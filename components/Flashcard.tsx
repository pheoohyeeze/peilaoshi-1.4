
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

  React.useEffect(() => {
    setIsFlipped(false);
  }, [word]);

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    playAudio(word.audioUrl);
  };

  const cardContainerStyle: React.CSSProperties = {
    perspective: '1000px',
  };

  const cardStyle: React.CSSProperties = {
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const cardFaceStyle: React.CSSProperties = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };

  return (
    <div 
      style={cardContainerStyle} 
      className="w-full h-80 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
      role="button"
      tabIndex={0}
      aria-live="polite"
      aria-label={isFlipped ? `Back: ${word.pinyin}, ${word.translation}` : `Front: ${word.character}`}
    >
      <div style={cardStyle} className="relative w-full h-full">
        {/* Front of the card */}
        <div 
          style={cardFaceStyle} 
          className="absolute w-full h-full bg-slate-700 rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 border-4 border-slate-600"
        >
          <div className="flex items-center gap-4">
            <p className="text-7xl md:text-8xl font-bold text-white">
              {word.character}
            </p>
            {word.audioUrl && (
              <button 
                onClick={handleAudioClick}
                className="p-2 rounded-full bg-slate-600 hover:bg-brand-primary transition-colors"
                aria-label="Play pronunciation"
              >
                <SpeakerWaveIcon className="w-8 h-8" />
              </button>
            )}
          </div>
          <p className="absolute bottom-4 text-sm text-slate-400">ແຕະເພື່ອເປີດເຜີຍ</p>
        </div>
        
        {/* Back of the card */}
        <div 
          style={{ ...cardFaceStyle, transform: 'rotateY(180deg)' }} 
          className="absolute w-full h-full bg-brand-primary rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 text-white text-center"
        >
          <div className="space-y-4">
            <p className="text-4xl font-semibold">{word.pinyin}</p>
            <p className="text-3xl">{word.translation}</p>
          </div>
          <p className="absolute bottom-4 text-sm text-brand-light">ແຕະເພື່ອເຊື່ອງ</p>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
