import type { ProgressData } from '../types';

export interface User {
    username: string;
    password?: string;
    email: string;
    phone: string;
    isVip?: boolean;
}

const USERS_KEY = 'hsk-users';
const PROGRESS_KEY = 'hsk-progress';

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
        };
    }

    const userData = users[username];
    if (userData) {
        return {
            username,
            email: userData.email || '',
            phone: userData.phone || '',
            isVip: userData.isVip || false,
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
        isVip: newUser.isVip || false,
    };

    saveData(users, progress);
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
        isVip: updatedUser.isVip,
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