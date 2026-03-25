import {
  validateFolderName,
  validateFileName,
  validatePassword,
  validatePasswordConfirmation,
} from '../../../renderer/utils/validation';

describe('validateFolderName', () => {
  it('should accept a valid folder name', () => {
    expect(validateFolderName('MyFolder')).toEqual({ isValid: true });
  });

  it('should accept names with spaces', () => {
    expect(validateFolderName('My Folder')).toEqual({ isValid: true });
  });

  it('should reject empty name', () => {
    const result = validateFolderName('');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.folder.errors.empty');
  });

  it('should reject whitespace-only name', () => {
    const result = validateFolderName('   ');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.folder.errors.empty');
  });

  it('should reject names longer than 255 characters', () => {
    const longName = 'a'.repeat(256);
    const result = validateFolderName(longName);
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.folder.errors.tooLong');
  });

  it('should accept names exactly 255 characters', () => {
    const name = 'a'.repeat(255);
    expect(validateFolderName(name)).toEqual({ isValid: true });
  });

  it('should reject names with invalid characters', () => {
    const invalidNames = [
      'my<folder',
      'my>folder',
      'my:folder',
      'my"folder',
      'my/folder',
      'my\\folder',
      'my|folder',
      'my?folder',
      'my*folder',
    ];
    invalidNames.forEach((name) => {
      const result = validateFolderName(name);
      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe('dialog.folder.errors.invalidChars');
    });
  });

  it('should reject reserved Windows names', () => {
    const reserved = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM9',
      'LPT1',
      'LPT9',
    ];
    reserved.forEach((name) => {
      const result = validateFolderName(name);
      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe('dialog.folder.errors.reservedName');
    });
  });

  it('should reject reserved names case-insensitively', () => {
    const result = validateFolderName('con');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.folder.errors.reservedName');
  });

  it('should reject names starting with a dot', () => {
    const result = validateFolderName('.hidden');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.folder.errors.startsWithDot');
  });

  it('should reject names ending with dot', () => {
    expect(validateFolderName('folder.')).toEqual(
      expect.objectContaining({ isValid: false }),
    );
  });

  it('should trim whitespace before validation', () => {
    // Name with trailing space is trimmed first, so 'folder ' becomes 'folder' (valid)
    expect(validateFolderName('folder ')).toEqual({ isValid: true });
  });
});

describe('validateFileName', () => {
  it('should accept a valid file name', () => {
    expect(validateFileName('document')).toEqual({ isValid: true });
  });

  it('should reject empty name', () => {
    const result = validateFileName('');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.emptyName');
  });

  it('should reject names longer than 255 characters', () => {
    const result = validateFileName('a'.repeat(256));
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.tooLong');
  });

  it('should reject invalid characters', () => {
    const result = validateFileName('file<name');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.invalidChars');
  });

  it('should reject reserved names', () => {
    const result = validateFileName('NUL');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.reservedName');
  });

  it('should reject names starting with dot', () => {
    const result = validateFileName('.gitignore');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.startsWithDot');
  });

  it('should reject names ending with dot or space', () => {
    expect(validateFileName('file.')).toEqual(
      expect.objectContaining({ isValid: false }),
    );
  });
});

describe('validatePassword', () => {
  it('should accept a valid password with special char', () => {
    expect(validatePassword('mypass!')).toEqual({ isValid: true });
  });

  it('should reject empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.emptyPassword');
  });

  it('should reject password shorter than 6 chars', () => {
    const result = validatePassword('ab!');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.weakPassword');
  });

  it('should reject password longer than 128 chars', () => {
    const result = validatePassword('a!'.repeat(65));
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.passwordTooLong');
  });

  it('should reject password without special character', () => {
    const result = validatePassword('abcdef');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.passwordSpecialChars');
  });

  it('should accept various special characters', () => {
    const specials = ['@', '#', '$', '%', '!', '^', '&', '*', '(', ')'];
    specials.forEach((char) => {
      expect(validatePassword(`abcde${char}`)).toEqual({ isValid: true });
    });
  });
});

describe('validatePasswordConfirmation', () => {
  it('should pass when passwords match', () => {
    expect(validatePasswordConfirmation('pass!1', 'pass!1')).toEqual({
      isValid: true,
    });
  });

  it('should fail when passwords do not match', () => {
    const result = validatePasswordConfirmation('pass!1', 'pass!2');
    expect(result.isValid).toBe(false);
    expect(result.errorKey).toBe('dialog.file.errors.passwordMismatch');
  });
});
