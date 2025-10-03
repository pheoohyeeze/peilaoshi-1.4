import { GoogleGenAI, Type } from "@google/genai";
import type { HSKLevel, VocabularyWord, PracticeMode, SentenceExample, ErrorCorrectionExercise, SentenceScrambleExercise, SentenceFeedback, WritingExercise, SentenceOrderingExercise } from '../types';
import { getVocabularyByLevel } from './dataService';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41001_EXERCISES } from '../data/pailiesunxu/H41001';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41002_EXERCISES } from '../data/pailiesunxu/H41002';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41003_EXERCISES } from '../data/pailiesunxu/H41003';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41327_EXERCISES } from '../data/pailiesunxu/H41327';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41328_EXERCISES } from '../data/pailiesunxu/H41328';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41329_EXERCISES } from '../data/pailiesunxu/H41329';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41330_EXERCISES } from '../data/pailiesunxu/H41330';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41332_EXERCISES } from '../data/pailiesunxu/H41332';

const ALL_HSK4_SENTENCE_ORDERING_EXERCISES = [...H41001_EXERCISES, ...H41002_EXERCISES, ...H41003_EXERCISES, ...H41327_EXERCISES, ...H41328_EXERCISES, ...H41329_EXERCISES, ...H41330_EXERCISES, ...H41332_EXERCISES];
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const fetchHSKVocabulary = async (level: HSKLevel): Promise<VocabularyWord[]> => {
  try {
    const wordsForLevel = await getVocabularyByLevel(level);
    if (!wordsForLevel || wordsForLevel.length === 0) {
        throw new Error(`ບໍ່ພົບຄຳສັບສຳລັບ HSK ລະດັບ ${level}.`);
    }
    const shuffledWords = shuffleArray(wordsForLevel);
    const selectedWords = shuffledWords.slice(0, 20);
    return selectedWords;
  } catch (error) {
    console.error('Error fetching HSK vocabulary:', error);
    throw error;
  }
};

const fetchSentenceOrderingExercise = (): SentenceOrderingExercise => {
    const randomIndex = Math.floor(Math.random() * ALL_HSK4_SENTENCE_ORDERING_EXERCISES.length);
    return ALL_HSK4_SENTENCE_ORDERING_EXERCISES[randomIndex];
};


export const generatePracticeExercise = async (
  word: VocabularyWord, 
  mode: PracticeMode,
  level: HSKLevel
): Promise<SentenceExample | ErrorCorrectionExercise | SentenceScrambleExercise | WritingExercise | SentenceOrderingExercise> => {
  try {
    if (mode === 'ordering') {
      if (level !== 4) {
        throw new Error('This practice mode is only available for HSK Level 4.');
      }
      return fetchSentenceOrderingExercise();
    }
      
    let contents = '';
    let responseSchema: any = {};

    switch (mode) {
      case 'example':
        contents = `Generate a simple, common Chinese sentence using the word '${word.character}' (${word.pinyin}). The sentence should be easy for an HSK level ${level} student to understand. Also provide the Laotian translation of the sentence.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING, description: 'The generated Chinese sentence.' },
            translation: { type: Type.STRING, description: 'The Laotian translation of the sentence.' }
          },
          required: ["sentence", "translation"]
        };
        break;
      case 'correction':
        contents = `Create a sentence for an HSK level ${level} student using the word '${word.character}'. The sentence must contain one common grammatical error. Provide the incorrect sentence, the corrected sentence, and a simple explanation of the error in Laotian.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            incorrectSentence: { type: Type.STRING },
            correctSentence: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["incorrectSentence", "correctSentence", "explanation"]
        };
        break;
      case 'scramble':
        contents = `Create a simple sentence for an HSK level ${level} student using the word '${word.character}'. Provide the correct sentence, and an array of its constituent words or phrases in a scrambled (random) order. The scrambled words array should not contain empty strings.`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            correctSentence: { type: Type.STRING },
            scrambledWords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["correctSentence", "scrambledWords"]
        };
        break;
      case 'writing':
        contents = `For an HSK level ${level} student, generate a writing exercise. Provide 5 related Chinese vocabulary words suitable for this level. The student must use all 5 words to write a short essay of about 80 characters. Provide the list of words. The prompt for the user should be in Chinese: "请结合下列词语（要全部使用），写一篇80字左右的短文。"
        For each word, provide the character, pinyin, and Laotian translation.`;
        responseSchema = {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'The user-facing prompt in Chinese.' },
                words: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            character: { type: Type.STRING },
                            pinyin: { type: Type.STRING },
                            translation: { type: Type.STRING }
                        },
                        required: ["character", "pinyin", "translation"]
                    }
                }
            },
            required: ["prompt", "words"]
        };
        break;
      default:
        // This case should not be hit with TypeScript, but it's good practice
        throw new Error("Invalid practice mode specified.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error(`Error generating practice for mode ${mode}:`, error);
    throw new Error('ການສ້າງແບບຝຶກຫັດຈາກ Gemini API ລົ້ມເຫລວ.');
  }
};

export const getSentenceFeedback = async (
    word: VocabularyWord,
    userSentence: string
): Promise<SentenceFeedback> => {
    try {
        const contents = `A student is learning the HSK word '${word.character}' (${word.pinyin}). They wrote the following sentence: "${userSentence}". Please evaluate this sentence. Is it grammatically correct and natural for a learner? Provide feedback in Laotian. Also provide a boolean 'isCorrect' field. Keep the feedback concise, positive, and encouraging.`;
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                feedback: { type: Type.STRING, description: "Feedback for the user in Laotian." },
                isCorrect: { type: Type.BOOLEAN, description: "True if the sentence is grammatically correct and makes sense." }
            },
            required: ["feedback", "isCorrect"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error('Error getting sentence feedback:', error);
        throw new Error('ການໃຫ້ຄຳຕິຊົມຈາກ Gemini API ລົ້ມເຫລວ.');
    }
};

export const getEssayFeedback = async (
    level: HSKLevel,
    userEssay: string,
    words: VocabularyWord[]
): Promise<SentenceFeedback> => {
    try {
        const wordList = words.map(w => `'${w.character}' (${w.pinyin})`).join(', ');
        const contents = `A student is learning HSK level ${level}. They were asked to write a short essay of about 80 characters using all of the following five words: ${wordList}.
        Here is their essay: "${userEssay}".
        Please evaluate this essay in Laotian.
        1. Check if all five required words were used correctly.
        2. Check for grammatical correctness, coherence, and natural language.
        3. Provide concise, positive, and encouraging feedback.
        Also provide a boolean 'isCorrect' field which is true if the essay is well-written and uses all words correctly.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                feedback: { type: Type.STRING, description: "Feedback for the user in Laotian." },
                isCorrect: { type: Type.BOOLEAN, description: "True if the essay is well-written and uses all words correctly." }
            },
            required: ["feedback", "isCorrect"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error('Error getting essay feedback:', error);
        throw new Error('ການໃຫ້ຄຳຕິຊົມຈາກ Gemini API ລົ້ມເຫລວ.');
    }
};