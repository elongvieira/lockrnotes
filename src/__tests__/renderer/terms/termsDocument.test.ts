import {
  TERMS_DOCUMENT_KEY,
  TERMS_VERSION,
  buildTermsAcceptanceRecord,
  computeTermsChecksum,
  verifyTermsAcceptance,
} from '../../../renderer/terms/termsDocument';

describe('termsDocument', () => {
  it('builds a stable checksum for the same locale', async () => {
    const first = await computeTermsChecksum('pt-BR');
    const second = await computeTermsChecksum('pt-BR');
    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it('validates an acceptance record built from the current terms', async () => {
    const record = await buildTermsAcceptanceRecord('en');
    expect(record.documentKey).toBe(TERMS_DOCUMENT_KEY);
    expect(record.version).toBe(TERMS_VERSION);
    expect(await verifyTermsAcceptance(record)).toBe(true);
  });

  it('rejects tampered checksum', async () => {
    const record = await buildTermsAcceptanceRecord('pt-BR');
    const tampered = { ...record, contentSha256: '0'.repeat(64) };
    expect(await verifyTermsAcceptance(tampered)).toBe(false);
  });
});
