import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Upload, Plus, Trash2, Edit3, CheckSquare, Square, Check, X, 
  BookOpen, Tag, GraduationCap, ArrowLeft, FileText, Settings2,
  ChevronDown, Search, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionItem, Subject, Topic, Grade } from './types';
import * as store from './store';
import { extractText, parseQuestionsFromText, ParsedQuestion } from './fileParser';

interface QuestionManagerProps {
  onBack: () => void;
  onLoadToGame: (questions: { level: number; points: number; question: string; options: string[]; correct: number; hint: string }[]) => void;
}

type TabId = 'bank' | 'upload' | 'categories' | 'form';

export default function QuestionManager({ onBack, onLoadToGame }: QuestionManagerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('bank');
  
  // Question bank state
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Categories state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  
  // Upload state
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Form state
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: 0,
    hint: '',
    level: 1,
    subjectId: '',
    topicId: '',
    gradeId: '',
  });

  // New category inputs
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicSubjectId, setNewTopicSubjectId] = useState('');
  const [newGradeName, setNewGradeName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    setQuestions(store.getQuestionBank());
    setSubjects(store.getSubjects());
    setTopics(store.getTopics());
    setGrades(store.getGrades());
  }, []);

  // --- Question Bank Tab ---
  const filteredQuestions = questions.filter(q => {
    if (filterSubject && q.subjectId !== filterSubject) return false;
    if (filterTopic && q.topicId !== filterTopic) return false;
    if (filterGrade && q.gradeId !== filterGrade) return false;
    if (searchQuery && !q.question.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedCount = questions.filter(q => q.selected).length;

  const handleSelectAll = () => {
    const updated = store.selectAllQuestions(true);
    setQuestions(updated);
  };

  const handleDeselectAll = () => {
    const updated = store.selectAllQuestions(false);
    setQuestions(updated);
  };

  const handleDeleteAll = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa TẤT CẢ ${questions.length} câu hỏi? Hành động này không thể hoàn tác!`)) {
      setQuestions(store.deleteAllQuestions());
    }
  };

  const handleToggleSelect = (id: string) => {
    setQuestions(store.toggleQuestionSelection(id));
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Xóa câu hỏi này?')) {
      setQuestions(store.deleteQuestion(id));
    }
  };

  const handleEditQuestion = (q: QuestionItem) => {
    setEditingQuestion(q);
    setFormData({
      question: q.question,
      options: [...q.options],
      correct: q.correct,
      hint: q.hint,
      level: q.level,
      subjectId: q.subjectId || '',
      topicId: q.topicId || '',
      gradeId: q.gradeId || '',
    });
    setActiveTab('form');
  };

  const handleLoadToGame = () => {
    const selected = store.getSelectedQuestions();
    if (selected.length === 0) {
      alert('Chưa chọn câu hỏi nào! Hãy tick chọn ít nhất 1 câu hỏi.');
      return;
    }
    onLoadToGame(selected);
  };

  // --- Upload Tab ---
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError('');
    setParsedQuestions([]);

    try {
      const file = files[0];
      const text = await extractText(file);
      const parsed = parseQuestionsFromText(text);
      
      if (parsed.length === 0) {
        setUploadError('Không tìm thấy câu hỏi nào trong file. Hãy đảm bảo file có format: "Câu X: ...", "A. ... B. ... C. ... D. ...", "Đáp án: ..."');
      } else {
        setParsedQuestions(parsed);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi khi đọc file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const handleImportParsed = () => {
    if (parsedQuestions.length === 0) return;
    const newQuestions = parsedQuestions.map(pq => ({
      question: pq.question,
      options: pq.options,
      correct: pq.correct,
      hint: pq.hint,
      level: 1,
      points: 100,
      subjectId: undefined,
      topicId: undefined,
      gradeId: undefined,
    }));
    const updated = store.addQuestions(newQuestions as any);
    setQuestions(updated);
    setParsedQuestions([]);
    setActiveTab('bank');
  };

  const handleUpdateParsedQuestion = (idx: number, field: string, value: any) => {
    const updated = [...parsedQuestions];
    if (field === 'question') updated[idx].question = value;
    else if (field === 'correct') updated[idx].correct = value;
    else if (field === 'hint') updated[idx].hint = value;
    else if (field.startsWith('option_')) {
      const optIdx = parseInt(field.split('_')[1]);
      updated[idx].options[optIdx] = value;
    }
    setParsedQuestions(updated);
  };

  const handleRemoveParsedQuestion = (idx: number) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // --- Form Tab ---
  const handleFormSubmit = () => {
    if (!formData.question.trim()) {
      alert('Vui lòng nhập câu hỏi!');
      return;
    }
    if (formData.options.some(o => !o.trim())) {
      alert('Vui lòng nhập đầy đủ 4 đáp án!');
      return;
    }

    if (editingQuestion) {
      const updated = store.updateQuestion(editingQuestion.id, {
        question: formData.question,
        options: formData.options,
        correct: formData.correct,
        hint: formData.hint,
        level: formData.level,
        points: store.getPointsByLevel(formData.level),
        subjectId: formData.subjectId || undefined,
        topicId: formData.topicId || undefined,
        gradeId: formData.gradeId || undefined,
      });
      setQuestions(updated);
    } else {
      const updated = store.addQuestions([{
        question: formData.question,
        options: formData.options,
        correct: formData.correct,
        hint: formData.hint,
        level: formData.level,
        points: store.getPointsByLevel(formData.level),
        subjectId: formData.subjectId || undefined,
        topicId: formData.topicId || undefined,
        gradeId: formData.gradeId || undefined,
      }]);
      setQuestions(updated);
    }

    resetForm();
    setActiveTab('bank');
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setFormData({
      question: '',
      options: ['', '', '', ''],
      correct: 0,
      hint: '',
      level: 1,
      subjectId: '',
      topicId: '',
      gradeId: '',
    });
  };

  // --- Categories Tab ---
  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    setSubjects(store.addSubject(newSubjectName.trim()));
    setNewSubjectName('');
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm('Xóa môn học này? Các chủ đề thuộc môn cũng sẽ bị xóa.')) {
      setSubjects(store.deleteSubject(id));
      setTopics(store.getTopics());
    }
  };

  const handleAddTopic = () => {
    if (!newTopicName.trim() || !newTopicSubjectId) {
      alert('Vui lòng chọn môn học và nhập tên chủ đề!');
      return;
    }
    setTopics(store.addTopic(newTopicName.trim(), newTopicSubjectId));
    setNewTopicName('');
  };

  const handleDeleteTopic = (id: string) => {
    if (window.confirm('Xóa chủ đề này?')) {
      setTopics(store.deleteTopic(id));
    }
  };

  const handleAddGrade = () => {
    if (!newGradeName.trim()) return;
    setGrades(store.addGrade(newGradeName.trim()));
    setNewGradeName('');
  };

  const handleDeleteGrade = (id: string) => {
    if (window.confirm('Xóa lớp này?')) {
      setGrades(store.deleteGrade(id));
    }
  };

  // --- Lookup helpers ---
  const getSubjectName = (id?: string) => subjects.find(s => s.id === id)?.name || '';
  const getTopicName = (id?: string) => topics.find(t => t.id === id)?.name || '';
  const getGradeName = (id?: string) => grades.find(g => g.id === id)?.name || '';

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'bank', label: 'Kho câu hỏi', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload file', icon: <Upload className="w-4 h-4" /> },
    { id: 'categories', label: 'Môn/Chủ đề/Lớp', icon: <Settings2 className="w-4 h-4" /> },
    { id: 'form', label: editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi', icon: <Plus className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-millionaire-blue to-blue-900 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-6 h-6 text-millionaire-gold" />
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-millionaire-gold">
              QUẢN LÝ CÂU HỎI
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-60">{selectedCount}/{questions.length} đã chọn</span>
            <button
              onClick={handleLoadToGame}
              className="px-6 py-2 font-bold bg-green-600 hover:bg-green-500 rounded-xl transition-all flex items-center gap-2"
            >
              <Check className="w-5 h-5" /> Nạp vào trò chơi ({selectedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { if (tab.id === 'form') resetForm(); setActiveTab(tab.id); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-millionaire-gold text-millionaire-blue'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'bank' && renderBankTab()}
            {activeTab === 'upload' && renderUploadTab()}
            {activeTab === 'categories' && renderCategoriesTab()}
            {activeTab === 'form' && renderFormTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  // ========== RENDER FUNCTIONS ==========

  function renderBankTab() {
    return (
      <div className="glass-panel p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleSelectAll} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" /> Chọn tất cả
          </button>
          <button onClick={handleDeselectAll} className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-500 rounded-lg flex items-center gap-1.5">
            <Square className="w-4 h-4" /> Bỏ tất cả
          </button>
          <button onClick={handleDeleteAll} className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 rounded-lg flex items-center gap-1.5" disabled={questions.length === 0}>
            <Trash2 className="w-4 h-4" /> Xóa tất cả
          </button>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm bg-white/5 border border-white/20 rounded-lg focus:border-millionaire-gold outline-none w-48"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="px-3 py-1.5 text-sm bg-white/5 border border-white/20 rounded-lg text-white">
            <option value="">Tất cả môn</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="px-3 py-1.5 text-sm bg-white/5 border border-white/20 rounded-lg text-white">
            <option value="">Tất cả chủ đề</option>
            {topics.filter(t => !filterSubject || t.subjectId === filterSubject).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="px-3 py-1.5 text-sm bg-white/5 border border-white/20 rounded-lg text-white">
            <option value="">Tất cả lớp</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Chưa có câu hỏi nào</p>
            <p className="text-sm mt-1">Hãy upload file hoặc thêm câu hỏi thủ công</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  q.selected ? 'bg-green-900/20 border-green-500/50' : 'bg-white/5 border-white/10'
                }`}
              >
                <button onClick={() => handleToggleSelect(q.id)} className="mt-1 shrink-0">
                  {q.selected ? (
                    <CheckSquare className="w-5 h-5 text-green-400" />
                  ) : (
                    <Square className="w-5 h-5 opacity-40" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm leading-snug">{q.question}</div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {q.options.map((opt, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
                        i === q.correct ? 'bg-green-600/30 text-green-300' : 'bg-white/10 opacity-60'
                      }`}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1 text-xs opacity-40">
                    {q.subjectId && <span>📚 {getSubjectName(q.subjectId)}</span>}
                    {q.topicId && <span>🏷️ {getTopicName(q.topicId)}</span>}
                    {q.gradeId && <span>🎓 {getGradeName(q.gradeId)}</span>}
                    <span>⭐ Cấp {q.level}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEditQuestion(q)} className="p-1.5 rounded-lg hover:bg-blue-600/30" title="Sửa">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                  </button>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 rounded-lg hover:bg-red-600/30" title="Xóa">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderUploadTab() {
    return (
      <div className="glass-panel p-6 space-y-6">
        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragOver ? 'border-millionaire-gold bg-millionaire-gold/10' : 'border-white/30 hover:border-white/50 hover:bg-white/5'
          }`}
        >
          <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragOver ? 'text-millionaire-gold' : 'opacity-40'}`} />
          <p className="text-lg font-medium mb-1">
            {isUploading ? 'Đang phân tích...' : 'Kéo thả file vào đây'}
          </p>
          <p className="text-sm opacity-50">
            Hỗ trợ <strong>.docx</strong> và <strong>.pdf</strong> — Bài tập trắc nghiệm có đáp án
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf"
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Error */}
        {uploadError && (
          <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{uploadError}</p>
          </div>
        )}

        {/* Preview parsed questions */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-millionaire-gold">
                Đã phân tích: {parsedQuestions.length} câu hỏi
              </h3>
              <button
                onClick={handleImportParsed}
                className="px-6 py-2 font-bold bg-green-600 hover:bg-green-500 rounded-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Nạp tất cả vào kho
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {parsedQuestions.map((pq, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-millionaire-gold shrink-0">Câu {idx + 1}</span>
                    <button onClick={() => handleRemoveParsedQuestion(idx)} className="p-1 rounded hover:bg-red-600/30">
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={pq.question}
                    onChange={e => handleUpdateParsedQuestion(idx, 'question', e.target.value)}
                    className="w-full p-2 text-sm bg-white/5 border border-white/20 rounded-lg outline-none focus:border-millionaire-gold"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {pq.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateParsedQuestion(idx, 'correct', i)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                            pq.correct === i ? 'bg-green-500 border-green-400 text-white' : 'border-white/30 opacity-50'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => handleUpdateParsedQuestion(idx, `option_${i}`, e.target.value)}
                          className="flex-1 p-1.5 text-xs bg-white/5 border border-white/20 rounded-lg outline-none focus:border-millionaire-gold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderCategoriesTab() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subjects */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-blue-400">
            <BookOpen className="w-5 h-5" /> Môn học
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tên môn học..."
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
              className="flex-1 p-2 text-sm bg-white/5 border border-white/20 rounded-lg outline-none focus:border-blue-400"
            />
            <button onClick={handleAddSubject} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {subjects.length === 0 ? (
              <p className="text-sm opacity-40 text-center py-4">Chưa có môn nào</p>
            ) : subjects.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg group">
                <span className="text-sm">{s.name}</span>
                <button onClick={() => handleDeleteSubject(s.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-600/30 transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-green-400">
            <Tag className="w-5 h-5" /> Chủ đề
          </h3>
          <select
            value={newTopicSubjectId}
            onChange={e => setNewTopicSubjectId(e.target.value)}
            className="w-full p-2 text-sm bg-white/5 border border-white/20 rounded-lg text-white"
          >
            <option value="">Chọn môn học...</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tên chủ đề..."
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
              className="flex-1 p-2 text-sm bg-white/5 border border-white/20 rounded-lg outline-none focus:border-green-400"
            />
            <button onClick={handleAddTopic} className="p-2 bg-green-600 hover:bg-green-500 rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {topics.length === 0 ? (
              <p className="text-sm opacity-40 text-center py-4">Chưa có chủ đề nào</p>
            ) : topics.map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg group">
                <div>
                  <span className="text-sm">{t.name}</span>
                  <span className="text-xs opacity-40 ml-2">({getSubjectName(t.subjectId)})</span>
                </div>
                <button onClick={() => handleDeleteTopic(t.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-600/30 transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Grades */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-purple-400">
            <GraduationCap className="w-5 h-5" /> Lớp
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tên lớp..."
              value={newGradeName}
              onChange={e => setNewGradeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGrade()}
              className="flex-1 p-2 text-sm bg-white/5 border border-white/20 rounded-lg outline-none focus:border-purple-400"
            />
            <button onClick={handleAddGrade} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {grades.length === 0 ? (
              <p className="text-sm opacity-40 text-center py-4">Chưa có lớp nào</p>
            ) : grades.map(g => (
              <div key={g.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg group">
                <span className="text-sm">{g.name}</span>
                <button onClick={() => handleDeleteGrade(g.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-600/30 transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderFormTab() {
    return (
      <div className="glass-panel p-6 max-w-3xl mx-auto space-y-5">
        <h3 className="font-bold text-xl text-millionaire-gold">
          {editingQuestion ? '✏️ Sửa câu hỏi' : '➕ Thêm câu hỏi mới'}
        </h3>

        {/* Question */}
        <div>
          <label className="block text-sm font-medium mb-1 opacity-70">Câu hỏi</label>
          <textarea
            value={formData.question}
            onChange={e => setFormData(prev => ({ ...prev, question: e.target.value }))}
            rows={3}
            className="w-full p-3 bg-white/5 border border-white/20 rounded-xl outline-none focus:border-millionaire-gold resize-none"
            placeholder="Nhập câu hỏi..."
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="block text-sm font-medium opacity-70">Đáp án (click chữ cái để chọn đáp án đúng)</label>
          {formData.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, correct: i }))}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                  formData.correct === i ? 'bg-green-500 border-green-400 text-white scale-110' : 'border-white/30 hover:border-white/50'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </button>
              <input
                type="text"
                value={opt}
                onChange={e => {
                  const newOpts = [...formData.options];
                  newOpts[i] = e.target.value;
                  setFormData(prev => ({ ...prev, options: newOpts }));
                }}
                className="flex-1 p-2.5 bg-white/5 border border-white/20 rounded-xl outline-none focus:border-millionaire-gold"
                placeholder={`Đáp án ${String.fromCharCode(65 + i)}...`}
              />
            </div>
          ))}
        </div>

        {/* Hint */}
        <div>
          <label className="block text-sm font-medium mb-1 opacity-70">Gợi ý (không bắt buộc)</label>
          <input
            type="text"
            value={formData.hint}
            onChange={e => setFormData(prev => ({ ...prev, hint: e.target.value }))}
            className="w-full p-2.5 bg-white/5 border border-white/20 rounded-xl outline-none focus:border-millionaire-gold"
            placeholder="Nhập gợi ý..."
          />
        </div>

        {/* Level + Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Cấp độ</label>
            <select
              value={formData.level}
              onChange={e => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
              className="w-full p-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
            >
              {[1, 2, 3, 4, 5].map(l => (
                <option key={l} value={l}>Cấp {l} ({store.getPointsByLevel(l)} đ)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Môn học</label>
            <select
              value={formData.subjectId}
              onChange={e => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
              className="w-full p-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
            >
              <option value="">Không chọn</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Chủ đề</label>
            <select
              value={formData.topicId}
              onChange={e => setFormData(prev => ({ ...prev, topicId: e.target.value }))}
              className="w-full p-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
            >
              <option value="">Không chọn</option>
              {topics.filter(t => !formData.subjectId || t.subjectId === formData.subjectId).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Lớp</label>
            <select
              value={formData.gradeId}
              onChange={e => setFormData(prev => ({ ...prev, gradeId: e.target.value }))}
              className="w-full p-2.5 bg-white/5 border border-white/20 rounded-xl text-white"
            >
              <option value="">Không chọn</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleFormSubmit}
            className="flex-1 py-3 font-bold bg-millionaire-gold text-millionaire-blue rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            {editingQuestion ? 'Cập nhật' : 'Thêm câu hỏi'}
          </button>
          <button
            onClick={() => { resetForm(); setActiveTab('bank'); }}
            className="px-6 py-3 font-bold bg-white/10 hover:bg-white/20 rounded-xl transition-all"
          >
            Hủy
          </button>
        </div>
      </div>
    );
  }
}
