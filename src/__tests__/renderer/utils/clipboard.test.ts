import { shouldClearClipboard } from '../../../renderer/utils/clipboard';

describe('shouldClearClipboard', () => {
  it('clears only the value this app copied', () => {
    expect(shouldClearClipboard('secret', 'secret')).toBe(true);
    expect(shouldClearClipboard('something else', 'secret')).toBe(false);
    expect(shouldClearClipboard('', '')).toBe(false);
  });
});
