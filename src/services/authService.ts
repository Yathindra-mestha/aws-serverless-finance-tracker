import { UserProfile } from '../types';
import { StorageAdapter } from './storageAdapter';
import { INITIAL_USER } from './mockData';

const AUTH_TOKEN_KEY = 'fintrack_auth_jwt_token';

export const AuthService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;
    return StorageAdapter.getUser();
  },

  async login(email: string, _password: string): Promise<UserProfile> {
    // Artificial latency for Cognito User Pools authentication
    await new Promise((res) => setTimeout(res, 400));
    const user = await StorageAdapter.getUser();
    const updatedUser: UserProfile = {
      ...user,
      email,
      name: email.split('@')[0] || user.name,
    };
    await StorageAdapter.saveUser(updatedUser);
    localStorage.setItem(AUTH_TOKEN_KEY, `mock-cognito-id-token-${Date.now()}`);
    return updatedUser;
  },

  async loginDemo(): Promise<UserProfile> {
    await new Promise((res) => setTimeout(res, 300));
    await StorageAdapter.saveUser(INITIAL_USER);
    localStorage.setItem(AUTH_TOKEN_KEY, `demo-cognito-jwt-token-984210`);
    return INITIAL_USER;
  },

  async signUp(name: string, email: string, _password: string): Promise<UserProfile> {
    await new Promise((res) => setTimeout(res, 500));
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      name,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      currency: 'INR',
      currencySymbol: '₹',
      monthlyBudget: 25000,
      createdAt: new Date().toISOString(),
      cognitoSub: `cognito-sub-uuid-${Math.random().toString(36).substring(2, 9)}`,
    };
    await StorageAdapter.saveUser(newUser);
    localStorage.setItem(AUTH_TOKEN_KEY, `mock-cognito-id-token-${Date.now()}`);
    return newUser;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await StorageAdapter.getUser();
    const updated = { ...current, ...updates };
    return StorageAdapter.saveUser(updated);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },
};
