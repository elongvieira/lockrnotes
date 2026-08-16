import { buildWebLoginFillScript } from '../../../main/services/webLoginFillScript';

describe('buildWebLoginFillScript', () => {
  it('embeds credentials as JSON strings', () => {
    const username = 'user@site.com';
    const password = 'p@ss"word';
    const script = buildWebLoginFillScript(username, password);
    expect(script).toContain(`const USERNAME = ${JSON.stringify(username)};`);
    expect(script).toContain(`const PASSWORD = ${JSON.stringify(password)};`);
    expect(script).toContain('new-password');
    expect(script).toContain('__lockrWebLoginCleanup');
  });
});
