import React from 'react';
import { XCircleIcon } from './IconComponents';

interface VIPPageProps {
  onClose: () => void;
  onPurchaseClick: () => void;
}

const VIPPage: React.FC<VIPPageProps> = ({ onClose, onPurchaseClick }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-teal-400 to-teal-600 p-6 pt-12 text-white shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <XCircleIcon className="w-8 h-8" />
        </button>

        <h1 className="text-center text-3xl font-bold mb-6" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
          ຜູ້ໃຊ້ VIP
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Membership Type */}
          <div className="bg-cyan-100/80 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center gap-4 shadow-lg">
            <h2 className="bg-teal-500 text-white font-bold py-2 px-6 rounded-full w-full text-center shadow-md">
              ປະເພດVIP
            </h2>
            <div className="bg-white text-gray-800 font-semibold py-3 px-5 rounded-full shadow-md w-full text-center">
              VIP 3 ເດືອນ
            </div>
            <div className="bg-white text-gray-800 font-semibold py-3 px-5 rounded-full shadow-md w-full text-center">
              150.000 ກິບ ແຖມໄຟລ໌ປື້ມແບບຮຽນຄົບຊຸດໜື່ງລະດັບ
            </div>
            <div className="bg-white text-gray-800 font-semibold py-3 px-5 rounded-full shadow-md w-full text-center">
              VIP 1 ປີ
            </div>
            <div className="bg-white text-gray-800 font-semibold py-3 px-5 rounded-full shadow-md w-full text-center">
              480.000 ກິບ ແຖມໄຟລ໌ປື້ມແບບຮຽນຄົບຊຸດໜື່ງລະດັບ
            </div>
          </div>

          {/* Activation Conditions */}
          <div className="bg-cyan-100/80 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center gap-4 shadow-lg">
            <h2 className="bg-teal-600 text-white font-bold py-2 px-6 rounded-full w-full text-center shadow-md">
              ໂປຣໂມຊັ່ນພິເສດ
            </h2>
            <div className="bg-white text-gray-800 font-semibold py-3 px-5 rounded-full shadow-md w-full text-center leading-tight">
              ສັ່ງຊື້ປື້ມແບບຮຽນຄົບຊຸດລະດັບໃດໜື່ງ HSK1-6
            </div>
            
            <div className="bg-white text-gray-800 font-semibold py-3 px-5 rounded-full shadow-md w-full text-center leading-tight">
              ສັ່ງຊື້ປື້ມຄຳສັບລະດັບໃດໜື່ງ HSK-6
            </div>
            <div className="bg-white text-gray-800 font-semibold py-3 px-5 rounded-full shadow-md w-full text-center leading-tight">
              ປົດລ໊ອກVIPໍ 1 ເດືອນ
            </div>
          </div>
          
        </div>

        {/* Discount */}
        <div className="text-center mb-8">
          <p
            className="text-5xl font-bold text-lime-400"
            style={{
                textShadow: `
                    -1.5px -1.5px 0 #facc15,  
                     1.5px -1.5px 0 #facc15,
                    -1.5px  1.5px 0 #facc15,
                     1.5px  1.5px 0 #facc15,
                     3px 3px 5px rgba(0,0,0,0.3)`
            }}
          >
            ສ່ວນຫຼຸດ-60%
          </p>
        </div>

        {/* Purchase Button */}
        <div className="text-center">
          <button
            className="w-full max-w-xs mx-auto py-4 text-2xl font-bold text-gray-800 bg-gradient-to-b from-yellow-300 to-amber-400 rounded-full shadow-lg transform hover:scale-105 transition-transform"
            onClick={onPurchaseClick}
          >
            ກົດສັ່ງຊື້
          </button>
        </div>
      </div>
    </div>
  );
};

export default VIPPage;