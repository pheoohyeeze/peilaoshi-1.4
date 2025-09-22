import React, { useState, useCallback, useMemo } from 'react';
import type { HSKLevel, VocabularyWord, PracticeMode } from './types';
import { fetchHSKVocabulary, generatePracticeExercise, getSentenceFeedback, getEssayFeedback } from './services/geminiService';
import { HSK_LEVELS } from './constants';
import { HSK_VOCABULARY } from './data/hsk-vocabulary';
import HSKLevelSelector from './components/HSKLevelSelector';
import Flashcard from './components/Flashcard';
import LoadingSpinner from './components/LoadingSpinner';
import PracticeView from './components/PracticeView';
import { 
    ArrowLeftIcon, ArrowRightIcon, RefreshIcon, BookOpenIcon, 
    LightBulbIcon, ShieldExclamationIcon, ArrowsRightLeftIcon, 
    ChatBubbleLeftRightIcon, PencilIcon, QueueListIcon, 
    MagnifyingGlassIcon, XCircleIcon, SpeakerWaveIcon
} from './components/IconComponents';

const playAudio = (audioUrl?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error("Audio playback failed:", error));
  }
};

type SearchResultWord = VocabularyWord & { level: HSKLevel };

interface SearchResultsProps {
  results: SearchResultWord[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-2xl">
        <p>ບໍ່ພົບຄຳສັບທີ່ຕົງກັນ.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-800 rounded-2xl shadow-2xl p-2 animate-fade-in max-h-[65vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-center text-white my-2">ຜົນການຄົ້ນຫາ ({results.length})</h2>
        <ul className="divide-y divide-slate-700">
            {results.map((word, index) => (
                <li key={`${word.character}-${index}`} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => playAudio(word.audioUrl)}
                            className="p-2 rounded-full bg-slate-700 hover:bg-brand-primary transition-colors flex-shrink-0"
                            aria-label={`Play pronunciation for ${word.character}`}
                        >
                            <SpeakerWaveIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-2xl font-semibold text-white">{word.character}</p>
                            <p className="text-md text-slate-400">{word.pinyin}</p>
                            <p className="text-md text-slate-300">{word.translation}</p>
                        </div>
                    </div>
                    <span className="text-sm font-medium bg-slate-700 text-brand-primary px-2 py-1 rounded-md">
                        HSK {word.level}
                    </span>
                </li>
            ))}
        </ul>
    </div>
  );
};


