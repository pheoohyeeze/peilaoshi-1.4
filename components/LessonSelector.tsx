import React from 'react';
import type { HSKLevel, ProgressData } from '../types';
import { getNumberOfLessons, getTotalWordsForLevel } from '../services/geminiService';
import { HSK_VOCABULARY } from '../data/hsk-vocabulary';
import { ArrowLeftIcon, LockClosedIcon } from './IconComponents';
import type { User } from '../services/adminService';

type CurrentUser = (Omit<User, 'password'> & { isAdmin: boolean }) | null;

interface LessonSelectorProps {
  level: HSKLevel;
  onSelectLesson: (lesson: number) => void;
  onBack: () => void;
  progress: ProgressData;
  currentUser: CurrentUser;
  onVipLockClick: () => void;
}

const LessonSelector: React.FC<LessonSelectorProps> = ({ level, onSelectLesson, onBack, progress, currentUser, onVipLockClick }) => {
  const numberOfLessons = getNumberOfLessons(level);
  const totalWords = getTotalWordsForLevel(level);
  const lessons = Array.from({ length: numberOfLessons }, (_, i) => i + 1);

  const levelWords = HSK_VOCABULARY[level] || [];
  const learnedCount = levelWords.filter(word => (progress[word.character]?.score ?? 0) > 0).length;
  
  const midpoint = Math.ceil(numberOfLessons / 2);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 m-4 animate-fade-in text-slate-800 dark:text-slate-200">
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-5xl font-bold text-white">A</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">HSK ລະດັບ {level} ເພີ່ມຄຳສັບໃໝ່ ({totalWords})</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                    <span className="font-sans font-bold text-blue-500 text-lg">A</span> {learnedCount}/{totalWords}
                </span>
                <span className="flex items-center gap-1">
                    <span role="img" aria-label="star">⭐</span> 0/0
                </span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-md">K</span>
            <h3 className="font-semibold text-slate-600 dark:text-slate-300">ຄຳສັບທີ່ພบบ่อยในข้อสอบ</h3>
        </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
        {lessons.map((lesson) => {
          const isVipRequired = level >= 2 && lesson > midpoint;
          const isLocked = isVipRequired && !currentUser?.isVip;
          
          const handleLessonClick = () => {
            if (isLocked) {
              onVipLockClick();
            } else {
              onSelectLesson(lesson);
            }
          };

          return (
            <button
              key={lesson}
              onClick={handleLessonClick}
              className={`relative aspect-square flex items-center justify-center text-xl sm:text-2xl font-bold rounded-2xl transition-all duration-300 ease-in-out shadow-sm ${
                isLocked
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-pointer'
                    : 'bg-blue-100 dark:bg-slate-700/80 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-slate-600 transform hover:-translate-y-1'
              }`}
              aria-disabled={isLocked}
            >
              <span className="absolute top-1.5 right-1.5 bg-blue-200 text-blue-600 dark:bg-slate-600 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded">K</span>
              <span>{lesson}</span>
              {isLocked && (
                <div className="absolute bottom-1.5 right-1.5">
                    <LockClosedIcon className="w-5 h-5 text-yellow-500 opacity-80" />
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
