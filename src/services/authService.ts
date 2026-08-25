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
    
    // Check if string is a raw UUID
    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    
    const email = claims.email || current?.email || '';
    const emailPrefix = email ? email.split('@')[0] : '';
    const formattedEmailName = emailPrefix
      ? emailPrefix.split(/[._-]/).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
      : '';

    const rawUsername = claims['cognito:username'] || claims.preferred_username || '';
    const cleanUsername = isUuid(rawUsername) ? '' : rawUsername;

    // Pick cleanest display name
    const displayName = claims.name || formattedEmailName || cleanUsername || 'User';
    
    // Construct avatar using initials or custom picture
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
