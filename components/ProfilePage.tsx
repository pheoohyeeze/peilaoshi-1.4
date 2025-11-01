import React, { useState } from 'react';
import type { User } from '../services/adminService';
import { 
    XCircleIcon, LockClosedIcon, UserIcon, EnvelopeIcon, PhoneIcon, CrownIcon, DevicePhoneMobileIcon, TrashIcon,
    ArrowRightOnRectangleIcon
} from './IconComponents';

type CurrentUser = (Omit<User, 'password'> & { isAdmin: boolean; });

interface ProfilePageProps {
  user: CurrentUser;
  onClose: () => void;
  onLogout: () => void;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string; }>;
  onDeregisterDevice: (deviceId: string) => void;
  currentDeviceId: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onClose, onLogout, onUpdatePassword, onDeregisterDevice, currentDeviceId }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບຖ້ວນ.');
      setIsError(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('ລະຫັດຜ່ານໃໝ່ບໍ່ຕົງກັນ.');
      setIsError(true);
      return;
    }

    setIsSubmitting(true);
    const result = await onUpdatePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    setMessage(result.message);
    setIsError(!result.success);
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDeviceDeregisterClick = (deviceId: string) => {
      if (window.confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການອອກຈາກລະບົບຈາກອຸປະກອນນີ້?')) {
          onDeregisterDevice(deviceId);
      }
  };

  const InfoItem: React.FC<{ icon: React.FC<{className?: string}>, label: string, value: string | undefined }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 py-3">
        <Icon className="w-6 h-6 text-slate-400 flex-shrink-0" />
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">{value || '-'}</p>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg animate-fade-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ໂປຣໄຟລ໌ຜູ້ໃຊ້</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><XCircleIcon className="w-8 h-8"/></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
            {/* User Info Section */}
            <div>
                <h3 className="text-lg font-semibold text-brand-primary mb-2">ຂໍ້ມູນສ່ວນຕົວ</h3>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    <InfoItem icon={UserIcon} label="ຊື່ຜູ້ໃຊ້" value={user.username} />
                    <InfoItem icon={EnvelopeIcon} label="ອີເມວ" value={user.email} />
                    <InfoItem icon={PhoneIcon} label="ເບີໂທລະສັບ" value={user.phone} />
                    {user.isVip && (
                        <div className="flex items-center gap-4 py-3">
                            <CrownIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">ສະຖານະ VIP</p>
                                <p className="font-semibold text-yellow-500">ສະມາຊິກ VIP ໝົດອາຍຸວັນທີ: {user.vipExpiryDate}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Registered Devices Section */}
            <div>
                 <h3 className="text-lg font-semibold text-brand-primary mb-2">ອຸປະກອນທີ່ເຂົ້າສູ່ລະບົບ</h3>
                 <div className="space-y-2">
                    {user.devices && user.devices.length > 0 ? user.devices.map(device => (
                         <div key={device.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <DevicePhoneMobileIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {device.id === currentDeviceId ? `${device.id.substring(0, 10)}... (ອຸປະກອນນີ້)` : `${device.id.substring(0, 10)}...`}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        ເຂົ້າສູ່ລະບົບຄັ້ງສຸດທ້າຍ: {new Date(device.lastLogin).toLocaleString('lo-LA')}
                                    </p>
                                </div>
                            </div>
                            {device.id !== currentDeviceId && (
                                <button onClick={() => handleDeviceDeregisterClick(device.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400">
                                    <TrashIcon className="w-4 h-4" />
                                    <span>ອອກຈາກລະບົບ</span>
                                </button>
                            )}
                         </div>
                    )) : <p className="text-slate-500 dark:text-slate-400">ບໍ່ມີຂໍ້ມູນອຸປະກອນ.</p>}
                 </div>
            </div>

            {/* Password Change Section */}
            <div>
                <h3 className="text-lg font-semibold text-brand-primary mb-4">ປ່ຽນລະຫັດຜ່ານ</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    {message && (
                        <div className={`p-3 rounded-md text-sm text-center ${isError ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300'}`}>{message}</div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ລະຫັດຜ່ານປັດຈຸບັນ</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ລະຫັດຜ່ານໃໝ່</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" required />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ຢືນຢັນລະຫັດຜ່ານໃໝ່</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" required />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full py-2 px-4 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:bg-slate-400">
                        {isSubmitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການປ່ຽນແປງ'}
                    </button>
                </form>
            </div>
             {/* Logout Section */}
            <div className="mt-4">
                 <button 
                    onClick={onLogout}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>ອອກຈາກລະບົບ</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;