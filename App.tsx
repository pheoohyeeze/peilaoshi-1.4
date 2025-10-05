import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { HSKLevel, VocabularyWord, PracticeMode, ProgressData, ActivityLogEntry } from './types';
import { fetchHSKVocabularyForLesson, generatePracticeExercise, getSentenceFeedback, getEssayFeedback, generateTranslationChoiceQuiz, generateWordBuildingQuiz, generateMatchingQuiz } from './services/geminiService';
import { getProgress, updateWordMastery } from './services/progressService';
import { getActivityHistory, logActivity } from './services/activityLogService';
import { getUser, User, deregisterDevice } from './services/adminService';
import { HSK_LEVELS } from './constants';
import { HSK_VOCABULARY } from './data/hsk-vocabulary';
import HSKLevelSelector from './components/HSKLevelSelector';
import LessonSelector from './components/LessonSelector';
import Flashcard from './components/Flashcard';
import LoadingSpinner from './components/LoadingSpinner';
import PracticeView from './components/PracticeView';
import Auth from './components/Auth';
import ProgressView from './components/ProgressView';
import VIPPage from './components/VIPPage';
import QRCodePage from './components/QRCodePage';
import ActivityHistoryView from './components/ActivityHistoryView';
import AdminDashboard from './components/AdminDashboard';
import { 
    ArrowLeftIcon, ArrowRightIcon, BookOpenIcon, 
    LightBulbIcon, ShieldExclamationIcon, ArrowsRightLeftIcon, 
    ChatBubbleLeftRightIcon, PencilIcon, QueueListIcon, 
    MagnifyingGlassIcon, XCircleIcon, SpeakerWaveIcon, QuestionMarkCircleIcon, SquaresPlusIcon, LinkIcon,
    PuzzlePieceIcon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon, ChartBarIcon, ClockIcon, LockClosedIcon, CrownIcon
} from './components/IconComponents';

const playAudio = (audioUrl?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error("Audio playback failed:", error));
  }
};

type SearchResultWord = VocabularyWord & { level: HSKLevel };
type CurrentUser = (Omit<User, 'password'> & { isAdmin: boolean });


interface SearchResultsProps {
  results: SearchResultWord[];
}

