import React, { useState, useEffect, useMemo } from 'react';
import { getAllUsers, updateUser, deleteUser, User, createUser, deregisterDevice } from '../services/adminService';
import { getAllActivityLogs } from '../services/activityLogService';
import type { ActivityLogEntry, PracticeMode } from '../types';
import { 
    PencilIcon, TrashIcon, UserIcon, EnvelopeIcon, PhoneIcon, LockClosedIcon, MagnifyingGlassIcon, XCircleIcon, 
    ArrowRightOnRectangleIcon, UserPlusIcon, CrownIcon, BookOpenIcon, ChartBarIcon, LightBulbIcon, KeyIcon,
    ShieldExclamationIcon, ArrowsRightLeftIcon, ChatBubbleLeftRightIcon, QuestionMarkCircleIcon, 
    SquaresPlusIcon, LinkIcon, PuzzlePieceIcon, QueueListIcon
} from './IconComponents';

interface AdminDashboardProps {
    onLogout: () => void;
}

// Re-usable components from ActivityHistoryView, adapted for Admin use
const practiceModeLabels: Record<PracticeMode, string> = {
    example: 'ຕົວຢ່າງປະໂຫຍກ',
    correction: 'ຊອກຫາຂໍ້ຜິດພາດ',
    scramble: 'ລຽງປະໂຫຍກ',
    building: 'ສ້າງປະໂຫຍກ',
    writing: 'ຝຶກຂຽນ',
    ordering: '排列顺序',
    translation_choice: 'ເລືອກຄຳແປ',
    build_from_translation: 'ປະກອບຄຳສັບ',
    matching: 'ຈັບຄູ່ຄຳສັບ',
    conjunction: 'ເຊື່ອມປະໂຫຍກ'
};

const IconMap: Record<string, React.FC<{className?: string}>> = {
    lesson_start: BookOpenIcon,
    quiz_complete: ChartBarIcon,
    practice_complete: LightBulbIcon,
    login: KeyIcon,
    register: UserPlusIcon,
    example: LightBulbIcon,
    correction: ShieldExclamationIcon,
    scramble: ArrowsRightLeftIcon,
    building: ChatBubbleLeftRightIcon,
    translation_choice: QuestionMarkCircleIcon,
    build_from_translation: SquaresPlusIcon,
    matching: LinkIcon,
    conjunction: PuzzlePieceIcon,
    ordering: QueueListIcon,
    writing: PencilIcon,
};

const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
     return date.toLocaleString('lo-LA', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
};

const renderLogEntry = (entry: ActivityLogEntry) => {
    let title = '';
    let details = `ໂດຍ ${entry.username}`;
    const Icon = IconMap[entry.mode || entry.type] || BookOpenIcon;

    switch (entry.type) {
        case 'register':
            title = 'ຜູ້ໃຊ້ໃໝ່ລົງທະບຽນ';
            break;
        case 'login':
            title = 'ເຂົ້າສູ່ລະບົບ';
            break;
        case 'lesson_start':
            title = `ເລີ່ມ HSK ${entry.level} ບົດຮຽນ ${entry.lesson}`;
            break;
        case 'quiz_complete':
            title = `ຈົບແບບທົດສອບ: ${practiceModeLabels[entry.mode!] || entry.mode}`;
            details += ` - ຄະແນນ: ${entry.score}/${entry.total}`;
            break;
        case 'practice_complete':
             title = `ຝຶກ: ${practiceModeLabels[entry.mode!] || entry.mode}`;
             if (typeof entry.isCorrect === 'boolean') {
                 details += entry.isCorrect ? ' (ຖືກຕ້ອງ)' : ' (ຜິດ)';
             }
            break;
    }

    return (
        <li key={entry.id} className="flex items-start gap-4 py-3">
            <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{details}</p>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0" title={new Date(entry.id).toLocaleString()}>{formatTimestamp(entry.id)}</p>
        </li>
    );
};


