import React from 'react';
import type { HSKLevel } from '../types';
import { HSK_LEVELS } from '../constants';

interface HSKLevelSelectorProps {
  onSelectLevel: (level: HSKLevel) => void;
}

const HSKLevelSelector: React.FC<HSKLevelSelectorProps> = ({ onSelectLevel }) => {
  return (
    <div className="px-4">
      <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-2">ເລືອກລະດັບ HSK</h2>
      <p className="text-center text-slate-500 dark:text-slate-400 mb-6">ເລືອກລະດັບເພື່ອເລີ່ມການຝຶກຄຳສັບຂອງທ່ານ.</p>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {HSK_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => onSelectLevel(level)}
            className="aspect-square flex items-center justify-center text-2xl md:text-3xl font-bold text-blue-600 bg-blue-100 dark:bg-slate-700/50 rounded-3xl shadow-sm transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 dark:text-blue-300 dark:hover:bg-slate-700"
          >
            {`HSK ${level}`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HSKLevelSelector;
