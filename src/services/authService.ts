import { UserProfile } from '../types';
import { StorageAdapter } from './storageAdapter';
import { INITIAL_USER } from './mockData';

export const AuthService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    return StorageAdapter.getUser();
  },

  async loginDemo(): Promise<UserProfile> {
    await new Promise((res) => setTimeout(res, 300));
    await StorageAdapter.saveUser(INITIAL_USER);
    return INITIAL_USER;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await StorageAdapter.getUser();
    const updated = { ...current, ...updates };
    return StorageAdapter.saveUser(updated);
  },
  
  async syncCognitoUser(claims: Record<string, any>): Promise<UserProfile> {
    const current = await StorageAdapter.getUser();
    
    // Construct user from Cognito OIDC claims
    const updatedUser: UserProfile = {
      ...current, // Preserve local preferences like currency
      id: claims.sub || current.id,
      cognitoSub: claims.sub,
      email: claims.email || current.email,
      name: claims.name || claims.email?.split('@')[0] || current.name,
    };
    
    await StorageAdapter.saveUser(updatedUser);
    return updatedUser;
  }
};
