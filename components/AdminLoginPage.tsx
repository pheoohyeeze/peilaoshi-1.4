import React, { useState } from 'react';
import type { User } from '../types';
import { loginUser } from '../services/dataService';
import { ArrowUturnLeftIcon, UserCircleIcon, LockClosedIcon, Cog6ToothIcon } from './IconComponents';

interface AdminLoginPageProps {
  onAdminLoginSuccess: (user: User) => void;
  onBack: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAdminLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Ensure only the designated admin username can attempt login from this page.
      if (username !== 'peilaoshi') {
          throw new Error("ຊື່ບັນຊີຜູ້ເບິ່ງແຍງລະບົບບໍ່ຖືກຕ້ອງ.");
      }
      
      const user = await loginUser(username, password);
      
      if (user && user.username === 'peilaoshi') {
        onAdminLoginSuccess(user);
      } else {
        throw new Error("ຊື່ບັນຊີ ຫຼື ລະຫັດຜ່ານຜູ້ເບິ່ງແຍງລະບົບບໍ່ຖືກຕ້ອງ.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-slate-800 rounded-2xl shadow-2xl animate-fade-in">
        <div className="relative flex items-center justify-center mb-6">
            <button onClick={onBack} className="absolute left-0 p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="ກັບຄືນ">
                <ArrowUturnLeftIcon className="w-6 h-6 text-slate-400" />
            </button>
            <Cog6ToothIcon className="w-8 h-8 text-slate-500 mr-2" />
            <h2 className="text-3xl font-bold text-white">ລະບົບຜູ້ເບິ່ງແຍງ</h2>
        </div>
      
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <UserCircleIcon className="w-5 h-5"/>
            </span>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ຊື່ບັນຊີຜູ້ເບິ່ງແຍງ"
                required
                className="w-full py-3 pl-10 pr-4 text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
            />
        </div>

        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <LockClosedIcon className="w-5 h-5"/>
            </span>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ລະຫັດຜ່ານ"
                required
                className="w-full py-3 pl-10 pr-4 text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
            />
        </div>

        {error && <p className="text-red-400 text-sm text-center bg-red-900/50 p-2 rounded-md">{error}</p>}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 text-lg font-semibold text-white bg-brand-primary rounded-lg transition-all duration-300 ease-in-out hover:bg-brand-secondary focus:outline-none focus:ring-4 focus:ring-brand-secondary/50 disabled:bg-slate-600"
        >
          {isLoading ? 'ກຳລັງເຂົ້າສູ່ລະບົບ...' : 'ເຂົ້າສູ່ລະບົບ'}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;