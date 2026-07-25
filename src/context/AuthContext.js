'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, getUserProfile } from '@/lib/firebase';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid) {
    const p = await getUserProfile(uid);
    setProfile(p);
  }

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function refreshProfile() {
    if (user) loadProfile(user.uid);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
