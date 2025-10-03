import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/dataService';
import type { User } from '../types';
import { UserCircleIcon, EnvelopeIcon, DevicePhoneMobileIcon, LockClosedIcon } from './IconComponents';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

interface InputFieldProps {
  name: string;
  type: string;
  placeholder: string;
  value: string;
  icon: React.ReactNode;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ name, type, placeholder, value, icon, onChange }) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            {icon}
        </span>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required
            className="w-full py-3 pl-10 pr-4 text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
        />
    </div>
);

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    username: '', phone: '', email: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.username.toLowerCase() === 'peilaoshi' || formData.username.toLowerCase() === 'admin') {
      setError("ຊື່ບັນຊີນີ້ຖືກສະຫງວນໄວ້.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("ລະຫັດຜ່ານບໍ່ຕົງກັນ.");
      return;
    }

    if (!formData.username || !formData.email || !formData.phone || !formData.password) {
        setError("ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບຖ້ວນ.");
        return;
    }
    
    setIsLoading(true);
    try {
        const newUser = await registerUser({
            username: formData.username,
            phone: formData.phone,
            email: formData.email,
            password: formData.password
        });
        onLoginSuccess(newUser);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
      try {
          const user = await loginUser(formData.username, formData.password);
          if (user) {
            onLoginSuccess(user);
          } else {
            throw new Error("ຊື່ບັນຊີ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ.");
          }
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
          setIsLoading(false);
      }
  };

  const resetFormState = () => {
    setFormData({ username: '', phone: '', email: '', password: '', confirmPassword: '' });
    setError(null);
    setIsLoading(false);
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-8 bg-slate-800 rounded-2xl shadow-2xl">
        <div className="animate-fade-in">
          <h2 className="text-3xl font-bold text-center text-white mb-6">
            {authMode === 'login' ? 'ເຂົ້າສູ່ລະບົບ' : 'ລົງທະບຽນ'}
          </h2>
          
          <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegistrationSubmit} className="space-y-4">
            {authMode === 'login' && (
              <InputField 
                onChange={handleInputChange} 
                name="username" 
                type="text" 
                placeholder="ຊື່ບັນຊີ, ອີເມວ, ຫຼື ເບີໂທ" 
                value={formData.username} 
                icon={<UserCircleIcon className="w-5 h-5"/>}
              />
            )}
            
            {authMode === 'register' && (
              <>
                <InputField onChange={handleInputChange} name="username" type="text" placeholder="ຊື່ບັນຊີ" value={formData.username} icon={<UserCircleIcon className="w-5 h-5"/>}/>
                <InputField onChange={handleInputChange} name="email" type="email" placeholder="ອີເມວ" value={formData.email} icon={<EnvelopeIcon className="w-5 h-5"/>}/>
                <InputField onChange={handleInputChange} name="phone" type="tel" placeholder="ເບີໂທລະສັບ" value={formData.phone} icon={<DevicePhoneMobileIcon className="w-5 h-5"/>}/>
              </>
            )}
            
            <InputField onChange={handleInputChange} name="password" type="password" placeholder="ລະຫັດຜ່ານ" value={formData.password} icon={<LockClosedIcon className="w-5 h-5"/>}/>
            
            {authMode === 'register' && (
                <InputField onChange={handleInputChange} name="confirmPassword" type="password" placeholder="ຢືນຢັນລະຫັດຜ່ານ" value={formData.confirmPassword} icon={<LockClosedIcon className="w-5 h-5"/>}/>
            )}

            {error && <p className="text-red-400 text-sm text-center bg-red-900/50 p-2 rounded-md">{error}</p>}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-lg font-semibold text-white bg-brand-primary rounded-lg transition-all duration-300 ease-in-out hover:bg-brand-secondary focus:outline-none focus:ring-4 focus:ring-brand-secondary focus:ring-opacity-50 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ກຳລັງດຳເນີນການ...' : (authMode === 'login' ? 'ເຂົ້າສູ່ລະບົບ' : 'ລົງທະບຽນ')}
            </button>
          </form>
          
          <p className="text-center text-slate-400 mt-6">
            {authMode === 'login' ? 'ບໍ່ມີບັນຊີ?' : 'ມີບັນຊີແລ້ວ?'}
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                resetFormState();
              }}
              className="ml-2 font-semibold text-brand-primary hover:text-brand-light transition"
            >
              {authMode === 'login' ? 'ລົງທະບຽນ' : 'ເຂົ້າສູ່ລະບົບ'}
            </button>
          </p>
        </div>
    </div>
  );
};

export default AuthPage;