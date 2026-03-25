/**
 * Service to manage a session key for encrypting passwords in memory
 * The session key is generated randomly when the app starts and exists only in memory
 */

class SessionKeyService {
  private sessionKey: Uint8Array | null = null;

  /**
   * Initialize a new random session key
   * Called once when the app starts
   */
  initialize(): void {
    // Generate a random 256-bit key (32 bytes)
    this.sessionKey = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array;
  }

  /**
   * Get the current session key
   */
  getSessionKey(): Uint8Array {
    if (!this.sessionKey) {
      throw new Error('Session key not initialized');
    }
    return this.sessionKey;
  }

  /**
   * Clear the session key from memory
   * Called when the app closes
   */
  clear(): void {
    this.sessionKey = null;
  }

  /**
   * Encrypt a password using the session key
   */
  async encryptPassword(password: string): Promise<string> {
    const sessionKey = this.getSessionKey();

    // Convert password to buffer
    const passwordBuffer = new TextEncoder().encode(password);

    // Import the session key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      sessionKey.buffer as ArrayBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt'],
    );

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array;

    // Encrypt the password
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      cryptoKey,
      passwordBuffer,
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...Array.from(combined)));
  }

  /**
   * Decrypt a password using the session key
   */
  async decryptPassword(encryptedPassword: string): Promise<string> {
    const sessionKey = this.getSessionKey();

    // Import the session key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      sessionKey.buffer as ArrayBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedPassword), (c) =>
      c.charCodeAt(0),
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt the password
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      cryptoKey,
      encryptedData,
    );

    // Convert back to string
    return new TextDecoder().decode(decryptedBuffer);
  }
}

export const sessionKeyService = new SessionKeyService();