const App: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for practice mode
  const [practiceMode, setPracticeMode] = useState<PracticeMode | null>(null);
  const [practiceData, setPracticeData] = useState<any>(null);
  const [isPracticeLoading, setIsPracticeLoading] = useState(false);
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');

  const allVocabulary = useMemo(() => {
    return HSK_LEVELS.flatMap(level =>
        (HSK_VOCABULARY[level] || []).map(word => ({ ...word, level }))
    );
  }, []);

  const searchResults = useMemo(() => {
      if (!searchQuery.trim()) {
          return [];
      }
      const lowerCaseQuery = searchQuery.trim().toLowerCase();
      // Handle pinyin with tones by also searching without tones
      const queryWithoutTones = lowerCaseQuery
        .replace(/[āáǎà]/g, 'a')
        .replace(/[ōóǒò]/g, 'o')
        .replace(/[ēéěè]/g, 'e')
        .replace(/[īíǐì]/g, 'i')
        .replace(/[ūúǔù]/g, 'u')
        .replace(/[ǖǘǚǜü]/g, 'v');

      return allVocabulary.filter(
          word => {
            const pinyinWithoutTones = word.pinyin.toLowerCase()
              .replace(/[āáǎà]/g, 'a')
              .replace(/[ōóǒò]/g, 'o')
              .replace(/[ēéěè]/g, 'e')
              .replace(/[īíǐì]/g, 'i')
              .replace(/[ūúǔù]/g, 'u')
              .replace(/[ǖǘǚǜü]/g, 'v');

            return word.character.includes(lowerCaseQuery) ||
              word.pinyin.toLowerCase().includes(lowerCaseQuery) ||
              pinyinWithoutTones.includes(queryWithoutTones) ||
              word.translation.toLowerCase().includes(lowerCaseQuery);
          }
      );
  }, [searchQuery, allVocabulary]);


  const handleLevelSelect = useCallback(async (level: HSKLevel) => {
    setIsLoading(true);
    setError(null);
    setSelectedLevel(level);
    try {
      const words = await fetchHSKVocabulary(level);
      setVocabulary(words);
      setCurrentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setSelectedLevel(null); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % vocabulary.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length);
  };

  const resetApp = () => {
    setSelectedLevel(null);
    setVocabulary([]);
    setCurrentIndex(0);
    setError(null);
    setPracticeMode(null);
    setPracticeData(null);
    setSearchQuery('');
  };
  
  const currentWord = vocabulary[currentIndex];

  const handlePracticeSelect = useCallback(async (mode: PracticeMode) => {
    if ((!currentWord && mode !== 'ordering') || !selectedLevel) return;

    if (mode === 'building') {
      setPracticeMode('building');
      setPracticeData(null); // No initial data needed
      return;
    }

    setIsPracticeLoading(true);
    setError(null);
    setPracticeMode(mode);
    try {
      // For ordering, currentWord is not needed for generation but passed for consistency
      const data = await generatePracticeExercise(currentWord || {} as VocabularyWord, mode, selectedLevel);
      setPracticeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setPracticeMode(null);
    } finally {
      setIsPracticeLoading(false);
    }
  }, [currentWord, selectedLevel]);

  const handleSentenceSubmit = useCallback(async (sentence: string) => {
      if (!currentWord) return null;
      try {
          const feedback = await getSentenceFeedback(currentWord, sentence);
          return feedback;
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
          return null;
      }
  }, [currentWord]);
  
  const handleEssaySubmit = useCallback(async (essay: string, words: VocabularyWord[]) => {
      if (!selectedLevel) return null;
      try {
          const feedback = await getEssayFeedback(selectedLevel, essay, words);
          return feedback;
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
          return null;
      }
  }, [selectedLevel]);

  const backToFlashcards = () => {
    setPracticeMode(null);
    setPracticeData(null);
    setError(null);
  };

  const practiceButtons = useMemo(() => {
    const buttons = [
      { mode: 'example', label: 'ຕົວຢ່າງປະໂຫຍກ', icon: LightBulbIcon },
      { mode: 'correction', label: 'ຊອກຫາຂໍ້ຜິດພາດ', icon: ShieldExclamationIcon },
      { mode: 'scramble', label: 'ລຽງປະໂຫຍກ', icon: ArrowsRightLeftIcon },
      { mode: 'building', label: 'ສ້າງປະໂຫຍກ', icon: ChatBubbleLeftRightIcon },
    ];
    
    if (selectedLevel === 4) {
      buttons.push({ mode: 'ordering', label: '排列顺序', icon: QueueListIcon });
    }
    
    if (selectedLevel && selectedLevel >= 5) {
        buttons.push({ mode: 'writing', label: 'ຝຶກຂຽນ', icon: PencilIcon });
    }
    return buttons;
  }, [selectedLevel]);

  const renderMainContent = () => {
    if (isLoading) return <LoadingSpinner message={`ກຳລັງສ້າງຄຳສັບ HSK ລະດັບ ${selectedLevel}...`} />;
    if (error) return (
        <div className="text-center bg-red-900/50 border border-red-700 p-6 rounded-lg">
            <h3 className="text-2xl font-semibold text-red-300 mb-2">ເກີດຂໍ້ຜິດພາດ</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={practiceMode ? backToFlashcards : resetApp}
              className="px-4 py-2 bg-brand-primary rounded-lg hover:bg-brand-secondary transition-colors"
            >
              {practiceMode ? 'ກັບໄປທີ່ບັດຄຳສັບ' : 'ລອງ​ອີກ​ຄັ້ງ'}
            </button>
        </div>
    );
    if (isPracticeLoading) return <LoadingSpinner message="ກຳລັງສ້າງແບບຝຶກຫັດ..." />;

    if (practiceMode) {
      return (
        <PracticeView
          mode={practiceMode}
          word={currentWord} // This will be undefined for 'ordering' if no words are loaded, handle in PracticeView
          data={practiceData}
          onSentenceSubmit={handleSentenceSubmit}
          onEssaySubmit={handleEssaySubmit}
          onClose={backToFlashcards}
        />
      );
    }

    if (selectedLevel && currentWord) {
      return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full mb-6">
              <Flashcard word={currentWord} />
            </div>

            <div className="flex items-center justify-between w-full mb-6">
              <button onClick={handlePrev} className="p-4 rounded-full bg-slate-700 hover:bg-brand-primary transition-colors" aria-label="ຄຳກ່ອນໜ້າ"><ArrowLeftIcon className="w-6 h-6" /></button>
              <p className="text-lg font-medium text-slate-400">{currentIndex + 1} / {vocabulary.length}</p>
              <button onClick={handleNext} className="p-4 rounded-full bg-slate-700 hover:bg-brand-primary transition-colors" aria-label="ຄຳຕໍ່ໄປ"><ArrowRightIcon className="w-6 h-6" /></button>
            </div>

            <div className="w-full border-t border-slate-700 pt-6">
              <h3 className="text-center text-slate-400 mb-4 font-semibold">ຝຶກຝົນຄຳສັບນີ້</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {practiceButtons.map(({mode, label, icon: Icon}) => (
                  <button key={mode} onClick={() => handlePracticeSelect(mode as PracticeMode)} className="flex flex-col items-center justify-center text-center gap-2 p-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-sm">
                    <Icon className="w-6 h-6" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <button onClick={() => handleLevelSelect(selectedLevel)} className="flex items-center gap-2 mt-6 px-4 py-2 bg-slate-800/50 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-sm" aria-label="ເອົາຄຳສັບໃໝ່">
              <RefreshIcon className="w-4 h-4" />
              ປ່ຽນຄຳສັບໃໝ່
            </button>
        </div>
      );
    }

    // Home View (Search + Level Selector)
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col">
            <div className="relative mb-6">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-500" />
                </span>
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ຄົ້ນຫາຄຳສັບ HSK (ຕົວອັກສອນ, ພິນອິນ, ຄຳແປ)..."
                    className="w-full py-3 pl-10 pr-10 text-lg text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    aria-label="Search HSK Vocabulary"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        aria-label="Clear search"
                    >
                        <XCircleIcon className="w-6 h-6 text-slate-500 hover:text-white transition-colors" />
                    </button>
                )}
            </div>

            <div className="flex-grow">
                {searchQuery.trim().length > 0 ? (
                    <SearchResults results={searchResults} />
                ) : (
                    <HSKLevelSelector onSelectLevel={handleLevelSelect} />
                )}
            </div>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 font-sans">
      <header className="w-full max-w-4xl mx-auto text-center mb-8">
        <div className="flex items-center justify-center gap-4">
          <BookOpenIcon className="w-12 h-12 text-brand-primary"/>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            ຮຽນຄຳສັບ HSK ດ້ວຍ AI
          </h1>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto flex-grow flex items-center justify-center">
        {renderMainContent()}
      </main>

       <footer className="w-full max-w-4xl mx-auto text-center mt-8 py-4">
         {selectedLevel && !isLoading && !practiceMode && (
            <button
              onClick={resetApp}
              className="px-6 py-2 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors text-slate-300"
            >
              ປ່ຽນລະດັບ HSK
            </button>
         )}
         <p className="text-slate-500 text-sm mt-4">ຕິດຕາມ tiktok: peilaoshi_ </p>
      </footer>
    </div>
  );
};

export default App;