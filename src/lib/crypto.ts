/**
 * Cryptography Module for E2EE Communicator
 * Utilizes Web Crypto API for secure key management and encryption.
 */

// Helper to convert ArrayBuffer to Base64
export const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
};

// Helper to convert Base64 to ArrayBuffer
export const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 */
export async function deriveMasterKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates an RSA-OAEP Key Pair for E2EE.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a private key using a master key (for storage).
 */
export async function encryptPrivateKey(privateKey: CryptoKey, masterKey: CryptoKey): Promise<{ encrypted: string; iv: string }> {
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    exported
  );

  return {
    encrypted: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts a private key using a master key (on login).
 */
export async function decryptPrivateKey(encryptedBase64: string, ivBase64: string, masterKey: CryptoKey): Promise<CryptoKey> {
  const encrypted = base64ToBuffer(encryptedBase64);
  const iv = base64ToBuffer(ivBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    masterKey,
    encrypted as BufferSource
  );

  return window.crypto.subtle.importKey(
    'pkcs8',
    decrypted,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
}

/**
 * Encrypts data with a symmetric key (AES-GCM).
 */
export async function encryptData(data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(data)
  );

  return {
    encrypted: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts data with a symmetric key (AES-GCM).
 */
export async function decryptData(encryptedBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const encrypted = base64ToBuffer(encryptedBase64);
  const iv = base64ToBuffer(ivBase64);
  const dec = new TextDecoder();

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encrypted as BufferSource
  );

  return dec.decode(decrypted);
}

/**
 * Export a public key to Base64 string for storage.
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return bufferToBase64(exported);
}

/**
 * Import a public key from Base64 string.
 */
export async function importPublicKey(publicBase64: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(publicBase64);
  return window.crypto.subtle.importKey(
    'spki',
    buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

/**
 * Encrypts a message key with a recipient's public key (RSA-OAEP).
 */
export async function encryptMessageKey(messageKey: CryptoKey, recipientPublicKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', messageKey);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    exported
  );
  return bufferToBase64(encrypted);
}

/**
 * Decrypts a message key with own private key.
 */
export async function decryptMessageKey(encryptedKeyBase64: string, privateKey: CryptoKey): Promise<CryptoKey> {
  const encrypted = base64ToBuffer(encryptedKeyBase64);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encrypted
  );

  return window.crypto.subtle.importKey(
    'raw',
    decrypted,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates a random AES-GCM key for a message.
 */
export async function generateMessageKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
