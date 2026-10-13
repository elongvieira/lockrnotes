import {
  createEntry,
  createLoginSessionId,
  loginSessionOptions,
  parseJsonContent,
  serializeJsonContent,
  JsonEntry,
} from '../../../renderer/types/jsonEntry';

describe('createEntry', () => {
  it('should create a keyValue entry with defaults', () => {
    const entry = createEntry('keyValue', {});
    expect(entry.type).toBe('keyValue');
    expect(entry.id).toMatch(/^entry_/);
    expect((entry as any).title).toBe('');
    expect((entry as any).value).toBe('');
  });

  it('should create a keyValue entry with provided data', () => {
    const entry = createEntry('keyValue', {
      title: 'Name',
      value: 'John',
    } as any);
    expect(entry.type).toBe('keyValue');
    expect((entry as any).title).toBe('Name');
    expect((entry as any).value).toBe('John');
  });

  it('should create a titleTwoValues entry', () => {
    const entry = createEntry('titleTwoValues', {
      title: 'Server',
      value1: 'user',
      value2: 'url',
    } as any);
    expect(entry.type).toBe('titleTwoValues');
    expect((entry as any).title).toBe('Server');
    expect((entry as any).value1).toBe('user');
    expect((entry as any).value2).toBe('url');
  });

  it('should create a titlePassword entry', () => {
    const entry = createEntry('titlePassword', {
      title: 'WiFi',
      password: 'secret',
    } as any);
    expect(entry.type).toBe('titlePassword');
    expect((entry as any).title).toBe('WiFi');
    expect((entry as any).password).toBe('secret');
  });

  it('should create a titleValuePassword entry', () => {
    const entry = createEntry('titleValuePassword', {
      title: 'DB',
      value: 'host',
      password: 'pass',
    } as any);
    expect(entry.type).toBe('titleValuePassword');
    expect((entry as any).value).toBe('host');
    expect((entry as any).password).toBe('pass');
  });

  it('should create a titleTwoValuesPassword entry', () => {
    const entry = createEntry('titleTwoValuesPassword', {
      title: 'Server',
      value1: 'user',
      value2: 'key',
      password: 'pass',
    } as any);
    expect(entry.type).toBe('titleTwoValuesPassword');
    expect((entry as any).value1).toBe('user');
    expect((entry as any).value2).toBe('key');
    expect((entry as any).password).toBe('pass');
  });

  it('should generate unique IDs', () => {
    const entry1 = createEntry('keyValue', {});
    const entry2 = createEntry('keyValue', {});
    expect(entry1.id).not.toBe(entry2.id);
  });

  it('should create a webLogin entry with defaults', () => {
    const entry = createEntry('webLogin', {});
    expect(entry.type).toBe('webLogin');
    expect((entry as any).title).toBe('');
    expect((entry as any).url).toBe('');
    expect((entry as any).user).toBe('');
    expect((entry as any).password).toBe('');
    expect((entry as any).shareSession).toBe(false);
    expect((entry as any).sessionId).toMatch(/^sess_/);
  });

  it('should create a webLogin entry with provided data', () => {
    const entry = createEntry('webLogin', {
      title: 'GitHub',
      url: 'https://github.com/login',
      user: 'me@example.com',
      password: 'secret',
    } as any);
    expect(entry.type).toBe('webLogin');
    expect((entry as any).title).toBe('GitHub');
    expect((entry as any).url).toBe('https://github.com/login');
    expect((entry as any).user).toBe('me@example.com');
    expect((entry as any).password).toBe('secret');
    expect((entry as any).shareSession).toBe(false);
  });

  it('should keep webLogin session options when provided', () => {
    const entry = createEntry('webLogin', {
      title: 'GitHub',
      url: 'https://github.com/login',
      user: 'me@example.com',
      password: 'secret',
      shareSession: true,
      sessionId: 'sess_shared_1',
    } as any);
    expect((entry as any).shareSession).toBe(true);
    expect((entry as any).sessionId).toBe('sess_shared_1');
  });

  it('should create a customLogin entry with defaults', () => {
    const entry = createEntry('customLogin', {});
    expect(entry.type).toBe('customLogin');
    expect((entry as any).title).toBe('');
    expect((entry as any).url).toBe('');
    expect((entry as any).steps).toEqual([]);
    expect((entry as any).shareSession).toBe(false);
    expect((entry as any).sessionId).toMatch(/^sess_/);
  });

  it('should create a customLogin entry with provided steps', () => {
    const steps = [
      { id: 's1', kind: 'click', label: 'SSO', selector: 'button.sso' },
      {
        id: 's2',
        kind: 'type',
        label: 'Organization',
        selector: '#org',
        value: 'acme',
      },
    ];
    const entry = createEntry('customLogin', {
      title: 'Okta',
      url: 'https://example.com',
      steps,
    } as any);
    expect(entry.type).toBe('customLogin');
    expect((entry as any).url).toBe('https://example.com');
    expect((entry as any).steps).toEqual(steps);
    expect((entry as any).shareSession).toBe(false);
  });

  it('should keep customLogin session options when provided', () => {
    const entry = createEntry('customLogin', {
      title: 'Okta',
      url: 'https://example.com',
      steps: [],
      shareSession: true,
      sessionId: 'sess_okta',
    } as any);
    expect((entry as any).shareSession).toBe(true);
    expect((entry as any).sessionId).toBe('sess_okta');
  });

  it('should throw on unknown entry type', () => {
    expect(() => createEntry('unknown' as any, {})).toThrow(
      'Unknown entry type',
    );
  });
});

