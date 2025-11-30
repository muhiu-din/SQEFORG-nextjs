import { useEffect } from 'react';

/**
 * Auto-saves generation progress to localStorage
 * Prevents loss of progress if user closes browser
 */
export function useProgressSaver(key, data) {
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }, [key, data]);
}

/**
 * Loads saved progress from localStorage
 */
export function loadProgress(key) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Failed to load progress:', e);
    return null;
  }
}

/**
 * Clears saved progress
 */
export function clearProgress(key) {
  localStorage.removeItem(key);
}

/**
 * Saves generation checkpoint with timestamp
 */
export function saveCheckpoint(key, checkpoint) {
  const data = {
    ...checkpoint,
    savedAt: new Date().toISOString(),
    version: 1
  };
  localStorage.setItem(`checkpoint_${key}`, JSON.stringify(data));
}

/**
 * Loads checkpoint and checks if it's recent (< 24 hours old)
 */
export function loadCheckpoint(key) {
  try {
    const saved = localStorage.getItem(`checkpoint_${key}`);
    if (!saved) return null;
    
    const checkpoint = JSON.parse(saved);
    const savedTime = new Date(checkpoint.savedAt);
    const now = new Date();
    const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
    
    // Only return if saved within last 24 hours
    if (hoursDiff < 24) {
      return checkpoint;
    }
    
    // Clear old checkpoint
    localStorage.removeItem(`checkpoint_${key}`);
    return null;
  } catch (e) {
    console.error('Failed to load checkpoint:', e);
    return null;
  }
}