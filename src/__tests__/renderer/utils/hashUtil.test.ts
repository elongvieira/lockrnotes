import { generateHash } from '../../../renderer/utils/hashUtil';

describe('hashUtil', () => {
  beforeAll(() => {
    // Polyfill crypto if not available in Jest environment
    if (typeof global.crypto === 'undefined' || !global.crypto.subtle) {
      Object.defineProperty(global, 'crypto', {
        value: {
          subtle: {
            digest: async (algorithm: any, data: any) => {
              return require('crypto').createHash('sha256').update(data).digest();
            }
          }
        },
        writable: true
      });
    }
  });

  it('should generate a correct SHA-256 hash for a given string', async () => {
    const input = 'hello world';
    // sha256('hello world') = b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
    const expectedHash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
    
    const hash = await generateHash(input);
    expect(hash).toBe(expectedHash);
  });

  it('should generate different hashes for different inputs', async () => {
    const hash1 = await generateHash('input 1');
    const hash2 = await generateHash('input 2');
    
    expect(hash1).not.toBe(hash2);
  });

  it('should generate the same hash for the same input', async () => {
    const input = 'consistent input';
    const hash1 = await generateHash(input);
    const hash2 = await generateHash(input);
    
    expect(hash1).toBe(hash2);
  });

  it('should handle empty strings', async () => {
    const input = '';
    // sha256('') = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const expectedHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    
    const hash = await generateHash(input);
    expect(hash).toBe(expectedHash);
  });
});
