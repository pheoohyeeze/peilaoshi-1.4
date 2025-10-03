import { openDB, IDBPDatabase } from 'idb';
import { HSK_LEVELS } from '../constants';
import { HSK_VOCABULARY } from '../data/hsk-vocabulary';
import type { HSKLevel, VocabularyWord, User } from '../types';

const DB_NAME = 'hsk-ai-tutor-db';
const DB_VERSION = 2; // Incremented DB version
const VOCAB_STORE_NAME = 'vocabulary';
const RECENT_SEARCHES_STORE_NAME = 'recentSearches';
const USERS_STORE_NAME = 'users';
const MAX_RECENT_SEARCHES = 5;

export type SearchResultWord = VocabularyWord & { level: HSKLevel };

let db: IDBPDatabase;

async function getDb(): Promise<IDBPDatabase> {
    if (!db) {
        db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                if (oldVersion < 1) {
                    const vocabStore = db.createObjectStore(VOCAB_STORE_NAME, {
                        keyPath: 'id',
                    });
                    vocabStore.createIndex('level', 'level');
                    vocabStore.createIndex('character', 'character');
                    vocabStore.createIndex('pinyin_lower', 'pinyin_lower');
                    vocabStore.createIndex('pinyin_no_tones', 'pinyin_no_tones');
                    vocabStore.createIndex('translation_lower', 'translation_lower');

                    const recentSearchesStore = db.createObjectStore(RECENT_SEARCHES_STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    recentSearchesStore.createIndex('timestamp', 'timestamp');
                }
                 if (oldVersion < 2) {
                    const usersStore = db.createObjectStore(USERS_STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    usersStore.createIndex('username', 'username', { unique: true });
                    usersStore.createIndex('phone', 'phone', { unique: true });
                    usersStore.createIndex('email', 'email', { unique: true });
                }
            },
        });
    }
    return db;
}

