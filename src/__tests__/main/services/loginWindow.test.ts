import {
  resolveLoginPartition,
  SHARED_LOGIN_PARTITION,
} from '../../../main/services/loginWindow';

describe('resolveLoginPartition', () => {
  it('uses the shared partition when shareSession is true', () => {
    expect(
      resolveLoginPartition({
        shareSession: true,
        sessionId: 'sess_abc',
      }),
    ).toBe(SHARED_LOGIN_PARTITION);
  });

  it('isolates by session id', () => {
    expect(resolveLoginPartition({ sessionId: 'sess_abc' })).toBe(
      'persist:lockr-web-login-id-sess_abc',
    );
    expect(resolveLoginPartition({ sessionId: 'sess_xyz' })).toBe(
      'persist:lockr-web-login-id-sess_xyz',
    );
  });

  it('does not let a session id collide with the shared partition', () => {
    expect(resolveLoginPartition({ sessionId: 'shared' })).not.toBe(
      SHARED_LOGIN_PARTITION,
    );
  });

  it('sanitizes unsafe session ids', () => {
    expect(resolveLoginPartition({ sessionId: 'sess/../evil;drop' })).toBe(
      'persist:lockr-web-login-id-sess____evil_drop',
    );
  });

  it('falls back to an isolated partition when session id is missing', () => {
    expect(resolveLoginPartition({})).toBe(
      'persist:lockr-web-login-id-missing',
    );
    expect(resolveLoginPartition({ shareSession: false })).toBe(
      'persist:lockr-web-login-id-missing',
    );
  });
});
