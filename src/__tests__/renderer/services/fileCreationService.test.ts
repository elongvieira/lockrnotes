// Tests for fileCreationService pure functions
// We test the public methods that don't require IPC (sanitization, extension mapping, templates)

// Since fileCreationService is a class with private methods, we test through the public API
// The IPC-dependent methods (createFile) are not tested here

import { fileCreationService } from '../../../renderer/services/fileCreationService';

beforeAll(() => {
  const mockFilesystem = {
    readDirectory: jest.fn(),
    getItem: jest.fn(),
    createDirectory: jest.fn(),
    createFile: jest.fn(),
    saveFile: jest.fn(),
    readFile: jest.fn(),
    deleteItem: jest.fn(),
    renameItem: jest.fn(),
    readConfig: jest.fn(),
    updateConfig: jest.fn(),
    getDefaultNotesDirectory: jest.fn(),
    itemExists: jest.fn(),
    decryptFile: jest.fn(),
    copyDirectory: jest.fn(),
  };

  const mockSystem = {
    getPathSeparator: jest.fn().mockResolvedValue('\\'),
  };

  Object.defineProperty(window, 'electron', {
    value: { filesystem: mockFilesystem, system: mockSystem },
    writable: true,
  });
  Object.defineProperty(window, 'encryptionAPI', {
    value: { encryptContent: jest.fn(), decryptContent: jest.fn() },
    writable: true,
  });
  Object.defineProperty(window, 'manualEncryptionAPI', {
    value: { encryptContent: jest.fn(), decryptContent: jest.fn() },
    writable: true,
  });
});

describe('fileCreationService', () => {
  describe('getEncryptedExtension', () => {
    it('should return .ltxt for .txt files', () => {
      expect(fileCreationService.getEncryptedExtension('.txt')).toBe('.ltxt');
    });

    it('should return .ljson for .json files', () => {
      expect(fileCreationService.getEncryptedExtension('.json')).toBe('.ljson');
    });

    it('should return .lenc for unknown extensions', () => {
      expect(fileCreationService.getEncryptedExtension('.md')).toBe('.lenc');
      expect(fileCreationService.getEncryptedExtension('.xml')).toBe('.lenc');
    });
  });

  describe('getAvailableTypes', () => {
    it('should return text and keyvalue types', () => {
      const types = fileCreationService.getAvailableTypes();
      expect(types).toContain('text');
      expect(types).toContain('keyvalue');
      expect(types.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getTemplate', () => {
    it('should return a template for text type', () => {
      const template = fileCreationService.getTemplate('text');
      expect(template).toBeDefined();
      expect(template?.extension).toBe('.txt');
      expect(typeof template?.generateContent).toBe('function');
    });

    it('should return a template for keyvalue type', () => {
      const template = fileCreationService.getTemplate('keyvalue');
      expect(template).toBeDefined();
      expect(template?.extension).toBe('.json');
    });

    it('should return undefined for unknown type', () => {
      expect(fileCreationService.getTemplate('unknown')).toBeUndefined();
    });
  });

  describe('registerTemplate', () => {
    it('should register a custom template', () => {
      fileCreationService.registerTemplate('markdown', {
        extension: '.md',
        generateContent: (name: string) => `# ${name}`,
      });
      const template = fileCreationService.getTemplate('markdown');
      expect(template).toBeDefined();
      expect(template?.extension).toBe('.md');
      expect(template?.generateContent('Test')).toBe('# Test');
    });
  });

  describe('generatePreview', () => {
    it('should generate text preview', () => {
      const preview = fileCreationService.generatePreview('MyNote', 'text');
      expect(preview).toContain('MyNote');
    });

    it('should generate keyvalue preview as valid JSON', () => {
      const preview = fileCreationService.generatePreview('Config', 'keyvalue');
      const parsed = JSON.parse(preview);
      expect(parsed.name).toBe('Config');
    });

    it('should return error message for unknown type', () => {
      const preview = fileCreationService.generatePreview(
        'file',
        'nonexistent',
      );
      expect(preview).toBeTruthy();
    });

    it('should use "exemplo" as fallback for empty filename', () => {
      const preview = fileCreationService.generatePreview('', 'text');
      expect(preview).toContain('exemplo');
    });
  });

  describe('isEncryptionSupported', () => {
    it('should return true', () => {
      expect(fileCreationService.isEncryptionSupported()).toBe(true);
    });
  });
});
