import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  profilePic: string | null;
  // hydrated: boolean;
  viewedProfileUsername: string | null;
  setToken: (token: string) => void;
  setProfilePic: (profilePic: string | null) => void;
  setViewedProfileUsername: (viewedProfileUsername: string | null) => void;
  clearAuth: () => void;
  // markHydrated: () => void;

}

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}


const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      profilePic: null,  
      // hydrated :false,
      viewedProfileUsername: null,
      setToken: (token) => set({ token }),
      setProfilePic: (profilePic) => set({ profilePic }),
      setViewedProfileUsername: (viewedProfileUsername) => set({ viewedProfileUsername }),
      clearAuth: () =>
        set({ token: null,  profilePic: null, viewedProfileUsername: null }),
      // markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'auth',
      // onRehydrateStorage: () => (state) => {
      //   if (state) {
      //     // hydration completed
      //     useAuthStore.getState().markHydrated();
      //   }
      // },
    }
  )
);

export { useAuthStore };

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () =>
        set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme', 
    }
  )
);
