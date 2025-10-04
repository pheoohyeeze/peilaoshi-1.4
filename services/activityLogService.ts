import type { ActivityLogEntry } from '../types';

const ACTIVITY_LOG_KEY = 'hsk-activity-log';
const MAX_HISTORY_LENGTH = 100; // Keep the last 100 activities per user

/**
 * Gets the activity history for a specific user from localStorage.
 * @param username The username of the logged-in user.
 * @returns An array of activity log entries.
 */
export const getActivityHistory = (username: string): ActivityLogEntry[] => {
  if (!username) return [];
  try {
    const allLogs = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '{}');
    return allLogs[username] || [];
  } catch {
    return [];
  }
};

/**
 * Logs a new activity for a user and saves it to localStorage.
 * @param username The username of the logged-in user.
 * @param entry The activity data to log.
 * @returns The updated array of activity log entries for the user.
 */
export const logActivity = (username: string, entry: Omit<ActivityLogEntry, 'id' | 'username'>): ActivityLogEntry[] => {
  if (!username) return [];

  const newEntry: Omit<ActivityLogEntry, 'username'> = {
    ...entry,
    id: Date.now(), // Use timestamp as a unique ID and for sorting
  };

  try {
    const allLogs = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '{}');
    const userHistory: Omit<ActivityLogEntry, 'username'>[] = allLogs[username] || [];

    // Add new entry to the front and trim the array if it exceeds the max length
    const updatedHistory = [newEntry, ...userHistory].slice(0, MAX_HISTORY_LENGTH);

    allLogs[username] = updatedHistory;
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(allLogs));
    return updatedHistory.map(log => ({...log, username}));
  } catch (e) {
    console.error("Failed to log activity", e);
    // Return existing history on failure
    return getActivityHistory(username);
  }
};


/**
 * Gets all activity logs for all users, flattened and sorted.
 * @returns A sorted array of all activity log entries, with username added.
 */
export const getAllActivityLogs = (): ActivityLogEntry[] => {
  try {
    const allLogs: Record<string, Omit<ActivityLogEntry, 'username'>[]> = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '{}');
    const flatLogList: ActivityLogEntry[] = [];

    for (const username in allLogs) {
      if (username === 'peilaoshi') continue; // Exclude admin logs

      allLogs[username].forEach(log => {
        flatLogList.push({
          ...log,
          username, // Add username to each entry
        });
      });
    }

    // Sort by timestamp descending (newest first)
    return flatLogList.sort((a, b) => b.id - a.id);
  } catch {
    return [];
  }
};
