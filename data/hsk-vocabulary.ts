import type { HSKLevel, VocabularyWord } from '../types';
import { HSK1_WORDS } from './hsk1-vocabulary';
import { HSK2_WORDS } from './hsk2-vocabulary';
import { HSK3_WORDS } from './hsk3-vocabulary';
import { HSK4_WORDS } from './hsk4-vocabulary';
import { HSK5_WORDS } from './hsk5-vocabulary';
import { HSK6_WORDS } from './hsk6-vocabulary';


export const HSK_VOCABULARY: Record<HSKLevel, VocabularyWord[]> = {
  1: HSK1_WORDS,
  2: HSK2_WORDS,
  3: HSK3_WORDS,
  4: HSK4_WORDS,
  5: HSK5_WORDS,
  6: HSK6_WORDS,
};
