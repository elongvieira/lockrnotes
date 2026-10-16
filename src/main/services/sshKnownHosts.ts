import fs from 'fs/promises';
import path from 'path';
import { app, dialog } from 'electron';
import { readConfigFile } from '../config';
import {
  classifyHostKey,
  hostEndpoint,
  hostKeyFingerprint,
  type KnownHostStore,
} from './sshHostKey';

function storePath(): string {
  return path.join(app.getPath('userData'), 'ssh-known-hosts.json');
}

async function loadStore(): Promise<KnownHostStore> {
  try {
    const parsed = JSON.parse(await fs.readFile(storePath(), 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const store: KnownHostStore = {};
    Object.entries(parsed).forEach(([endpoint, fingerprint]) => {
      if (typeof fingerprint === 'string') {
        store[endpoint] = fingerprint;
      }
    });
    return store;
  } catch {
    return {};
  }
}

async function saveStore(store: KnownHostStore): Promise<void> {
  const destination = storePath();
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const tmpPath = `${destination}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(store, null, 2), 'utf8');
  await fs.rename(tmpPath, destination);
}

async function confirmChangedKey(
  endpoint: string,
  stored: string,
  presented: string,
): Promise<boolean> {
  const config = await readConfigFile();
  const portuguese =
    !config?.language || String(config.language).startsWith('pt');
  const result = await dialog.showMessageBox({
    type: 'warning',
    buttons: portuguese
      ? ['Cancelar', 'Confiar na nova chave']
      : ['Cancel', 'Trust the new key'],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
    title: 'SSH',
    message: portuguese
      ? `A chave do servidor ${endpoint} mudou.`
      : `The host key for ${endpoint} changed.`,
    detail: portuguese
      ? `Chave salva: ${stored}\nChave apresentada: ${presented}\n\nIsso pode indicar um servidor diferente no caminho. Só continue se você esperava essa troca.`
      : `Stored key: ${stored}\nPresented key: ${presented}\n\nThis can mean a different server is on the path. Continue only if you expected the change.`,
  });
  return result.response === 1;
}

/**
 * Trust on first use. A changed key is rejected unless the user accepts it.
 */
export async function acceptHostKey(
  host: string,
  port: number,
  key: Buffer,
): Promise<boolean> {
  const endpoint = hostEndpoint(host, port);
  const fingerprint = hostKeyFingerprint(key);
  const store = await loadStore();
  const status = classifyHostKey(store, endpoint, fingerprint);

  if (status === 'mismatch') {
    const stored = store[endpoint];
    const accepted = await confirmChangedKey(endpoint, stored, fingerprint);
    if (!accepted) return false;
  }

  if (status !== 'match') {
    store[endpoint] = fingerprint;
    await saveStore(store);
  }
  return true;
}
