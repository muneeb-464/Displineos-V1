import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useStore } from "@/lib/store";

const API = import.meta.env.VITE_API_URL as string;

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isGuest: boolean;
  isLoading: boolean;
  enterGuestMode: () => void;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  signInPromptOpen: boolean;
  openSignInPrompt: () => void;
  closeSignInPrompt: () => void;
  requireAuth: (action: () => void) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => sessionStorage.getItem("guest") === "1");
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);

  useEffect(() => {
    axios
      .get<User>(`${API}/auth/me`, { withCredentials: true })
      .then(async (res) => {
        setUser(res.data);
        setIsGuest(false);
        sessionStorage.removeItem("guest");
        useStore.getState().setAuthenticated(true);
        await useStore.getState().syncFromServer();
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const enterGuestMode = useCallback(() => {
    sessionStorage.setItem("guest", "1");
    setIsGuest(true);
  }, []);

  const signInWithGoogle = () => {
    window.location.href = `${API}/auth/google`;
  };

  const signOut = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    useStore.getState().setAuthenticated(false);
    useStore.getState().clearAllState();
    sessionStorage.removeItem("guest");
    setIsGuest(false);
    setUser(null);
  };

  const openSignInPrompt = useCallback(() => setSignInPromptOpen(true), []);
  const closeSignInPrompt = useCallback(() => setSignInPromptOpen(false), []);

  const requireAuth = useCallback((action: () => void) => {
    if (user) { action(); } else { setSignInPromptOpen(true); }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, isLoggedIn: !!user, isGuest, isLoading,
      enterGuestMode, signInWithGoogle, signOut,
      signInPromptOpen, openSignInPrompt, closeSignInPrompt, requireAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
