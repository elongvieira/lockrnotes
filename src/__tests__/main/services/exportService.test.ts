import path from 'path';
import { exportEntryName } from '../../../main/services/exportNames';

describe('exportEntryName', () => {
  it('replaces the file extension without touching a parent folder', () => {
    const relative = path.join('notes.txt', 'secret.ltxt');
    expect(exportEntryName(relative, '.txt')).toBe(
      path.join('notes.txt', 'secret.txt'),
    );
  });
});
