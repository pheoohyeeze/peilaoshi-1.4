// Fix: Implemented the full Gemini service to resolve module errors and provide app functionality.
import { GoogleGenAI, Type } from "@google/genai";
import type { HSKLevel, VocabularyWord, PracticeMode, SentenceExample, SentenceFeedback, ErrorCorrectionExercise, SentenceScrambleExercise, WritingExercise, SentenceOrderingExercise, TranslationChoiceQuestion, TranslationChoiceQuiz, WordBuildingQuiz, WordBuildingQuestion, MatchingQuiz, ConjunctionExercise, SearchResultWord } from '../types';
import { HSK_VOCABULARY } from '../data/hsk-vocabulary';
import { WORDS_PER_LESSON, HSK_LEVELS } from '../constants';
// Import all sentence ordering exercises
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41001 } from '../data/pailiesunxu/H41001';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41002 } from '../data/pailiesunxu/H41002';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41003 } from '../data/pailiesunxu/H41003';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41004 } from '../data/pailiesunxu/H41004';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41005 } from '../data/pailiesunxu/H41005';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41006 } from '../data/pailiesunxu/H41006';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41007 } from '../data/pailiesunxu/H41007';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41008 } from '../data/pailiesunxu/H41008';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41009 } from '../data/pailiesunxu/H41009';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41113 } from '../data/pailiesunxu/H41113';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41114 } from '../data/pailiesunxu/H41114';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41115 } from '../data/pailiesunxu/H41115';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41116 } from '../data/pailiesunxu/H41116';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41218 } from '../data/pailiesunxu/H41218';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41327 } from '../data/pailiesunxu/H41327';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41328 } from '../data/pailiesunxu/H41328';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41329 } from '../data/pailiesunxu/H41329';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41330 } from '../data/pailiesunxu/H41330';
import { HSK4_SENTENCE_ORDERING_EXERCISES as H41332 } from '../data/pailiesunxu/H41332';


// Check for API Key - this is a hard requirement.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

// Initialize the Gemini client.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const allSentenceOrderingExercises = [
    ...H41001, ...H41002, ...H41003, ...H41004, ...H41005, ...H41006, ...H41007, ...H41008, ...H41009,
    ...H41113, ...H41114, ...H41115, ...H41116,
    ...H41218,
    ...H41327, ...H41328, ...H41329, ...H41330, ...H41332,
];

// Helper function to safely parse JSON
const safeJsonParse = (jsonString: string) => {
    try {
        // The API might return markdown with ```json ... ```, so we need to strip it.
        const cleanedString = jsonString.replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(cleanedString);
    } catch (e) {
        console.error("Failed to parse JSON:", jsonString, e);
        throw new Error("Received invalid JSON from the API.");
    }
};

// Utility to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// Generate a multiple-choice translation quiz from local data
export const generateTranslationChoiceQuiz = (
  lessonWords: VocabularyWord[]
): TranslationChoiceQuiz => {
  if (lessonWords.length < 4) {
    // App.tsx handles the error message based on this.
    return { questions: [] };
  }

  const questions: TranslationChoiceQuestion[] = lessonWords.map(word => {
    const correctAnswer = word.translation;
    
    // Get 3 incorrect options from the rest of the lesson's words
    const incorrectOptions = lessonWords
      .filter(w => w.character !== word.character)
      .map(w => w.translation);

    // Shuffle and pick 3 unique incorrect options
    const shuffledIncorrect = shuffleArray(incorrectOptions);
    const selectedIncorrect = [...new Set(shuffledIncorrect)].slice(0, 3);
    
    // Combine correct and incorrect options and shuffle them
    const options = shuffleArray([correctAnswer, ...selectedIncorrect]);

    return {
      word,
      options,
      correctAnswer,
    };
  });

  // Shuffle the order of questions for the quiz
  return {
    questions: shuffleArray(questions),
  };
};

// Generate a word building quiz from local data
export const generateWordBuildingQuiz = (
  lessonWords: VocabularyWord[]
): WordBuildingQuiz => {
  const allCharsInLesson = [
    ...new Set(lessonWords.flatMap(w => w.character.split(''))),
  ];

  const questions: WordBuildingQuestion[] = lessonWords
    .filter(word => word.character && word.character.length > 1) // Only use multi-character words
    .map(word => {
      const correctChars = word.character.split('');
      
      const distractors = shuffleArray(allCharsInLesson)
        .filter(char => !correctChars.includes(char))
        .slice(0, 2); // Add 2 distractors, like in the screenshot

      const options = shuffleArray([...correctChars, ...distractors]);

      return {
        word,
        options,
        correctAnswer: word.character,
      };
    });

  if (questions.length === 0) {
    return { questions: [] };
  }
  
  return {
    questions: shuffleArray(questions),
  };
};

