import * as bip39 from 'bip39';
import { Buffer } from 'buffer';

// Browser polyfill for Buffer
if (typeof window !== 'undefined' && !window.Buffer) {
  (window as any).Buffer = Buffer;
}

/**
 * Generates a high-entropy 24-word recovery phrase.
 * This is the ultimate "Fortress" key for the user's account.
 */
export function generateRecoveryPhrase(): string {
  // 256 bits of entropy = 24 words
  return bip39.generateMnemonic(256);
}

/**
 * Validates if a recovery phrase is a correct BIP39 mnemonic.
 */
export function validateRecoveryPhrase(phrase: string): boolean {
  return bip39.validateMnemonic(phrase.trim().toLowerCase());
}

/**
 * Converts a recovery phrase into a high-entropy seed.
 * This seed can be used as the input for our Master Key derivation.
 */
export async function phraseToSeed(phrase: string): Promise<string> {
  const seed = await bip39.mnemonicToSeed(phrase.trim().toLowerCase());
  return seed.toString('hex');
}

/**
 * Short identifier for a recovery phrase (for UI hints).
 * First 4 words.
 */
export function getPhraseHint(phrase: string): string {
  return phrase.split(' ').slice(0, 4).join(' ') + '...';
}