const getDeviceId = () => {
    let deviceId = localStorage.getItem('hsk-device-id');
    if (!deviceId) {
        deviceId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        localStorage.setItem('hsk-device-id', deviceId);
    }
    return deviceId;
};

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl">
        <p>ບໍ່ພົບຄຳສັບທີ່ຕົງກັນ.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-2 animate-fade-in max-h-[65vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 my-2">ຜົນການຄົ້ນຫາ ({results.length})</h2>
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {results.map((word, index) => (
                <li key={`${word.character}-${index}`} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => playAudio(word.audioUrl)}
                            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-brand-primary hover:text-white dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-brand-primary transition-colors flex-shrink-0"
                            aria-label={`Play pronunciation for ${word.character}`}
                        >
                            <SpeakerWaveIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{word.character}</p>
                            <p className="text-md text-slate-500 dark:text-slate-400">{word.pinyin}</p>
                            <p className="text-md text-slate-600 dark:text-slate-300">{word.translation}</p>
                        </div>
                    </div>
                    <span className="text-sm font-medium bg-blue-100 text-brand-primary px-2 py-1 rounded-md dark:bg-blue-900/50 dark:text-blue-300">
                        HSK {word.level}
                    </span>
                </li>
            ))}
        </ul>
    </div>
  );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
    }
    return 'light';
  });

  const [practiceMode, setPracticeMode] = useState<PracticeMode | null>(null);
  const [practiceData, setPracticeData] = useState<any>(null);
  const [isPracticeLoading, setIsPracticeLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [progress, setProgress] = useState<ProgressData>({});
  const [showProgressView, setShowProgressView] = useState(false);
  const [activityHistory, setActivityHistory] = useState<ActivityLogEntry[]>([]);
  const [showVipPage, setShowVipPage] = useState(false);
  const [showQRCodePage, setShowQRCodePage] = useState(false);
  const [showActivityHistory, setShowActivityHistory] = useState(false);


  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      root.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [theme]);

  useEffect(() => {
    const username = sessionStorage.getItem('hsk-user');
    if (username) {
      handleLoginSuccess(username);
    }
  }, []);
  
  const handleLogActivity = useCallback((entry: Omit<ActivityLogEntry, 'id' | 'username'>) => {
    if (!currentUser?.username) return;
    const updatedHistory = logActivity(currentUser.username, entry);
    setActivityHistory(updatedHistory);
  }, [currentUser]);

  const handleLoginSuccess = (username: string) => {
    sessionStorage.setItem('hsk-user', username);
    const userData = getUser(username);
    if (userData) {
      setCurrentUser(userData);
      if (!userData.isAdmin) {
        setProgress(getProgress(username));
        setActivityHistory(getActivityHistory(username));
        // Log the login event, but don't re-log if it's just a page refresh
        const lastActivity = getActivityHistory(username)[0];
        if (!lastActivity || lastActivity.type !== 'login' || (Date.now() - lastActivity.id > 5000)) {
            handleLogActivity({ type: 'login' });
        }
      }
    } else {
      // Handle user not found case, maybe log them out
      handleLogout();
    }
  };

  const handleLogout = () => {
    if (currentUser) {
        deregisterDevice(currentUser.username, getDeviceId());
    }
    sessionStorage.removeItem('hsk-user');
    setCurrentUser(null);
    setProgress({});
    setActivityHistory([]);
    resetApp();
  };

  const handleUpdateProgress = useCallback((character: string, outcome: 'correct' | 'incorrect') => {
    if (!currentUser?.username) return;
    const updatedProgress = updateWordMastery(currentUser.username, character, outcome);
    setProgress(updatedProgress);
  }, [currentUser]);

  const handleVipLockClick = () => {
    setShowVipPage(true);
  };


  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

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


  const handleLevelSelect = useCallback((level: HSKLevel) => {
    setIsLoading(true);
    setError(null);
    setSelectedLevel(level);
    setSelectedLesson(null);
    setVocabulary([]);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const handleLessonSelect = useCallback(async (lesson: number) => {
    if (!selectedLevel) return;
    setIsLoading(true);
    setError(null);
    try {
      const words = await fetchHSKVocabularyForLesson(selectedLevel, lesson);
      setVocabulary(words);
      setCurrentIndex(0);
      setSelectedLesson(lesson);
      handleLogActivity({ type: 'lesson_start', level: selectedLevel, lesson });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setSelectedLesson(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevel, handleLogActivity]);


  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % vocabulary.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length);
  };

  const resetApp = () => {
    setSelectedLevel(null);
    setSelectedLesson(null);
    setVocabulary([]);
    setCurrentIndex(0);
    setError(null);
    setPracticeMode(null);
    setPracticeData(null);
    setSearchQuery('');
    setShowProgressView(false);
    setShowActivityHistory(false);
  };
  
    const backToLevelSelector = () => {
        setSelectedLevel(null);
        setSelectedLesson(null);
        setVocabulary([]);
        setError(null);
    }

    const backToLessonSelector = () => {
        setSelectedLesson(null);
        setVocabulary([]);
        setError(null);
        setPracticeMode(null);
        setPracticeData(null);
    }

  const currentWord = vocabulary[currentIndex];
  
  const vipModes: PracticeMode[] = ['ordering', 'building', 'scramble', 'conjunction', 'correction', 'writing'];

  const handlePracticeSelect = useCallback(async (mode: PracticeMode) => {
      const isVipRequired = (selectedLevel && selectedLevel >= 4 && vipModes.includes(mode));
      if (isVipRequired && !currentUser?.isVip) {
        handleVipLockClick();
        return;
      }
      
    if ((!currentWord && !['ordering', 'translation_choice', 'build_from_translation', 'matching', 'conjunction'].includes(mode)) || !selectedLevel) return;

    if (mode === 'building') {
      setPracticeMode('building');
      setPracticeData(null);
      return;
    }

    if (mode === 'translation_choice') {
      if (vocabulary.length < 4) {
        setError('ບົດຮຽນນີ້ມີຄຳສັບບໍ່ພຽງພໍສຳລັບແບບທົດສອບນີ້.');
        return;
      }
      const quizData = generateTranslationChoiceQuiz(vocabulary);
      setPracticeMode(mode);
      setPracticeData(quizData);
      return;
    }

    if (mode === 'build_from_translation') {
      const quizData = generateWordBuildingQuiz(vocabulary);
       if (!quizData || quizData.questions.length === 0) {
        setError('ບົດຮຽນນີ້ບໍ່ສາມາດສ້າງແບບທົດສອບນີ້ໄດ້.');
        return;
      }
      setPracticeMode(mode);
      setPracticeData(quizData);
      return;
    }

    if (mode === 'matching') {
      const quizData = generateMatchingQuiz(vocabulary);
      if (!quizData || !quizData.rounds || quizData.rounds.length === 0) {
        setError('ບົດຮຽນນີ້ມີຄຳສັບບໍ່ພຽງພໍສຳລັບເກມນີ້.');
        return;
      }
      setPracticeMode(mode);
      setPracticeData(quizData);
      return;
    }
    
    setIsPracticeLoading(true);
    setError(null);
    setPracticeMode(mode);
    try {
      const data = await generatePracticeExercise(currentWord || {} as VocabularyWord, mode, selectedLevel);
      setPracticeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setPracticeMode(null);
    } finally {
      setIsPracticeLoading(false);
    }
  }, [currentWord, selectedLevel, vocabulary, currentUser]);

  const handleSentenceSubmit = useCallback(async (sentence: string) => {
      if (!currentWord || !selectedLevel) return null;
      try {
          const feedback = await getSentenceFeedback(currentWord, sentence, selectedLevel);
          return feedback;
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
          return null;
      }
  }, [currentWord, selectedLevel]);
  
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
    const allModes = [
      { mode: 'example', label: 'ຕົວຢ່າງປະໂຫຍກ', icon: LightBulbIcon },
      { mode: 'correction', label: 'ຊອກຫາຂໍ້ຜິດພາດ', icon: ShieldExclamationIcon },
      { mode: 'scramble', label: 'ລຽງປະໂຫຍກ', icon: ArrowsRightLeftIcon },
      { mode: 'building', label: 'ສ້າງປະໂຫຍກ', icon: ChatBubbleLeftRightIcon },
      { mode: 'translation_choice', label: 'ເລືອກຄຳແປ', icon: QuestionMarkCircleIcon },
      { mode: 'build_from_translation', label: 'ປະກອບຄຳສັບ', icon: SquaresPlusIcon },
      { mode: 'matching', label: 'ຈັບຄູ່ຄຳສັບ', icon: LinkIcon },
      { mode: 'conjunction', label: 'ເຊື່ອມປະໂຫຍກ', icon: PuzzlePieceIcon },
      { mode: 'ordering', label: '排列顺序', icon: QueueListIcon },
      { mode: 'writing', label: 'ຝຶກຂຽນ', icon: PencilIcon },
    ];

    const buttons = allModes.map(btn => {
      const isVipRequired = (selectedLevel && selectedLevel >= 4 && vipModes.includes(btn.mode as PracticeMode));
      const isDisabled = isVipRequired && !currentUser?.isVip;
      return { ...btn, isDisabled };
    });

    // Filtering logic based on level
    if (selectedLevel && selectedLevel < 3) {
      return buttons.filter(b => b.mode !== 'conjunction' && b.mode !== 'ordering' && b.mode !== 'writing');
    }
    if (selectedLevel === 3) {
       return buttons.filter(b => b.mode !== 'ordering' && b.mode !== 'writing');
    }
    if (selectedLevel === 4) {
        return buttons.filter(b => b.mode !== 'writing');
    }
    if (selectedLevel === 5 || selectedLevel === 6) {
        return buttons.filter(b => b.mode !== 'ordering');
    }
    
    return buttons;
  }, [selectedLevel, currentUser]);

  const renderMainContent = () => {
    if (!currentUser) {
        return <Auth onLoginSuccess={handleLoginSuccess} />;
    }
    
    if (currentUser.isAdmin) {
        return <AdminDashboard onLogout={handleLogout} />;
    }

    if (!selectedLevel) {
      return (
          <div className="w-full max-w-2xl mx-auto flex flex-col">
              <div className="relative mb-6">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </span>
                  <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ຄົ້ນຫາຄຳສັບ HSK (ຕົວອັກສອນ, ພິນອິນ, ຄຳແປ)..."
                      className="w-full py-3 pl-10 pr-10 text-lg text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
                      aria-label="Search HSK Vocabulary"
                  />
                  {searchQuery && (
                      <button
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          aria-label="Clear search"
                      >
                          <XCircleIcon className="w-6 h-6 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors" />
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

    if (isLoading) return <LoadingSpinner message={`ກຳລັງໂຫຼດ...`} />;
    
    if (error) return (
        <div className="text-center bg-red-100 border border-red-400 text-red-700 p-6 rounded-lg dark:bg-red-900/20 dark:border-red-600 dark:text-red-300">
            <h3 className="text-2xl font-semibold mb-2">ເກີດຂໍ້ຜິດພາດ</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={selectedLesson ? backToLessonSelector : backToLevelSelector}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              ກັບໄປ
            </button>
        </div>
    );

    if (!selectedLesson) {
        return <LessonSelector level={selectedLevel} onSelectLesson={handleLessonSelect} onBack={backToLevelSelector} progress={progress} currentUser={currentUser} onVipLockClick={handleVipLockClick} />;
    }

    if (isPracticeLoading) return <LoadingSpinner message="ກຳລັງສ້າງແບບຝຶກຫັດ..." />;

    if (practiceMode && selectedLesson) {
      return (
        <PracticeView
          mode={practiceMode}
          word={currentWord} 
          data={practiceData}
          level={selectedLevel}
          lesson={selectedLesson}
          onSentenceSubmit={handleSentenceSubmit}
          onEssaySubmit={handleEssaySubmit}
          onClose={backToFlashcards}
          onNewExercise={handlePracticeSelect}
          onUpdateProgress={handleUpdateProgress}
          onLogActivity={handleLogActivity}
          currentUser={currentUser.username}
        />
      );
    }

    if (currentWord) {
      return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full mb-6">
              <Flashcard word={currentWord} />
            </div>

            <div className="flex items-center justify-between w-full mb-6">
              <button onClick={handlePrev} className="p-4 rounded-full bg-white text-slate-600 shadow-md hover:bg-brand-primary hover:text-white transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:text-white" aria-label="ຄຳກ່ອນໜ້າ"><ArrowLeftIcon className="w-6 h-6" /></button>
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{currentIndex + 1} / {vocabulary.length}</p>
              <button onClick={handleNext} className="p-4 rounded-full bg-white text-slate-600 shadow-md hover:bg-brand-primary hover:text-white transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:text-white" aria-label="ຄຳຕໍ່ໄປ"><ArrowRightIcon className="w-6 h-6" /></button>
            </div>

            <div className="w-full border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="text-center text-slate-500 dark:text-slate-400 mb-4 font-semibold">ຝຶກຝົນຄຳສັບນີ້</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {practiceButtons.map(({mode, label, icon: Icon, isDisabled}) => (
                  <button 
                    key={mode} 
                    onClick={() => handlePracticeSelect(mode as PracticeMode)} 
                    className={`relative flex flex-col items-center justify-center text-center gap-2 p-3 bg-white text-slate-600 rounded-lg shadow-sm transition-colors text-sm dark:bg-slate-800 dark:text-slate-300 ${
                      isDisabled
                        ? 'opacity-50'
                        : 'hover:bg-slate-100 hover:text-brand-primary dark:hover:bg-slate-700 dark:hover:text-brand-light'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{label}</span>
                    {isDisabled && (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                            <span className="font-bold text-yellow-500 dark:text-yellow-400 text-xs">VIP</span>
                            <LockClosedIcon className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                        </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
        </div>
      );
    }

    return <p className="text-slate-500 dark:text-slate-400">ບໍ່ມີຄຳສັບໃນບົດຮຽນນີ້.</p>;
  }


  return (
    <div className="min-h-screen bg-gray-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200 flex flex-col items-center p-4 font-sans">
      {showProgressView && selectedLevel && currentUser && !currentUser.isAdmin && (
          <ProgressView 
            level={selectedLevel}
            onClose={() => setShowProgressView(false)}
            progress={progress}
            allWordsForLevel={HSK_VOCABULARY[selectedLevel]}
          />
      )}
      {showActivityHistory && currentUser && !currentUser.isAdmin && (
        <ActivityHistoryView
          history={activityHistory}
          onClose={() => setShowActivityHistory(false)}
        />
      )}
      {showVipPage && (
        <VIPPage 
            onClose={() => setShowVipPage(false)} 
            onPurchaseClick={() => {
              setShowVipPage(false);
              setShowQRCodePage(true);
            }}
        />
      )}
      {showQRCodePage && <QRCodePage onClose={() => setShowQRCodePage(false)} />}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between mb-8">
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center items-center gap-4">
          <BookOpenIcon className="w-12 h-12 text-brand-primary"/>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            ຮຽນຄຳສັບ HSK ດ້ວຍ AI
          </h1>
        </div>
        <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4">
          {currentUser && !currentUser.isAdmin && selectedLevel && (
            <>
              <button
                  onClick={() => setShowActivityHistory(true)}
                  className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-blue-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  aria-label="ສະແດງປະຫວັດການຮຽນ"
              >
                  <ClockIcon className="w-6 h-6" />
              </button>
              <button
                  onClick={() => setShowProgressView(true)}
                  className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-blue-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  aria-label="ສະແດງຄວາມຄືບໜ້າ"
              >
                  <ChartBarIcon className="w-6 h-6" />
              </button>
            </>
          )}
          <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-yellow-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
          </button>
          {currentUser && !currentUser.isAdmin && (
            <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-slate-600 dark:text-slate-300">ສະບາຍດີ, {currentUser.username}</span>
                {currentUser.isVip && <CrownIcon className="w-5 h-5 text-yellow-500" />}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    aria-label="ອອກຈາກລະບົບ"
                >
                    <ArrowRightOnRectangleIcon className="w-6 h-6" />
                </button>
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto flex-grow flex items-center justify-center">
        {renderMainContent()}
      </main>

       <footer className="w-full max-w-4xl mx-auto text-center mt-8 py-4">
         {currentUser && !currentUser.isAdmin && selectedLevel && (
            <button
              onClick={selectedLesson ? backToLessonSelector : backToLevelSelector}
              className="px-6 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              {selectedLesson ? 'ປ່ຽນບົດຮຽນ' : 'ປ່ຽນລະດັບ HSK'}
            </button>
         )}
         <p className="text-slate-1800 dark:text-slate-400 text-sm mt-4">ຕິດຕາມ tiktok: peilaoshi_ </p>
         <p className="text-slate-1800 dark:text-slate-400 text-sm mt-4"> ສັ່ງຊື້ປື້ມແບບຮຽນ ແລະ ຄຳສັບ HSK1-6 ໄດ້ທີ: WeChat: Pheoohyeeze33 </p>
         <p className="text-slate-1800 dark:text-slate-400 text-sm mt-4"> ຂໍຂອບໃຈທຸກທ່ານ </p>
         

      </footer>
    </div>
  );
};

export default App;