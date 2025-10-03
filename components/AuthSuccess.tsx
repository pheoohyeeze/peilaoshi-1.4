import React from 'react';
import type { User } from '../types';
import { CheckCircleIcon } from './IconComponents';

interface AuthSuccessProps {
    user: User;
    onContinue: () => void;
}

const AuthSuccess: React.FC<AuthSuccessProps> = ({ user, onContinue }) => {
    return (
        <div className="w-full max-w-md mx-auto p-8 bg-slate-800 rounded-2xl shadow-2xl flex flex-col items-center text-center animate-fade-in">
            <CheckCircleIcon className="w-20 h-20 text-brand-primary mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">ສຳເລັດ!</h2>
            <p className="text-lg text-slate-300 mb-6">ຍິນດີຕ້ອນຮັບ, <span className="font-semibold text-brand-light">{user.username}</span>!</p>
            <button
                onClick={onContinue}
                className="w-full py-3 text-lg font-semibold text-white bg-brand-primary rounded-lg transition-all duration-300 ease-in-out hover:bg-brand-secondary focus:outline-none focus:ring-4 focus:ring-brand-secondary focus:ring-opacity-50"
            >
                ເລີ່ມການຮຽນຮູ້
            </button>
        </div>
    );
};

export default AuthSuccess;