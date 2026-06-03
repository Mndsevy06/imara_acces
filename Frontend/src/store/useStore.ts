import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, Configuration } from '../types';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  setUser: (user: User | null, token?: string | null) => void;
  setRole: (role: UserRole | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      token: null,
      setUser: (user, token = null) => set({ user, token, role: user?.role || null }),
      setRole: (role) => set({ role }),
      logout: () => set({ user: null, role: null, token: null }),
    }),
    {
      name: 'imara-auth-storage',
    }
  )
);

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'imara-theme-storage',
    }
  )
);

interface ConfigState {
  activeConfig: Configuration | null;
  setActiveConfig: (config: Configuration | null) => void;
}

export const useConfigStore = create<ConfigState>()((set) => ({
  activeConfig: null,
  setActiveConfig: (config) => set({ activeConfig: config }),
}));
