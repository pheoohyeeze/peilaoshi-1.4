import React from 'react';

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
      <p className="text-lg text-slate-300">{message}</p>
       <p className="text-sm text-slate-500">ອາດຈະໃຊ້ເວລາຈັກຄາວ...</p>
    </div>
  );
};

export default LoadingSpinner;