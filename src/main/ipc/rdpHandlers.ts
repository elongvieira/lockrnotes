import { ipcMain } from 'electron';
import { spawn, type ChildProcess } from 'child_process';
import {
  cmdkeyDeleteArgs,
  cmdkeyStoreArgs,
  formatEndpoint,
  freeRdpArgs,
  parseRemoteTarget,
  windowsCredentialTarget,
  windowsUsername,
} from '../services/remoteConnection';

// Delay before removing cmdkey credentials to give mstsc time to read them
const CREDENTIAL_CLEANUP_DELAY_MS = 8000;
const RDP_PORT = 3389;

function startDetached(
  command: string,
  args: string[],
  stdin?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn(command, args, {
      detached: true,
      shell: false,
      windowsHide: true,
      stdio: stdin === undefined ? 'ignore' : ['pipe', 'ignore', 'ignore'],
    });
    child.once('error', reject);
    child.once('spawn', () => {
      if (stdin !== undefined && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
      child.unref();
      resolve();
    });
  });
}

export function setupRdpHandlers() {
  ipcMain.handle(
    'rdp:connect',
    async (
      _event,
      config: {
        host: string;
        port?: number;
        user: string;
        password: string;
        domain?: string;
      },
    ) => {
      const target = parseRemoteTarget(config, RDP_PORT);
      if (!target) {
        return { success: false, error: 'Invalid RDP target' };
      }

      const credentialTarget = windowsCredentialTarget(
        target.host,
        target.port,
        RDP_PORT,
      );
      const username = windowsUsername(target.user, target.domain);

      try {
        if (process.platform === 'win32') {
          const stored = await new Promise<boolean>((resolve, reject) => {
            const credProc = spawn(
              'cmdkey.exe',
              cmdkeyStoreArgs(credentialTarget, username, target.password),
              { shell: false, windowsHide: true },
            );
            credProc.once('error', reject);
            credProc.once('close', (code) => resolve(code === 0));
          });
          if (!stored) {
            return { success: false, error: 'Failed to store credentials' };
          }

          await startDetached('mstsc.exe', [
            `/v:${formatEndpoint(target.host, target.port)}`,
          ]);

          setTimeout(() => {
            spawn('cmdkey.exe', cmdkeyDeleteArgs(credentialTarget), {
              shell: false,
              windowsHide: true,
            }).on('error', () => {});
          }, CREDENTIAL_CLEANUP_DELAY_MS);

          return { success: true };
        }

        await startDetached(
          'xfreerdp',
          freeRdpArgs(target),
          `${target.password}\n`,
        );
        return { success: true };
      } catch {
        return { success: false, error: 'Failed to start the RDP client' };
      }
    },
  );
}
