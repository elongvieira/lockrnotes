import { ipcMain } from 'electron';
import { spawn, exec } from 'child_process';

// Delay before removing cmdkey credentials to give mstsc time to read them
const CREDENTIAL_CLEANUP_DELAY_MS = 8000;

function getCredentialTarget(host: string, port: number) {
  const portSuffix = port !== 3389 ? `:${port}` : '';
  return `TERMSRV/${host}${portSuffix}`;
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
      const port = config.port || 3389;
      const target = getCredentialTarget(config.host, port);
      const username = config.domain
        ? `${config.domain}\\${config.user}`
        : config.user;

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        if (process.platform === 'win32') {
          // Store credentials in Windows Credential Manager
          const cmdkeyArgs = [
            `/generic:${target}`,
            `/user:${username}`,
            `/pass:${config.password}`,
          ];

          const credProc = spawn('cmdkey.exe', cmdkeyArgs, { shell: false });
          credProc.on('close', (code) => {
            if (code !== 0) {
              resolve({ success: false, error: 'Failed to store credentials' });
              return;
            }

            // Launch mstsc.exe
            const mstscArgs = [`/v:${config.host}:${port}`];
            spawn('mstsc.exe', mstscArgs, {
              detached: true,
              stdio: 'ignore',
              shell: false,
            }).unref();

            // Clean up credentials after a delay
            setTimeout(() => {
              exec(`cmdkey.exe /delete:${target}`, () => {});
            }, CREDENTIAL_CLEANUP_DELAY_MS);

            resolve({ success: true });
          });
        } else if (process.platform === 'darwin') {
          // macOS: open with Microsoft Remote Desktop if available, otherwise xfreerdp
          const userArg = config.domain
            ? `${config.domain}\\\\${config.user}`
            : config.user;
          const args = [
            `-u`,
            userArg,
            `-p`,
            config.password,
            `/v:${config.host}:${port}`,
            `/cert-ignore`,
          ];
          spawn('xfreerdp', args, {
            detached: true,
            stdio: 'ignore',
            shell: false,
          }).unref();
          resolve({ success: true });
        } else {
          // Linux: use xfreerdp
          const userArg = config.domain
            ? `${config.domain}\\\\${config.user}`
            : config.user;
          const args = [
            `-u`,
            userArg,
            `-p`,
            config.password,
            `/v:${config.host}:${port}`,
            `/cert-ignore`,
          ];
          spawn('xfreerdp', args, {
            detached: true,
            stdio: 'ignore',
            shell: false,
          }).unref();
          resolve({ success: true });
        }
      });
    },
  );
}
