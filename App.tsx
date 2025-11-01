import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { HSKLevel, VocabularyWord, PracticeMode, ProgressData, ActivityLogEntry, SearchResultWord } from './types';
import { fetchHSKVocabularyForLesson, generatePracticeExercise, getSentenceFeedback, getEssayFeedback, generateTranslationChoiceQuiz, generateWordBuildingQuiz, generateMatchingQuiz, identifyCharactersInImage, identifyObjectInImage } from './services/geminiService';
import { getProgress, updateWordMastery } from './services/progressService';
import { getActivityHistory, logActivity } from './services/activityLogService';
import { getUser, User, deregisterDevice, changeUserPassword } from './services/adminService';
import { HSK_LEVELS, WORDS_PER_LESSON } from './constants';
import { HSK_VOCABULARY } from './data/hsk-vocabulary';
import HSKLevelSelector from './components/HSKLevelSelector';
import LessonSelector from './components/LessonSelector';
import LoadingSpinner from './components/LoadingSpinner';
import PracticeView from './components/PracticeView';
import Auth from './components/Auth';
import ProgressView from './components/ProgressView';
import VIPPage from './components/VIPPage';
import VipTutorial from './components/VipTutorial';
import QRCodePage from './components/QRCodePage';
import ActivityHistoryView from './components/ActivityHistoryView';
import AdminDashboard from './components/AdminDashboard';
import ProfilePage from './components/ProfilePage';
import { 
    ArrowLeftIcon, ArrowRightIcon, 
    MagnifyingGlassIcon, XCircleIcon, SpeakerWaveIcon, 
    SunIcon, MoonIcon, ArrowRightOnRectangleIcon, CrownIcon, UserIcon,
    CameraIcon, BellIcon, HomeIcon, ChevronDownIcon,
    SwapHorizontalIcon, ListCogIcon, LinkIcon, ClipboardChecklistIcon, 
    DuplicateIcon, TranslateIcon, NetworkIcon, LockClosedIcon, BookOpenIcon,
    ChatBubbleLeftRightIcon, PencilIcon, PromoMegaphoneIcon, PromoTrophyIcon
} from './components/IconComponents';

const playAudio = (audioUrl?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error("Audio playback failed:", error));
  }
};

type CurrentUser = (Omit<User, 'password'> & { isAdmin: boolean });


interface SearchResultsProps {
  results: SearchResultWord[];
  onWordSelect: (word: SearchResultWord) => void;
}

const getDeviceId = () => {
    let deviceId = localStorage.getItem('hsk-device-id');
    if (!deviceId) {
        deviceId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        localStorage.setItem('hsk-device-id', deviceId);
    }
    return deviceId;
};

