import type { ProgressData } from '../types';
import { logActivity } from './activityLogService';
import { VIP_USERS } from '../UserData/VIP';

export interface User {
    username: string;
    userID?: string;
    password?: string;
    email: string;
    phone: string;
    isVip?: boolean;
    orderId?: string;
    vipPurchaseDate?: string;
    vipExpiryDate?: string;
    devices?: { id: string; lastLogin: number }[];
}

const USERS_KEY = 'hsk-users';
const PROGRESS_KEY = 'hsk-progress';

// Initialize with default VIP users if no users exist
const initializeDefaultUsers = () => {
    try {
        const usersData = localStorage.getItem(USERS_KEY);
        // Only initialize if storage is empty or just an empty object
        if (!usersData || usersData === '{}') {
            const defaultUsers: { [username: string]: Omit<User, 'username'> } = {};
            VIP_USERS.forEach(user => {
                const { username, ...rest } = user;
                defaultUsers[username] = rest;
            });
            localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        } else {
             // Ensure existing users have a devices array
            const users = JSON.parse(usersData);
            let updated = false;
            for (const username in users) {
                if (!users[username].devices) {
                    users[username].devices = [];
                    updated = true;
                }
            }
            if (updated) {
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
            }
        }
    } catch (error) {
        console.error('Failed to initialize default VIP users:', error);
    }
};

initializeDefaultUsers();

// Helper to get all data
const getAllData = () => {
    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
        const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
        return { users, progress };
    } catch {
        return { users: {}, progress: {} };
    }
};

// Helper to save all data
const saveData = (users: any, progress: any) => {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
        console.error("Failed to save data", e);
    }
};

