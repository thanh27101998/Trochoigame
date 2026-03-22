/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, 
  UserCircle, 
  SkipForward, 
  RotateCcw, 
  Trophy, 
  Timer, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  BarChart3,
  Dices,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import QuestionManager from './QuestionManager';
import { Question, Team } from './types';
import { getSelectedQuestions } from './store';

// --- Default Data ---
const DEFAULT_QUESTIONS: Question[] = [
  // Level 1 (100 pts)
  { level: 1, points: 100, question: "Số nào lớn nhất trong các số sau: 4567, 4657, 4576, 4675?", options: ["4567", "4657", "4576", "4675"], correct: 3, hint: "Hãy so sánh hàng trăm rồi đến hàng chục." },
  { level: 1, points: 100, question: "Một hình vuông có cạnh 8cm. Chu vi của hình vuông đó là bao nhiêu?", options: ["16cm", "32cm", "64cm", "24cm"], correct: 1, hint: "Công thức tính chu vi hình vuông là cạnh nhân 4." },
  { level: 1, points: 100, question: "Kết quả của phép tính: 125 x 4 là?", options: ["400", "500", "600", "450"], correct: 1, hint: "125 gấp 4 lần sẽ ra một số tròn trăm." },
  // Level 2 (200 pts)
  { level: 2, points: 200, question: "Phân số nào sau đây bằng với phân số 1/2?", options: ["2/3", "3/6", "4/10", "5/12"], correct: 1, hint: "Hãy rút gọn các phân số để tìm kết quả." },
  { level: 2, points: 200, question: "Một hình chữ nhật có chiều dài 12cm, chiều rộng 5cm. Diện tích là?", options: ["34cm²", "60cm²", "17cm²", "50cm²"], correct: 1, hint: "Diện tích hình chữ nhật bằng dài nhân rộng." },
  { level: 2, points: 200, question: "Số trung bình cộng của 15, 25 và 35 là?", options: ["20", "25", "30", "35"], correct: 1, hint: "Tổng ba số chia cho 3." },
  // Level 3 (300 pts)
  { level: 3, points: 300, question: "25% của 200 là bao nhiêu?", options: ["25", "40", "50", "100"], correct: 2, hint: "25% tương đương với 1/4." },
  { level: 3, points: 300, question: "Một ô tô đi được 120km trong 2 giờ. Vận tốc của ô tô là?", options: ["60 km/h", "50 km/h", "70 km/h", "240 km/h"], correct: 0, hint: "Vận tốc = Quãng đường / Thời gian." },
  { level: 3, points: 300, question: "Thể tích của hình lập phương có cạnh 3cm là?", options: ["9cm³", "12cm³", "27cm³", "18cm³"], correct: 2, hint: "Thể tích = cạnh x cạnh x cạnh." },
  // Level 4 (500 pts)
  { level: 4, points: 500, question: "Tìm x biết: x + 1/4 = 5/8", options: ["x = 3/8", "x = 1/2", "x = 1/4", "x = 3/4"], correct: 0, hint: "x = 5/8 - 1/4. Hãy quy đồng mẫu số." },
  { level: 4, points: 500, question: "Một bể nước dạng hình hộp chữ nhật có thể tích 2m³. Biết diện tích đáy là 2.5m². Chiều cao của bể là?", options: ["0.5m", "0.8m", "1.2m", "0.4m"], correct: 1, hint: "Chiều cao = Thể tích / Diện tích đáy." },
  // Level 5 (1000 pts)
  { level: 5, points: 1000, question: "Tổng của hai số là 100, hiệu của hai số là 20. Số lớn là?", options: ["40", "50", "60", "70"], correct: 2, hint: "Số lớn = (Tổng + Hiệu) / 2." },
];

const BACKUP_QUESTIONS: Record<number, Question[]> = {
  1: [{ level: 1, points: 100, question: "Số bé nhất có 4 chữ số khác nhau là?", options: ["1000", "1023", "1234", "1001"], correct: 1, hint: "Số đó phải bắt đầu bằng 1, chữ số tiếp theo là 0..." }],
  2: [{ level: 2, points: 200, question: "3/4 giờ bằng bao nhiêu phút?", options: ["30 phút", "45 phút", "40 phút", "50 phút"], correct: 1, hint: "1 giờ có 60 phút, lấy 60 chia 4 rồi nhân 3." }],
  3: [{ level: 3, points: 300, question: "Một hình tròn có bán kính 5cm. Diện tích là? (Lấy π = 3.14)", options: ["31.4cm²", "78.5cm²", "15.7cm²", "25cm²"], correct: 1, hint: "Diện tích = r x r x 3.14." }],
  4: [{ level: 4, points: 500, question: "Lớp 5A có 40 học sinh, số học sinh nữ chiếm 60%. Số học sinh nam là?", options: ["24", "16", "20", "18"], correct: 1, hint: "Tính số học sinh nữ trước, hoặc tính % nam (40%)." }],
  5: [{ level: 5, points: 1000, question: "Một con thuyền xuôi dòng với vận tốc 15km/h, ngược dòng 10km/h. Vận tốc dòng nước là?", options: ["5km/h", "2.5km/h", "12.5km/h", "2km/h"], correct: 1, hint: "Vận tốc dòng nước = (V xuôi - V ngược) / 2." }],
};

