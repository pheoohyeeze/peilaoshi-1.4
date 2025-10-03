import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { HSKLevel, VocabularyWord, PracticeMode, User } from './types';
import { fetchHSKVocabulary, generatePracticeExercise, getSentenceFeedback, getEssayFeedback } from './services/geminiService';
import * as dataService from './services/dataService';
import { 
    initializeDB, getRecentSearches, addRecentSearch, 
    clearRecentSearches, searchVocabulary, getVocabularyByLevel
} from './services/dataService';
import HSKLevelSelector from './components/HSKLevelSelector';
import Flashcard from './components/Flashcard';
import LoadingSpinner from './components/LoadingSpinner';
import PracticeView from './components/PracticeView';
import AuthPage from './components/AuthPage';
import AuthSuccess from './components/AuthSuccess';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import AdminLoginPage from './components/AdminLoginPage';
import { 
    ArrowLeftIcon, ArrowRightIcon, RefreshIcon, BookOpenIcon, 
    LightBulbIcon, ShieldExclamationIcon, ArrowsRightLeftIcon, 
    ChatBubbleLeftRightIcon, PencilIcon, QueueListIcon, 
    MagnifyingGlassIcon, XCircleIcon, SpeakerWaveIcon, UserCircleIcon,
    ShieldCheckIcon, Cog6ToothIcon, LockClosedIcon
} from './components/IconComponents';

const playAudio = (audioUrl?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error("Audio playback failed:", error));
  }
};

type AppView = 'main' | 'profile' | 'admin';
type AuthView = 'landing' | 'user' | 'admin';
type SearchResultWord = VocabularyWord & { level: HSKLevel };

interface SearchResultsProps {
  results: SearchResultWord[];
  onWordSelect: (word: SearchResultWord) => void;
  isLoading: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onWordSelect, isLoading }) => {
  if (isLoading) {
    return (
        <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-2xl">
            <LoadingSpinner message="ກຳລັງຄົ້ນຫາ..." />
        </div>
    );
  }

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
                <li 
                    key={`${word.character}-${index}`} 
                    className="flex items-center justify-between p-3 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                    onClick={() => onWordSelect(word)}
                    role="button"
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); playAudio(word.audioUrl); }}
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