// Generate a word-translation matching quiz from local data, split into rounds.
export const generateMatchingQuiz = (
  lessonWords: VocabularyWord[]
): MatchingQuiz => {
  const WORDS_PER_ROUND = 5;
  const NUMBER_OF_ROUNDS = 3;

  if (lessonWords.length < WORDS_PER_ROUND * NUMBER_OF_ROUNDS) {
    // Not enough words to create the game. App.tsx will handle the error message.
    return { rounds: [] };
  }

  // Shuffle all lesson words once to randomize the rounds each time
  const shuffledWords = shuffleArray(lessonWords);
  
  const rounds: VocabularyWord[][] = [];
  for (let i = 0; i < NUMBER_OF_ROUNDS; i++) {
    const startIndex = i * WORDS_PER_ROUND;
    const endIndex = startIndex + WORDS_PER_ROUND;
    rounds.push(shuffledWords.slice(startIndex, endIndex));
  }
  
  return {
    rounds,
  };
};

// Functions to get lesson and word counts from local data
export const getTotalWordsForLevel = (level: HSKLevel): number => {
  return HSK_VOCABULARY[level]?.length || 0;
};

export const getNumberOfLessons = (level: HSKLevel): number => {
  const totalWords = getTotalWordsForLevel(level);
  return Math.ceil(totalWords / WORDS_PER_LESSON);
};

// Fetch a fixed set of vocabulary for a specific lesson
export const fetchHSKVocabularyForLesson = async (level: HSKLevel, lesson: number): Promise<VocabularyWord[]> => {
  const wordsForLevel = HSK_VOCABULARY[level] || [];
  
  const startIndex = (lesson - 1) * WORDS_PER_LESSON;
  const endIndex = startIndex + WORDS_PER_LESSON;
  
  // Return a fixed slice for the given lesson.
  return Promise.resolve(wordsForLevel.slice(startIndex, endIndex));
};

