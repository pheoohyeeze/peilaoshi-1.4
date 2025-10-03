import React from 'react';
import type { HSKLevel, ProgressData, VocabularyWord } from '../types';
import { getNumberOfLessons, getTotalWordsForLevel } from '../services/geminiService';
import { HSK_VOCABULARY } from '../data/hsk-vocabulary';
import { WORDS_PER_LESSON } from '../constants';
import { MAX_MASTERY_SCORE } from '../services/progressService';
import { ArrowLeftIcon, LockClosedIcon } from './IconComponents';
import type { User } from '../services/adminService';

type CurrentUser = (Omit<User, 'password'> & { isAdmin: boolean }) | null;

interface LessonSelectorProps {
  level: HSKLevel;
  onSelectLesson: (lesson: number) => void;
  onBack: () => void;
  progress: ProgressData;
  currentUser: CurrentUser;
}

const getWordsForLesson = (level: HSKLevel, lesson: number): VocabularyWord[] => {
    const wordsForLevel = HSK_VOCABULARY[level] || [];
    const startIndex = (lesson - 1) * WORDS_PER_LESSON;
    const endIndex = startIndex + WORDS_PER_LESSON;
    return wordsForLevel.slice(startIndex, endIndex);
};


const LessonSelector: React.FC<LessonSelectorProps> = ({ level, onSelectLesson, onBack, progress, currentUser }) => {
  const numberOfLessons = getNumberOfLessons(level);
  const totalWords = getTotalWordsForLevel(level);
  const lessons = Array.from({ length: numberOfLessons }, (_, i) => i + 1);

  const levelWords = HSK_VOCABULARY[level] || [];
  const learnedCount = levelWords.filter(word => (progress[word.character]?.score ?? 0) > 0).length;
  
  const midpoint = Math.ceil(numberOfLessons / 2);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-fade-in text-slate-800 dark:text-slate-200">
      <div className="relative mb-4">
        <button 
            onClick={onBack} 
            className="absolute top-0 left-0 -mt-2 -ml-2 sm:mt-0 sm:ml-0 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors" 
            aria-label="ກັບໄປ"
        >
            <ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-700/50 rounded-xl mb-6 p-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-brand-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-4xl font-bold text-white">A</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">HSK ລະດັບ {level} ເພີ່ມຄຳສັບໃໝ່ ({totalWords})</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span>
                    <span className="font-sans font-bold text-brand-primary">A</span> {learnedCount}/{totalWords}
                </span>
                <span>
                    <span role="img" aria-label="star">⭐</span> 0/0
                </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-md">K</span>
        <h3 className="font-semibold text-slate-600 dark:text-slate-300">ຄຳສັບທີ່ພบบ่อยในข้อสอบ</h3>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {lessons.map((lesson) => {
          const lessonWords = getWordsForLesson(level, lesson);
          const masteredCount = lessonWords.filter(word => (progress[word.character]?.score ?? 0) >= MAX_MASTERY_SCORE).length;
          const totalInLesson = lessonWords.length > 0 ? lessonWords.length : 1;
          const masteryPercentage = (masteredCount / totalInLesson) * 100;
          
          const isVipRequired = level >= 4 && lesson > midpoint;
          const isLocked = isVipRequired && !currentUser?.isVip;
          
          const handleLessonClick = () => {
            if (isLocked) {
              alert('ຜູ້ໃຊ້vipເທົ່ານັ້ນຈື່ງໃຊ້ໄດ້. ທ່ານສາມາດອັບເກັດVIP ຫຼື ສັ່ງປື້ມແບບຮຽນເພື່ອປົດລ໊ອກVIP');
            } else {
              onSelectLesson(lesson);
            }
          };

          return (
            <button
              key={lesson}
              onClick={handleLessonClick}
              className={`relative aspect-square flex flex-col items-center justify-center p-2 text-2xl font-bold rounded-xl transition-all duration-300 ease-in-out overflow-hidden ${
                isLocked
                    ? 'bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-70 cursor-pointer'
                    : 'text-brand-primary dark:text-blue-400 bg-blue-100 border-2 border-blue-200 dark:bg-slate-700 dark:border-slate-600 hover:bg-blue-200 hover:border-blue-400 dark:hover:bg-slate-600 dark:hover:border-blue-500 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50'
              }`}
              aria-disabled={isLocked}
            >
              <span className="absolute top-1 right-1 bg-blue-200 text-blue-500 dark:bg-slate-600 dark:text-blue-400 text-[10px] font-bold px-1 rounded-sm z-10">K</span>
              <span>{lesson}</span>
              {!isLocked && (
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-blue-200 dark:bg-slate-600">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${masteryPercentage}%` }}
                  ></div>
                </div>
              )}
               {isLocked && (
                    <div className="absolute top-1 right-1 flex items-center gap-1">
                        <span className="font-bold text-blue-500 dark:text-blue-400 text-xs">VIP</span>
                        <LockClosedIcon className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                    </div>
                )}
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default LessonSelector;