describe('parseJsonContent', () => {
  it('should parse valid JSON with entries array', () => {
    const content = JSON.stringify({
      entries: [{ id: '1', type: 'keyValue', title: 'Key', value: 'Val' }],
    });
    const result = parseJsonContent(content);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('keyValue');
  });

  it('should return empty array for invalid JSON', () => {
    expect(parseJsonContent('not json')).toEqual([]);
  });

  it('should return empty array for JSON without entries', () => {
    expect(parseJsonContent(JSON.stringify({ foo: 'bar' }))).toEqual([]);
  });

  it('should return empty array for JSON where entries is not an array', () => {
    expect(parseJsonContent(JSON.stringify({ entries: 'not array' }))).toEqual(
      [],
    );
  });

  it('should return empty array for empty string', () => {
    expect(parseJsonContent('')).toEqual([]);
  });
});

describe('serializeJsonContent', () => {
  it('should serialize entries to formatted JSON', () => {
    const entries: JsonEntry[] = [
      { id: '1', type: 'keyValue', title: 'Key', value: 'Val' },
    ];
    const result = serializeJsonContent(entries);
    const parsed = JSON.parse(result);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].title).toBe('Key');
  });

  it('should serialize empty array', () => {
    const result = serializeJsonContent([]);
    const parsed = JSON.parse(result);
    expect(parsed.entries).toEqual([]);
  });

  it('should produce indented output', () => {
    const entries: JsonEntry[] = [
      { id: '1', type: 'keyValue', title: 'A', value: 'B' },
    ];
    const result = serializeJsonContent(entries);
    expect(result).toContain('\n');
    expect(result).toContain('  ');
  });

  it('should roundtrip with parseJsonContent', () => {
    const entries: JsonEntry[] = [
      { id: '1', type: 'keyValue', title: 'K', value: 'V' },
      { id: '2', type: 'titlePassword', title: 'T', password: 'P' },
    ];
    const serialized = serializeJsonContent(entries);
    const parsed = parseJsonContent(serialized);
    expect(parsed).toEqual(entries);
  });
});

describe('loginSessionOptions', () => {
  it('isolates by sessionId and falls back to entry id', () => {
    expect(
      loginSessionOptions({
        id: 'entry_1',
        sessionId: 'sess_abc',
      }),
    ).toEqual({ shareSession: false, sessionId: 'sess_abc' });
    expect(loginSessionOptions({ id: 'entry_legacy' })).toEqual({
      shareSession: false,
      sessionId: 'entry_legacy',
    });
  });

  it('keeps the share flag when enabled', () => {
    expect(
      loginSessionOptions({
        id: 'entry_1',
        shareSession: true,
        sessionId: 'sess_abc',
      }),
    ).toEqual({ shareSession: true, sessionId: 'sess_abc' });
  });

  it('creates unique login session ids', () => {
    expect(createLoginSessionId()).not.toBe(createLoginSessionId());
  });
});
