import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import type { UserProfile, UserRole } from '../types';
import { AuthContext, type AuthContextValue } from './authContext';

const normalizeRole = (value: unknown): UserRole => {
  if (value === 'admin' || value === 'tecnico') {
    return value;
  }

  return 'colaborador';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userSnapshot = await getDoc(doc(db, 'users', user.uid));
        const data = userSnapshot.data();

        setProfile({
          uid: user.uid,
          login: String(data?.login ?? user.email?.split('@')[0] ?? 'Colaborador'),
          email: String(data?.email ?? user.email ?? ''),
          companyId: String(data?.companyId ?? 'Sem empresa'),
          role: normalizeRole(data?.role),
        });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        setProfile({
          uid: user.uid,
          login: user.email?.split('@')[0] ?? 'Colaborador',
          email: user.email ?? '',
          companyId: 'Sem empresa',
          role: 'colaborador',
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      loading,
      isStaff: profile?.role === 'admin' || profile?.role === 'tecnico',
    }),
    [firebaseUser, loading, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
