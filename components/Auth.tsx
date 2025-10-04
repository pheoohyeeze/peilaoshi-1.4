import React, { useState } from 'react';
import { UserIcon, LockClosedIcon, EnvelopeIcon, PhoneIcon } from './IconComponents';
import { loginUser } from '../services/adminService';

interface AuthProps {
  onLoginSuccess: (username: string) => void;
}

const getDeviceId = () => {
    let deviceId = localStorage.getItem('hsk-device-id');
    if (!deviceId) {
        deviceId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        localStorage.setItem('hsk-device-id', deviceId);
    }
    return deviceId;
};

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [authMode, setAuthMode] = useState<'user' | 'admin'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password || !confirmPassword || !email || !phone) {
      setError('ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບຖ້ວນ.');
      return;
    }
    if (password !== confirmPassword) {
      setError('ລະຫັດຜ່ານບໍ່ຕົງກັນ.');
      return;
    }
     if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ.');
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('hsk-users') || '{}');
      
      if (users[username]) {
        setError('ຊື່ຜູ້ໃຊ້ນີ້ມີຢູ່ແລ້ວ.');
        return;
      }
      for (const key in users) {
          if (users[key].email === email) {
              setError('ອີເມວນີ້ຖືກໃຊ້ແລ້ວ.');
              return;
          }
          if (users[key].phone === phone) {
              setError('ເບີໂທນີ້ຖືກໃຊ້ແລ້ວ.');
              return;
          }
      }

      users[username] = { password, email, phone, devices: [] };
      localStorage.setItem('hsk-users', JSON.stringify(users));
      setSuccess('ລົງທະບຽນສຳເລັດ! ກະລຸນາເຂົ້າສູ່ລະບົບ.');
      setActiveTab('login');
      clearForm();
    } catch (err) {
      setError('ເກີດຂໍ້ຜິດພາດໃນການລົງທະບຽນ.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password) {
      setError('ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບຖ້ວນ.');
      return;
    }

    const deviceId = getDeviceId();
    const result = loginUser(username, password, deviceId);

    if (result.success) {
      onLoginSuccess(username);
    } else {
      setError(result.message || 'ເກີດຂໍ້ຜິດພາດໃນການເຂົ້າສູ່ລະບົບ.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (username === 'peilaoshi' && password === 'y33z3ph3o') {
      onLoginSuccess('peilaoshi');
    } else {
      setError('ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານຂອງຜູ້ດູແລລະບົບບໍ່ຖືກຕ້ອງ.');
    }
  };
  
  const clearForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setPhone('');
    setError('');
    // Do not clear success message so user can see it after tab switch
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label htmlFor="login-username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">ຊື່ຜູ້ໃຊ້</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="ໃສ່ຊື່ຜູ້ໃຊ້ຂອງທ່ານ"
          />
        </div>
      </div>
      <div>
        <label htmlFor="login-password"
               className="block text-sm font-medium text-slate-700 dark:text-slate-300">ລະຫັດຜ່ານ</label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LockClosedIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="ໃສ່ລະຫັດຜ່ານຂອງທ່ານ"
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary"
        >
          ເຂົ້າສູ່ລະບົບ
        </button>
      </div>
    </form>
  );
  
    const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label htmlFor="register-username"
               className="block text-sm font-medium text-slate-700 dark:text-slate-300">ຊື່ຜູ້ໃຊ້</label>
        <div className="mt-1 relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="register-username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
             placeholder="ເລືອກຊື່ຜູ້ໃຊ້"
          />
        </div>
      </div>
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">ອີເມວ</label>
        <div className="mt-1 relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="ໃສ່ອີເມວຂອງທ່ານ"
          />
        </div>
      </div>
       <div>
        <label htmlFor="register-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">ເບີໂທລະສັບ</label>
        <div className="mt-1 relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <PhoneIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="register-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="ໃສ່ເບີໂທລະສັບຂອງທ່ານ"
          />
        </div>
      </div>
      <div>
        <label htmlFor="register-password"
               className="block text-sm font-medium text-slate-700 dark:text-slate-300">ລະຫັດຜ່ານ</label>
        <div className="mt-1 relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LockClosedIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="ສ້າງລະຫັດຜ່ານ"
          />
        </div>
      </div>
      <div>
        <label htmlFor="confirm-password"
               className="block text-sm font-medium text-slate-700 dark:text-slate-300">ຢືນຢັນລະຫັດຜ່ານ</label>
        <div className="mt-1 relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LockClosedIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="ຢືນຢັນລະຫັດຜ່ານຂອງທ່ານ"
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary"
        >
          ລົງທະບຽນ
        </button>
      </div>
    </form>
  );

  const renderUserAuth = () => (
    <>
      <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6">
        <button
          onClick={() => { setActiveTab('login'); clearForm(); setSuccess(''); }}
          className={`w-1/2 py-4 text-center font-medium text-sm ${
            activeTab === 'login'
              ? 'border-b-2 border-brand-primary text-brand-primary dark:text-brand-light'
              : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          ເຂົ້າສູ່ລະບົບ
        </button>
        <button
          onClick={() => { setActiveTab('register'); clearForm(); setSuccess(''); }}
          className={`w-1/2 py-4 text-center font-medium text-sm ${
            activeTab === 'register'
              ? 'border-b-2 border-brand-primary text-brand-primary dark:text-brand-light'
              : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          ລົງທະບຽນ
        </button>
      </div>

      <div className="mb-4">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">
              {activeTab === 'login' ? 'ຍິນດີຕ້ອນຮັບກັບມາ!' : 'ສ້າງບັນຊີໃໝ່'}
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-2">
            {activeTab === 'login' ? 'ເຂົ້າສູ່ລະບົບເພື່ອສືບຕໍ່ການຮຽນຮູ້ຂອງທ່ານ.' : 'ເລີ່ມຕົ້ນການເດີນທາງຮຽນພາສາຈີນຂອງທ່ານ.'}
          </p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300 rounded-md text-center">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300 rounded-md text-center">{success}</div>}

      {activeTab === 'login' ? renderLoginForm() : renderRegisterForm()}
    </>
  );

  const renderAdminLogin = () => (
    <>
        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-6">ເຂົ້າສູ່ລະບົບຜູ້ດູແລລະບົບ</h2>
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300 rounded-md text-center">{error}</div>}
        <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
                <label htmlFor="admin-username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">ຊື່ຜູ້ໃຊ້</label>
                <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-gray-400" /></div>
                    <input id="admin-username" type="password" required value={username} onChange={(e) => setUsername(e.target.value)} className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="ໃສ່ຊື່ຜູ້ໃຊ້" />
                </div>
            </div>
            <div>
                <label htmlFor="admin-password"
                       className="block text-sm font-medium text-slate-700 dark:text-slate-300">ລະຫັດຜ່ານ</label>
                <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockClosedIcon className="h-5 w-5 text-gray-400" /></div>
                    <input id="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="ໃສ່ລະຫັດຜ່ານ" />
                </div>
            </div>
            <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary">
                    ເຂົ້າສູ່ລະບົບ
                </button>
            </div>
        </form>
    </>
  );

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-fade-in">
        {authMode === 'user' ? renderUserAuth() : renderAdminLogin()}
         <div className="text-center mt-6">
            <button 
                onClick={() => { setAuthMode(prev => prev === 'user' ? 'admin' : 'user'); clearForm(); setSuccess(''); }}
                className="text-sm font-medium text-brand-primary hover:text-brand-secondary dark:hover:text-brand-light"
            >
                {authMode === 'user' ? 'ເຂົ້າສູ່ລະບົບຜູ້ດູແລລະບົບ' : 'ກັບໄປໜ້າເຂົ້າສູ່ລະບົບຜູ້ໃຊ້'}
            </button>
        </div>
    </div>
  );
};

export default Auth;