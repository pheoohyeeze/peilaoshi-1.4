import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { updateUser } from '../services/dataService';
import { ArrowUturnLeftIcon, UserCircleIcon, EnvelopeIcon, DevicePhoneMobileIcon, PencilSquareIcon } from './IconComponents';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
}

interface ProfileFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  icon: React.ReactNode;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, name, type, value, icon, onChange, disabled }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                {icon}
            </span>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="w-full py-3 pl-10 pr-4 text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition disabled:bg-slate-800 disabled:text-slate-400"
            />
        </div>
    </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    phone: user.phone,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Reset form data if the user prop changes (e.g., re-login)
    setFormData({
      username: user.username,
      email: user.email,
      phone: user.phone,
    });
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSuccessMessage(null);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ // Revert changes
      username: user.username,
      email: user.email,
      phone: user.phone,
    });
    setError(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedUserData = {
          ...user,
          ...formData
      };

      const result = await updateUser(updatedUserData);
      onUpdateUser(result);
      setIsEditing(false);
      setSuccessMessage('ອັບເດດໂປຣໄຟລ໌ສຳເລັດແລ້ວ!');
      setTimeout(() => setSuccessMessage(null), 3000); // Clear message after 3 seconds

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during update.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-slate-800 rounded-2xl shadow-2xl animate-fade-in">
        <div className="relative flex items-center justify-center mb-6">
            <button onClick={onBack} className="absolute left-0 p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="ກັບຄືນ">
                <ArrowUturnLeftIcon className="w-6 h-6 text-slate-400" />
            </button>
            <h2 className="text-3xl font-bold text-white">ໂປຣໄຟລ໌ຜູ້ໃຊ້</h2>
        </div>

        <div className="space-y-4">
            <ProfileField 
                label="ຊື່ບັນຊີ"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                disabled={!isEditing}
                icon={<UserCircleIcon className="w-5 h-5"/>}
            />
            <ProfileField 
                label="ອີເມວ"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                icon={<EnvelopeIcon className="w-5 h-5"/>}
            />
            <ProfileField 
                label="ເບີໂທລະສັບ"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                icon={<DevicePhoneMobileIcon className="w-5 h-5"/>}
            />
        </div>
        
        {error && <p className="text-red-400 text-sm text-center bg-red-900/50 p-3 rounded-md mt-4">{error}</p>}
        {successMessage && <p className="text-green-400 text-sm text-center bg-green-900/50 p-3 rounded-md mt-4">{successMessage}</p>}

        <div className="mt-6 flex gap-4">
            {isEditing ? (
                <>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 py-3 text-lg font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary disabled:bg-slate-600 transition-colors"
                    >
                        {isLoading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="flex-1 py-3 text-lg font-semibold text-slate-300 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
                    >
                        ຍົກເລີກ
                    </button>
                </>
            ) : (
                <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center gap-2 py-3 text-lg font-semibold text-white bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                    <PencilSquareIcon className="w-5 h-5"/>
                    ແກ້ໄຂໂປຣໄຟລ໌
                </button>
            )}
        </div>
    </div>
  );
};

export default ProfilePage;