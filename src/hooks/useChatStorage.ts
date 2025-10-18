import { useState, useEffect } from 'react';

export type ChatSize = { 
  w: number; 
  h: number; 
  mode: 'docked' | 'fullscreen' 
};

type StorageHook<T> = [T, (value: T) => void];

export function useChatStorage<T>(key: string, defaultValue: T): StorageHook<T> {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage`, e);
    }
  }, [key, value]);

  return [value, setValue];
}

export const DEFAULT_CHAT_SIZE: ChatSize = { w: 420, h: 560, mode: 'docked' };
export const MIN_WIDTH = 360;
export const MAX_WIDTH = 720;
export const MIN_HEIGHT = 420;
export const MAX_HEIGHT_VH = 80;
