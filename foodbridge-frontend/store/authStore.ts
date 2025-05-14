import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  profilePic: string | null;
  viewedProfileUsername: string | null;
  setToken: (token: string) => void;
  setProfilePic: (profilePic: string | null) => void;
  setViewedProfileUsername: (viewedProfileUsername: string | null) => void;
  clearAuth: () => void;

}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      profilePic: null,
      viewedProfileUsername: null,
      setToken: (token) => set({ token }),
      setProfilePic: (profilePic) => set({ profilePic }),
      setViewedProfileUsername: (viewedProfileUsername) => set({ viewedProfileUsername }),
      clearAuth: () =>
        set({ token: null,  profilePic: null, viewedProfileUsername: null }),
    }),
    {
      name: 'auth',
    }
  )
);

export { useAuthStore };