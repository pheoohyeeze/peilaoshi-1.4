export type HSKLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface VocabularyWord {
  character: string;
  pinyin: string;
  translation: string;
  audioUrl?: string;
}

export type PracticeMode = 'example' | 'correction' | 'scramble' | 'building' | 'writing' | 'ordering' | 'translation_choice' | 'build_from_translation' | 'matching' | 'conjunction';

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

export interface TranslationChoiceQuestion {
  word: VocabularyWord;
  options: string[];
  correctAnswer: string;
}

export interface TranslationChoiceQuiz {
  questions: TranslationChoiceQuestion[];
}

export interface WordBuildingQuestion {
  word: VocabularyWord;
  options: string[];
  correctAnswer: string;
}

export interface WordBuildingQuiz {
  questions: WordBuildingQuestion[];
}

export interface MatchingQuiz {
  rounds: VocabularyWord[][];
}

export interface ConjunctionExercise {
    sentenceA: string;
    sentenceB: string;
    conjunctionOptions: string[];
    correctConjunction: string;
    correctSentence: string;
}

export interface WordProgress {
  score: number;
  lastReviewed: number;
}

export type ProgressData = Record<string, WordProgress>;

// New types for Activity History
export type ActivityType = 'lesson_start' | 'quiz_complete' | 'practice_complete' | 'login' | 'register';

export interface ActivityLogEntry {
  id: number; // timestamp
  type: ActivityType;
  level?: HSKLevel;
  lesson?: number;
  mode?: PracticeMode;
  word?: string; // character
  score?: number;
  total?: number;
  isCorrect?: boolean;
  username?: string; // For admin dashboard view
}
