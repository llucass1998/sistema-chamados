import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';

export interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isStaff: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
