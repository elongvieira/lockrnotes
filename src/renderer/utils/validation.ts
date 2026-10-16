// Utility functions for form validation

// Reserved names that cannot be used for files/folders
const RESERVED_NAMES = [
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
];

export interface ValidationResult {
  isValid: boolean;
  errorKey?: string;
  fallbackMessage?: string;
}

export const validateFolderName = (name: string): ValidationResult => {
  const trimmedName = name.trim();

  // Check if empty
  if (!trimmedName) {
    return {
      isValid: false,
      errorKey: 'dialog.folder.errors.empty',
      fallbackMessage: 'Folder name cannot be empty',
    };
  }

  // Check length (most file systems have 255 character limit)
  if (trimmedName.length > 255) {
    return {
      isValid: false,
      errorKey: 'dialog.folder.errors.tooLong',
      fallbackMessage: 'Folder name is too long (maximum 255 characters)',
    };
  }

  // Check for invalid characters
  // eslint-disable-next-line no-control-regex
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(trimmedName)) {
    return {
      isValid: false,
      errorKey: 'dialog.folder.errors.invalidChars',
      fallbackMessage: 'Folder name contains invalid characters',
    };
  }

  // Check for reserved names (Windows)
  const nameWithoutExtension = trimmedName.split('.')[0].toUpperCase();
  if (RESERVED_NAMES.includes(nameWithoutExtension)) {
    return {
      isValid: false,
      errorKey: 'dialog.folder.errors.reservedName',
      fallbackMessage: 'This is a reserved system name',
    };
  }

  // Check if starts with dot (hidden files/folders)
  if (trimmedName.startsWith('.')) {
    return {
      isValid: false,
      errorKey: 'dialog.folder.errors.startsWithDot',
      fallbackMessage: 'Folder name cannot start with a dot',
    };
  }

  // Check if ends with space or dot (Windows restriction)
  if (trimmedName.endsWith(' ') || trimmedName.endsWith('.')) {
    return {
      isValid: false,
      errorKey: 'dialog.folder.errors.invalidChars',
      fallbackMessage: 'Folder name cannot end with space or dot',
    };
  }

  return { isValid: true };
};

export const validateFileName = (name: string): ValidationResult => {
  const trimmedName = name.trim();

  // Check if empty
  if (!trimmedName) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.emptyName',
      fallbackMessage: 'File name is required',
    };
  }

  // Check length
  if (trimmedName.length > 255) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.tooLong',
      fallbackMessage: 'File name is too long (maximum 255 characters)',
    };
  }

  // Check for invalid characters
  // eslint-disable-next-line no-control-regex
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(trimmedName)) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.invalidChars',
      fallbackMessage: 'File name contains invalid characters',
    };
  }

  // Check for reserved names
  const nameWithoutExtension = trimmedName.split('.')[0].toUpperCase();
  if (RESERVED_NAMES.includes(nameWithoutExtension)) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.reservedName',
      fallbackMessage: 'This is a reserved system name',
    };
  }

  // Check if starts with dot
  if (trimmedName.startsWith('.')) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.startsWithDot',
      fallbackMessage: 'File name cannot start with a dot',
    };
  }

  // Check if ends with space or dot
  if (trimmedName.endsWith(' ') || trimmedName.endsWith('.')) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.invalidChars',
      fallbackMessage: 'File name cannot end with space or dot',
    };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  // Check if empty
  if (!password) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.emptyPassword',
      fallbackMessage: 'Password is required',
    };
  }

  // Length matters more than a required symbol.
  if (password.length < 12) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.weakPassword',
      fallbackMessage: 'Password must be at least 12 characters',
    };
  }

  // Check maximum length
  if (password.length > 128) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.passwordTooLong',
      fallbackMessage: 'Password is too long (maximum 128 characters)',
    };
  }

  return { isValid: true };
};

export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string,
): ValidationResult => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      errorKey: 'dialog.file.errors.passwordMismatch',
      fallbackMessage: 'Passwords do not match',
    };
  }

  return { isValid: true };
};