// Generate practice exercises using the Gemini API
export const generatePracticeExercise = async (
    word: VocabularyWord,
    mode: PracticeMode,
    level: HSKLevel
): Promise<SentenceExample | ErrorCorrectionExercise | SentenceScrambleExercise | WritingExercise | SentenceOrderingExercise | ConjunctionExercise | null> => {

    if (mode === 'ordering') {
        // HSK 4 Sentence Ordering is a specific test format. We'll use local data for this.
        if (level === 4 && allSentenceOrderingExercises.length > 0) {
            const randomIndex = Math.floor(Math.random() * allSentenceOrderingExercises.length);
            return allSentenceOrderingExercises[randomIndex];
        } else {
            // Handle cases where there's no data or it's not HSK 4
            throw new Error('Sentence ordering exercises are only available for HSK 4.');
        }
    }
    
    let prompt: string;
    let responseSchema: any;

    const wordInfo = `The target word is "${word.character}" (pinyin: ${word.pinyin}, translation: ${word.translation}). The HSK level is ${level}.`;

    switch (mode) {
        case 'example':
            prompt = `Generate a simple and clear example sentence in Chinese using the word "${word.character}". Also provide a Lao translation for the sentence. The sentence should be appropriate for an HSK level ${level} learner. Ensure the Chinese sentence ends with a Chinese full stop (。).`;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    sentence: { type: Type.STRING, description: 'The Chinese example sentence ending with a full stop (。).' },
                    translation: { type: Type.STRING, description: 'The Lao translation of the sentence.' },
                },
            };
            break;
        case 'correction':
            prompt = `Create an error correction exercise for an HSK level ${level} learner. Generate a Chinese sentence that uses the word "${word.character}" but contains one common grammatical error. Also provide the corrected version of the sentence and a brief explanation of the error in Lao. Ensure both Chinese sentences end with a Chinese full stop (。).`;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    incorrectSentence: { type: Type.STRING, description: 'The incorrect Chinese sentence ending with a full stop (。).' },
                    correctSentence: { type: Type.STRING, description: 'The correct Chinese sentence ending with a full stop (。).' },
                    explanation: { type: Type.STRING, description: 'The explanation of the error in Lao.' },
                },
            };
            break;
        case 'scramble':
            prompt = `Create a sentence scramble exercise. Generate a correct, natural-sounding Chinese sentence using the word "${word.character}" suitable for an HSK level ${level} learner. The sentence must end with a Chinese full stop (。). Then, provide an array of the words/phrases from that sentence in a scrambled order. The final punctuation mark (the full stop 。) must be included as a separate item in the scrambledWords array. Do not join the punctuation with the last word.`;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    correctSentence: { type: Type.STRING, description: 'The correct, unscrambled Chinese sentence ending with a full stop (。).' },
                    scrambledWords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'An array of words from the correct sentence, in a scrambled order, including the final full stop "。" as a separate item.'
                    },
                },
            };
            break;
        case 'writing':
             prompt = `Create a writing prompt for an HSK level ${level} learner. The prompt should be in Lao and encourage the user to write a short essay of about 80 characters. Provide 5 related vocabulary words, including "${word.character}", that they should use in their essay.`;
             responseSchema = {
                type: Type.OBJECT,
                properties: {
                    prompt: { type: Type.STRING, description: "A writing prompt in Lao." },
                    words: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                character: { type: Type.STRING },
                                pinyin: { type: Type.STRING },
                                translation: { type: Type.STRING }
                            }
                        },
                         description: `An array of 5 vocabulary words (as objects with character, pinyin, translation), including the target word: ${word.character}.`
                    }
                }
             };
             break;
        case 'conjunction':
            prompt = `Create a sentence linking exercise for an HSK level ${level} learner using the word "${word.character}". 
            1.  Provide two simple but related Chinese sentences (sentenceA, sentenceB). At least one of them should contain the word "${word.character}".
            2.  Provide the correct conjunction (e.g., "因为...所以...", "不但...而且...", "虽然...但是...") that can be used to connect sentenceA and sentenceB into a single, logical sentence.
            3.  Provide two plausible but incorrect conjunction options, shuffled with the correct one.
            4.  Provide the final, complete, correct sentence formed by joining the two sentences with the correct conjunction.
            5.  Ensure all generated sentences (sentenceA, sentenceB, correctSentence) end with a Chinese full stop (。).`;
            responseSchema = {
                type: Type.OBJECT,
                properties: {
                    sentenceA: { type: Type.STRING, description: 'The first Chinese sentence, ending with a full stop (。).' },
                    sentenceB: { type: Type.STRING, description: 'The second Chinese sentence, ending with a full stop (。).' },
                    conjunctionOptions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'An array of three conjunctions: one correct and two incorrect, in a random order.'
                    },
                    correctConjunction: { type: Type.STRING, description: 'The correct conjunction from the options.' },
                    correctSentence: { type: Type.STRING, description: 'The complete sentence formed by connecting A and B with the correct conjunction, ending with a full stop (。).' },
                },
            };
            break;
        default:
            throw new Error(`Unsupported practice mode: ${mode}`);
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${wordInfo} ${prompt}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });

        if (response.text) {
            return safeJsonParse(response.text);
        }
        return null;

    } catch (error) {
        console.error(`Error generating practice for mode ${mode}:`, error);
        throw new Error(`Failed to generate exercise. The API returned an error.`);
    }
};


