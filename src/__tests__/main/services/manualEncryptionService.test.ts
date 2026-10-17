import crypto from 'crypto';
import { manualEncryptionService } from '../../../main/services/manualEncryptionService';

describe('manualEncryptionService', () => {
  const testContent = 'Hello, this is secret content!';
  const testPassword = 'strongP@ss123';
  const testExtension = '.txt';

  describe('encryptContent / decryptContent', () => {
    it('should encrypt and decrypt content back to original', async () => {
      const encrypted = await manualEncryptionService.encryptContent(
        testContent,
        testPassword,
        testExtension,
      );

      expect(encrypted.type).toBe('lockrnotes-manual-encrypted');
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.version).toBe('2.0');
      expect(encrypted.originalExtension).toBe(testExtension);
      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();
      expect(encrypted.salt).toBeTruthy();
      expect(encrypted.created).toBeTruthy();

      const decrypted = await manualEncryptionService.decryptContent(
        encrypted,
        testPassword,
      );
      expect(decrypted).toBe(testContent);
    });

    it('should produce different ciphertexts for same input (random IV/salt)', async () => {
      const enc1 = await manualEncryptionService.encryptContent(
        testContent,
        testPassword,
        testExtension,
      );
      const enc2 = await manualEncryptionService.encryptContent(
        testContent,
        testPassword,
        testExtension,
      );
      expect(enc1.encrypted).not.toBe(enc2.encrypted);
      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.salt).not.toBe(enc2.salt);
    });

    it('should decrypt a version 1.0 file', async () => {
      const salt = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      const key = crypto.pbkdf2Sync(testPassword, salt, 100000, 32, 'sha256');
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([
        cipher.update('legacy secret', 'utf8'),
        cipher.final(),
      ]).toString('base64');

      const decrypted = await manualEncryptionService.decryptContent(
        {
          type: 'lockrnotes-manual-encrypted',
          algorithm: 'aes-256-gcm',
          version: '1.0',
          originalExtension: '.txt',
          encrypted,
          iv: iv.toString('base64'),
          authTag: cipher.getAuthTag().toString('base64'),
          salt: salt.toString('base64'),
          created: new Date().toISOString(),
        },
        testPassword,
      );
      expect(decrypted).toBe('legacy secret');
    });

    it('should fail decryption with wrong password', async () => {
      const encrypted = await manualEncryptionService.encryptContent(
        testContent,
        testPassword,
        testExtension,
      );

      await expect(
        manualEncryptionService.decryptContent(encrypted, 'wrongPassword'),
      ).rejects.toThrow('Failed to decrypt');
    });

    it('should fail decryption with corrupted data', async () => {
      const encrypted = await manualEncryptionService.encryptContent(
        testContent,
        testPassword,
        testExtension,
      );

      const corrupted = { ...encrypted, encrypted: 'corrupted_data' };
      await expect(
        manualEncryptionService.decryptContent(corrupted, testPassword),
      ).rejects.toThrow();
    });

    it('should fail decryption with invalid format type', async () => {
      const encrypted = await manualEncryptionService.encryptContent(
        testContent,
        testPassword,
        testExtension,
      );

      const invalid = { ...encrypted, type: 'wrong-type' as any };
      await expect(
        manualEncryptionService.decryptContent(invalid, testPassword),
      ).rejects.toThrow('Invalid encrypted file format');
    });

    it('should handle empty content', async () => {
      const encrypted = await manualEncryptionService.encryptContent(
        '',
        testPassword,
        testExtension,
      );
      const decrypted = await manualEncryptionService.decryptContent(
        encrypted,
        testPassword,
      );
      expect(decrypted).toBe('');
    });

    it('should handle unicode content', async () => {
      const unicodeContent = '日本語テスト 🔒 émojis and àccénts';
      const encrypted = await manualEncryptionService.encryptContent(
        unicodeContent,
        testPassword,
        testExtension,
      );
      const decrypted = await manualEncryptionService.decryptContent(
        encrypted,
        testPassword,
      );
      expect(decrypted).toBe(unicodeContent);
    });

    it('should handle large content', async () => {
      const largeContent = 'x'.repeat(100_000);
      const encrypted = await manualEncryptionService.encryptContent(
        largeContent,
        testPassword,
        testExtension,
      );
      const decrypted = await manualEncryptionService.decryptContent(
        encrypted,
        testPassword,
      );
      expect(decrypted).toBe(largeContent);
    });
  });

  describe('isContentManuallyEncrypted', () => {
    it('should return true for valid encrypted JSON', async () => {
      const encrypted = await manualEncryptionService.encryptContent(
        testContent,
        testPassword,
        testExtension,
      );
      const json = JSON.stringify(encrypted);
      expect(manualEncryptionService.isContentManuallyEncrypted(json)).toBe(
        true,
      );
    });

    it('should return false for non-JSON content', () => {
      expect(
        manualEncryptionService.isContentManuallyEncrypted('plain text'),
      ).toBe(false);
    });

    it('should return false for JSON without correct type', () => {
      const data = JSON.stringify({ type: 'something-else' });
      expect(manualEncryptionService.isContentManuallyEncrypted(data)).toBe(
        false,
      );
    });

    it('should return false for empty string', () => {
      expect(manualEncryptionService.isContentManuallyEncrypted('')).toBe(
        false,
      );
    });
  });

  describe('getOriginalExtension', () => {
    it('should return original extension from encrypted content', async () => {
      const encrypted = await manualEncryptionService.encryptContent(
        testContent,
        testPassword,
        '.json',
      );
      const json = JSON.stringify(encrypted);
      expect(manualEncryptionService.getOriginalExtension(json)).toBe('.json');
    });

    it('should return null for non-encrypted content', () => {
      expect(
        manualEncryptionService.getOriginalExtension('plain text'),
      ).toBeNull();
    });

    it('should return null for JSON with wrong type', () => {
      const data = JSON.stringify({ type: 'other', originalExtension: '.txt' });
      expect(manualEncryptionService.getOriginalExtension(data)).toBeNull();
    });
  });
});
