import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Simple in-memory storage fallback for SSR/Node environments
const memoryStorage: Record<string, string> = {};
const safeStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return memoryStorage[key] || null;
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') { memoryStorage[key] = value; return; }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') { delete memoryStorage[key]; return; }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      delete memoryStorage[key];
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
