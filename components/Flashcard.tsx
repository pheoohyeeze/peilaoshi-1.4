import React from 'react';
import type { VocabularyWord } from '../types';
import { SpeakerWaveIcon } from './IconComponents';

const playAudio = (audioUrl?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error("Audio playback failed:", error));
  }
};

interface FlashcardProps {
  word: VocabularyWord;
}

const Flashcard: React.FC<FlashcardProps> = ({ word }) => {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isPinyinVisible, setIsPinyinVisible] = React.useState(false);

  React.useEffect(() => {
    // When the word changes, flip the card back to the front and hide pinyin
    setIsFlipped(false);
    setIsPinyinVisible(false);
  }, [word]);

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    playAudio(word.audioUrl);
  };
  
  const revealPinyin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinyinVisible(true);
  };

  return (
    <div 
      className="w-full h-80 cursor-pointer [perspective:1000px]"
      onClick={() => setIsFlipped(!isFlipped)}
      role="button"
      tabIndex={0}
      aria-live="polite"
      aria-label={isFlipped ? `Back: ${word.pinyin}, ${word.translation}` : `Front: ${word.character}, tap to reveal pinyin and translation.`}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front of the card */}
        <div 
          className="absolute w-full h-full bg-gradient-to-br from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 border-4 border-slate-100 dark:border-slate-600 [backface-visibility:hidden]"
        >
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
            <p className="text-5xl md:text-7xl font-bold text-slate-800 dark:text-slate-100 font-sans">
              {word.character}
            </p>
            
            <div className="relative h-8 w-16 flex items-center justify-center">
              <button 
                  onClick={revealPinyin} 
                  className={`absolute transition-opacity duration-300 ${isPinyinVisible ? 'opacity-0' : 'opacity-100'} text-2xl font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300`}
                  aria-label="Reveal pinyin"
              >
                  (?)
              </button>
              <span className={`absolute transition-opacity duration-300 ${isPinyinVisible ? 'opacity-100' : 'opacity-0'} text-2xl text-slate-500 dark:text-slate-400 font-medium`}>
                ({word.pinyin})
              </span>
            </div>

            {word.audioUrl && (
              <button 
                onClick={handleAudioClick}
                className="p-2 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300 hover:bg-brand-primary hover:text-white transition-all duration-200"
                aria-label="Play pronunciation"
              >
                <SpeakerWaveIcon className="w-7 h-7" />
              </button>
            )}
          </div>
          <p className="absolute bottom-4 text-sm text-slate-400 dark:text-slate-500 tracking-wider">ແຕະເພື່ອເປີດເຜີຍ</p>
        </div>
        
        {/* Back of the card */}
        <div 
          className="absolute w-full h-full bg-gradient-to-br from-brand-primary to-brand-dark rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 text-white text-center [transform:rotateY(180deg)] [backface-visibility:hidden]"
        >
          <div className="space-y-4">
            <p className="text-4xl font-semibold tracking-wide">{word.pinyin}</p>
            <p className="text-3xl font-medium">{word.translation}</p>
          </div>
          <p className="absolute bottom-4 text-sm text-blue-200/80 tracking-wider">ແຕະເພື່ອເຊື່ອງ</p>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;