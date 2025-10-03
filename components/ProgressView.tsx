import React, { useMemo } from 'react';
import type { HSKLevel, ProgressData, VocabularyWord } from '../types';
import { MAX_MASTERY_SCORE } from '../services/progressService';
import { XCircleIcon } from './IconComponents';

interface ProgressViewProps {
  level: HSKLevel;
  onClose: () => void;
  progress: ProgressData;
  allWordsForLevel: VocabularyWord[];
}

const ProgressView: React.FC<ProgressViewProps> = ({ level, onClose, progress, allWordsForLevel }) => {

  const stats = useMemo(() => {
    const total = allWordsForLevel.length;
    let mastered = 0;
    let learning = 0;
    let struggling: VocabularyWord[] = [];

    allWordsForLevel.forEach(word => {
      const wordProgress = progress[word.character];
      if (wordProgress) {
        if (wordProgress.score >= MAX_MASTERY_SCORE) {
          mastered++;
        } else if (wordProgress.score > 0) {
          learning++;
          if (wordProgress.score <= 1) {
            struggling.push(word);
          }
        } else { // score is 0
          struggling.push(word);
        }
      }
    });
    
    const newWords = total - (mastered + learning);

    return { total, mastered, learning, newWords, struggling };
  }, [progress, allWordsForLevel]);

  const StatCard: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
    <div className={`p-4 rounded-lg text-center ${color}`}>
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg animate-fade-in transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ສະຫຼຸບຄວາມຄືບໜ້າ HSK {level}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
            <XCircleIcon className="w-8 h-8"/>
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard value={stats.total} label="ຄຳສັບທັງໝົດ" color="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200" />
            <StatCard value={stats.mastered} label=" mastered " color="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300" />
            <StatCard value={stats.learning} label=" learning " color="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" />
            <StatCard value={stats.newWords} label=" ຄຳສັບໃໝ່ " color="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">ຄຳສັບທີ່ຕ້ອງທົບທວນ ( {stats.struggling.length} )</h3>
            {stats.struggling.length > 0 ? (
              <div className="max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                  {stats.struggling.map(word => (
                    <li key={word.character} className="py-2">
                      <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">{word.character} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({word.pinyin})</span></p>
                      <p className="text-slate-600 dark:text-slate-300">{word.translation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-slate-500 dark:text-slate-400">
                ເກັ່ງຫຼາຍ! ບໍ່ມີຄຳສັບທີ່ຕ້ອງທົບທວນໃນຕອນນີ້.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
