import React from 'react';
import type { HSKLevel } from '../types';
import { HSK_LEVELS } from '../constants';

interface HSKLevelSelectorProps {
  onSelectLevel: (level: HSKLevel) => void;
}

const HSKLevelSelector: React.FC<HSKLevelSelectorProps> = ({ onSelectLevel }) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-slate-800 rounded-2xl shadow-2xl">
      <h2 className="text-3xl font-bold text-center text-white mb-2">ເລືອກລະດັບ HSK</h2>
      <p className="text-center text-slate-400 mb-8">ເລືອກລະດັບເພື່ອເລີ່ມການຝຶກຄຳສັບຂອງທ່ານ.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {HSK_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => onSelectLevel(level)}
            className="group relative flex items-center justify-center p-6 text-xl font-semibold text-white bg-slate-700 rounded-lg transition-all duration-300 ease-in-out hover:bg-brand-primary hover:shadow-lg hover:shadow-brand-primary/30 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-brand-secondary focus:ring-opacity-50"
          >
            <span className="z-10">{`HSK ${level}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HSKLevelSelector;