const UserFormModal: React.FC<{
    mode: 'add' | 'edit';
    user?: User;
    onClose: () => void;
    onSave: (user: User, originalUsername?: string) => { success: boolean, message?: string };
}> = ({ mode, user, onClose, onSave }) => {
    const [formData, setFormData] = useState<User>(
        mode === 'edit' && user ? { ...user, password: '' } : { username: '', userID: '', password: '', email: '', phone: '', isVip: false, orderId: '', vipPurchaseDate: '', vipExpiryDate: '', devices: [] }
    );
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = () => {
        if (mode === 'add' && !formData.password) {
            setError('ກະລຸນາໃສ່ລະຫັດຜ່ານ.');
            return;
        }
        
        const result = onSave(formData, user?.username);
        
        if (!result.success) {
            setError(result.message || 'ເກີດຂໍ້ຜິດພາດ.');
        }
    };

    const handleRemoveDevice = (deviceId: string) => {
        setFormData(prev => ({
            ...prev,
            devices: prev.devices?.filter(d => d.id !== deviceId) || [],
        }));
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-6 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                    {mode === 'add' ? 'ເພີ່ມຜູ້ໃຊ້ໃໝ່' : 'ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້'}
                </h3>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ຊື່ຜູ້ໃຊ້</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">UserID</label>
                        <input type="text" name="userID" value={formData.userID || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ອີເມວ</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ເບີໂທລະສັບ</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                             {mode === 'add' ? 'ລະຫັດຜ່ານ' : 'ລະຫັດຜ່ານໃໝ່ (ປະໄວ້ວ່າງເພື່ອບໍ່ປ່ຽນ)'}
                        </label>
                        <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">订单 ID</label>
                        <input type="text" name="orderId" value={formData.orderId || ''} onChange={handleChange} placeholder="ຕົວຢ່າງ: bcelone123456789" className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">购买日期 (Purchase Date)</label>
                        <input type="date" name="vipPurchaseDate" value={formData.vipPurchaseDate || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">会员到期日 (VIP Expiry)</label>
                        <input type="date" name="vipExpiryDate" value={formData.vipExpiryDate || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="isVip" name="isVip" checked={!!formData.isVip} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary dark:bg-slate-600 dark:border-slate-500" />
                        <label htmlFor="isVip" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">VIP 会员</label>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ອຸປະກອນທີ່ເຂົ້າສູ່ລະບົບ ({formData.devices?.length || 0}/2)</label>
                        <div className="mt-1 space-y-2">
                            {formData.devices && formData.devices.length > 0 ? (
                                formData.devices.map(device => (
                                    <div key={device.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                                        <div>
                                            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">{device.id}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">ເຂົ້າສູ່ລະບົບຄັ້ງສຸດທ້າຍ: {new Date(device.lastLogin).toLocaleString('lo-LA')}</p>
                                        </div>
                                        <button onClick={() => handleRemoveDevice(device.id)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full" aria-label={`Remove device ${device.id}`}>
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 p-2">ບໍ່ມີອຸປະກອນທີ່ເຂົ້າສູ່ລະບົບ.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200">ຍົກເລີກ</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary">ບັນທຶກ</button>
                </div>
            </div>
        </div>
    );
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');
    const [allActivity, setAllActivity] = useState<ActivityLogEntry[]>([]);

    useEffect(() => {
        loadUsers();
        if (activeTab === 'activity') {
            loadActivities();
        }
    }, [activeTab]);

    const loadUsers = () => {
        setUsers(getAllUsers());
    };

    const loadActivities = () => {
        setAllActivity(getAllActivityLogs());
    };

    const handleSave = (userData: User, originalUsername?: string): { success: boolean, message?: string } => {
        if (isAddingUser) {
            return createUser(userData);
        } else if (editingUser) {
            const dataToSave = { ...userData };
            if (!dataToSave.password) {
                delete dataToSave.password;
            }
            return updateUser(originalUsername!, dataToSave);
        }
        return { success: false, message: 'Invalid operation.' };
    };
    
    const handleSaveCallback = (userData: User, originalUsername?: string): { success: boolean, message?: string } => {
        const result = handleSave(userData, originalUsername);
        if (result.success) {
            setIsAddingUser(false);
            setEditingUser(null);
            loadUsers();
            loadActivities(); // Refresh activities in case of new user registration
        }
        return result;
    };


    const handleDeleteUser = (username: string) => {
        if (window.confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຜູ້ໃຊ້ "${username}"? ການກະທຳນີ້ຈະລຶບຄວາມຄືບໜ້າ ແລະ ປະຫວັດກິດຈະກຳຂອງຜູ້ໃຊ້ນຳ.`)) {
            deleteUser(username);
            loadUsers();
            loadActivities();
        }
    };
    
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowercasedFilter = searchTerm.toLowerCase();
        return users.filter(user =>
            user.username.toLowerCase().includes(lowercasedFilter) ||
            user.email.toLowerCase().includes(lowercasedFilter) ||
            user.phone.toLowerCase().includes(lowercasedFilter) ||
            (user.orderId && user.orderId.toLowerCase().includes(lowercasedFilter)) ||
            (user.userID && user.userID.toLowerCase().includes(lowercasedFilter))
        );
    }, [users, searchTerm]);
    
    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-fade-in text-slate-800 dark:text-slate-200">
            {(isAddingUser || editingUser) && <UserFormModal mode={isAddingUser ? 'add' : 'edit'} user={editingUser || undefined} onClose={() => { setIsAddingUser(false); setEditingUser(null); }} onSave={handleSaveCallback} />}
            
            <header className="flex flex-wrap gap-4 justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold">ກະດານຜູ້ດູແລລະບົບ</h2>
                <div className="flex gap-2">
                    <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        <UserPlusIcon className="w-5 h-5" />
                        <span>ເພີ່ມຜູ້ໃຊ້</span>
                    </button>
                    <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span>ອອກຈາກລະບົບ</span>
                    </button>
                </div>
            </header>

            <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        ຈັດການຜູ້ໃຊ້
                    </button>
                    <button onClick={() => setActiveTab('activity')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        ກິດຈະກຳຫຼ້າສຸດ
                    </button>
                </nav>
            </div>

            {activeTab === 'users' && (
                <div>
                    <div className="mb-4 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </span>
                        <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ຄົ້ນຫາຜູ້ໃຊ້..." className="w-full p-3 pl-10 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-3"><XCircleIcon className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="p-3">UserID</th><th className="p-3">ຊື່ຜູ້ໃຊ້</th><th className="p-3">ອີເມວ</th><th className="p-3">ເບີໂທລະສັບ</th><th className="p-3">VIP</th><th className="p-3">订单 ID</th><th className="p-3">购买日期</th><th className="p-3">会员到期日</th><th className="p-3">ອຸປະກອນ</th><th className="p-3">ການກະທຳ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.username} className="border-b dark:border-slate-700">
                                        <td className="p-3 text-sm">{user.userID || ''}</td>
                                        <td className="p-3 font-medium">{user.username}</td>
                                        <td className="p-3">{user.email}</td><td className="p-3">{user.phone}</td>
                                        <td className="p-3">{user.isVip && <CrownIcon className="w-6 h-6 text-yellow-500" title="VIP Member" />}</td>
                                        <td className="p-3 text-sm">{user.orderId || ''}</td>
                                        <td className="p-3 text-sm">{user.vipPurchaseDate || ''}</td>
                                        <td className="p-3 text-sm">{user.vipExpiryDate || ''}</td>
                                        <td className="p-3 text-sm">{user.devices?.length || 0}/2</td>
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => setEditingUser(user)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteUser(user.username)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && <p className="text-center p-8 text-slate-500">ບໍ່ພົບຜູ້ໃຊ້.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="max-h-[60vh] overflow-y-auto">
                     {allActivity.length > 0 ? (
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700 pr-2">
                            {allActivity.map(renderLogEntry)}
                        </ul>
                    ) : (
                        <p className="text-center py-16 text-slate-500 dark:text-slate-400">
                            ບໍ່ມີກິດຈະກຳຈາກຜູ້ໃຊ້.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
