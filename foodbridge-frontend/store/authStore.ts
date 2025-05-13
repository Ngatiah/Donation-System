import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: string | null;
  profilePic: string | null;
  viewedProfileUsername: string | null;
  setToken: (token: string) => void;
  setRole: (role: string) => void;
  setProfilePic: (profilePic: string | null) => void;
  setViewedProfileUsername: (viewedProfileUsername: string | null) => void;
  clearAuth: () => void;
  // fontSize: number;
  // setFontSize: (size: number) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      profilePic: null,
      viewedProfileUsername: null,
      setToken: (token) => set({ token }),
      setRole: (role) => set({ role }),
      setProfilePic: (profilePic) => set({ profilePic }),
      setViewedProfileUsername: (viewedProfileUsername) => set({ viewedProfileUsername }),
      clearAuth: () =>
        set({ token: null,  profilePic: null, viewedProfileUsername: null,role:null }),
      // fontSize: 16,
      // setFontSize: (size) => {
      //   set({ fontSize: size });
      // },
    }),
    {
      name: 'auth',
    }
  )
);

export { useAuthStore };