export const loginUser = (username: string, password, deviceId): { success: boolean; message?: string; } => {
    const { users } = getAllData();
    const userData = users[username];

    if (!userData || userData.password !== password) {
        return { success: false, message: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ.' };
    }

    // Device check
    let devices = userData.devices || [];
    const deviceExists = devices.some(d => d.id === deviceId);

    if (deviceExists) {
        // Device is already registered, update last login time
        devices = devices.map(d => d.id === deviceId ? { ...d, lastLogin: Date.now() } : d);
    } else {
        // New device, check limit
        if (devices.length >= 2) {
            return { success: false, message: 'ບັນຊີນີ້ເຂົ້າສູ່ລະບົບຄົບ 2 ເຄື່ອງແລ້ວ. ກະລຸນາອອກຈາກລະບົບຈາກເຄື່ອງອື່ນກ່ອນ.' };
        }
        // Add new device
        devices.push({ id: deviceId, lastLogin: Date.now() });
    }

    users[username].devices = devices;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    return { success: true };
};

export const deregisterDevice = (username: string, deviceId: string) => {
    if (!username || !deviceId) return;
    const { users } = getAllData();
    const userData = users[username];

    if (userData && userData.devices) {
        userData.devices = userData.devices.filter(d => d.id !== deviceId);
        users[username] = userData;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};


export const getUser = (username: string): (Omit<User, 'password'> & { isAdmin: boolean }) | null => {
    if (!username) return null;
    const { users } = getAllData();
    const isAdmin = username === 'peilaoshi';
    
    if (isAdmin) {
        return {
            username: 'peilaoshi',
            email: '',
            phone: '',
            isVip: true, // Admin is always a VIP
            isAdmin: true,
            vipPurchaseDate: '2024-01-01',
            vipExpiryDate: '9999-12-31',
        };
    }

    const userData = users[username];
    if (userData) {
        let isVipActive = userData.isVip || false;
        if (isVipActive && userData.vipExpiryDate) {
            try {
                const parts = userData.vipExpiryDate.split('-').map(Number);
                const expiryDate = new Date(parts[0], parts[1] - 1, parts[2]);
                expiryDate.setHours(23, 59, 59, 999); // End of the expiry day
                
                const now = new Date();
                
                if (now > expiryDate) {
                    isVipActive = false;
                }
            } catch (e) {
                console.error("Invalid VIP expiry date format for user:", username, e);
                isVipActive = false; // Invalidate VIP if date is malformed
            }
        }
        
        return {
            username,
            userID: userData.userID,
            email: userData.email || '',
            phone: userData.phone || '',
            isVip: isVipActive,
            orderId: userData.orderId,
            vipPurchaseDate: userData.vipPurchaseDate,
            vipExpiryDate: userData.vipExpiryDate,
            isAdmin: false,
        };
    }
    
    return null;
};


export const getAllUsers = (): User[] => {
    const { users } = getAllData();
    // Exclude admin from the user list if it exists
    const userList = Object.keys(users)
        .filter(username => username !== 'peilaoshi')
        .map(username => ({
            username,
            ...users[username],
            isVip: users[username].isVip || false,
        }));
    return userList;
};

export const createUser = (newUser: User): { success: boolean, message?: string } => {
    if (!newUser.username || !newUser.password || !newUser.email || !newUser.phone) {
        return { success: false, message: 'ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບຖ້ວນ.' };
    }

    const { users, progress } = getAllData();

    if (users[newUser.username]) {
        return { success: false, message: 'ຊື່ຜູ້ໃຊ້ນີ້ມີຢູ່ແລ້ວ.' };
    }

    for (const key in users) {
        if (users[key].email === newUser.email) {
            return { success: false, message: 'ອີເມວນີ້ຖືກໃຊ້ແລ້ວ.' };
        }
        if (users[key].phone === newUser.phone) {
            return { success: false, message: 'ເບີໂທນີ້ຖືກໃຊ້ແລ້ວ.' };
        }
    }
    
    users[newUser.username] = {
        password: newUser.password,
        email: newUser.email,
        phone: newUser.phone,
        userID: newUser.userID,
        isVip: newUser.isVip || false,
        orderId: newUser.orderId,
        vipPurchaseDate: newUser.vipPurchaseDate,
        vipExpiryDate: newUser.vipExpiryDate,
        devices: newUser.devices || [],
    };

    saveData(users, progress);
    
    // Log the registration event
    logActivity(newUser.username, { type: 'register', level: undefined, lesson: undefined });


    return { success: true };
};

export const updateUser = (originalUsername: string, updatedUser: User): { success: boolean, message?: string } => {
    const { users, progress } = getAllData();

    // Check if new username/email/phone already exists for another user
    if (updatedUser.username !== originalUsername && users[updatedUser.username]) {
        return { success: false, message: 'ຊື່ຜູ້ໃຊ້ນີ້ມີຢູ່ແລ້ວ.' };
    }
    for (const username in users) {
        if (username !== originalUsername) {
            if (users[username].email === updatedUser.email) {
                return { success: false, message: 'ອີເມວນີ້ຖືກໃຊ້ແລ້ວ.' };
            }
            if (users[username].phone === updatedUser.phone) {
                return { success: false, message: 'ເບີໂທນີ້ຖືກໃຊ້ແລ້ວ.' };
            }
        }
    }

    const oldUserData = users[originalUsername];
    const userDataToSave = {
        password: updatedUser.password || oldUserData.password, // Keep old password if not changed
        email: updatedUser.email,
        phone: updatedUser.phone,
        userID: updatedUser.userID,
        isVip: updatedUser.isVip,
        orderId: updatedUser.orderId,
        vipPurchaseDate: updatedUser.vipPurchaseDate,
        vipExpiryDate: updatedUser.vipExpiryDate,
        devices: updatedUser.devices || oldUserData.devices || [],
    };

    // If username changed, migrate data
    if (originalUsername !== updatedUser.username) {
        users[updatedUser.username] = userDataToSave;
        delete users[originalUsername];

        if (progress[originalUsername]) {
            progress[updatedUser.username] = progress[originalUsername];
            delete progress[originalUsername];
        }
    } else {
        users[originalUsername] = userDataToSave;
    }

    saveData(users, progress);
    return { success: true };
};


export const deleteUser = (username: string): void => {
    const { users, progress } = getAllData();

    if (users[username]) {
        delete users[username];
    }
    if (progress[username]) {
        delete progress[username];
    }

    saveData(users, progress);
};