const SearchResults: React.FC<SearchResultsProps> = ({ results, onWordSelect }) => {
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
                <li key={`${word.character}-${index}`}
                    onClick={() => onWordSelect(word)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onWordSelect(word)}
                    className={`transition-colors rounded-lg ${word.level ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer' : 'cursor-default'}`}
                    role={word.level ? "button" : "listitem"}
                    tabIndex={word.level ? 0 : -1}
                    aria-label={word.level ? `Go to lesson for ${word.character}` : word.character}
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent navigating to lesson
                                playAudio(word.audioUrl);
                            }}
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
                    <span className={`text-sm font-medium px-2 py-1 rounded-md ${word.level ? 'bg-blue-100 text-brand-primary dark:bg-blue-900/50 dark:text-blue-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'}`}>
                        {word.level ? `HSK ${word.level}` : 'ຄຳສັບທົ່ວໄປ'}
                    </span>
                   </div>
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
  const [showVipTutorial, setShowVipTutorial] = useState(false);
  const [showQRCodePage, setShowQRCodePage] = useState(false);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);

  const [showCameraView, setShowCameraView] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraScanResults, setCameraScanResults] = useState<SearchResultWord[] | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const promotions = [
      {
        line1: 'VIP 12 ເດືອນ',
        line2: 'ລາຄາ 480.000 ກີບ',
      },
      {
        line1: 'VIP 3 ເດືອນ',
        line2: 'ລາຄາ 150.000 ກີບ',
      },
      {
        line1: 'ຊື້ປຶ້ມຄຳສັບ ຫຼື ໄຟລ໌ປຶ້ມແບບຮຽນ',
        line2: 'ແຖມ VIP 1 ເດືອນ',
      },
      {
        line1: 'ສັ່ງຊື້ປື້ມແບບຮຽນ ແລະ ຄຳສັບ HSK1-6 ໄດ້ທີ:',
        line2: 'WeChat: Pheoohyeeze33 ຫຼື Whatsaap: 2096473810',
        isOriginal: true,
      },
    ];

    const [currentPromotion, setCurrentPromotion] = useState(0);

    useEffect(() => {
        // This effect should only run on the homepage
        if (!selectedLevel && !searchQuery) {
            const timer = setInterval(() => {
                setCurrentPromotion((prev) => (prev + 1) % promotions.length);
            }, 3000); // Auto-slide every 3 seconds

            return () => clearInterval(timer); // Cleanup on component unmount or view change
        }
    }, [selectedLevel, searchQuery, promotions.length]);

  const PlusLogo = () => (
    <div
      className="flex items-center gap-1 text-yellow-500 cursor-pointer"
      onClick={() => setShowVipPage(true)}
      role="button"
      tabIndex={0}
      aria-label="ເປີດໜ້າ VIP"
    >
        <CrownIcon className="w-6 h-6" />
        <span className="font-bold text-xl tracking-wider">PLUS</span>
    </div>
  );

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
    setIsCardFlipped(false);
  }, [currentIndex]);

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
      setCurrentUser(userData as CurrentUser);
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
  
  const handleUpdatePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string; }> => {
    if (!currentUser) return { success: false, message: 'ບໍ່ມີຜູ້ໃຊ້ເຂົ້າສູ່ລະບົບ.' };
    const result = changeUserPassword(currentUser.username, currentPassword, newPassword);
    return result;
  };

  const handleDeregisterDevice = (deviceId: string) => {
    if (!currentUser) return;
    deregisterDevice(currentUser.username, deviceId);
    // Refresh user data to show updated device list
    handleLoginSuccess(currentUser.username);
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
      ).map(word => ({ ...word, level: word.level as HSKLevel | null }));
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
  
  const handleGoToLessonFromSearch = useCallback(async (word: SearchResultWord) => {
    if (word.level === null) {
      playAudio(word.audioUrl);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        const { level, character } = word;
        
        const wordsForLevel = HSK_VOCABULARY[level] || [];
        const wordIndexInLevel = wordsForLevel.findIndex(w => w.character === character);

        if (wordIndexInLevel === -1) {
            throw new Error("ບໍ່ພົບຄຳສັບໃນຖານຂໍ້ມູນ.");
        }

        const lessonNumber = Math.floor(wordIndexInLevel / WORDS_PER_LESSON) + 1;
        
        const lessonWords = await fetchHSKVocabularyForLesson(level, lessonNumber);
        const indexInLesson = lessonWords.findIndex(w => w.character === character);

        if (indexInLesson === -1) {
            throw new Error("ບໍ່ສາມາດຊອກຫາຄຳສັບໃນບົດຮຽນໄດ້.");
        }

        setVocabulary(lessonWords);
        setCurrentIndex(indexInLesson);
        setSelectedLevel(level);
        setSelectedLesson(lessonNumber);
        setSearchQuery('');
        setShowCameraView(false);
        setCameraScanResults(null);
        handleLogActivity({ type: 'lesson_start', level: level, lesson: lessonNumber });

    } catch (err) {
        setError(err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດໃນການໄປທີ່ບົດຮຽນ.');
    } finally {
        setIsLoading(false);
    }
  }, [handleLogActivity]);


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
        setSearchQuery('');
    }

    const backToLessonSelector = () => {
        setSelectedLesson(null);
        setVocabulary([]);
        setError(null);
        setPracticeMode(null);
        setPracticeData(null);
    }

  const currentWord = vocabulary[currentIndex];
  
  const handlePracticeSelect = useCallback(async (mode: PracticeMode) => {
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

    const handleImageScan = async (base64ImageData: string, mode: 'character' | 'object') => {
        setIsScanning(true);
        setError(null);
        setCameraScanResults(null);
        try {
            const results = mode === 'character'
                ? await identifyCharactersInImage(base64ImageData)
                : await identifyObjectInImage(base64ImageData);
            setCameraScanResults(results);
        } catch(err) {
            const errorMessage = err instanceof Error ? err.message : 'ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດໃນລະຫວ່າງການສະແກນຮູບພາບ.';
            setError(errorMessage);
            setShowCameraView(false); // Close camera to show main error
        } finally {
            setIsScanning(false);
        }
    };

    const handleCloseCamera = () => {
        setShowCameraView(false);
        setCameraScanResults(null);
        setIsScanning(false);
        setError(null);
    };

  const backToFlashcards = () => {
    setPracticeMode(null);
    setPracticeData(null);
    setError(null);
  };

  const practiceModes = useMemo(() => {
    const allModes: ({ 
        mode: PracticeMode; 
        label: string; 
        icon: React.FC<{className?: string;}>; 
        levels?: HSKLevel[];
        isVipOnly?: boolean; 
    })[] = [
      { mode: 'example', label: 'ຕົວຢ່າງປະໂຫຍກ', icon: BookOpenIcon },
      { mode: 'scramble', label: 'ລຽງຄຳສັບ', icon: SwapHorizontalIcon, isVipOnly: true },
      { mode: 'ordering', label: 'ລຽງປະໂຫຍກ ABC', icon: ListCogIcon, levels: [4], isVipOnly: true },
      { mode: 'conjunction', label: 'ເຊື່ອມປະໂຫຍກ', icon: LinkIcon, isVipOnly: true },
      { mode: 'correction', label: 'ຫາຂໍ້ຜິດພາດ', icon: ClipboardChecklistIcon, isVipOnly: true },
      { mode: 'building', label: 'ສ້າງປະໂຫຍກ', icon: ChatBubbleLeftRightIcon, isVipOnly: true },
      { mode: 'writing', label: 'ຝຶກການຂຽນ', icon: PencilIcon, levels: [5], isVipOnly: true },
      { mode: 'build_from_translation', label: 'ປະກອບຄຳສັບ', icon: DuplicateIcon },
      { mode: 'translation_choice', label: 'ເລືອກຄຳແປ', icon: TranslateIcon, isVipOnly: true },
      { mode: 'matching', label: 'ຈັບຄູ່ຄຳສັບ', icon: NetworkIcon },
    ];
    
    if (!selectedLevel) return [];
    
    return allModes.filter(m => !m.levels || m.levels.includes(selectedLevel));
  }, [selectedLevel]);


  const CameraView: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraMode, setCameraMode] = useState<'character' | 'object'>('character');

    useEffect(() => {
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setCameraError("ຄຸນສົມບັດກ້ອງຖ່າຍຮູບບໍ່ຮອງຮັບໃນບຣາວເຊີນີ້.");
                    return;
                }
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setCameraError("ບໍ່ສາມາດເຂົ້າເຖິງກ້ອງຖ່າຍຮູບໄດ້. ກະລຸນາກວດສອບການອະນຸຍາດ.");
            }
        };

        startCamera();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = imageDataUrl.split(',')[1];
        handleImageScan(base64Data, cameraMode);
    };

    const handleObjectScanClick = () => {
        if (!currentUser?.isVip) {
            handleVipLockClick();
        } else {
            setCameraMode('object');
        }
    };
    
    if (cameraScanResults) {
        return (
            <div className="fixed inset-0 bg-slate-900 z-50 p-4 flex flex-col items-center justify-center animate-fade-in">
                {cameraMode === 'object' && cameraScanResults.length === 0 ? (
                     <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-2xl">
                        <p>ບໍ່ສາມາດກວດຫາວັດຖຸທີ່ຮູ້ຈັກໄດ້.</p>
                        <p className="text-sm mt-2">ກະລຸນາລອງໃໝ່ດ້ວຍຮູບທີ່ຊັດເຈນກວ່າ ຫຼື ວັດຖຸອື່ນ.</p>
                    </div>
                ) : (
                    <SearchResults results={cameraScanResults} onWordSelect={handleGoToLessonFromSearch} />
                )}
                <button 
                    onClick={() => setCameraScanResults(null)}
                    className="mt-4 px-6 py-3 bg-brand-primary text-white rounded-lg text-lg font-semibold"
                >
                    {cameraScanResults.length === 0 ? 'ລອງໃໝ່' : 'ສະແກນອີກຄັ້ງ'}
                </button>
                 <button onClick={onClose} className="absolute top-4 left-4 p-3 bg-black/50 text-white rounded-full">
                    <XCircleIcon className="w-8 h-8"/>
                </button>
            </div>
        )
    }

    if (isScanning) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 p-4 flex flex-col items-center justify-center">
                <LoadingSpinner message={cameraMode === 'character' ? "ກຳລັງວິເຄາະຕົວໜັງສື..." : "ກຳລັງວິເຄາະວັດຖຸ..."} />
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
             <div className="absolute top-4 right-4 bg-black/50 p-1 rounded-full flex gap-1 text-white z-10">
                <button 
                    onClick={() => setCameraMode('character')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${cameraMode === 'character' ? 'bg-brand-primary' : 'bg-transparent'}`}
                >
                    ສະແກນຕົວໜັງສື
                </button>
                <button 
                    onClick={handleObjectScanClick}
                    className={`relative flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors ${cameraMode === 'object' && currentUser?.isVip ? 'bg-brand-primary' : 'bg-transparent'}`}
                >
                    <span>ສະແກນວັດຖຸ</span>
                    {!currentUser?.isVip && (
                        <CrownIcon className="w-3 h-3 text-yellow-400" />
                    )}
                </button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            <button onClick={onClose} className="absolute top-4 left-4 p-3 bg-black/50 text-white rounded-full z-10">
                <XCircleIcon className="w-8 h-8"/>
            </button>
            {cameraError && <div className="absolute top-20 p-4 bg-red-500 text-white text-center rounded-lg">{cameraError}</div>}
            <div className="absolute bottom-8 flex flex-col items-center gap-4 z-10">
                <p className="text-white text-lg font-semibold bg-black/50 px-4 py-2 rounded-full">
                    {cameraMode === 'character' ? 'ຈັດວາງຕົວອັກສອນຈີນໄວ້ໃນກອບ' : 'ຈັດວາງວັດຖຸໄວ້ກາງຈໍ'}
                </p>
                <button onClick={handleCapture} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 ring-4 ring-white/30"></button>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};

  const renderMainContent = () => {
    if (!currentUser) {
        return (
          <div className="flex items-center justify-center min-h-screen p-4">
            <Auth onLoginSuccess={handleLoginSuccess} />
          </div>
        );
    }
    
    if (currentUser.isAdmin) {
        return (
          <div className="p-4">
            <AdminDashboard onLogout={handleLogout} />
          </div>
        );
    }

    if (!selectedLevel) {
      return (
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col">
          {/* Header */}
          <header className="grid grid-cols-3 items-center px-4 pt-4">
            <div className="w-7"></div> {/* Spacer */}
            <div className="justify-self-center">
                <PlusLogo />
            </div>
            <div className="relative justify-self-end">
              <BellIcon className="w-7 h-7 text-gray-500 dark:text-gray-400" />
              <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
            </div>
          </header>

          {/* Search Bar */}
          <div className="px-4 my-4">
            <div className="relative flex items-center bg-gray-100 dark:bg-slate-800 rounded-full h-14 shadow-sm">
              <span className="absolute left-4 pointer-events-none">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 dark:text-slate-500" />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ຄົ້ນຫາຄຳສັບ HSK"
                className="bg-transparent w-full h-full pl-12 pr-20 focus:outline-none text-gray-700 dark:text-slate-200"
                aria-label="Search HSK Vocabulary"
              />
              <button onClick={() => setShowCameraView(true)} className="absolute right-2 p-2 bg-purple-200 dark:bg-purple-800/50 rounded-full">
                 <CameraIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </button>
            </div>
          </div>
          
          {searchQuery.trim().length > 0 ? (
            <div className="px-4"><SearchResults results={searchResults} onWordSelect={handleGoToLessonFromSearch} /></div>
          ) : (
            <>
              {/* Promotion Slider */}
                <div className="px-4 mb-6">
                    <div className="relative w-full h-48 md:h-56 rounded-2xl shadow-lg overflow-hidden cursor-pointer" onClick={() => setShowVipPage(true)}>
                        {/* Sliding Wrapper */}
                        <div 
                            className="flex h-full transition-transform duration-700 ease-in-out"
                            style={{ transform: `translateX(-${currentPromotion * 100}%)` }}
                        >
                            {promotions.map((promo, index) => (
                                <div key={index} className="w-full h-full flex-shrink-0 bg-blue-600 text-white p-5 flex flex-col justify-center items-center relative text-center">
                                    {!promo.isOriginal ? (
                                        <>
                                            <PromoMegaphoneIcon className="absolute w-24 h-24 top-0 left-0 -mt-4 -ml-4 transform -rotate-12 opacity-80" />
                                            <PromoTrophyIcon className="absolute w-24 h-24 bottom-0 left-0 -mb-6 -ml-4 opacity-80" />
                                            <PromoMegaphoneIcon className="absolute w-24 h-24 top-0 right-0 -mt-4 -mr-4 transform rotate-12 scale-x-[-1] opacity-80" />
                                            <PromoTrophyIcon className="absolute w-24 h-24 bottom-0 right-0 -mb-6 -mr-4 transform scale-x-[-1] opacity-80" />

                                            <h3 className="text-2xl md:text-3xl font-bold z-10">ໂປຣໂມຊັ່ນພິເສດ</h3>
                                            <p className="text-3xl md:text-4xl font-bold mt-2 z-10">{promo.line1}</p>
                                            <p className="text-2xl md:text-3xl font-semibold mt-1 z-10">{promo.line2}</p>
                                        </>
                                    ) : (
                                        <div className="z-10">
                                            <p className="font-semibold text-lg md:text-xl leading-relaxed">{promo.line1}</p>
                                            <p className="font-semibold text-base md:text-lg leading-relaxed mt-2">{promo.line2}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination Dots */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                            {promotions.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentPromotion(index);
                                    }}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentPromotion === index ? 'bg-white scale-125' : 'bg-white/50'}`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
              
              <HSKLevelSelector onSelectLevel={handleLevelSelect} />
            </>
          )}
        </div>
      );
    }

    if (isLoading) return <div className="flex items-center justify-center pt-24"><LoadingSpinner message={`ກຳລັງໂຫຼດ...`} /></div>;
    
    if (error) return (
        <div className="p-4 max-w-md mx-auto">
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
        </div>
    );

    if (!selectedLesson) {
        return (
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col">
                 <header className="w-full grid grid-cols-3 items-center px-4 pt-4">
                    <div className="justify-self-start">
                        <button
                            onClick={backToLevelSelector}
                            className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            aria-label="ກັບໄປ"
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="justify-self-center">
                        <PlusLogo />
                    </div>
                    <div className="justify-self-end relative">
                        <BellIcon className="w-7 h-7 text-gray-500 dark:text-gray-400" />
                        <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
                    </div>
                </header>

                <div className="px-4 my-4">
                    <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-full h-14 shadow-sm border border-slate-200 dark:border-slate-700">
                        <span className="absolute left-4 pointer-events-none">
                            <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 dark:text-slate-500" />
                        </span>
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ຄົ້ນຫາຄຳສັບ HSK"
                          className="bg-transparent w-full h-full pl-12 pr-20 focus:outline-none text-gray-700 dark:text-slate-200"
                          aria-label="Search HSK Vocabulary"
                        />
                        <button onClick={() => setShowCameraView(true)} className="absolute right-2 p-2 bg-purple-200 dark:bg-purple-800/50 rounded-full">
                           <CameraIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                        </button>
                    </div>
                </div>

                {searchQuery.trim().length > 0 ? (
                    <div className="px-4 pb-4"><SearchResults results={searchResults} onWordSelect={handleGoToLessonFromSearch} /></div>
                ) : (
                    <LessonSelector 
                        level={selectedLevel} 
                        onSelectLesson={handleLessonSelect} 
                        onBack={backToLevelSelector} 
                        progress={progress} 
                        currentUser={currentUser} 
                        onVipLockClick={handleVipLockClick} 
                    />
                )}
            </div>
        );
    }

    if (isPracticeLoading) return <div className="flex items-center justify-center pt-24"><LoadingSpinner message="ກຳລັງສ້າງແບບຝຶກຫັດ..." /></div>;

    if (practiceMode && selectedLesson) {
      return (
        <div className="max-w-md md:max-w-2xl mx-auto p-4">
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
        </div>
      );
    }

    if (currentWord) {
      return (
        <div className="w-full max-w-md md:max-w-2xl mx-auto flex flex-col">
            <header className="w-full grid grid-cols-3 items-center p-4">
                <div className="justify-self-start">
                    <button onClick={backToLessonSelector} className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-semibold text-lg">
                        HSK {selectedLevel} <ChevronDownIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="justify-self-center">
                    <PlusLogo />
                </div>
                <div className="justify-self-end relative">
                    <BellIcon className="w-7 h-7 text-gray-500 dark:text-gray-400" />
                    <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
                </div>
            </header>
            <main className="w-full flex-grow p-4">
                <div
                    className="w-full h-64 md:h-80 [perspective:1000px] cursor-pointer"
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    role="button"
                    tabIndex={0}
                    aria-live="polite"
                    aria-label={isCardFlipped ? `Back: ${currentWord.pinyin}, ${currentWord.translation}` : `Front: ${currentWord.character}, tap to reveal.`}
                >
                    <div className={`relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${isCardFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                        {/* Front Face */}
                        <div className="absolute w-full h-full bg-blue-600 rounded-2xl p-6 text-white text-center shadow-lg flex flex-col justify-center [backface-visibility:hidden]">
                            <h1 className="text-7xl md:text-9xl font-bold font-sans">{currentWord.character}</h1>
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                                <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="bg-green-500/80 rounded-full p-2 hover:bg-green-500 transition-transform hover:scale-110 active:scale-95" aria-label="Previous word"><ArrowLeftIcon className="w-6 h-6" /></button>
                                <div>
                                    <p className="font-semibold">{currentIndex + 1} / {vocabulary.length}</p>
                                    <p className="text-sm text-blue-200">ແຕະເພື່ອເປີດເຜີຍ</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="bg-green-500/80 rounded-full p-2 hover:bg-green-500 transition-transform hover:scale-110 active:scale-95" aria-label="Next word"><ArrowRightIcon className="w-6 h-6" /></button>
                            </div>
                        </div>
                        
                        {/* Back Face */}
                        <div className="absolute w-full h-full bg-blue-600 rounded-2xl p-6 text-white text-center shadow-lg flex flex-col justify-center items-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                             <div className="space-y-4">
                                <p className="text-4xl md:text-5xl font-semibold tracking-wide">{currentWord.pinyin}</p>
                                <p className="text-3xl md:text-4xl font-medium">{currentWord.translation}</p>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                                <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="bg-green-500/80 rounded-full p-2 hover:bg-green-500 transition-transform hover:scale-110 active:scale-95" aria-label="Previous word"><ArrowLeftIcon className="w-6 h-6" /></button>
                                <div>
                                    <p className="font-semibold">{currentIndex + 1} / {vocabulary.length}</p>
                                    <p className="text-sm text-blue-200">ແຕະເພື່ອເຊື່ອງ</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="bg-green-500/80 rounded-full p-2 hover:bg-green-500 transition-transform hover:scale-110 active:scale-95" aria-label="Next word"><ArrowRightIcon className="w-6 h-6" /></button>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-8">
                    {practiceModes.map(({ mode, label, icon: Icon, isVipOnly }) => {
                        const isLocked = isVipOnly && selectedLevel && selectedLevel >= 2 && !currentUser?.isVip;
                        return (
                            <button
                                key={mode}
                                onClick={() => isLocked ? handleVipLockClick() : handlePracticeSelect(mode as PracticeMode)}
                                className="relative bg-blue-100/70 dark:bg-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2 aspect-square transition-transform shadow-sm hover:shadow-lg data-[locked=true]:hover:shadow-sm data-[locked=true]:hover:-translate-y-0 hover:-translate-y-1"
                                data-locked={isLocked}
                                aria-label={isLocked ? `${label} (ຕ້ອງການ VIP)` : label}
                            >
                                <Icon className={`w-10 h-10 md:w-12 md:h-12 text-slate-800 dark:text-slate-200 mb-1 ${isLocked ? 'opacity-30' : ''}`} />
                                <span className={`text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300 leading-tight ${isLocked ? 'opacity-50' : ''}`}>{label}</span>
                                {isLocked && (
                                    <div className="absolute inset-0 bg-black/20 dark:bg-black/40 rounded-2xl flex items-center justify-center">
                                        <CrownIcon className="w-9 h-9 text-yellow-400 opacity-90" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </main>
        </div>
      );
    }

    return <p className="text-slate-500 dark:text-slate-400 text-center p-4">ບໍ່ມີຄຳສັບໃນບົດຮຽນນີ້.</p>;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-slate-900 font-sans antialiased">
      {showCameraView && <CameraView onClose={handleCloseCamera} />}
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
      {showProfilePage && currentUser && !currentUser.isAdmin && (
        <ProfilePage
            user={currentUser}
            onClose={() => setShowProfilePage(false)}
            onUpdatePassword={handleUpdatePassword}
            onDeregisterDevice={handleDeregisterDevice}
            currentDeviceId={getDeviceId()}
            onLogout={handleLogout}
        />
      )}
      {showVipPage && (
        <VIPPage 
            onClose={() => setShowVipPage(false)} 
            onPurchaseClick={() => {
              setShowVipPage(false);
              setShowQRCodePage(true);
            }}
            onShowTutorial={() => setShowVipTutorial(true)}
        />
      )}
      {showVipTutorial && <VipTutorial onClose={() => setShowVipTutorial(false)} />}
      {showQRCodePage && <QRCodePage onClose={() => setShowQRCodePage(false)} />}

      <main className="pb-24 px-2 sm:px-0">
        {renderMainContent()}
      </main>

       {currentUser && !currentUser.isAdmin && (
          <footer className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-700 z-40">
                <div className="w-full h-full max-w-md mx-auto flex justify-around items-center">
                    <button onClick={resetApp} className="flex flex-col items-center justify-center text-black dark:text-white">
                        <HomeIcon className="w-7 h-7" />
                    </button>
                    <button onClick={() => setShowProfilePage(true)} className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <UserIcon className="w-7 h-7" />
                    </button>
                </div>
            </footer>
        )}
    </div>
  );
};

export default App;