const TEAM_NAMES_POOL = [
  "Thần đồng Toán học", "Nhà bác học nhí", "Biệt đội Số học", "Siêu trí tuệ", 
  "Những nhà thông thái", "Đội quân Logic", "Vua giải toán", "Chiến binh Pi"
];

const LEVELS = [
  { id: 5, label: "Cấp độ 5", points: 1000, color: "text-red-400" },
  { id: 4, label: "Cấp độ 4", points: 500, color: "text-orange-400" },
  { id: 3, label: "Cấp độ 3", points: 300, color: "text-yellow-400" },
  { id: 2, label: "Cấp độ 2", points: 200, color: "text-green-400" },
  { id: 1, label: "Cấp độ 1", points: 100, color: "text-blue-400" },
];

// --- Components ---

export default function App() {
  const [screen, setScreen] = useState<'setup' | 'manager' | 'game' | 'results'>('setup');
  const [teams, setTeams] = useState<Team[]>([
    { id: 0, name: "Đội Vàng", score: 0, lifelines: { hint: true, poll: true, skip: true } },
    { id: 1, name: "Đội Xanh", score: 0, lifelines: { hint: true, poll: true, skip: true } },
    { id: 2, name: "Đội Đỏ", score: 0, lifelines: { hint: true, poll: true, skip: true } },
    { id: 3, name: "Đội Tím", score: 0, lifelines: { hint: true, poll: true, skip: true } },
  ]);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [gameQuestions, setGameQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [activeQuestion, setActiveQuestion] = useState<Question>(DEFAULT_QUESTIONS[0]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lifelineContent, setLifelineContent] = useState<{ type: 'hint' | 'poll', data: any } | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Logic ---

  const startTimer = (level: number) => {
    let time = 30;
    if (level >= 3) time = 25;
    if (level >= 5) time = 20;
    
    setTimeLeft(time);
    setIsTimerActive(true);
  };

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, timeLeft]);

  const handleStartGame = () => {
    // Try to load questions from bank
    const bankQuestions = getSelectedQuestions();
    const questionsToUse = bankQuestions.length > 0 ? bankQuestions : DEFAULT_QUESTIONS;
    
    // Shuffle questions
    const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
    
    setGameQuestions(shuffled);
    setScreen('game');
    setCurrentQuestionIdx(0);
    setActiveQuestion(shuffled[0]);
    setCurrentTeamIdx(0);
    // Reset team scores
    setTeams(prev => prev.map(t => ({ ...t, score: 0, lifelines: { hint: true, poll: true, skip: true } })));
    startTimer(shuffled[0].level);
  };

  const handleLoadToGame = (questions: Question[]) => {
    // Questions loaded from QuestionManager, go back to setup
    setScreen('setup');
  };

  const handleRandomName = (idx: number) => {
    const randomName = TEAM_NAMES_POOL[Math.floor(Math.random() * TEAM_NAMES_POOL.length)];
    const newTeams = [...teams];
    newTeams[idx].name = randomName;
    setTeams(newTeams);
  };

  const handleOptionSelect = (idx: number) => {
    if (showAnswer) return;
    setSelectedOption(idx);
    setIsTimerActive(false);
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    // Update score if correct
    if (selectedOption === activeQuestion.correct) {
      const newTeams = [...teams];
      newTeams[currentTeamIdx].score += activeQuestion.points;
      setTeams(newTeams);
    }

    // Move to next question or end
    if (currentQuestionIdx < gameQuestions.length - 1) {
      const nextIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextIdx);
      setActiveQuestion(gameQuestions[nextIdx]);
      setCurrentTeamIdx((currentTeamIdx + 1) % teams.length);
      setSelectedOption(null);
      setShowAnswer(false);
      setLifelineContent(null);
      startTimer(gameQuestions[nextIdx].level);
    } else {
      setScreen('results');
      triggerConfetti();
    }
  };

  const useLifeline = (type: 'hint' | 'poll' | 'skip') => {
    if (!teams[currentTeamIdx].lifelines[type] || showAnswer) return;

    const newTeams = [...teams];
    newTeams[currentTeamIdx].lifelines[type] = false;
    setTeams(newTeams);

    if (type === 'hint') {
      setLifelineContent({ type: 'hint', data: activeQuestion.hint });
    } else if (type === 'poll') {
      const correct = activeQuestion.correct;
      const pollData = [0, 0, 0, 0].map((_, i) => {
        if (i === correct) return Math.floor(Math.random() * 30) + 50; // 50-80%
        return Math.floor(Math.random() * 15); // 0-15%
      });
      // Normalize to 100
      const sum = pollData.reduce((a, b) => a + b, 0);
      const normalized = pollData.map(v => Math.round((v / sum) * 100));
      setLifelineContent({ type: 'poll', data: normalized });
    } else if (type === 'skip') {
      const backupLevel = BACKUP_QUESTIONS[activeQuestion.level];
      if (backupLevel && backupLevel.length > 0) {
        setActiveQuestion(backupLevel[0]);
        startTimer(backupLevel[0].level);
      }
      setSelectedOption(null);
      setLifelineContent(null);
    }
  };

  const triggerConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const sortedTeams = useMemo(() => [...teams].sort((a, b) => b.score - a.score), [teams]);

  // --- Render Helpers ---

  const renderSetup = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-millionaire-blue to-blue-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-8 glass-panel"
      >
        <h1 className="mb-8 text-4xl font-extrabold text-center text-millionaire-gold drop-shadow-lg">
          THIẾT LẬP ĐỘI CHƠI
        </h1>
        
        <div className="space-y-6">
          {teams.map((team, idx) => (
            <div key={team.id} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-red-500' : 'bg-purple-500'
              }`}>
                {idx + 1}
              </div>
              <input 
                type="text" 
                value={team.name}
                onChange={(e) => {
                  const newTeams = [...teams];
                  newTeams[idx].name = e.target.value;
                  setTeams(newTeams);
                }}
                className="flex-1 p-3 text-lg font-medium transition-all border-2 rounded-xl bg-white/5 border-white/20 focus:border-millionaire-gold outline-none"
              />
              <button 
                onClick={() => handleRandomName(idx)}
                className="p-3 transition-colors rounded-xl bg-white/10 hover:bg-white/20"
                title="Tên ngẫu nhiên"
              >
                <Dices className="w-6 h-6 text-millionaire-gold" />
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-10">
          <button 
            onClick={() => setScreen('manager')}
            className="flex-1 py-4 text-lg font-bold transition-all bg-white/10 border-2 border-millionaire-gold/50 text-millionaire-gold rounded-2xl hover:bg-white/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            <Settings2 className="w-6 h-6" /> Quản lý câu hỏi
          </button>
          <button 
            onClick={handleStartGame}
            className="flex-1 py-4 text-lg font-bold transition-all bg-millionaire-gold text-millionaire-blue rounded-2xl hover:scale-[1.02] active:scale-95 gold-glow"
          >
            BẮT ĐẦU CHƠI
          </button>
        </div>

        {/* Question count info */}
        {(() => {
          const bankCount = getSelectedQuestions().length;
          return (
            <p className="mt-4 text-center text-sm opacity-50">
              {bankCount > 0 
                ? `📋 Đã chọn ${bankCount} câu hỏi từ kho` 
                : `📋 Sử dụng ${DEFAULT_QUESTIONS.length} câu hỏi mặc định`}
            </p>
          );
        })()}

        {/* Author info */}
        <p className="mt-6 text-center text-sm opacity-40 italic">
          Tác giả: Cô Vũ Phương Thanh — Giáo viên Trường Tiểu Học Đại Phú
        </p>
      </motion.div>
    </div>
  );

  const renderGame = () => (
    <div className="grid h-screen grid-cols-12 gap-4 p-4 overflow-hidden bg-millionaire-blue">
      {/* Left: Points Tower */}
      <div className="flex flex-col col-span-2 gap-2 p-4 glass-panel">
        <h3 className="mb-4 text-xs font-bold tracking-widest text-center uppercase opacity-50">Thang điểm</h3>
        {LEVELS.map((lvl) => (
          <div 
            key={lvl.id}
            className={`flex justify-between items-center p-2 rounded-lg border transition-all ${
              activeQuestion.level === lvl.id 
                ? 'bg-millionaire-gold text-millionaire-blue border-white font-bold scale-105 gold-glow' 
                : 'border-white/10 opacity-60'
            }`}
          >
            <span className="text-xs">{lvl.label}</span>
            <span className={activeQuestion.level === lvl.id ? '' : lvl.color}>{lvl.points}</span>
          </div>
        ))}
        <div className="mt-auto text-center">
          <div className="text-sm opacity-50">Câu hỏi</div>
          <div className="text-3xl font-black text-millionaire-gold">{currentQuestionIdx + 1}/{gameQuestions.length}</div>
        </div>
      </div>

      {/* Center: Main Area */}
      <div className="flex flex-col col-span-7 gap-4">
        {/* Timer & Status */}
        <div className="flex items-center justify-between p-4 glass-panel">
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-3xl font-black ${
              timeLeft <= 5 ? 'border-red-500 animate-pulse-red' : 'border-millionaire-gold text-millionaire-gold'
            }`}>
              {timeLeft}
            </div>
            <div>
              <div className="text-sm font-bold uppercase opacity-50">Thời gian</div>
              <div className="text-xs">Cấp độ {activeQuestion.level}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              disabled={!teams[currentTeamIdx].lifelines.hint || showAnswer}
              onClick={() => useLifeline('hint')}
              className="lifeline-btn"
            >
              <HelpCircle className="w-8 h-8 text-blue-400" />
              <span className="text-[10px] uppercase font-bold">Hỏi bạn</span>
            </button>
            <button 
              disabled={!teams[currentTeamIdx].lifelines.poll || showAnswer}
              onClick={() => useLifeline('poll')}
              className="lifeline-btn"
            >
              <BarChart3 className="w-8 h-8 text-green-400" />
              <span className="text-[10px] uppercase font-bold">Hỏi lớp</span>
            </button>
            <button 
              disabled={!teams[currentTeamIdx].lifelines.skip || showAnswer}
              onClick={() => useLifeline('skip')}
              className="lifeline-btn"
            >
              <SkipForward className="w-8 h-8 text-orange-400" />
              <span className="text-[10px] uppercase font-bold">Bỏ qua</span>
            </button>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-8 text-center glass-panel flex flex-col justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeQuestion.question}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                {activeQuestion.question}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {activeQuestion.options.map((opt, i) => {
                  let statusClass = "";
                  if (showAnswer) {
                    if (i === activeQuestion.correct) statusClass = "correct";
                    else if (i === selectedOption) statusClass = "wrong";
                  } else if (i === selectedOption) {
                    statusClass = "selected";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(i)}
                      className={`option-btn ${statusClass}`}
                    >
                      <span className="flex items-center justify-center w-8 h-8 font-bold border border-current rounded-full shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-lg">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Lifeline Display Overlay */}
          {lifelineContent && !showAnswer && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-10 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm"
            >
              <div className="w-full max-w-md p-6 bg-blue-900 border-2 border-millionaire-gold rounded-3xl">
                {lifelineContent.type === 'hint' ? (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xl font-bold text-millionaire-gold">
                      <HelpCircle /> Gợi ý từ bạn bên cạnh
                    </h4>
                    <p className="text-lg italic">"{lifelineContent.data}"</p>
                    <button onClick={() => setLifelineContent(null)} className="w-full py-2 font-bold bg-white/10 rounded-xl">Đóng</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xl font-bold text-millionaire-gold">
                      <BarChart3 /> Ý kiến của cả lớp
                    </h4>
                    <div className="flex items-end justify-around h-32 gap-2">
                      {lifelineContent.data.map((val: number, i: number) => (
                        <div key={i} className="flex flex-col items-center flex-1 gap-1">
                          <div className="text-xs font-bold">{val}%</div>
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${val}%` }}
                            className={`w-full rounded-t-lg ${i === activeQuestion.correct ? 'bg-green-500' : 'bg-blue-500'}`}
                          />
                          <div className="font-bold">{String.fromCharCode(65 + i)}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setLifelineContent(null)} className="w-full py-2 font-bold bg-white/10 rounded-xl">Đóng</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* GV Controls */}
        <div className="flex gap-4 p-4 glass-panel">
          <button 
            onClick={handleRevealAnswer}
            disabled={selectedOption === null && timeLeft > 0}
            className="flex items-center justify-center flex-1 gap-2 py-3 font-bold transition-all bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-30"
          >
            <CheckCircle2 /> Hiện đáp án
          </button>
          <button 
            onClick={handleNextQuestion}
            disabled={!showAnswer}
            className="flex items-center justify-center flex-1 gap-2 py-3 font-bold transition-all bg-green-600 rounded-xl hover:bg-green-500 disabled:opacity-30"
          >
            Tiếp tục <ArrowRight />
          </button>
        </div>
      </div>

      {/* Right: Scoreboard */}
      <div className="flex flex-col col-span-3 gap-4">
        <h3 className="text-xs font-bold tracking-widest text-center uppercase opacity-50">Bảng điểm</h3>
        {teams.map((team, idx) => (
          <div 
            key={team.id}
            className={`p-4 glass-panel border-2 transition-all relative ${
              currentTeamIdx === idx 
                ? 'border-millionaire-gold gold-glow scale-105 z-10' 
                : 'border-white/10 opacity-70'
            }`}
          >
            {currentTeamIdx === idx && (
              <div className="absolute px-2 py-1 text-[10px] font-bold text-black uppercase -top-3 left-4 bg-millionaire-gold rounded">
                Đang trả lời
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-red-500' : 'bg-purple-500'
                }`}>
                  {idx + 1}
                </div>
                <span className="font-bold truncate max-w-[120px]">{team.name}</span>
              </div>
              <div className="text-2xl font-black text-millionaire-gold">{team.score}</div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className={`w-4 h-4 rounded-full ${team.lifelines.hint ? 'bg-blue-400' : 'bg-gray-600'}`} title="Hỏi bạn" />
              <div className={`w-4 h-4 rounded-full ${team.lifelines.poll ? 'bg-green-400' : 'bg-gray-600'}`} title="Hỏi lớp" />
              <div className={`w-4 h-4 rounded-full ${team.lifelines.skip ? 'bg-orange-400' : 'bg-gray-600'}`} title="Bỏ qua" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-millionaire-blue to-black">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl text-center"
      >
        <Trophy className="w-24 h-24 mx-auto mb-4 text-millionaire-gold animate-bounce" />
        <h1 className="mb-12 text-6xl font-black text-white uppercase drop-shadow-2xl">
          {sortedTeams[0].score > 0 ? "CHÚC MỪNG CHIẾN THẮNG!" : "KẾT THÚC BUỔI ÔN TẬP"}
        </h1>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 mb-16 h-80">
          {/* 2nd Place */}
          <div className="flex flex-col items-center flex-1">
            <div className="mb-2 text-lg font-bold">{sortedTeams[1].name}</div>
            <div className="w-full h-40 bg-gray-400/50 rounded-t-2xl flex flex-col items-center justify-center border-t-4 border-gray-300">
              <span className="text-5xl font-black text-gray-300">2</span>
              <span className="font-bold">{sortedTeams[1].score} pts</span>
            </div>
          </div>
          
          {/* 1st Place */}
          <div className="flex flex-col items-center flex-1">
            <div className="mb-2 text-xl font-black text-millionaire-gold">{sortedTeams[0].name}</div>
            <div className="w-full h-60 bg-millionaire-gold/50 rounded-t-2xl flex flex-col items-center justify-center border-t-4 border-millionaire-gold gold-glow">
              <span className="text-7xl font-black text-millionaire-gold">1</span>
              <span className="text-xl font-bold text-white">{sortedTeams[0].score} pts</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center flex-1">
            <div className="mb-2 text-lg font-bold">{sortedTeams[2].name}</div>
            <div className="w-full h-28 bg-orange-800/50 rounded-t-2xl flex flex-col items-center justify-center border-t-4 border-orange-700">
              <span className="text-4xl font-black text-orange-700">3</span>
              <span className="font-bold">{sortedTeams[2].score} pts</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-12">
          {teams.map(t => (
            <div key={t.id} className="p-4 glass-panel">
              <div className="text-sm opacity-50">{t.name}</div>
              <div className="text-2xl font-black text-millionaire-gold">{t.score}</div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-12 py-4 mx-auto text-2xl font-bold transition-all bg-white text-millionaire-blue rounded-2xl hover:scale-105 active:scale-95"
        >
          <RotateCcw /> CHƠI LẠI
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="font-sans select-none">
      {screen === 'setup' && renderSetup()}
      {screen === 'manager' && (
        <QuestionManager 
          onBack={() => setScreen('setup')} 
          onLoadToGame={handleLoadToGame}
        />
      )}
      {screen === 'game' && renderGame()}
      {screen === 'results' && renderResults()}
    </div>
  );
}
