import mammoth from 'mammoth';

// PDF.js worker configuration
let pdfjsLib: any = null;

async function loadPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
  return pdfjsLib;
}

export interface ParsedQuestion {
  question: string;
  options: string[];
  correct: number;
  hint: string;
}

// --- Extract text from files ---
export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(' ');
    pages.push(text);
  }

  return pages.join('\n');
}

export async function extractText(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'docx' || ext === 'doc') {
    return extractTextFromDocx(file);
  } else if (ext === 'pdf') {
    return extractTextFromPdf(file);
  }
  throw new Error(`Không hỗ trợ định dạng .${ext}. Chỉ hỗ trợ .docx và .pdf`);
}

// --- Parse questions from text ---
export function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Normalize line breaks
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strategy 1: Split by question pattern "Câu X:" or "Câu X." or numbered "1." "2."
  const questionBlocks = splitIntoQuestionBlocks(normalized);

  for (const block of questionBlocks) {
    const parsed = parseOneQuestion(block);
    if (parsed) {
      questions.push(parsed);
    }
  }

  return questions;
}

function splitIntoQuestionBlocks(text: string): string[] {
  // Match patterns like "Câu 1:", "Câu 1.", "1.", "1)", "Câu hỏi 1:"
  const pattern = /(?:^|\n)(?:Câu\s*(?:hỏi\s*)?\d+\s*[.:)]|(?:\d+)\s*[.)])\s*/gi;
  const blocks: string[] = [];
  const matches = [...text.matchAll(pattern)];

  if (matches.length === 0) {
    // Try to split by "?" - each question ends with ?
    const lines = text.split('\n');
    let currentBlock = '';
    for (const line of lines) {
      currentBlock += line + '\n';
      if (line.includes('?') || (currentBlock.includes('?') && /^[A-Da-d][.)]\s/.test(line.trim()))) {
        // Check if we have options after this
        continue;
      }
      // If we see "Đáp án" or next question marker, flush
      if (/đáp\s*án/i.test(line) || currentBlock.split('?').length > 1) {
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
      }
    }
    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }
    return blocks.filter(b => b.includes('?') || /[A-Da-d][.)]\s/.test(b));
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const block = text.substring(start, end).trim();
    if (block) blocks.push(block);
  }

  return blocks;
}

function parseOneQuestion(block: string): ParsedQuestion | null {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return null;

  // Extract question text (everything before options)
  let questionText = '';
  let optionStartIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^[A-Da-d]\s*[.)]\s*\S/.test(lines[i]) || /^[A-Da-d]\s*[.:]\s*\S/.test(lines[i])) {
      optionStartIdx = i;
      break;
    }
    questionText += (questionText ? ' ' : '') + lines[i];
  }

  if (!questionText || optionStartIdx === -1) return null;

  // Extract options
  const options: string[] = [];
  let correctIndex = -1;
  let answerLine = '';

  for (let i = optionStartIdx; i < lines.length; i++) {
    const line = lines[i];

    // Check for answer line
    if (/^đáp\s*án\s*(?:đúng\s*)?[.:]\s*/i.test(line)) {
      answerLine = line;
      continue;
    }

    // Match option: A. xxx, A) xxx, a. xxx, a) xxx
    const optMatch = line.match(/^([A-Da-d])\s*[.):\s]\s*(.+)/);
    if (optMatch) {
      let optText = optMatch[2].trim();

      // Check if option is marked as correct (bold **, or has ✓ or *)
      const isMarkedCorrect = /\*\*/.test(line) || /✓|✔|√|\(đúng\)|\(correct\)/i.test(line);
      if (isMarkedCorrect) {
        correctIndex = options.length;
        optText = optText.replace(/\*\*/g, '').replace(/[✓✔√]/g, '').replace(/\(đúng\)|\(correct\)/gi, '').trim();
      }

      options.push(optText);
    }
  }

  // If no options found, try inline format: A. xxx   B. xxx   C. xxx   D. xxx
  if (options.length === 0) {
    for (let i = optionStartIdx; i < lines.length; i++) {
      const inlineMatch = lines[i].match(/([A-Da-d])\s*[.)]\s*([^A-Da-d]+?)(?=\s+[A-Da-d]\s*[.)]|$)/g);
      if (inlineMatch) {
        for (const m of inlineMatch) {
          const parts = m.match(/([A-Da-d])\s*[.)]\s*(.+)/);
          if (parts) {
            options.push(parts[2].trim());
          }
        }
      }
    }
  }

  if (options.length < 2) return null;

  // Pad options to 4 if needed
  while (options.length < 4) {
    options.push('');
  }

  // Determine correct answer
  if (correctIndex === -1 && answerLine) {
    const ansMatch = answerLine.match(/[.:]\s*([A-Da-d])/i);
    if (ansMatch) {
      const letter = ansMatch[1].toUpperCase();
      correctIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    }
  }

  // Default to 0 if no correct answer found
  if (correctIndex < 0 || correctIndex >= options.length) {
    correctIndex = 0;
  }

  return {
    question: questionText,
    options: options.slice(0, 4),
    correct: correctIndex,
    hint: '',
  };
}
