// --- Data Model Types ---

export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  subjectId: string;
}

export interface Grade {
  id: string;
  name: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  options: string[];
  correct: number;
  hint: string;
  level: number;
  points: number;
  subjectId?: string;
  topicId?: string;
  gradeId?: string;
  selected: boolean;
}

// Legacy type used in game
export interface Question {
  level: number;
  points: number;
  question: string;
  options: string[];
  correct: number;
  hint: string;
}

export interface Team {
  id: number;
  name: string;
  score: number;
  lifelines: {
    hint: boolean;
    poll: boolean;
    skip: boolean;
  };
}
