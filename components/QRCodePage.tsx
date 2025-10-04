import React, { useState } from 'react';
import { XCircleIcon } from './IconComponents';

const QRCodePage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copySuccess, setCopySuccess] = useState('');

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(`ສຳເນົາ ${name} ID/Link ສຳເລັດ!`);
      setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
      setCopySuccess('ສຳເນົາບໍ່ສຳເລັດ.');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const weixinQr = '/image/weixin.jpg';
  const whatsappQr = '/image/whatsapp.jpg';
  const weixinId = 'HSK1-6';
  const whatsappId = '+856 20 96 473 810';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          aria-label="Close"
        >
          <XCircleIcon className="w-8 h-8" />
        </button>

        <h1 className="text-center text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
          ສະແກນເພື່ອເຂົ້າກຸ່ມ
        </h1>

        <div className="space-y-8">
          {/* WeChat Section */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">WeChat</h2>
            <a href={weixinQr} download="weixin_qr.jpg" className="inline-block p-4 bg-white rounded-lg shadow-md border border-gray-100 dark:border-slate-700">
              <img src={weixinQr} alt="WeChat QR Code" className="w-48 h-48 mx-auto" />
            </a>
            <div className="mt-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">WeChat ID:</p>
              <div 
                onClick={() => copyToClipboard(weixinId, 'WeChat')}
                className="mt-1 inline-block w-full max-w-xs p-3 bg-gray-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                <p className="font-mono text-slate-800 dark:text-slate-200 break-words">{weixinId}</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Section */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">WhatsApp</h2>
            <a href={whatsappQr} download="whatsapp_qr.jpg" className="inline-block p-4 bg-white rounded-lg shadow-md border border-gray-100 dark:border-slate-700">
              <img src={whatsappQr} alt="WhatsApp QR Code" className="w-48 h-48 mx-auto" />
            </a>
            <div className="mt-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">WhatsApp Link:</p>
              <div 
                onClick={() => copyToClipboard(whatsappId, 'WhatsApp')}
                className="mt-1 inline-block w-full max-w-xs p-3 bg-gray-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                <p className="font-mono text-slate-800 dark:text-slate-200 break-words">{whatsappId}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          ກົດທີ່ ID/Link ເພື່ອສຳເນົາ | ກົດທີ່ QR Code ເພື່ອບັນທຶກ
        </p>

        {copySuccess && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm py-2 px-4 rounded-full transition-opacity duration-300">
            {copySuccess}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodePage;