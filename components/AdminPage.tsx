import React, { useState } from 'react';
import type { User } from '../types';
import {
  ArrowUturnLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  UserCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  StarIcon,
  LockClosedIcon,
} from './IconComponents';

interface AdminPageProps {
  users: User[];
  currentUser: User;
  onUpdateUser: (user: User) => Promise<User>;
  onAddUser: (user: Omit<User, 'id'>) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
  onBack: () => void;
}

interface AddUserModalProps {
  onSave: (newUserData: Omit<User, 'id'>) => Promise<void>;
  onClose: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.username || !formData.email || !formData.phone || !formData.password) {
            setError("ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບຖ້ວນ.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 animate-fade-in">
            <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
                <h3 className="text-2xl font-bold text-white mb-4">ເພີ່ມຜູ້ໃຊ້ໃໝ່</h3>
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">ຊື່ບັນຊີ</label>
                        <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full py-2 px-3 text-white bg-slate-900 border border-slate-700 rounded-lg"/>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">ອີເມວ</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full py-2 px-3 text-white bg-slate-900 border border-slate-700 rounded-lg"/>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">ເບີໂທລະສັບ</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full py-2 px-3 text-white bg-slate-900 border border-slate-700 rounded-lg"/>
                     </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">ລະຫັດຜ່ານ</label>
                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full py-2 px-3 text-white bg-slate-900 border border-slate-700 rounded-lg"/>
                     </div>
                </div>
                {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
                <div className="flex gap-4 mt-6">
                    <button onClick={handleSave} disabled={isLoading} className="flex-1 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary">
                        {isLoading ? 'ກຳລັງເພີ່ມ...' : 'ເພີ່ມຜູ້ໃຊ້'}
                    </button>
                    <button onClick={onClose} disabled={isLoading} className="flex-1 py-2 bg-slate-600 text-slate-300 rounded-lg hover:bg-slate-500">
                        ຍົກເລີກ
                    </button>
                </div>
            </div>
        </div>
    );
};

interface EditUserModalProps {
  user: User;
  onSave: (updatedUserData: Partial<User>) => Promise<void>;
  onClose: () => void;
  isCurrentUser: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onSave, onClose, isCurrentUser }) => {
    const [formData, setFormData] = useState({
        username: user.username,
        email: user.email,
        phone: user.phone,
        password: '', // New password field
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const payload: Partial<User> = {
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
            };
            // Only include the password in the payload if it's not empty
            if (formData.password.trim()) {
                payload.password = formData.password;
            }
            await onSave(payload);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 animate-fade-in">
            <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
                <h3 className="text-2xl font-bold text-white mb-4">ແກ້ໄຂຜູ້ໃຊ້: {user.username}</h3>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-1">ຊື່ບັນຊີ</label>
                        <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full py-2 px-3 text-white bg-slate-900 border border-slate-700 rounded-lg"/>
                     </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">ອີເມວ</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full py-2 px-3 text-white bg-slate-900 border border-slate-700 rounded-lg"/>
                     </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-400 mb-1">ເບີໂທລະສັບ</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full py-2 px-3 text-white bg-slate-900 border border-slate-700 rounded-lg"/>
                     </div>
                     <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1">ລະຫັດຜ່ານໃໝ່ (ປະໄວ້ວ່າງເພື່ອບໍ່ປ່ຽນ)</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleInputChange} 
                            className="w-full py-2 px-3 text-white bg-slate-900 border border-slate-700 rounded-lg disabled:opacity-50"
                            placeholder={isCurrentUser ? "ບໍ່ສາມາດປ່ຽນລະຫັດຜ່ານຂອງຕົນເອງໄດ້ທີ່ນີ້" : ""}
                            disabled={isCurrentUser}
                        />
                     </div>
                </div>
                {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
                <div className="flex gap-4 mt-6">
                    <button onClick={handleSave} disabled={isLoading} className="flex-1 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary">
                        {isLoading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
                    </button>
                    <button onClick={onClose} disabled={isLoading} className="flex-1 py-2 bg-slate-600 text-slate-300 rounded-lg hover:bg-slate-500">
                        ຍົກເລີກ
                    </button>
                </div>
            </div>
        </div>
    );
};

interface VipToggleProps {
  isVip: boolean;
  onChange: () => void;
  disabled: boolean;
}
const VipToggle: React.FC<VipToggleProps> = ({ isVip, onChange, disabled }) => {
  const uniqueId = `vip-toggle-${React.useId()}`;
  return (
    <label htmlFor={uniqueId} className={`relative inline-flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input 
        id={uniqueId}
        type="checkbox" 
        checked={isVip} 
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer" 
      />
      <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
      <span className="ml-2 text-sm font-medium text-slate-300">VIP</span>
    </label>
  );
};

const AdminPage: React.FC<AdminPageProps> = ({ users, currentUser, onUpdateUser, onAddUser, onDeleteUser, onBack }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleDelete = async (userToDelete: User) => {
        if (userToDelete.id === currentUser.id) {
            alert("ບໍ່ສາມາດລຶບບັນຊີຜູ້ເບິ່ງແຍງລະບົບໄດ້.");
            return;
        }

        if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບບັນຊີ '${userToDelete.username}'? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.`)) {
            setIsDeleting(userToDelete.id!);
            setError(null);
            try {
                await onDeleteUser(userToDelete.id!);
            } catch (err) {
                setError("ການລຶບລົ້ມເຫລວ.");
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const handleSaveUser = async (updatedUserData: Partial<User>) => {
        if (!editingUser) return;
        
        await onUpdateUser({
            ...editingUser,
            ...updatedUserData,
        });
    };

    const handleToggleVip = async (userToUpdate: User) => {
        if (userToUpdate.id === currentUser.id) return;
        
        try {
            await onUpdateUser({ ...userToUpdate, isVip: !userToUpdate.isVip });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update VIP status.');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
    );

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-800 rounded-2xl shadow-2xl animate-fade-in">
        <div className="grid grid-cols-3 items-center mb-6">
            <div className="justify-self-start">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="ກັບຄືນ">
                    <ArrowUturnLeftIcon className="w-6 h-6 text-slate-400" />
                </button>
            </div>
            <h2 className="text-3xl font-bold text-white text-center">ແຜງควบคุมຜູ້ເບິ່ງແຍງລະບົບ</h2>
            <div className="justify-self-end">
                 <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors" aria-label="ເພີ່ມຜູ້ໃຊ້ໃໝ່">
                    <UserPlusIcon className="w-5 h-5"/>
                    <span>ເພີ່ມຜູ້ໃຊ້</span>
                </button>
            </div>
        </div>

        <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-500" />
            </span>
            <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ຄົ້ນຫາຕາມຊື່ບັນຊີ, ອີເມວ, ຫຼື ເບີໂທ..."
                className="w-full py-2 pl-10 pr-4 text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                aria-label="Search users"
            />
        </div>
        
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                    <div key={user.id} className="bg-slate-900/50 p-4 rounded-lg flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                             <p className="text-lg font-semibold text-white truncate flex items-center gap-2">
                                <UserCircleIcon className="w-5 h-5 inline-block flex-shrink-0"/>
                                <span className="truncate">{user.username}</span>
                                {user.isVip && <StarIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" title="ສະມາຊິກ VIP"/>}
                                <span className="text-xs text-slate-500">(ID: {user.id})</span>
                            </p>
                            <p className="text-sm text-slate-400 truncate"><EnvelopeIcon className="w-4 h-4 inline-block mr-2"/>{user.email}</p>
                            <p className="text-sm text-slate-400 truncate"><DevicePhoneMobileIcon className="w-4 h-4 inline-block mr-2"/>{user.phone}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                            <VipToggle 
                                isVip={!!user.isVip} 
                                onChange={() => handleToggleVip(user)}
                                disabled={user.id === currentUser.id}
                            />
                            <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-brand-primary rounded-md transition-colors" aria-label={`ແກ້ໄຂ ${user.username}`}>
                                <PencilSquareIcon className="w-5 h-5"/>
                            </button>
                            <button 
                                onClick={() => handleDelete(user)} 
                                disabled={user.id === currentUser.id || isDeleting === user.id}
                                className="p-2 text-slate-400 hover:text-red-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                aria-label={`ລຶບ ${user.username}`}>
                                {isDeleting === user.id ? <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-slate-400"></div> : <TrashIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-slate-400">
                    <p>ບໍ່ພົບຜູ້ໃຊ້ທີ່ຕົງກັນ.</p>
                </div>
            )}
        </div>

        {editingUser && (
            <EditUserModal 
                user={editingUser}
                onSave={handleSaveUser}
                onClose={() => setEditingUser(null)}
                isCurrentUser={editingUser.id === currentUser.id}
            />
        )}

        {isAddingUser && (
            <AddUserModal
                onSave={onAddUser}
                onClose={() => setIsAddingUser(false)}
            />
        )}
    </div>
  );
};

export default AdminPage;