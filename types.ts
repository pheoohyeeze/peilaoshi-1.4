
export type HSKLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface VocabularyWord {
  character: string;
  pinyin: string;
  translation: string;
  audioUrl?: string;
}

export type PracticeMode = 'example' | 'correction' | 'scramble' | 'building' | 'writing' | 'ordering';

export interface SentenceExample {
    sentence: string;
    translation: string;
}

export interface ErrorCorrectionExercise {
    incorrectSentence: string;
    correctSentence: string;
    explanation: string;
}

export interface SentenceScrambleExercise {
    correctSentence: string;
    scrambledWords: string[];
}

export interface WritingExercise {
    prompt: string;
    words: VocabularyWord[];
}

export interface SentenceFeedback {
    feedback: string;
    isCorrect: boolean;
}

export interface SentenceOrderingExercise {
  id: number;
  sentences: {
    a: string;
    b: string;
    c: string;
  };
  correctOrder: string;
}

export interface User {
  id?: number;
  username: string;
  phone: string;
  email: string;
  password?: string; // Should not be passed around the app after auth
  isVip?: boolean;
}