export async function initializeDB(): Promise<void> {
    const db = await getDb();
    
    // --- Populate vocabulary if needed ---
    const vocabCount = await db.count(VOCAB_STORE_NAME);
    if (vocabCount === 0) {
        console.log('Populating database with vocabulary...');
        const tx = db.transaction(VOCAB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(VOCAB_STORE_NAME);

        const pinyinWithoutTones = (p: string) =>
            p.toLowerCase()
             .replace(/[āáǎà]/g, 'a')
             .replace(/[ōóǒò]/g, 'o')
             .replace(/[ēéěè]/g, 'e')
             .replace(/[īíǐì]/g, 'i')
             .replace(/[ūúǔù]/g, 'u')
             .replace(/[ǖǘǚǜü]/g, 'v');

        for (const level of HSK_LEVELS) {
            const words = HSK_VOCABULARY[level] || [];
            for (const word of words) {
                await store.add({
                    ...word,
                    level,
                    id: `${word.character}-${level}`,
                    pinyin_lower: word.pinyin.toLowerCase(),
                    pinyin_no_tones: pinyinWithoutTones(word.pinyin),
                    translation_lower: word.translation.toLowerCase()
                });
            }
        }
        await tx.done;
         console.log('Database populated successfully.');
    } else {
        console.log('Vocabulary database already populated.');
    }

    // --- Ensure admin user exists ---
    const usersTx = db.transaction(USERS_STORE_NAME, 'readwrite');
    const usersStore = usersTx.objectStore(USERS_STORE_NAME);
    const adminUser = await usersStore.index('username').get('peilaoshi');
    if (!adminUser) {
        console.log('Creating admin user...');
        await usersStore.add({
            username: 'peilaoshi',
            password: 'y33z3ph3o',
            email: 'peilaoshi@admin.local',
            phone: '00000000',
            isVip: true,
        });
    }
    await usersTx.done;
    console.log('DB initialization checks complete.');
}

export async function registerUser(user: Omit<User, 'id'>): Promise<User> {
    const db = await getDb();
    const tx = db.transaction(USERS_STORE_NAME, 'readonly');
    const store = tx.objectStore(USERS_STORE_NAME);

    const existingByUsername = await store.index('username').get(user.username);
    if (existingByUsername) throw new Error("ຊື່ບັນຊີນີ້ຖືກໃຊ້ແລ້ວ.");

    const existingByPhone = await store.index('phone').get(user.phone);
    if (existingByPhone) throw new Error("ເບີໂທລະສັບນີ້ຖືກໃຊ້ແລ້ວ.");
    
    const existingByEmail = await store.index('email').get(user.email);
    if (existingByEmail) throw new Error("ອີເມວນີ້ຖືກໃຊ້ແລ້ວ.");
    
    await tx.done;

    const newUser = { ...user, isVip: false };
    // In a real app, hash the password before storing
    const newUserId = await db.add(USERS_STORE_NAME, newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    return { ...userWithoutPassword, id: newUserId as number };
}

export async function loginUser(identifier: string, password: string): Promise<User | null> {
    const db = await getDb();
    const tx = db.transaction(USERS_STORE_NAME, 'readonly');
    const store = tx.objectStore(USERS_STORE_NAME);

    let user: User | undefined;

    user = await store.index('username').get(identifier);
    if (!user) {
        user = await store.index('email').get(identifier);
    }
    if (!user) {
        user = await store.index('phone').get(identifier);
    }
    
    await tx.done;

    // Security fix: Explicitly check for non-empty string password to prevent bypass.
    if (user && typeof user.password === 'string' && user.password.length > 0 && user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }

    return null;
}

export async function updateUser(user: User): Promise<User> {
    const db = await getDb();
    const tx = db.transaction(USERS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(USERS_STORE_NAME);
    
    // Check for uniqueness before updating
    const usernameIndex = store.index('username');
    const existingByUsername = await usernameIndex.get(user.username);
    if (existingByUsername && existingByUsername.id !== user.id) {
        throw new Error("ຊື່ບັນຊີນີ້ຖືກໃຊ້ໂດຍບັນຊີອື່ນແລ້ວ.");
    }
    
    const phoneIndex = store.index('phone');
    const existingByPhone = await phoneIndex.get(user.phone);
    if (existingByPhone && existingByPhone.id !== user.id) {
        throw new Error("ເບີໂທລະສັບນີ້ຖືກໃຊ້ໂດຍບັນຊີອື່ນແລ້ວ.");
    }

    const emailIndex = store.index('email');
    const existingByEmail = await emailIndex.get(user.email);
    if (existingByEmail && existingByEmail.id !== user.id) {
        throw new Error("ອີເມວນີ້ຖືກໃຊ້ໂດຍບັນຊີອື່ນແລ້ວ.");
    }

    const existingUser = await store.get(user.id!);
    if (!existingUser) {
        throw new Error("ບໍ່ພົບຜູ້ໃຊ້ນີ້.");
    }

    // Security Fix: Carefully merge properties to prevent password from being wiped.
    const userToUpdate = {
        ...existingUser,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isVip: typeof user.isVip === 'boolean' ? user.isVip : existingUser.isVip,
    };

    // ONLY update the password if a new, non-empty password is explicitly provided.
    if (user.password) {
        userToUpdate.password = user.password;
    }

    await store.put(userToUpdate);
    await tx.done;

    const { password: _, ...userWithoutPassword } = userToUpdate;
    return userWithoutPassword as User;
}

export async function getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const db = await getDb();
    const users = await db.getAll(USERS_STORE_NAME);
    // Never return passwords to the client-side components
    return users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
}

export async function deleteUser(userId: number): Promise<void> {
    const db = await getDb();
    await db.delete(USERS_STORE_NAME, userId);
}


export async function getVocabularyByLevel(level: HSKLevel): Promise<VocabularyWord[]> {
    const db = await getDb();
    return db.getAllFromIndex(VOCAB_STORE_NAME, 'level', level);
}

export async function searchVocabulary(query: string): Promise<SearchResultWord[]> {
    if (!query.trim()) {
        return [];
    }
    const db = await getDb();
    const tx = db.transaction(VOCAB_STORE_NAME, 'readonly');
    const store = tx.objectStore(VOCAB_STORE_NAME);
    const results = new Map<string, SearchResultWord>();

    const lowerCaseQuery = query.toLowerCase();
    const queryWithoutTones = lowerCaseQuery
        .replace(/[āáǎà]/g, 'a')
        .replace(/[ōóǒò]/g, 'o')
        .replace(/[ēéěè]/g, 'e')
        .replace(/[īíǐì]/g, 'i')
        .replace(/[ūúǔù]/g, 'u')
        .replace(/[ǖǘǚǜü]/g, 'v');

    let cursor = await store.openCursor();
    while(cursor) {
        const value = cursor.value as any;
        if(
            value.character.includes(lowerCaseQuery) ||
            value.pinyin_lower.includes(lowerCaseQuery) ||
            value.pinyin_no_tones.includes(queryWithoutTones) ||
            value.translation_lower.includes(lowerCaseQuery)
        ) {
            results.set(value.id, value);
        }
        cursor = await cursor.continue();
    }
    
    await tx.done;
    return Array.from(results.values());
}

export async function getRecentSearches(): Promise<SearchResultWord[]> {
    const db = await getDb();
    const results = await db.getAllFromIndex(RECENT_SEARCHES_STORE_NAME, 'timestamp');
    return results.reverse();
}

export async function addRecentSearch(word: SearchResultWord): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(RECENT_SEARCHES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(RECENT_SEARCHES_STORE_NAME);

    let cursor = await store.openCursor(null, 'prev');
    while (cursor) {
        if (cursor.value.character === word.character && cursor.value.level === word.level) {
            await cursor.delete();
            break; 
        }
        cursor = await cursor.continue();
    }
    
    await store.add({ ...word, timestamp: Date.now() });

    const count = await store.count();
    if (count > MAX_RECENT_SEARCHES) {
        let oldestCursor = await store.index('timestamp').openCursor();
        if (oldestCursor) {
            await oldestCursor.delete();
        }
    }
    await tx.done;
}

export async function clearRecentSearches(): Promise<void> {
    const db = await getDb();
    await db.clear(RECENT_SEARCHES_STORE_NAME);
}