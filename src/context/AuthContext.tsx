import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { AuthService } from '../services/authService';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  changeCurrency: (currency: string, symbol: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // By default in demo mode, auto-login the demo user for smooth immediate showcase
          const demo = await AuthService.loginDemo();
          setUser(demo);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await AuthService.login(email, pass);
      setUser(loggedUser);
      showToast('success', 'Welcome back!', `Signed in as ${loggedUser.email}`);
    } catch (err: any) {
      showToast('error', 'Authentication Failed', err.message || 'Could not sign in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async () => {
    setIsLoading(true);
    try {
      const demoUser = await AuthService.loginDemo();
      setUser(demoUser);
      showToast('info', 'Demo Mode Activated', 'Loaded preconfigured cloud portfolio dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const newUser = await AuthService.signUp(name, email, pass);
      setUser(newUser);
      showToast('success', 'Account Created!', 'Welcome to FinTrack Cloud.');
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message || 'Could not create account');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    showToast('info', 'Logged Out', 'Your session has ended securely.');
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    try {
      const updated = await AuthService.updateProfile(updates);
      setUser(updated);
      showToast('success', 'Profile Updated', 'Your preferences have been saved.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const changeCurrency = async (currency: string, currencySymbol: string) => {
    await updateUser({ currency, currencySymbol });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginDemo,
        signUp,
        logout,
        updateUser,
        changeCurrency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
