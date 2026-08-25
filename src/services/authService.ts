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
    const displayName = claims.name || claims['cognito:username'] || claims.preferred_username || claims.email?.split('@')[0] || 'User';
    const email = claims.email || current?.email || '';
    
    // Construct avatar using real user initials or custom picture if available
    const avatarUrl = claims.picture || claims.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=128&bold=true`;
    
    // Construct user from Cognito OIDC claims
    const updatedUser: UserProfile = {
      ...current, // Preserve local preferences like currency
      id: claims.sub || current?.id || 'usr_' + Date.now(),
      cognitoSub: claims.sub,
      email: email,
      name: displayName,
      avatar: avatarUrl,
    };
    
    await StorageAdapter.saveUser(updatedUser);
    return updatedUser;
  }
};