// Get feedback for a user-built sentence
// Fix: Pass HSKLevel to the function and use it in the prompt, as VocabularyWord does not contain the level property.
export const getSentenceFeedback = async (word: VocabularyWord, sentence: string, level: HSKLevel): Promise<SentenceFeedback | null> => {
    const prompt = `A student learning Chinese at HSK level ${level} wrote the following sentence to practice the word "${word.character}" (pinyin: ${word.pinyin}): "${sentence}". 
    Please analyze the sentence.
    1. Determine if the sentence is grammatically correct and natural-sounding.
    2. Provide concise feedback in Lao. If it's correct, praise the student. If it's incorrect, gently point out the error and suggest a correction.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            isCorrect: { type: Type.BOOLEAN, description: 'True if the sentence is correct and natural, otherwise false.' },
            feedback: { type: Type.STRING, description: 'Concise feedback for the student in Lao.' },
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        
        if (response.text) {
            return safeJsonParse(response.text);
        }
        return null;
    } catch (error) {
        console.error('Error getting sentence feedback:', error);
        throw new Error('Failed to get feedback from the API.');
    }
};

// Get feedback for a user-written essay
export const getEssayFeedback = async (level: HSKLevel, essay: string, words: VocabularyWord[]): Promise<SentenceFeedback | null> => {
    const wordList = words.map(w => `"${w.character}"`).join(', ');
    const prompt = `A student at HSK level ${level} wrote a short essay in Chinese. They were asked to use the following words: ${wordList}. The essay is: "${essay}".
    Please analyze the essay.
    1. Check if all the required words were used correctly.
    2. Check for grammatical errors and awkward phrasing.
    3. Provide overall constructive feedback in Lao. The feedback should be encouraging. If there are major errors, suggest improvements. If it's well-written, give praise.`;
    
     const responseSchema = {
        type: Type.OBJECT,
        properties: {
            isCorrect: { type: Type.BOOLEAN, description: 'A general assessment. True if the essay is mostly good with minor or no errors. False if there are significant errors.' },
            feedback: { type: Type.STRING, description: 'Overall constructive feedback for the student in Lao, about 2-3 sentences long.' },
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
             config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        
        if (response.text) {
             return safeJsonParse(response.text);
        }
        return null;
    } catch (error) {
        console.error('Error getting essay feedback:', error);
        throw new Error('Failed to get feedback from the API.');
    }
};

const findWordLevel = (character: string): HSKLevel | null => {
    for (const level of HSK_LEVELS) {
        const levelAsNumber = parseInt(level.toString(), 10) as HSKLevel;
        if (HSK_VOCABULARY[levelAsNumber]?.some(word => word.character === character)) {
            return levelAsNumber;
        }
    }
    return null;
};

export const identifyCharactersInImage = async (base64ImageData: string): Promise<SearchResultWord[]> => {
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
        },
    };

    const textPart = {
        text: `Identify all simplified Chinese HSK characters in this image. For each character found, provide its simplified form, its standard pinyin, and its Lao translation.
        Respond ONLY with a valid JSON array. Each object in the array must have these exact keys: "character", "pinyin", "translation".
        If no HSK characters are found, return an empty array [].
        Example response for finding '你好': [{"character": "你", "pinyin": "nǐ", "translation": "ເຈົ້າ"}, {"character": "好", "pinyin": "hǎo", "translation": "ດີ"}]`,
    };

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                character: { type: Type.STRING },
                pinyin: { type: Type.STRING },
                translation: { type: Type.STRING },
            },
            required: ['character', 'pinyin', 'translation'],
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema,
            },
        });

        if (response.text) {
            const identifiedWords = safeJsonParse(response.text) as VocabularyWord[];
            
            const resultsWithLevel: SearchResultWord[] = identifiedWords
                .map(word => {
                    const level = findWordLevel(word.character);
                    if (level) {
                        const originalWord = HSK_VOCABULARY[level].find(w => w.character === word.character);
                        return { ...word, level, audioUrl: originalWord?.audioUrl };
                    }
                    return null;
                })
                // Fix: Corrected a TypeScript type predicate error by using a more robust type guard that correctly infers the filtered array type.
                .filter((word): word is Exclude<typeof word, null> => word !== null);

            return resultsWithLevel;
        }
        return [];
    } catch (error) {
        console.error('Error identifying characters in image:', error);
        throw new Error('ບໍ່ສາມາດກວດຫາຕົວອັກສອນໄດ້. API ເກີດຂໍ້ຜິດພາດ.');
    }
};

export const identifyObjectInImage = async (base64ImageData: string): Promise<SearchResultWord[]> => {
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
        },
    };

    const textPart = {
        text: `Identify the main object in this image. Provide its common Chinese name, standard pinyin, and its Lao translation.
        Respond ONLY with a valid JSON object that has these exact keys: "character", "pinyin", "translation" (in Lao). 
        If you cannot identify a clear object, return an empty JSON object {}.
        For example, if you see a cup, respond: {"character": "杯子", "pinyin": "bēi zi", "translation": "ຈອກ"}.
        If you see a screwdriver, respond: {"character": "螺丝刀", "pinyin": "luósīdāo", "translation": "ໄຂຄວງ"}.`,
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            character: { type: Type.STRING },
            pinyin: { type: Type.STRING },
            translation: { type: Type.STRING },
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema,
            },
        });

        if (response.text) {
            const identifiedWord = safeJsonParse(response.text) as VocabularyWord;

            if (!identifiedWord || Object.keys(identifiedWord).length === 0 || !identifiedWord.character) {
                return [];
            }

            const level = findWordLevel(identifiedWord.character);
            if (level) {
                const originalWord = HSK_VOCABULARY[level].find(w => w.character === identifiedWord.character);
                const result: SearchResultWord = { ...identifiedWord, level, audioUrl: originalWord?.audioUrl };
                return [result];
            } else {
                // It's not an HSK word, but the user still wants to see it.
                const result: SearchResultWord = { ...identifiedWord, level: null, audioUrl: `https://fanyi.baidu.com/gettts?lan=zh&text=${encodeURIComponent(identifiedWord.character)}&spd=3&source=web` };
                return [result];
            }
        }
        return [];
    } catch (error) {
        console.error('Error identifying object in image:', error);
        throw new Error('ບໍ່ສາມາດກວດຫາວັດຖຸໄດ້. API ເກີດຂໍ້ຜິດພາດ.');
    }
};