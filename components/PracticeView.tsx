
import React, { useState } from 'react';
import type { PracticeMode, VocabularyWord, SentenceExample, ErrorCorrectionExercise, SentenceScrambleExercise, SentenceFeedback, WritingExercise, SentenceOrderingExercise } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { ArrowLeftIcon, SpeakerWaveIcon } from './IconComponents';

interface PracticeViewProps {
  mode: PracticeMode;
  word: VocabularyWord;
  data: any;
  onClose: () => void;
  onSentenceSubmit: (sentence: string) => Promise<SentenceFeedback | null>;
  onEssaySubmit?: (essay: string, words: VocabularyWord[]) => Promise<SentenceFeedback | null>;
}

const playAudio = (audioUrl?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error("Audio playback failed:", error));
  }
};

const PracticeHeader: React.FC<{ title: string; word: VocabularyWord; onClose: () => void }> = ({ title, word, onClose }) => (
    <div className="relative flex flex-col items-center justify-center mb-6 gap-2">
        <div className="w-full flex items-center justify-center">
             <button onClick={onClose} className="absolute left-0 p-2 rounded-full bg-slate-700 hover:bg-brand-primary transition-colors" aria-label="ກັບໄປທີ່ບັດຄຳສັບ">
                <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-brand-primary">{title}</h2>
        </div>
        {word.character && (
            <div className="flex items-center gap-2">
                <span className="text-xl text-white font-semibold">{word.character}</span>
                <span className="text-lg text-slate-400">({word.pinyin})</span>
                {word.audioUrl && (
                    <button 
                        onClick={() => playAudio(word.audioUrl)}
                        className="p-1 rounded-full bg-slate-600 hover:bg-brand-primary transition-colors"
                        aria-label="Play pronunciation"
                    >
                        <SpeakerWaveIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        )}
    </div>
);


const PracticeView: React.FC<PracticeViewProps> = ({ mode, word, data, onClose, onSentenceSubmit, onEssaySubmit }) => {
    
    // State for Sentence Scramble
    const [userAnswer, setUserAnswer] = useState<string[]>([]);
    const [scrambleStatus, setScrambleStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    
    // State for Error Correction
    const [showCorrection, setShowCorrection] = useState(false);

    // State for Sentence Building
    const [userSentence, setUserSentence] = useState('');
    const [feedback, setFeedback] = useState<SentenceFeedback | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for Writing Practice
    const [userEssay, setUserEssay] = useState('');
    const [essayFeedback, setEssayFeedback] = useState<SentenceFeedback | null>(null);
    const [isSubmittingEssay, setIsSubmittingEssay] = useState(false);

    // State for Sentence Ordering
    const [userOrder, setUserOrder] = useState<string[]>([]);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');


    const handleScrambleWordClick = (word: string, index: number) => {
        setUserAnswer([...userAnswer, word]);
        // This is a simple implementation. A more robust one would handle removing the word from the options.
    };
    
    const checkScrambleAnswer = () => {
        const expected = (data as SentenceScrambleExercise).correctSentence;
        const actual = userAnswer.join('');
        if (expected === actual) {
            setScrambleStatus('correct');
        } else {
            setScrambleStatus('incorrect');
        }
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
        }
        setIsSubmittingEssay(false);
    };


    const renderContent = () => {
        switch (mode) {
            case 'example': {
                const exercise = data as SentenceExample;
                return (
                    <div>
                        <PracticeHeader title="ຕົວຢ່າງປະໂຫຍກ" onClose={onClose} word={word}/>
                        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                            <p className="text-3xl text-white text-center font-semibold tracking-wide">{exercise.sentence}</p>
                            <p className="text-lg text-slate-400 text-center border-t border-slate-700 pt-4">{exercise.translation}</p>
                        </div>
                    </div>
                );
            }
            case 'correction': {
                const exercise = data as ErrorCorrectionExercise;
                return (
                    <div>
                        <PracticeHeader title="ຊອກຫາຂໍ້ຜິດພາດ" onClose={onClose} word={word}/>
                        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                           <p className="text-slate-400 text-center mb-2">ຊອກຫາຂໍ້ຜິດພາດໃນປະໂຫຍກລຸ່ມນີ້:</p>
                           <p className="text-3xl text-amber-400 text-center font-semibold tracking-wide">"{exercise.incorrectSentence}"</p>
                           
                           {!showCorrection && (
                                <div className="text-center pt-4">
                                    <button onClick={() => setShowCorrection(true)} className="px-4 py-2 bg-brand-primary rounded-lg hover:bg-brand-secondary transition-colors">
                                        ເປີດເຜີຍຄຳຕອບ
                                    </button>
                                </div>
                           )}

                           {showCorrection && (
                            <div className="border-t border-slate-700 pt-4 space-y-4 animate-fade-in">
                                <div>
                                    <h4 className="font-semibold text-green-400">ປະໂຫຍກທີ່ຖືກຕ້ອງ:</h4>
                                    <p className="text-xl text-white">{exercise.correctSentence}</p>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-yellow-400">ຄຳອະທິບາຍ:</h4>
                                    <p className="text-slate-300">{exercise.explanation}</p>
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
                    <div>
                        <PracticeHeader title="ລຽງປະໂຫຍກ" onClose={onClose} word={word}/>
                        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                             <p className="text-slate-400 text-center mb-2">ຄລິກໃສ່ຄຳສັບເພື່ອລຽງປະໂຫຍກໃຫ້ຖືກຕ້ອງ:</p>
                             <div className="p-4 mb-4 min-h-[6rem] bg-slate-900 rounded-md text-2xl text-white flex items-center justify-center text-center tracking-wide">
                                {userAnswer.join(' ')}
                             </div>
                             <div className="flex flex-wrap gap-3 justify-center">
                                {exercise.scrambledWords.map((wordPart, index) => (
                                    <button key={index} onClick={() => handleScrambleWordClick(wordPart, index)} className="px-4 py-2 text-xl bg-slate-700 rounded-md hover:bg-brand-primary transition-colors">
                                        {wordPart}
                                    </button>
                                ))}
                             </div>
                             <div className="flex justify-center gap-3 pt-4 border-t border-slate-700">
                                <button onClick={resetScramble} className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500">ລຶບ</button>
                                <button onClick={checkScrambleAnswer} className="px-4 py-2 bg-brand-primary rounded-lg hover:bg-brand-secondary">ກວດສອບ</button>
                             </div>
                             {scrambleStatus === 'correct' && <p className="text-center text-green-400">🎉 ຖືກຕ້ອງ! ເກັ່ງຫຼາຍ!</p>}
                             {scrambleStatus === 'incorrect' && <p className="text-center text-red-400">ລອງໃໝ່ອີກຄັ້ງ. ຄຳຕອບທີ່ຖືກຕ້ອງ: "{exercise.correctSentence}"</p>}
                        </div>
                    </div>
                 )
            }
            case 'building': {
                 return (
                    <div>
                        <PracticeHeader title="ສ້າງປະໂຫຍກ" onClose={onClose} word={word}/>
                        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                            <p className="text-slate-400 text-center">ສ້າງປະໂຫຍກຂອງທ່ານເອງໂດຍໃຊ້ຄຳວ່າ: <strong className="text-brand-light text-lg">{word.character}</strong></p>
                            <form onSubmit={handleSentenceBuildSubmit}>
                                <textarea
                                    value={userSentence}
                                    onChange={(e) => setUserSentence(e.target.value)}
                                    className="w-full h-28 p-3 bg-slate-900 rounded-md text-white text-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    placeholder="ຂຽນປະໂຫຍກຂອງທ່ານທີ່ນີ້..."
                                    aria-label="Sentence input"
                                ></textarea>
                                <button type="submit" disabled={isSubmitting} className="w-full mt-4 px-4 py-2 bg-brand-primary rounded-lg hover:bg-brand-secondary disabled:bg-slate-600">
                                    {isSubmitting ? 'ກຳລັງກວດສອບ...' : 'ສົ່ງເພື່ອຂໍຄຳຕິຊົມ'}
                                </button>
                            </form>
                            {isSubmitting && <div className="pt-4"><LoadingSpinner message="ກຳລັງວິເຄາະປະໂຫຍກ..."/></div>}
                            {feedback && (
                                <div className={`p-4 mt-4 rounded-lg ${feedback.isCorrect ? 'bg-green-900/50 border-green-700' : 'bg-amber-900/50 border-amber-700'}`}>
                                    <p className="font-semibold text-lg">{feedback.isCorrect ? '✅ ດີເລີດ!' : '💡 ຄຳແນະນຳ:'}</p>
                                    <p>{feedback.feedback}</p>
                                </div>
                            )}
                        </div>
                    </div>
                 )
            }
            case 'writing': {
                const exercise = data as WritingExercise;
                return (
                    <div>
                        <PracticeHeader title="ຝຶກຂຽນ" onClose={onClose} word={word}/>
                        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                            <p className="text-slate-300 text-center text-lg">{exercise.prompt}</p>
                            <div className="flex flex-wrap gap-3 justify-center p-4 bg-slate-900/50 rounded-lg">
                                {exercise.words.map((w, index) => (
                                    <div key={index} className="px-3 py-1 bg-slate-700 rounded-md text-center">
                                        <span className="text-white text-xl font-semibold">{w.character}</span>
                                        <span className="text-slate-400 text-sm block">{w.pinyin}</span>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleEssaySubmitForm}>
                                <textarea
                                    value={userEssay}
                                    onChange={(e) => setUserEssay(e.target.value)}
                                    className="w-full h-48 p-3 bg-slate-900 rounded-md text-white text-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    placeholder="ຂຽນບົດຄວາມຂອງທ່ານທີ່ນີ້ (ປະມານ 80 ຄຳ)..."
                                    aria-label="Essay input"
                                ></textarea>
                                <button type="submit" disabled={isSubmittingEssay} className="w-full mt-4 px-4 py-2 bg-brand-primary rounded-lg hover:bg-brand-secondary disabled:bg-slate-600">
                                    {isSubmittingEssay ? 'ກຳລັງກວດສອບ...' : 'ສົ່ງເພື່ອຂໍຄຳຕິຊົມ'}
                                </button>
                            </form>
                            {isSubmittingEssay && <div className="pt-4"><LoadingSpinner message="ກຳລັງວິເຄາະບົດຄວາມ..."/></div>}
                            {essayFeedback && (
                                <div className={`p-4 mt-4 rounded-lg ${essayFeedback.isCorrect ? 'bg-green-900/50 border-green-700' : 'bg-amber-900/50 border-amber-700'}`}>
                                    <p className="font-semibold text-lg">{essayFeedback.isCorrect ? '✅ ດີເລີດ!' : '💡 ຄຳແນະນຳ:'}</p>
                                    <p>{essayFeedback.feedback}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
             case 'ordering': {
                const exercise = data as SentenceOrderingExercise;
                const options = [
                    { key: 'A', text: exercise.sentences.a },
                    { key: 'B', text: exercise.sentences.b },
                    { key: 'C', text: exercise.sentences.c },
                ];

                const handleOrderClick = (key: string) => {
                    if (userOrder.length < 3 && !userOrder.includes(key)) {
                        setUserOrder([...userOrder, key]);
                        setOrderStatus('idle');
                    }
                };

                const resetOrder = () => {
                    setUserOrder([]);
                    setOrderStatus('idle');
                };

                const checkOrder = () => {
                    if (userOrder.length !== 3) return;
                    if (userOrder.join('') === exercise.correctOrder) {
                        setOrderStatus('correct');
                    } else {
                        setOrderStatus('incorrect');
                    }
                };

                return (
                    <div>
                        <PracticeHeader title="排列顺序" onClose={onClose} word={{ character: `HSK 4`, pinyin: `练习 ${exercise.id}`, translation: '' }} />
                        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                            <p className="text-slate-400 text-center mb-2">将下列三个句子按正确顺序排列:</p>
                            
                            <div className="p-4 mb-4 min-h-[4rem] bg-slate-900 rounded-md text-2xl text-white flex items-center justify-center text-center tracking-wide font-bold">
                                {userOrder.join(' ')}
                            </div>

                            <div className="space-y-3">
                                {options.map(({ key, text }) => (
                                    <button 
                                        key={key} 
                                        onClick={() => handleOrderClick(key)} 
                                        disabled={userOrder.includes(key)}
                                        className="w-full flex items-start text-left gap-3 p-3 text-lg bg-slate-700 rounded-md hover:bg-brand-primary transition-colors disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="font-bold text-brand-primary">{key}.</span>
                                        <span>{text}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-center gap-3 pt-4 border-t border-slate-700">
                                <button onClick={resetOrder} className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500">ລຶບ</button>
                                <button onClick={checkOrder} className="px-4 py-2 bg-brand-primary rounded-lg hover:bg-brand-secondary">ກວດສອບ</button>
                            </div>
                            
                            {orderStatus === 'correct' && <p className="text-center text-green-400">🎉 ຖືກຕ້ອງ! ລຳດັບທີ່ຖືກຕ້ອງຄື {exercise.correctOrder}.</p>}
                            {orderStatus === 'incorrect' && <p className="text-center text-red-400">ລອງໃໝ່ອີກຄັ້ງ. ຄຳຕອບທີ່ຖືກຕ້ອງຄື: "{exercise.correctOrder}"</p>}
                        </div>
                    </div>
                )
            }
        }
    };
  
    return (
      <div className="w-full animate-fade-in">
        {renderContent()}
      </div>
    );
};

export default PracticeView;
