import React, { useState, useEffect } from 'react';
import type { HSKLevel, PracticeMode, VocabularyWord, SentenceExample, ErrorCorrectionExercise, SentenceScrambleExercise, SentenceFeedback, WritingExercise, SentenceOrderingExercise, TranslationChoiceQuiz, WordBuildingQuiz, MatchingQuiz, ConjunctionExercise, ActivityLogEntry } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { ArrowLeftIcon, SpeakerWaveIcon } from './IconComponents';

interface PracticeViewProps {
  mode: PracticeMode;
  word: VocabularyWord;
  data: any;
  level: HSKLevel;
  lesson: number;
  onClose: () => void;
  onSentenceSubmit: (sentence: string) => Promise<SentenceFeedback | null>;
  onEssaySubmit?: (essay: string, words: VocabularyWord[]) => Promise<SentenceFeedback | null>;
  onNewExercise: (mode: PracticeMode) => void;
  onUpdateProgress: (character: string, outcome: 'correct' | 'incorrect') => void;
  onLogActivity: (entry: Omit<ActivityLogEntry, 'id'>) => void;
  currentUser: string | null;
}

const playAudio = (audioUrl?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error("Audio playback failed:", error));
  }
};

const PracticeHeader: React.FC<{ title: string; word?: VocabularyWord; onClose: () => void }> = ({ title, word, onClose }) => (
    <div className="relative flex flex-col items-center justify-center mb-6 gap-2">
        <div className="w-full flex items-center justify-center">
             <button onClick={onClose} className="absolute left-0 p-2 rounded-full bg-slate-200 text-slate-600 hover:bg-brand-primary hover:text-white dark:bg-slate-600 dark:text-slate-200 dark:hover:text-white transition-colors" aria-label="ກັບໄປທີ່ບັດຄຳສັບ">
                <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-primary">{title}</h2>
        </div>
        {word?.character && (
            <div className="flex items-center gap-2">
                <span className="text-xl text-slate-800 dark:text-slate-100 font-semibold">{word.character}</span>
                <span className="text-lg text-slate-500 dark:text-slate-400">({word.pinyin})</span>
                {word.audioUrl && (
                    <button 
                        onClick={() => playAudio(word.audioUrl)}
                        className="p-1 rounded-full bg-slate-200 text-slate-600 hover:bg-brand-primary hover:text-white dark:bg-slate-600 dark:text-slate-200 dark:hover:text-white transition-colors"
                        aria-label="Play pronunciation"
                    >
                        <SpeakerWaveIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        )}
    </div>
);

// Fix: Corrected component definition which was not returning any JSX.
const PracticeView: React.FC<PracticeViewProps> = ({ mode, word, data, level, lesson, onClose, onSentenceSubmit, onEssaySubmit, onNewExercise, onUpdateProgress, onLogActivity, currentUser }) => {
    
    // State for single-exercise modes
    const [userAnswer, setUserAnswer] = useState<string[]>([]);
    const [scrambleStatus, setScrambleStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [showCorrection, setShowCorrection] = useState(false);
    const [userSentence, setUserSentence] = useState('');
    const [feedback, setFeedback] = useState<SentenceFeedback | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userEssay, setUserEssay] = useState('');
    const [essayFeedback, setEssayFeedback] = useState<SentenceFeedback | null>(null);
    const [isSubmittingEssay, setIsSubmittingEssay] = useState(false);
    const [userOrder, setUserOrder] = useState<string[]>([]);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    
    // State for Conjunction mode
    const [conjunctionStatus, setConjunctionStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [selectedConjunction, setSelectedConjunction] = useState<string | null>(null);

    // Generic Quiz State
    const [quizData, setQuizData] = useState<TranslationChoiceQuiz | WordBuildingQuiz | MatchingQuiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isQuizOver, setIsQuizOver] = useState(false);

    // State specific to translation choice
    const [choiceStatus, setChoiceStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

    // State specific to word building
    const [wbUserAnswer, setWbUserAnswer] = useState<string[]>([]);
    const [wbStatus, setWbStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    // State for the new two-column matching game
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [leftColumn, setLeftColumn] = useState<VocabularyWord[]>([]);
    const [rightColumn, setRightColumn] = useState<VocabularyWord[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [selectedRight, setSelectedRight] = useState<number | null>(null);
    const [matchedChars, setMatchedChars] = useState<string[]>([]);
    const [incorrectPair, setIncorrectPair] = useState<[number, number] | null>(null);
    const [matchingTotalScore, setMatchingTotalScore] = useState(0);


    useEffect(() => {
        // Reset single-exercise states
        setUserAnswer([]);
        setScrambleStatus('idle');
        setShowCorrection(false);
        setUserSentence('');
        setFeedback(null);
        setIsSubmitting(false);
        setUserEssay('');
        setEssayFeedback(null);
        setIsSubmittingEssay(false);
        setUserOrder([]);
        setOrderStatus('idle');
        setConjunctionStatus('idle');
        setSelectedConjunction(null);

        // Reset all quiz states when data or mode changes
        if (['translation_choice', 'build_from_translation', 'matching'].includes(mode)) {
            setQuizData(data);
            setCurrentQuestionIndex(0);
            setScore(0);
            setIsQuizOver(false);

            // Reset interaction states for other quiz types
            setChoiceStatus('idle');
            setSelectedChoice(null);
            setWbUserAnswer([]);
            setWbStatus('idle');
            
            // Setup for the new matching game
            if (mode === 'matching') {
                setCurrentRoundIndex(0);
                setMatchingTotalScore(0);
            }
        }

        if (mode === 'example' && data) {
             onLogActivity({ type: 'practice_complete', level, lesson, mode: 'example', word: word.character });
        }
    }, [data, mode, level, lesson, word, onLogActivity]);
    
    // Effect to set up the matching game board for the current round
    useEffect(() => {
        if (mode === 'matching') {
            const quiz = quizData as MatchingQuiz;
            if (quiz && quiz.rounds && quiz.rounds.length > currentRoundIndex) {
                const currentRoundWords = quiz.rounds[currentRoundIndex];
                const shuffleArray = (array: any[]) => {
                    const newArray = [...array];
                    for (let i = newArray.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
                    }
                    return newArray;
                };
                setLeftColumn(currentRoundWords);
                setRightColumn(shuffleArray([...currentRoundWords]));
                setSelectedLeft(null);
                setSelectedRight(null);
                setMatchedChars([]);
                setIncorrectPair(null);
            }
        }
    }, [quizData, currentRoundIndex, mode]);


    // Effect to check for matches in the matching game
    useEffect(() => {
        if (selectedLeft !== null && selectedRight !== null) {
            const leftWord = leftColumn[selectedLeft];
            const rightWord = rightColumn[selectedRight];

            if (leftWord.character === rightWord.character) {
                // Correct match
                setMatchedChars(prev => [...prev, leftWord.character]);
                onUpdateProgress(leftWord.character, 'correct');
                setMatchingTotalScore(prev => prev + 1);
                setSelectedLeft(null);
                setSelectedRight(null);
            } else {
                // Incorrect match
                onUpdateProgress(leftWord.character, 'incorrect');
                onUpdateProgress(rightWord.character, 'incorrect');
                setIncorrectPair([selectedLeft, selectedRight]);
                setTimeout(() => {
                    setSelectedLeft(null);
                    setSelectedRight(null);
                    setIncorrectPair(null);
                }, 800);
            }
        }
    }, [selectedLeft, selectedRight, leftColumn, rightColumn, onUpdateProgress]);


    const handleScrambleWordClick = (word: string) => {
        setUserAnswer([...userAnswer, word]);
    };
    
    const checkScrambleAnswer = () => {
        const expected = (data as SentenceScrambleExercise).correctSentence;
        const actual = userAnswer.join('');
        const isCorrect = expected === actual;
        setScrambleStatus(isCorrect ? 'correct' : 'incorrect');
        onUpdateProgress(word.character, isCorrect ? 'correct' : 'incorrect');
        onLogActivity({ type: 'practice_complete', level, lesson, mode, word: word.character, isCorrect });
    };
    
    const resetScramble = () => {
        setUserAnswer([]);
        setScrambleStatus('idle');
    };

    const handleSentenceBuildSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userSentence.trim()) return;
        setIsSubmitting(true);
        setFeedback(null);
        const result = await onSentenceSubmit(userSentence);
        if (result) {
            setFeedback(result);
            onUpdateProgress(word.character, result.isCorrect ? 'correct' : 'incorrect');
            onLogActivity({ type: 'practice_complete', level, lesson, mode, word: word.character, isCorrect: result.isCorrect });
        }
        setIsSubmitting(false);
    };

    const handleEssaySubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        const exercise = data as WritingExercise;
        if (!userEssay.trim() || !exercise.words || !onEssaySubmit) return;
        setIsSubmittingEssay(true);
        setEssayFeedback(null);
        const result = await onEssaySubmit(userEssay, exercise.words);
        if (result) {
            setEssayFeedback(result);
            // Update progress for all required words based on overall essay correctness
            exercise.words.forEach(w => onUpdateProgress(w.character, result.isCorrect ? 'correct' : 'incorrect'));
            onLogActivity({ type: 'practice_complete', level, lesson, mode, word: exercise.words.map(w => w.character).join(','), isCorrect: result.isCorrect });
        }
        setIsSubmittingEssay(false);
    };

    // Generic Quiz Handlers
    const handleNextQuestion = () => {
        if (!quizData) return;
        if (mode === 'translation_choice' || mode === 'build_from_translation') {
            const quiz = quizData as TranslationChoiceQuiz | WordBuildingQuiz;
            if (currentQuestionIndex < quiz.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                // Reset interaction states
                setChoiceStatus('idle');
                setSelectedChoice(null);
                setWbUserAnswer([]);
                setWbStatus('idle');
            } else {
                 onLogActivity({ type: 'quiz_complete', level, lesson, mode, score, total: quiz.questions.length });
                setIsQuizOver(true);
            }
        }
    };

    const handleRestartQuiz = () => {
        onNewExercise(mode as PracticeMode);
    };
    
    // Handlers for Translation Choice
    const handleChoiceSelect = (choice: string) => {
        if (choiceStatus !== 'idle' || !quizData) return;
        const currentQuestion = (quizData as TranslationChoiceQuiz).questions[currentQuestionIndex];
        setSelectedChoice(choice);
        if (choice === currentQuestion.correctAnswer) {
            setChoiceStatus('correct');
            setScore(prev => prev + 1);
            onUpdateProgress(currentQuestion.word.character, 'correct');
        } else {
            setChoiceStatus('incorrect');
            onUpdateProgress(currentQuestion.word.character, 'incorrect');
        }
    };

    // Handlers for Word Building
    const handleWbCharClick = (char: string) => {
        if (wbStatus !== 'idle' || !quizData) return;
        const currentQuestion = (quizData as WordBuildingQuiz).questions[currentQuestionIndex];
        if(wbUserAnswer.length < currentQuestion.correctAnswer.length) {
            setWbUserAnswer(prev => [...prev, char]);
        }
    };
    
    const handleWbBackspace = () => {
        if (wbStatus !== 'idle') return;
        setWbUserAnswer(prev => prev.slice(0, -1));
    };

    const handleWbCheck = () => {
        if (wbStatus !== 'idle' || !quizData) return;
        const currentQuestion = (quizData as WordBuildingQuiz).questions[currentQuestionIndex];
        const userAnswerStr = wbUserAnswer.join('');
        
        if (userAnswerStr === currentQuestion.correctAnswer) {
            setWbStatus('correct');
            setScore(prev => prev + 1);
            onUpdateProgress(currentQuestion.word.character, 'correct');
        } else {
            setWbStatus('incorrect');
            onUpdateProgress(currentQuestion.word.character, 'incorrect');
        }
    };
    
    // Handlers for Conjunction
    const handleConjunctionSelect = (option: string) => {
        if (conjunctionStatus !== 'idle' || !data) return;
        const exercise = data as ConjunctionExercise;
        setSelectedConjunction(option);
        const isCorrect = option === exercise.correctConjunction;
        setConjunctionStatus(isCorrect ? 'correct' : 'incorrect');
        onUpdateProgress(word.character, isCorrect ? 'correct' : 'incorrect');
        onLogActivity({ type: 'practice_complete', level, lesson, mode, word: word.character, isCorrect });
    };

    // Handlers for Matching Game
    const handleLeftCardClick = (index: number) => {
        if (incorrectPair || matchedChars.includes(leftColumn[index].character) || selectedLeft === index) return;
        setSelectedLeft(index);
    };

    const handleRightCardClick = (index: number) => {
        if (incorrectPair || matchedChars.includes(rightColumn[index].character) || selectedRight === index) return;
        setSelectedRight(index);
    };

    const handleNextMatchingRound = () => {
      const quiz = quizData as MatchingQuiz;
      if (currentRoundIndex < quiz.rounds.length - 1) {
        setCurrentRoundIndex(prev => prev + 1);
      } else {
        const totalWords = quiz.rounds.flat().length;
        onLogActivity({ type: 'quiz_complete', level, lesson, mode, score: matchingTotalScore, total: totalWords });
        setIsQuizOver(true);
      }
    }


    const renderContent = () => {
        if ((['translation_choice', 'build_from_translation'].includes(mode) && isQuizOver && quizData)) {
            const quiz = quizData as TranslationChoiceQuiz | WordBuildingQuiz;
            return (
                <div className="w-full p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg text-center animate-fade-in">
                    <h2 className="text-3xl font-bold text-brand-primary mb-4">ຈົບແບບທົດສອບ!</h2>
                    <p className="text-xl text-slate-700 dark:text-slate-200 mb-8">
                        ຄະແນນຂອງທ່ານ: <strong className="text-4xl font-bold text-green-600 dark:text-green-400">{score}</strong> / {quiz.questions.length}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={onClose} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 transition-colors text-lg font-semibold">ກັບໄປທີ່ບັດຄຳສັບ</button>
                        <button onClick={handleRestartQuiz} className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors text-lg font-semibold">ຝຶກອີກຄັ້ງ</button>
                    </div>
                </div>
            );
        }
         if (mode === 'matching' && isQuizOver && quizData) {
            const quiz = quizData as MatchingQuiz;
            const totalWords = quiz.rounds.flat().length;
            return (
                <div className="w-full p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg text-center animate-fade-in">
                    <h2 className="text-3xl font-bold text-brand-primary mb-4">ຈົບເກມ!</h2>
                    <p className="text-xl text-slate-700 dark:text-slate-200 mb-8">
                        ຄະແນນຂອງທ່ານ: <strong className="text-4xl font-bold text-green-600 dark:text-green-400">{matchingTotalScore}</strong> / {totalWords}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={onClose} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 transition-colors text-lg font-semibold">ກັບໄປທີ່ບັດຄຳສັບ</button>
                        <button onClick={handleRestartQuiz} className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors text-lg font-semibold">ຫຼິ້ນອີກຄັ້ງ</button>
                    </div>
                </div>
            );
        }

        switch (mode) {
            case 'example': {
                const exercise = data as SentenceExample;
                return (
                    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="ຕົວຢ່າງປະໂຫຍກ" onClose={onClose} word={word}/>
                        <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg space-y-4">
                            <p className="text-2xl sm:text-3xl text-slate-800 dark:text-slate-100 text-center font-semibold tracking-wide">{exercise.sentence}</p>
                            <p className="text-lg text-slate-500 dark:text-slate-400 text-center border-t border-slate-200 dark:border-slate-600 pt-4">{exercise.translation}</p>
                        </div>
                    </div>
                );
            }
            case 'correction': {
                const exercise = data as ErrorCorrectionExercise;
                
                const handleShowCorrection = () => {
                    if (!showCorrection) {
                        onLogActivity({ type: 'practice_complete', level, lesson, mode, word: word.character });
                    }
                    setShowCorrection(true);
                };

                return (
                    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="ຊອກຫາຂໍ້ຜິດພາດ" onClose={onClose} word={word}/>
                        <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg space-y-4">
                           <p className="text-slate-500 dark:text-slate-400 text-center mb-2">ຊອກຫາຂໍ້ຜິດພາດໃນປະໂຫຍກລຸ່ມນີ້:</p>
                           <p className="text-2xl sm:text-3xl text-amber-600 text-center font-semibold tracking-wide">"{exercise.incorrectSentence}"</p>
                           
                           {!showCorrection && (
                                <div className="text-center pt-4">
                                    <button onClick={handleShowCorrection} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">
                                        ເປີດເຜີຍຄຳຕອບ
                                    </button>
                                </div>
                           )}

                           {showCorrection && (
                            <div className="border-t border-slate-200 dark:border-slate-600 pt-4 space-y-4 animate-fade-in">
                                <div>
                                    <h4 className="font-semibold text-green-600 dark:text-green-400">ປະໂຫຍກທີ່ຖືກຕ້ອງ:</h4>
                                    <p className="text-xl text-slate-800 dark:text-slate-100">{exercise.correctSentence}</p>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-yellow-600 dark:text-yellow-400">ຄຳອະທິບາຍ:</h4>
                                    <p className="text-slate-600 dark:text-slate-300">{exercise.explanation}</p>
                                </div>
                            </div>
                           )}
                        </div>
                    </div>
                )
            }
            case 'scramble': {
                 const exercise = data as SentenceScrambleExercise;
                 return (
                    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="ລຽງປະໂຫຍກ" onClose={onClose} word={word}/>
                        <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg space-y-4">
                             <p className="text-slate-500 dark:text-slate-400 text-center mb-2">ຄລິກໃສ່ຄຳສັບເພື່ອລຽງປະໂຫຍກໃຫ້ຖືກຕ້ອງ:</p>
                             <div className="p-4 mb-4 min-h-[6rem] bg-slate-100 dark:bg-slate-800 rounded-md text-xl sm:text-2xl text-slate-800 dark:text-slate-100 flex items-center justify-center text-center tracking-wide">
                                {userAnswer.join('')}
                             </div>
                             <div className="flex flex-wrap gap-3 justify-center">
                                {exercise.scrambledWords.map((wordPart, index) => (
                                    <button key={index} onClick={() => handleScrambleWordClick(wordPart)} className="px-4 py-2 text-lg sm:text-xl bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-brand-primary hover:text-white hover:border-transparent dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-brand-primary dark:hover:text-white transition-colors">
                                        {wordPart}
                                    </button>
                                ))}
                             </div>
                             <div className="flex justify-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                                <button onClick={resetScramble} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">ລຶບ</button>
                                <button onClick={checkScrambleAnswer} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary">ກວດສອບ</button>
                             </div>
                             {scrambleStatus === 'correct' && <p className="text-center text-green-600 dark:text-green-400">🎉 ຖືກຕ້ອງ! ເກັ່ງຫຼາຍ!</p>}
                             {scrambleStatus === 'incorrect' && <p className="text-center text-red-600 dark:text-red-400">ລອງໃໝ່ອີກຄັ້ງ. ຄຳຕອບທີ່ຖືກຕ້ອງ: "{exercise.correctSentence}"</p>}
                        </div>
                    </div>
                 )
            }
            case 'building': {
                 return (
                    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="ສ້າງປະໂຫຍກ" onClose={onClose} word={word}/>
                        <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg space-y-4">
                            <p className="text-slate-500 dark:text-slate-400 text-center">ສ້າງປະໂຫຍກຂອງທ່ານເອງໂດຍໃຊ້ຄຳວ່າ: <strong className="text-brand-primary text-lg">{word.character}</strong></p>
                            <form onSubmit={handleSentenceBuildSubmit}>
                                <textarea
                                    value={userSentence}
                                    onChange={(e) => setUserSentence(e.target.value)}
                                    className="w-full h-28 p-3 bg-white border border-slate-300 rounded-md text-slate-800 text-lg focus:ring-2 focus:ring-brand-primary outline-none dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100 dark:placeholder-slate-400"
                                    placeholder="ຂຽນປະໂຫຍກຂອງທ່ານທີ່ນີ້..."
                                    // Fix: Replaced invalid `aria` prop with `aria-label` for accessibility.
                                    aria-label="Sentence building input"
                                />
                                <div className="text-center mt-4">
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:bg-slate-400 transition-colors">
                                        {isSubmitting ? 'ກຳລັງກວດສອບ...' : 'ກວດສອບ'}
                                    </button>
                                </div>
                            </form>
                            {isSubmitting && <LoadingSpinner message="ກຳລັງຂໍຄຳຕິຊົມຈາກ AI..."/>}
                            {feedback && (
                                <div className={`mt-4 p-4 rounded-lg text-center border ${feedback.isCorrect ? 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300' : 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300'}`}>
                                    <p>{feedback.feedback}</p>
                                </div>
                            )}
                        </div>
                    </div>
                 );
            }
            case 'writing': {
                const exercise = data as WritingExercise;
                return (
                    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="ຝຶກຂຽນ" onClose={onClose} />
                        <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg space-y-4">
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">ຫົວຂໍ້:</h3>
                                <p className="text-slate-600 dark:text-slate-300">{exercise.prompt}</p>
                            </div>
                             <div className="text-center space-y-2 border-t border-slate-200 dark:border-slate-600 pt-4">
                                 <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200">ຄຳສັບທີ່ຕ້ອງໃຊ້:</h4>
                                 <div className="flex flex-wrap gap-2 justify-center">
                                    {exercise.words.map(w => (
                                        <div key={w.character} className="bg-white dark:bg-slate-600 px-3 py-1 rounded-md shadow-sm">
                                            <span className="font-bold text-brand-primary">{w.character}</span>
                                            <span className="text-sm text-slate-500 dark:text-slate-400"> ({w.translation})</span>
                                        </div>
                                    ))}
                                 </div>
                             </div>
                             <form onSubmit={handleEssaySubmitForm}>
                                <textarea
                                    value={userEssay}
                                    onChange={(e) => setUserEssay(e.target.value)}
                                    className="w-full h-40 p-3 bg-white border border-slate-300 rounded-md text-slate-800 text-lg focus:ring-2 focus:ring-brand-primary outline-none dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100 dark:placeholder-slate-400"
                                    placeholder="ຂຽນບົດຂຽນຂອງທ່ານທີ່ນີ້ (ປະມານ 80 ໂຕອັກສອນ)..."
                                    aria-label="Essay input area"
                                />
                                <div className="text-center mt-4">
                                    <button type="submit" disabled={isSubmittingEssay} className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:bg-slate-400 transition-colors">
                                        {isSubmittingEssay ? 'ກຳລັງກວດສອບ...' : 'ສົ່ງບົດຂຽນ'}
                                    </button>
                                </div>
                             </form>
                             {isSubmittingEssay && <LoadingSpinner message="ກຳລັງປະເມີນບົດຂຽນ..."/>}
                             {essayFeedback && (
                                <div className={`mt-4 p-4 rounded-lg text-center border ${essayFeedback.isCorrect ? 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300' : 'bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300'}`}>
                                    <h4 className="font-bold mb-2">ຄຳຕິຊົມ:</h4>
                                    <p>{essayFeedback.feedback}</p>
                                </div>
                             )}
                        </div>
                    </div>
                );
            }
             case 'ordering': {
                const exercise = data as SentenceOrderingExercise;
                const parts = Object.entries(exercise.sentences);
                
                const handlePartClick = (part: string) => {
                    if(userOrder.length < 3) {
                        setUserOrder(prev => [...prev, part]);
                    }
                };
                
                const checkOrder = () => {
                    const isCorrect = userOrder.join('') === exercise.correctOrder;
                    setOrderStatus(isCorrect ? 'correct' : 'incorrect');
                    onLogActivity({ type: 'practice_complete', level, lesson, mode, isCorrect });
                };
                
                const resetOrder = () => {
                    setUserOrder([]);
                    setOrderStatus('idle');
                };

                return (
                    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="排列顺序 (ລຽງລຳດັບ)" onClose={onClose}/>
                         <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg space-y-4">
                            <p className="text-slate-500 dark:text-slate-400 text-center mb-2">ຈັດລຽງປະໂຫຍກລຸ່ມນີ້ໃຫ້ຖືກຕ້ອງ:</p>
                            <div className="space-y-3">
                                {parts.map(([key, sentence]) => (
                                    <div key={key} className="flex items-start gap-2">
                                        <span className="font-bold text-lg text-brand-primary">{key.toUpperCase()}.</span>
                                        <p className="text-lg text-slate-700 dark:text-slate-200">{sentence}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 mb-2 min-h-[4rem] bg-slate-100 dark:bg-slate-800 rounded-md text-2xl text-slate-800 dark:text-slate-100 flex items-center justify-center text-center tracking-widest font-bold">
                                {userOrder.join(' ')}
                            </div>
                             <div className="flex flex-wrap gap-3 justify-center">
                                {['A', 'B', 'C'].map(part => (
                                    <button key={part} onClick={() => handlePartClick(part)} className="w-16 h-16 text-2xl bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-brand-primary hover:text-white hover:border-transparent dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-brand-primary dark:hover:text-white transition-colors">
                                        {part}
                                    </button>
                                ))}
                             </div>
                            <div className="flex justify-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                                <button onClick={resetOrder} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">ລຶບ</button>
                                <button onClick={checkOrder} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary">ກວດສອບ</button>
                             </div>
                            { (orderStatus === 'correct' || orderStatus === 'incorrect') && (() => {
                                const fullSentence = exercise.correctOrder.split('').map(char => (exercise.sentences as any)[char.toLowerCase()]).join('，') + '。';
                                return (
                                  <div className="text-center mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <p className={`font-semibold ${orderStatus === 'correct' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {orderStatus === 'correct' ? '🎉 ຖືກຕ້ອງ!' : 'ບໍ່ຖືກຕ້ອງ.'} ລຳດັບທີ່ຖືກຕ້ອງແມ່ນ: {exercise.correctOrder}
                                    </p>
                                    <p className="text-lg text-slate-800 dark:text-slate-100 mt-2">{fullSentence}</p>
                                    <button
                                      onClick={() => onNewExercise(mode)}
                                      className="mt-4 px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
                                    >
                                      ຝຶກຂໍ້ຕໍ່ໄປ
                                    </button>
                                  </div>
                                )
                              })()}
                        </div>
                    </div>
                );
            }
             case 'translation_choice': {
                const quiz = quizData as TranslationChoiceQuiz;
                if (!quiz || !quiz.questions[currentQuestionIndex]) return null;
                const question = quiz.questions[currentQuestionIndex];

                return (
                    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="ເລືອກຄຳແປ" onClose={onClose} />
                        <div className="text-center mb-2">
                           <p className="text-slate-500 dark:text-slate-400">ຄຳຖາມທີ {currentQuestionIndex + 1} / {quiz.questions.length}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-8 rounded-lg space-y-6">
                            <div className="text-center">
                                <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">ຄຳສັບໃດແປວ່າ:</p>
                                <h3 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-slate-100">{question.word.character}</h3>
                                <p className="text-xl sm:text-2xl text-slate-500 dark:text-slate-400">{question.word.pinyin}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {question.options.map(option => {
                                    const isCorrect = option === question.correctAnswer;
                                    const isSelected = selectedChoice === option;
                                    let buttonClass = 'p-4 text-base sm:text-lg bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-500 transition-colors';
                                    if(choiceStatus !== 'idle' && isCorrect) {
                                        buttonClass = 'p-4 text-base sm:text-lg bg-green-200 border-2 border-green-500 text-green-800 rounded-lg dark:bg-green-900/50 dark:text-green-300';
                                    } else if (choiceStatus !== 'idle' && isSelected && !isCorrect) {
                                        buttonClass = 'p-4 text-base sm:text-lg bg-red-200 border-2 border-red-500 text-red-800 rounded-lg dark:bg-red-900/50 dark:text-red-300';
                                    }
                                    return (
                                        <button key={option} onClick={() => handleChoiceSelect(option)} disabled={choiceStatus !== 'idle'} className={buttonClass}>
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                            {choiceStatus !== 'idle' && (
                                <div className="text-center">
                                    <button onClick={handleNextQuestion} className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">
                                        {currentQuestionIndex === quiz.questions.length - 1 ? 'ເບິ່ງຄະແນນ' : 'ຄຳຖາມຕໍ່ໄປ'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
             }
             case 'build_from_translation': {
                const quiz = quizData as WordBuildingQuiz;
                if (!quiz || !quiz.questions[currentQuestionIndex]) return null;
                const question = quiz.questions[currentQuestionIndex];
                
                return (
                     <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="ປະກອບຄຳສັບ" onClose={onClose} />
                         <div className="text-center mb-2">
                           <p className="text-slate-500 dark:text-slate-400">ຄຳຖາມທີ {currentQuestionIndex + 1} / {quiz.questions.length}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-8 rounded-lg space-y-6">
                            <div className="text-center">
                                <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">ປະກອບຕົວອັກສອນໃຫ້ເປັນຄຳທີ່ແປວ່າ:</p>
                                <h3 className="text-4xl font-bold text-slate-800 dark:text-slate-100">{question.word.translation}</h3>
                            </div>

                             <div className="p-4 mb-2 min-h-[5rem] bg-slate-100 dark:bg-slate-800 rounded-md text-4xl text-slate-800 dark:text-slate-100 flex items-center justify-center text-center tracking-widest font-bold">
                                {wbUserAnswer.join('')}
                            </div>

                             <div className="flex flex-wrap gap-3 justify-center">
                                {question.options.map((char, index) => (
                                    <button key={index} onClick={() => handleWbCharClick(char)} disabled={wbStatus !== 'idle'} className="w-16 h-16 text-2xl bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-brand-primary hover:text-white hover:border-transparent dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-brand-primary dark:hover:text-white transition-colors disabled:opacity-50">
                                        {char}
                                    </button>
                                ))}
                             </div>
                             <div className="flex justify-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                                <button onClick={handleWbBackspace} disabled={wbStatus !== 'idle'} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 disabled:opacity-50">ລຶບ</button>
                                <button onClick={handleWbCheck} disabled={wbStatus !== 'idle' || wbUserAnswer.length === 0} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:bg-slate-400">ກວດສອບ</button>
                             </div>
                              {wbStatus === 'correct' && <p className="text-center text-green-600 dark:text-green-400">🎉 ຖືກຕ້ອງ! ຄຳຕອບແມ່ນ "{question.correctAnswer}"</p>}
                             {wbStatus === 'incorrect' && <p className="text-center text-red-600 dark:text-red-400">ບໍ່ຖືກຕ້ອງ. ຄຳຕອບທີ່ຖືກຕ້ອງແມ່ນ "{question.correctAnswer}"</p>}

                             {wbStatus !== 'idle' && (
                                <div className="text-center">
                                    <button onClick={handleNextQuestion} className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">
                                        {currentQuestionIndex === quiz.questions.length - 1 ? 'ເບິ່ງຄະແນນ' : 'ຄຳຖາມຕໍ່ໄປ'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
             }
            case 'matching': {
                const quiz = quizData as MatchingQuiz;
                if (!quiz || !quiz.rounds || !quiz.rounds[currentRoundIndex]) return null;
                const isRoundOver = matchedChars.length === leftColumn.length && leftColumn.length > 0;
                const isGameOver = currentRoundIndex === quiz.rounds.length - 1 && isRoundOver;
                
                return (
                    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="ຈັບຄູ່ຄຳສັບ" onClose={onClose} />
                         <div className="text-center mb-2">
                           <p className="text-slate-500 dark:text-slate-400">ຮອບທີ {currentRoundIndex + 1} / {quiz.rounds.length}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg space-y-4">
                            {!isRoundOver ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Left Column (Characters) */}
                                    <div className="space-y-3">
                                        {leftColumn.map((word, index) => {
                                            const isMatched = matchedChars.includes(word.character);
                                            const isSelected = selectedLeft === index;
                                            const isIncorrect = incorrectPair && incorrectPair[0] === index;
                                            let buttonClass = 'w-full p-4 text-xl font-semibold text-center rounded-lg border-2 transition-all duration-200 ';
                                            if (isMatched) {
                                                buttonClass += 'bg-green-200 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-600 dark:text-green-300 opacity-50 cursor-not-allowed';
                                            } else if (isSelected) {
                                                buttonClass += 'bg-blue-200 border-blue-500 dark:bg-blue-900/50 dark:border-blue-500 ring-2 ring-blue-500';
                                            } else if (isIncorrect) {
                                                buttonClass += 'bg-red-200 border-red-500 dark:bg-red-900/50 dark:border-red-600 animate-shake';
                                            } else {
                                                buttonClass += 'bg-white border-slate-300 text-slate-800 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100 hover:bg-blue-100 dark:hover:bg-slate-500';
                                            }
                                            return <button key={index} onClick={() => handleLeftCardClick(index)} disabled={isMatched} className={buttonClass}>{word.character}</button>;
                                        })}
                                    </div>
                                    {/* Right Column (Translations) */}
                                    <div className="space-y-3">
                                        {rightColumn.map((word, index) => {
                                            const isMatched = matchedChars.includes(word.character);
                                            const isSelected = selectedRight === index;
                                            const isIncorrect = incorrectPair && incorrectPair[1] === index;
                                            let buttonClass = 'w-full p-4 text-lg text-center rounded-lg border-2 transition-all duration-200 ';
                                             if (isMatched) {
                                                buttonClass += 'bg-green-200 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-600 dark:text-green-300 opacity-50 cursor-not-allowed';
                                            } else if (isSelected) {
                                                buttonClass += 'bg-blue-200 border-blue-500 dark:bg-blue-900/50 dark:border-blue-500 ring-2 ring-blue-500';
                                            } else if (isIncorrect) {
                                                buttonClass += 'bg-red-200 border-red-500 dark:bg-red-900/50 dark:border-red-600 animate-shake';
                                            } else {
                                                buttonClass += 'bg-white border-slate-300 text-slate-700 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-slate-500';
                                            }
                                            return <button key={index} onClick={() => handleRightCardClick(index)} disabled={isMatched} className={buttonClass}>{word.translation}</button>;
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">🎉 ສຳເລັດຮອບນີ້!</h3>
                                    {isGameOver ? (
                                        <p className="text-lg text-slate-700 dark:text-slate-200">ຍິນດີນຳ! ທ່ານຈົບເກມນີ້ແລ້ວ.</p>
                                    ) : (
                                         <p className="text-lg text-slate-700 dark:text-slate-200">ກຽມພ້ອມສຳລັບຮອບຕໍ່ໄປ!</p>
                                    )}
                                    <div className="mt-6">
                                        <button onClick={handleNextMatchingRound} className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors text-lg font-semibold">
                                            {isGameOver ? 'ເບິ່ງຄະແນນ' : 'ຮອບຕໍ່ໄປ'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
            case 'conjunction': {
                const exercise = data as ConjunctionExercise;
                if (!exercise) return null;

                return (
                    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <PracticeHeader title="ເຊື່ອມປະໂຫຍກ" onClose={onClose} word={word}/>
                        <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg space-y-6">
                            <p className="text-slate-500 dark:text-slate-400 text-center">ເລືອກຄຳເຊື່ອມທີ່ຖືກຕ້ອງເພື່ອລວມສອງປະໂຫຍກນີ້:</p>
                            <div className="space-y-3 text-center bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                                <p className="text-xl text-slate-700 dark:text-slate-200">{exercise.sentenceA}</p>
                                <p className="text-xl text-slate-700 dark:text-slate-200">{exercise.sentenceB}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {exercise.conjunctionOptions.map(option => {
                                    const isCorrect = option === exercise.correctConjunction;
                                    const isSelected = selectedConjunction === option;
                                    let buttonClass = 'p-4 text-lg bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-500 transition-colors';
                                    if(conjunctionStatus !== 'idle' && isCorrect) {
                                        buttonClass = 'p-4 text-lg bg-green-200 border-2 border-green-500 text-green-800 rounded-lg dark:bg-green-900/50 dark:text-green-300';
                                    } else if (conjunctionStatus !== 'idle' && isSelected && !isCorrect) {
                                        buttonClass = 'p-4 text-lg bg-red-200 border-2 border-red-500 text-red-800 rounded-lg dark:bg-red-900/50 dark:text-red-300 animate-shake';
                                    }
                                    return (
                                        <button key={option} onClick={() => handleConjunctionSelect(option)} disabled={conjunctionStatus !== 'idle'} className={buttonClass}>
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>

                            {conjunctionStatus !== 'idle' && (
                                <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-fade-in">
                                     <p className={`font-semibold mb-2 ${conjunctionStatus === 'correct' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {conjunctionStatus === 'correct' ? '🎉 ຖືກຕ້ອງ!' : 'ບໍ່ຖືກຕ້ອງ.'}
                                    </p>
                                    <h4 className="font-semibold text-slate-600 dark:text-slate-300">ປະໂຫຍກທີ່ສົມບູນ:</h4>
                                    <p className="text-xl text-slate-800 dark:text-slate-100 mt-1">{exercise.correctSentence}</p>
                                    <button onClick={() => onNewExercise(mode)} className="mt-4 px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">
                                        ຝຶກອີກຄັ້ງ
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return renderContent();
};

export default PracticeView;