interface RecentSearchesProps {
  searches: SearchResultWord[];
  onWordSelect: (word: SearchResultWord) => void;
  onClear: () => void;
}
const RecentSearches: React.FC<RecentSearchesProps> = ({ searches, onWordSelect, onClear }) => {
    return (
         <div className="w-full bg-slate-800 rounded-2xl shadow-2xl p-4 animate-fade-in max-h-[65vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2 px-1">
                <h2 className="text-lg font-bold text-slate-300">ຄຳສັບທີ່ຄົ້ນຫາຫຼ້າສຸດ</h2>
                <button 
                    onClick={onClear}
                    className="text-sm text-slate-400 hover:text-brand-primary transition-colors"
                >
                    ລຶບທັງໝົດ
                </button>
            </div>
            <ul className="divide-y divide-slate-700">
                {searches.map((word, index) => (
                     <li key={`${word.character}-${index}`} 
                        className="flex items-center justify-between p-3 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                        onClick={() => onWordSelect(word)}
                        role="button"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); playAudio(word.audioUrl); }}
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

const LandingAuthSelector: React.FC<{ onSelect: (view: AuthView) => void }> = ({ onSelect }) => (
    <div className="w-full max-w-md mx-auto p-8 bg-slate-800 rounded-2xl shadow-2xl text-center animate-fade-in">
        <h2 className="text-3xl font-bold text-white mb-6">ຍິນດີຕ້ອນຮັບ</h2>
        <p className="text-slate-400 mb-8">ກະລຸນາເລືອກປະເພດການເຂົ້າສູ່ລະບົບ:</p>
        <div className="space-y-4">
            <button
                onClick={() => onSelect('user')}
                className="w-full flex items-center justify-center gap-3 py-3 text-lg font-semibold text-white bg-brand-primary rounded-lg transition-all duration-300 ease-in-out hover:bg-brand-secondary focus:outline-none focus:ring-4 focus:ring-brand-secondary/50"
            >
                <UserCircleIcon className="w-6 h-6" />
                <span>ເຂົ້າສູ່ລະບົບ / ລົງທະບຽນຜູ້ໃຊ້</span>
            </button>
            <button
                onClick={() => onSelect('admin')}
                className="w-full flex items-center justify-center gap-3 py-3 text-lg font-semibold text-white bg-slate-700 rounded-lg transition-all duration-300 ease-in-out hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-600/50"
            >
                <Cog6ToothIcon className="w-6 h-6" />
                <span>ເຂົ້າສູ່ລະບົບຜູ້ເບິ່ງແຍງລະບົບ</span>
            </button>
        </div>
    </div>
);


const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appView, setAppView] = useState<AppView>('main');
  const [authView, setAuthView] = useState<AuthView>('landing');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [practiceMode, setPracticeMode] = useState<PracticeMode | null>(null);
  const [practiceData, setPracticeData] = useState<any>(null);
  const [isPracticeLoading, setIsPracticeLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultWord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResultWord[]>([]);

  useEffect(() => {
    async function init() {
        try {
            const userJson = sessionStorage.getItem('currentUser');
            if (userJson) {
                const user = JSON.parse(userJson);
                setCurrentUser(user);
                if (user.username === 'peilaoshi') {
                    setAppView('admin'); // Directly go to admin view if admin is logged in
                }
            }
            await initializeDB();
            if (userJson) { // Only load recent searches if user is logged in
                const searches = await getRecentSearches();
                setRecentSearches(searches);
            }
        } catch (err) {
            console.error("DB Initialization Error:", err);
            setError("ບໍ່ສາມາດເລີ່ມຖານຂໍ້ມູນໄດ້.");
        } finally {
            setIsInitializing(false);
        }
    }
    init();
  }, []);

  useEffect(() => {
      const handler = setTimeout(() => {
          setDebouncedSearchQuery(searchQuery);
      }, 300); // 300ms debounce delay

      return () => {
          clearTimeout(handler);
      };
  }, [searchQuery]);

  useEffect(() => {
      async function performSearch() {
          if (!debouncedSearchQuery.trim()) {
              setSearchResults([]);
              return;
          }
          setIsSearching(true);
          try {
              const results = await searchVocabulary(debouncedSearchQuery);
              setSearchResults(results);
          } catch (err) {
              console.error("Search error:", err);
              setError("ການຄົ້ນຫາລົ້ມເຫລວ.");
          } finally {
              setIsSearching(false);
          }
      }
      if (currentUser && !showAuthSuccess && appView === 'main') { // Only search if logged in, not on success screen, and in main view
        performSearch();
      }
  }, [debouncedSearchQuery, currentUser, showAuthSuccess, appView]);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    setShowAuthSuccess(true);
    // load recent searches for the newly logged in user
    const searches = await getRecentSearches();
    setRecentSearches(searches);
  };

  const handleAdminLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    await handleGoToAdmin(); // Directly fetch users and switch to admin view
    setAuthView('landing');
  };
  
  const handleContinueToApp = () => {
      setShowAuthSuccess(false);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    setAuthView('landing');
    resetToHome();
  };

  const handleUpdateUser = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleGoToAdmin = async () => {
    setIsLoading(true);
    try {
        const users = await dataService.getAllUsers();
        setAllUsers(users as User[]);
        setAppView('admin');
    } catch (err) {
        setError("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຜູ້ໃຊ້ໄດ້.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleAdminUpdateUser = async (user: User): Promise<User> => {
      const updatedUser = await dataService.updateUser(user);
      const users = await dataService.getAllUsers();
      setAllUsers(users as User[]);
      if (currentUser && currentUser.id === updatedUser.id) {
          handleUpdateUser(updatedUser);
      }
      return updatedUser;
  }

  const handleAdminAddUser = async (user: Omit<User, 'id'>) => {
      await dataService.registerUser(user);
      const users = await dataService.getAllUsers();
      setAllUsers(users as User[]);
  };

  const handleAdminDeleteUser = async (userId: number) => {
      await dataService.deleteUser(userId);
      const users = await dataService.getAllUsers();
      setAllUsers(users as User[]);
  }

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
      setSelectedLevel(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleWordSelect = async (word: SearchResultWord) => {
    await addRecentSearch(word);
    const searches = await getRecentSearches();
    setRecentSearches(searches);

    setSelectedLevel(word.level);
    setIsLoading(true);
    try {
        const wordsForLevel = await getVocabularyByLevel(word.level);
        const wordIndex = wordsForLevel.findIndex(w => w.character === word.character);
        
        setVocabulary(wordsForLevel);
        setCurrentIndex(wordIndex >= 0 ? wordIndex : 0);
        setSearchQuery('');
        setSearchResults([]);
    } catch (err) {
        setError("Could not load words for the selected level.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearRecentSearches = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % vocabulary.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length);
  };

  const resetToHome = () => {
    setSelectedLevel(null);
    setVocabulary([]);
    setCurrentIndex(0);
    setError(null);
    setPracticeMode(null);
    setPracticeData(null);
    setSearchQuery('');
    setRecentSearches([]);
    setAppView('main');
  };
  
  const currentWord = vocabulary[currentIndex];

  const handlePracticeSelect = useCallback(async (mode: PracticeMode) => {
    if ((!currentWord && mode !== 'ordering') || !selectedLevel) return;

    if (mode === 'building') {
      setPracticeMode('building');
      setPracticeData(null);
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
      { mode: 'example', label: 'ຕົວຢ່າງປະໂຫຍກ', icon: LightBulbIcon, vipOnly: false },
      { mode: 'correction', label: 'ຊອກຫາຂໍ້ຜິດພາດ', icon: ShieldExclamationIcon, vipOnly: false },
      { mode: 'scramble', label: 'ລຽງປະໂຫຍກ', icon: ArrowsRightLeftIcon, vipOnly: false },
      { mode: 'building', label: 'ສ້າງປະໂຫຍກ', icon: ChatBubbleLeftRightIcon, vipOnly: false },
    ];
    
    if (selectedLevel === 4) {
      buttons.push({ mode: 'ordering', label: '排列顺序', icon: QueueListIcon, vipOnly: true });
    }
    
    if (selectedLevel && selectedLevel >= 5) {
        buttons.push({ mode: 'writing', label: 'ຝຶກຂຽນ', icon: PencilIcon, vipOnly: false });
    }
    return buttons;
  }, [selectedLevel]);

  const renderMainContent = () => {
    if (isInitializing) return <LoadingSpinner message="ກຳລັງເລີ່ມຕົ້ນຖານຂໍ້ມູນ..." />;
    
    if (!currentUser) {
        switch(authView) {
            case 'user':
                return <AuthPage onLoginSuccess={handleLoginSuccess} />;
            case 'admin':
                return <AdminLoginPage onAdminLoginSuccess={handleAdminLoginSuccess} onBack={() => setAuthView('landing')} />;
            case 'landing':
            default:
                return <LandingAuthSelector onSelect={setAuthView} />;
        }
    }

    if (showAuthSuccess) return <AuthSuccess user={currentUser} onContinue={handleContinueToApp} />;
    
    if (appView === 'profile') {
        return <ProfilePage user={currentUser} onUpdateUser={handleUpdateUser} onBack={() => setAppView('main')} />;
    }

    if (appView === 'admin') {
        return (
            <AdminPage
                users={allUsers}
                currentUser={currentUser!}
                onUpdateUser={handleAdminUpdateUser}
                onAddUser={handleAdminAddUser}
                onDeleteUser={handleAdminDeleteUser}
                onBack={() => { setAppView('main'); resetToHome(); }}
            />
        );
    }

    if (isLoading) return <LoadingSpinner message={`ກຳລັງສ້າງຄຳສັບ HSK ລະດັບ ${selectedLevel}...`} />;
    if (error) return (
        <div className="text-center bg-red-900/50 border border-red-700 p-6 rounded-lg">
            <h3 className="text-2xl font-semibold text-red-300 mb-2">ເກີດຂໍ້ຜິດພາດ</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={practiceMode ? backToFlashcards : resetToHome}
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
          word={currentWord}
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
                {practiceButtons.map(({mode, label, icon: Icon, vipOnly}) => {
                  const isDisabled = vipOnly && !currentUser?.isVip;
                  return (
                    <button 
                      key={mode} 
                      onClick={() => !isDisabled && handlePracticeSelect(mode as PracticeMode)} 
                      className={`relative flex flex-col items-center justify-center text-center gap-2 p-3 bg-slate-800 text-slate-300 rounded-lg transition-colors text-sm ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-700 hover:text-white'}`}
                      title={isDisabled ? 'ສະເພາະສະມາຊິກ VIP ເທົ່ານັ້ນ' : ''}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                    >
                      <Icon className="w-6 h-6" />
                      <span>{label}</span>
                      {isDisabled && <LockClosedIcon className="w-4 h-4 absolute top-1.5 right-1.5 text-yellow-400" />}
                    </button>
                  )
                })}
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
                    <SearchResults results={searchResults} onWordSelect={handleWordSelect} isLoading={isSearching} />
                ) : recentSearches.length > 0 ? (
                    <RecentSearches searches={recentSearches} onWordSelect={handleWordSelect} onClear={handleClearRecentSearches} />
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
        {currentUser && !showAuthSuccess && (
            <div className="flex items-center justify-center gap-4 mt-2">
                <p className="text-slate-400">ຍິນດີຕ້ອນຮັບ, {currentUser.username}!</p>
                <button onClick={() => setAppView('profile')} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="ເບິ່ງໂປຣໄຟລ໌">
                    <UserCircleIcon className="w-6 h-6 text-slate-400"/>
                </button>
                {currentUser.username === 'peilaoshi' && appView !== 'admin' && (
                  <button onClick={handleGoToAdmin} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="ແຜງควบคุมຜູ້ເບິ່ງແຍງລະບົບ">
                      <ShieldCheckIcon className="w-6 h-6 text-slate-400"/>
                  </button>
                )}
            </div>
        )}
      </header>

      <main className="w-full max-w-2xl mx-auto flex-grow flex items-center justify-center">
        {renderMainContent()}
      </main>

      <footer className="w-full max-w-4xl mx-auto text-center mt-8 py-4">
        {currentUser && !showAuthSuccess && (appView === 'main' || appView === 'admin') && (
            <div className="flex justify-center items-center gap-4">
                {selectedLevel && !isLoading && !practiceMode && appView === 'main' && (
                    <button
                        onClick={resetToHome}
                        className="px-6 py-2 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors text-slate-300"
                    >
                        ປ່ຽນລະດັບ HSK
                    </button>
                )}
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-800/50 border border-red-700 rounded-lg hover:bg-red-700 transition-colors text-red-300"
                >
                  ອອກຈາກລະບົບ
                </button>
            </div>
        )}
        <p className="text-slate-1800 text-sm mt-4">ຕິດຕາມ tiktok: peilaoshi_ </p>
        <p className="text-slate-1800 dark:text-slate-400 text-sm mt-4"> ສັ່ງຊື້ປື້ມຮຽນແບບ ແລະ ຄຳສັບ HSK1-6 ໄດ້ທີ: WeChat: Pheoohyeeze33 </p>
         <p className="text-slate-1800 dark:text-slate-400 text-sm mt-4"> ຂໍຂອບໃຈທຸກທ່ານ </p>
      </footer>
    </div>
  );
};

export default App;