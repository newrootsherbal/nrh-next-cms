// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient as createSupabaseBrowserClient, getProfileWithRoleClientSide } from '@/utils/supabase/client';
import { Profile, UserRole } from '@/utils/supabase/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean; // True during initial auth check, then false
  isAdmin: boolean;
  isWriter: boolean;
  isUserRole: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 1. Initialize Supabase client once and keep it stable
  const [supabase] = useState(() => createSupabaseBrowserClient());

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true

  useEffect(() => {
    // This effect runs once on mount to set up initial auth state and listener
    setIsLoading(true); // Explicitly set loading true at the start of this effect

    // Attempt to get the initial session.
    // Supabase getSession() is async, so we handle it.
    // Using getSessionSync() is an option but might not be populated immediately on first load after login.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const initialUser = session?.user ?? null;
      setUser(initialUser);

      if (initialUser) {
        try {
          const userProfile = await getProfileWithRoleClientSide(initialUser.id);
          setProfile(userProfile);
          setRole(userProfile?.role ?? null);
        } catch (e) {
          console.error("AuthProvider: Error fetching initial profile", e);
          setProfile(null);
          setRole(null);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setIsLoading(false); // Initial auth check complete
    }).catch(e => {
        console.error("AuthProvider: Error in getSession()", e);
        setUser(null);
        setProfile(null);
        setRole(null);
        setIsLoading(false); // Still mark loading as false even on error
    });

    // Set up the auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // This listener updates state on auth events (login, logout)
        // It should NOT toggle isLoading. isLoading is for the *initial* check.
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          try {
            const userProfile = await getProfileWithRoleClientSide(currentUser.id);
            setProfile(userProfile);
            setRole(userProfile?.role ?? null);
          } catch (e) {
            console.error("AuthProvider: Error fetching profile on auth change", e);
            setProfile(null); // Clear profile on error to avoid stale data
            setRole(null);
          }
        } else {
          setProfile(null);
          setRole(null);
        }
      }
    );

    return () => {
      // Cleanup listener on unmount
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]); // Dependency array only contains stable `supabase` client

  const isAdmin = role === 'ADMIN';
  const isWriter = role === 'WRITER';
  const isUserRole = role === 'USER';

  return (
    <AuthContext.Provider value={{ user, profile, role, isLoading, isAdmin, isWriter, isUserRole }}>
      {/* 3. Always render children. Consumers will use `isLoading` to show their own loaders. */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};