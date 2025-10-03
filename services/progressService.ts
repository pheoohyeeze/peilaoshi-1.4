import type { ProgressData, WordProgress } from '../types';

const PROGRESS_KEY = 'hsk-progress';
export const MAX_MASTERY_SCORE = 5;
const MIN_MASTERY_SCORE = 0;

/**
 * Gets the progress data for a specific user from localStorage.
 * @param username The username of the logged-in user.
 * @returns The progress data object for the user.
 */
export const getProgress = (username: string): ProgressData => {
  if (!username) return {};
  try {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    return allProgress[username] || {};
  } catch {
    return {};
  }
};

/**
 * Saves the progress data for a specific user to localStorage.
 * @param username The username of the logged-in user.
 * @param userProgress The progress data object to save for the user.
 */
export const saveProgress = (username: string, userProgress: ProgressData) => {
  if (!username) return;
  try {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    allProgress[username] = userProgress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (e) {
    console.error("Failed to save progress", e);
  }
};

/**
 * Updates the mastery score for a single word based on quiz/practice outcome.
 * @param username The username of the logged-in user.
 * @param character The character of the word to update.
 * @param outcome 'correct' to increase the score, 'incorrect' to decrease.
 * @returns The updated progress data object for the user.
 */
export const updateWordMastery = (
    username: string,
    character: string,
    outcome: 'correct' | 'incorrect'
): ProgressData => {
    if (!username || !character) return getProgress(username);
    
    const userProgress = getProgress(username);
    const currentWordProgress = userProgress[character] || { score: 0 };
    
    let newScore = currentWordProgress.score;
    if (outcome === 'correct') {
        newScore = Math.min(MAX_MASTERY_SCORE, newScore + 1);
    } else {
        newScore = Math.max(MIN_MASTERY_SCORE, newScore - 1);
    }

    userProgress[character] = {
        score: newScore,
        lastReviewed: Date.now()
    };
    
    saveProgress(username, userProgress);
    return { ...userProgress }; // Return a new object to trigger state updates
};
