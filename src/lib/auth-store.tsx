import { useState, useEffect, createContext, useContext } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from './supabase';
import * as crypto from './crypto';
import * as recovery from './recovery';

interface AuthState {
  user: any | null;
  profile: any | null;
  privateKey: CryptoKey | null;
  loading: boolean;
  mnemonic: string | null;
  initializeE2EE: (phrase?: string) => Promise<string>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken, signOut: clerkSignOut } = useClerkAuth();
  
  const [profile, setProfile] = useState<any | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Clerk User with Supabase Profile
  useEffect(() => {
    if (isUserLoaded) {
      if (clerkUser) {
        fetchProfile(clerkUser.id);
      } else {
        setProfile(null);
        setPrivateKey(null);
        setMnemonic(null);
        setLoading(false);
      }
    }
  }, [clerkUser, isUserLoaded]);

  async function fetchProfile(userId: string) {
    try {
      const token = await getToken({ template: 'supabase' });
      const supabase = createClerkSupabaseClient(token);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        // Initial setup for new Clerk users who don't have a profile yet
        console.log('New user detected. Profile setup required.');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * The "Fortress" initialization.
   * Generates or recovers E2EE keys using a 24-word mnemonic.
   */
  async function initializeE2EE(phrase?: string): Promise<string> {
    if (!clerkUser) throw new Error('Authentication required');
    
    const activePhrase = phrase || recovery.generateRecoveryPhrase();
    if (!recovery.validateRecoveryPhrase(activePhrase)) {
      throw new Error('Invalid recovery phrase');
    }

    const token = await getToken({ template: 'supabase' });
    const supabase = createClerkSupabaseClient(token);

    // 1. Derive Master Key from Mnemonic Seed
    const seed = await recovery.phraseToSeed(activePhrase);
    // We use the seed as the "password" for our existing PBKDF2 logic
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const masterKey = await crypto.deriveMasterKey(seed, salt as any);

    // 2. Generate or Recover RSA Keypair
    const keyPair = await crypto.generateKeyPair();
    const { encrypted: encPriv, iv } = await crypto.encryptPrivateKey(keyPair.privateKey, masterKey);
    const pubKeyBase64 = await crypto.exportPublicKey(keyPair.publicKey);

    // 3. Save to Supabase (Upsert)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: clerkUser.id,
        username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
        public_key: pubKeyBase64,
        encrypted_private_key: encPriv,
        iv,
        salt: crypto.bufferToBase64(salt)
      });

    if (error) throw error;

    setPrivateKey(keyPair.privateKey);
    setMnemonic(activePhrase);
    await fetchProfile(clerkUser.id);
    
    return activePhrase;
  }

  const signOut = async () => {
    await clerkSignOut();
    setPrivateKey(null);
    setProfile(null);
    setMnemonic(null);
  };

  const refreshProfile = async () => {
    if (clerkUser) await fetchProfile(clerkUser.id);
  }

  return (
    <AuthContext.Provider value={{ 
      user: clerkUser, profile, privateKey, loading, mnemonic,
      initializeE2EE, signOut, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
