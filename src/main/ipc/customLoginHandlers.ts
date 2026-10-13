import { ipcMain, type WebContents } from 'electron';
import type { CustomLoginStep } from '../../renderer/types/jsonEntry';
import {
  buildCustomLoginRecorderScript,
  parseMacroConsoleMessage,
} from '../services/customLoginRecorder';
import { buildCustomLoginReplayStepScript } from '../services/customLoginReplay';
import {
  buildLoginStatusOverlayRemoveScript,
  buildLoginStatusOverlayScript,
} from '../services/loginStatusOverlay';
import {
  createLoginWindow,
  resolveLoginPartition,
} from '../services/loginWindow';
import { normalizeWebLoginUrl } from '../services/webLoginUrl';

function injectRecorder(contents: WebContents) {
  if (contents.isDestroyed()) return;
  contents.executeJavaScript(buildCustomLoginRecorderScript()).catch(() => {});
}

function injectStatus(contents: WebContents, message: string) {
  if (contents.isDestroyed()) return;
  contents
    .executeJavaScript(buildLoginStatusOverlayScript(message))
    .catch(() => {});
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function waitUntilLoaded(contents: WebContents, timeoutMs = 8000) {
  if (contents.isDestroyed() || !contents.isLoading()) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    contents.once('did-finish-load', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

export function setupCustomLoginHandlers() {
  ipcMain.handle(
    'custom-login:record',
    async (
      _event,
      config: {
        url: string;
        title?: string;
        shareSession?: boolean;
        sessionId?: string;
      },
    ): Promise<{
      success: boolean;
      steps?: CustomLoginStep[];
      error?: string;
    }> => {
      const url = normalizeWebLoginUrl(config?.url || '');
      if (!url) {
        return { success: false, error: 'Invalid URL' };
      }

      const win = createLoginWindow(
        config.title || 'Gravando macro',
        resolveLoginPartition({
          shareSession: config?.shareSession,
          sessionId: config?.sessionId,
        }),
      );
      win.show();
      const steps: CustomLoginStep[] = [];
      let finished = false;

      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        if (!win.isDestroyed()) {
          win.destroy();
        }
      };

      return new Promise((resolve) => {
        let poll: ReturnType<typeof setInterval> | undefined;

        const addStep = (step: CustomLoginStep) => {
          if (steps.some((existing) => existing.id === step.id)) {
            return;
          }
          const last = steps[steps.length - 1];
          if (
            step.kind === 'type' &&
            last &&
            last.kind === 'type' &&
            last.selector &&
            last.selector === step.selector
          ) {
            steps[steps.length - 1] = step;
            return;
          }
          steps.push(step);
        };

        const handlePayload = (
          parsed: { op: 'step'; step: CustomLoginStep } | { op: 'stop' },
        ) => {
          if (parsed.op === 'step') {
            addStep(parsed.step);
            return;
          }
          if (finished) return;
          if (poll) clearInterval(poll);
          finish();
          resolve({ success: true, steps });
        };

        poll = setInterval(async () => {
          if (finished || win.isDestroyed()) {
            if (poll) clearInterval(poll);
            return;
          }
          try {
            const batch = (await win.webContents.executeJavaScript(
              'window.__lockrMacro && window.__lockrMacro.flushQueue ? window.__lockrMacro.flushQueue() : []',
            )) as Array<{ op?: string; step?: CustomLoginStep }>;
            if (!Array.isArray(batch)) return;
            batch.forEach((payload) => {
              if (payload?.op === 'step' && payload.step) {
                addStep(payload.step);
              } else if (payload?.op === 'stop') {
                handlePayload({ op: 'stop' });
              }
            });
          } catch {
            // page may be navigating
          }
        }, 250);

        win.webContents.on(
          'console-message',
          (_consoleEvent, _level, message) => {
            const parsed = parseMacroConsoleMessage(message);
            if (!parsed || finished) return;
            handlePayload(parsed);
          },
        );

        win.on('closed', () => {
          if (poll) clearInterval(poll);
          if (finished) return;
          finished = true;
          resolve({ success: true, steps });
        });

        win.webContents.on('did-finish-load', () =>
          injectRecorder(win.webContents),
        );
        win.webContents.on('did-navigate-in-page', () =>
          injectRecorder(win.webContents),
        );

        win
          .loadURL(url)
          .then(() => win.show())
          .catch((error) => {
            if (poll) clearInterval(poll);
            finish();
            resolve({
              success: false,
              error:
                error instanceof Error ? error.message : 'Failed to open site',
            });
          });
      });
    },
  );

  ipcMain.handle(
    'custom-login:play',
    async (
      _event,
      config: {
        url: string;
        title?: string;
        steps: CustomLoginStep[];
        loadingMessage?: string;
        shareSession?: boolean;
        sessionId?: string;
      },
    ) => {
      const url = normalizeWebLoginUrl(config?.url || '');
      if (!url) {
        return { success: false, error: 'Invalid URL' };
      }
      const steps = Array.isArray(config.steps) ? config.steps : [];
      if (steps.length === 0) {
        return { success: false, error: 'Empty macro' };
      }

      const win = createLoginWindow(
        config.title || 'Login customizado',
        resolveLoginPartition({
          shareSession: config?.shareSession,
          sessionId: config?.sessionId,
        }),
      );
      const loadingMessage =
        config.loadingMessage || 'Aguarde, carregando o site…';
      let statusMessage = loadingMessage;
      let playFinished = false;

      const refreshStatus = () => {
        if (playFinished || win.isDestroyed()) return;
        injectStatus(win.webContents, statusMessage);
      };
      win.webContents.on('did-finish-load', refreshStatus);

      try {
        win.show();
        await win.loadURL(url);
        await waitUntilLoaded(win.webContents);
        refreshStatus();

        for (const step of steps) {
          if (win.isDestroyed()) {
            return { success: false, error: 'Window closed' };
          }
          statusMessage =
            step.kind === 'click'
              ? `Aguarde: clicando em “${step.label}”`
              : `Aguarde: preenchendo “${step.label}”`;
          refreshStatus();
          const result = (await win.webContents.executeJavaScript(
            buildCustomLoginReplayStepScript(step),
          )) as { ok?: boolean; error?: string };
          if (!result?.ok) {
            playFinished = true;
            return {
              success: false,
              error: result?.error || `Failed at: ${step.label}`,
            };
          }
          await wait(400);
          await waitUntilLoaded(win.webContents);
        }

        playFinished = true;
        if (!win.isDestroyed()) {
          win.webContents
            .executeJavaScript(buildLoginStatusOverlayRemoveScript())
            .catch(() => {});
        }

        return { success: true };
      } catch (error) {
        playFinished = true;
        if (!win.isDestroyed()) {
          win.destroy();
        }
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to play macro',
        };
      }
    },
  );
}
