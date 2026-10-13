import {
  LOCKR_MACRO_CONSOLE_PREFIX,
  parseMacroConsoleMessage,
} from '../../../main/services/customLoginRecorder';

describe('parseMacroConsoleMessage', () => {
  it('returns null for unrelated logs', () => {
    expect(parseMacroConsoleMessage('hello')).toBeNull();
  });

  it('parses a click step', () => {
    const step = {
      id: 's1',
      kind: 'click',
      label: 'SSO',
      selector: 'button',
      text: 'SSO',
    };
    const parsed = parseMacroConsoleMessage(
      `${LOCKR_MACRO_CONSOLE_PREFIX}${JSON.stringify({ op: 'step', step })}`,
    );
    expect(parsed).toEqual({ op: 'step', step });
  });

  it('parses a stop message', () => {
    const parsed = parseMacroConsoleMessage(
      `${LOCKR_MACRO_CONSOLE_PREFIX}${JSON.stringify({ op: 'stop' })}`,
    );
    expect(parsed).toEqual({ op: 'stop' });
  });
});
