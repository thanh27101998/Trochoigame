import { QuestionItem, Subject, Topic, Grade, Question } from './types';

const KEYS = {
  questions: 'altp_questions',
  subjects: 'altp_subjects',
  topics: 'altp_topics',
  grades: 'altp_grades',
};

// --- Helpers ---
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Question Bank ---
export function getQuestionBank(): QuestionItem[] {
  return loadJSON<QuestionItem[]>(KEYS.questions, []);
}

export function saveQuestionBank(questions: QuestionItem[]): void {
  saveJSON(KEYS.questions, questions);
}

export function addQuestions(newQuestions: Omit<QuestionItem, 'id' | 'selected'>[]): QuestionItem[] {
  const bank = getQuestionBank();
  const withIds = newQuestions.map(q => ({
    ...q,
    id: generateId(),
    selected: true,
  }));
  const updated = [...bank, ...withIds];
  saveQuestionBank(updated);
  return updated;
}

export function updateQuestion(id: string, data: Partial<QuestionItem>): QuestionItem[] {
  const bank = getQuestionBank();
  const updated = bank.map(q => q.id === id ? { ...q, ...data } : q);
  saveQuestionBank(updated);
  return updated;
}

export function deleteQuestion(id: string): QuestionItem[] {
  const bank = getQuestionBank().filter(q => q.id !== id);
  saveQuestionBank(bank);
  return bank;
}

export function deleteAllQuestions(): QuestionItem[] {
  saveQuestionBank([]);
  return [];
}

export function selectAllQuestions(selected: boolean): QuestionItem[] {
  const bank = getQuestionBank().map(q => ({ ...q, selected }));
  saveQuestionBank(bank);
  return bank;
}

export function toggleQuestionSelection(id: string): QuestionItem[] {
  const bank = getQuestionBank().map(q =>
    q.id === id ? { ...q, selected: !q.selected } : q
  );
  saveQuestionBank(bank);
  return bank;
}

export function getSelectedQuestions(): Question[] {
  return getQuestionBank()
    .filter(q => q.selected)
    .map(q => ({
      level: q.level,
      points: q.points,
      question: q.question,
      options: q.options,
      correct: q.correct,
      hint: q.hint,
    }));
}

// --- Subjects ---
export function getSubjects(): Subject[] {
  return loadJSON<Subject[]>(KEYS.subjects, []);
}

export function addSubject(name: string): Subject[] {
  const subjects = getSubjects();
  subjects.push({ id: generateId(), name });
  saveJSON(KEYS.subjects, subjects);
  return subjects;
}

export function deleteSubject(id: string): Subject[] {
  const subjects = getSubjects().filter(s => s.id !== id);
  saveJSON(KEYS.subjects, subjects);
  // Also remove orphaned topics
  const topics = getTopics().filter(t => t.subjectId !== id);
  saveJSON(KEYS.topics, topics);
  return subjects;
}

// --- Topics ---
export function getTopics(): Topic[] {
  return loadJSON<Topic[]>(KEYS.topics, []);
}

export function addTopic(name: string, subjectId: string): Topic[] {
  const topics = getTopics();
  topics.push({ id: generateId(), name, subjectId });
  saveJSON(KEYS.topics, topics);
  return topics;
}

export function deleteTopic(id: string): Topic[] {
  const topics = getTopics().filter(t => t.id !== id);
  saveJSON(KEYS.topics, topics);
  return topics;
}

// --- Grades ---
export function getGrades(): Grade[] {
  return loadJSON<Grade[]>(KEYS.grades, []);
}

export function addGrade(name: string): Grade[] {
  const grades = getGrades();
  grades.push({ id: generateId(), name });
  saveJSON(KEYS.grades, grades);
  return grades;
}

export function deleteGrade(id: string): Grade[] {
  const grades = getGrades().filter(g => g.id !== id);
  saveJSON(KEYS.grades, grades);
  return grades;
}

// --- Points by Level ---
export function getPointsByLevel(level: number): number {
  const map: Record<number, number> = { 1: 100, 2: 200, 3: 300, 4: 500, 5: 1000 };
  return map[level] || 100;
}
