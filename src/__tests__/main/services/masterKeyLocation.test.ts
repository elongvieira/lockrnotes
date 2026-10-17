import path from 'path';
import {
  headerLooksManaged,
  resolveMasterKeyPath,
} from '../../../main/services/masterKeyLocation';

describe('resolveMasterKeyPath', () => {
  it('keeps the system key inside user data', () => {
    expect(
      resolveMasterKeyPath({
        storageType: 'system',
        defaultPath: 'D:/notes',
        userDataPath: 'C:/Users/me/AppData/Roaming/lockrnotes',
      }),
    ).toBe(
      path.join(
        'C:/Users/me/AppData/Roaming/lockrnotes',
        'encryption',
        '.lockrnotes_key',
      ),
    );
  });

  it('follows the selected folder when storage is folder', () => {
    expect(
      resolveMasterKeyPath({
        storageType: 'folder',
        defaultPath: 'D:/vault',
        userDataPath: 'C:/userData',
      }),
    ).toBe(path.join('D:/vault', '.lockrnotes', '.lockrnotes_key'));
  });
});

describe('headerLooksManaged', () => {
  it('recognizes managed files and ignores password files', () => {
    expect(headerLooksManaged('{\n  "type": "lockrnotes-encrypted"')).toBe(
      true,
    );
    expect(headerLooksManaged('{"type":"lockrnotes-manual-encrypted"}')).toBe(
      false,
    );
    expect(headerLooksManaged('plain text')).toBe(false);
  });
});
