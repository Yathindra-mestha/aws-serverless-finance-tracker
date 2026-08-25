import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { AuthService } from '../services/authService';
import { useToast } from './ToastContext';
import { useAuth as useOidcAuth } from 'react-oidc-context';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  changeCurrency: (currency: string, symbol: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState<boolean>(true);
  const { showToast } = useToast();
  
  const oidc = useOidcAuth();

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (oidc.isAuthenticated && oidc.user?.profile) {
          const syncedUser = await AuthService.syncCognitoUser(oidc.user.profile);
          setUser(syncedUser);
        } else if (!oidc.isLoading) {
          const currentUser = await AuthService.getCurrentUser();
          if (currentUser && currentUser.cognitoSub) {
            // User was previously logged in but OIDC lost session, let's clear it
            setUser(null);
          } else if (currentUser) {
            // Demo user or local mock
            setUser(currentUser);
          }
        }
      } catch (err) {
        console.error('Failed to sync auth:', err);
      } finally {
        if (!oidc.isLoading) {
          setIsLocalLoading(false);
        }
      }
    };
    initAuth();
  }, [oidc.isAuthenticated, oidc.isLoading, oidc.user]);

  const login = async () => {
    await oidc.signinRedirect();
  };

  const loginDemo = async () => {
    setIsLocalLoading(true);
    try {
      const demoUser = await AuthService.loginDemo();
      setUser(demoUser);
      showToast('info', 'Demo Mode Activated', 'Loaded preconfigured cloud portfolio dataset.');
    } finally {
      setIsLocalLoading(false);
    }
  };

  const logout = async () => {
    if (oidc.isAuthenticated) {
      const clientId = "6d4m6tc2rau53b1om0ctangta4";
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const logoutUri = isLocal ? 'http://localhost:3000/' : 'https://fintrack-yathindra.vercel.app/';
      // Extract Cognito Domain from authority by replacing cognito-idp with auth and adding the prefix
      // Alternatively, we can use the domain from env if provided, but let's hardcode the one from the screenshot for safety
      const cognitoDomain = "https://ap-south-1b1mtk1d8v.auth.ap-south-1.amazoncognito.com";
      
      // Clear local session first
      oidc.removeUser();
      setUser(null);
      
      // Redirect to Cognito logout
      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    } else {
      setUser(null);
      showToast('info', 'Logged Out', 'Your session has ended securely.');
    }
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
        isAuthenticated: !!user || oidc.isAuthenticated,
        isLoading: isLocalLoading || oidc.isLoading || oidc.activeNavigator === 'signinSilent',
        login,
        loginDemo,
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
