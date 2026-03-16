import { ipcMain, dialog, app } from 'electron';
import fs from 'fs';
import path from 'path';
import { readConfigFile } from '../config';

export interface ImportFileInfo {
  name: string;
  path: string;
  content: string;
  ext: string;
}

/**
 * Returns true if `target` is inside (or equal to) `root`.
 * Both paths are resolved and normalised before comparison to prevent
 * path-traversal attacks (e.g. "../../etc/passwd").
 */
function isInsideRoot(root: string, target: string): boolean {
  const resolvedRoot = path.resolve(root) + path.sep;
  const resolvedTarget = path.resolve(target);
  // Allow exact match (target === root) or proper child
  return (
    resolvedTarget === path.resolve(root) ||
    resolvedTarget.startsWith(resolvedRoot)
  );
}

// eslint-disable-next-line import/prefer-default-export
export function registerImportHandlers() {
  ipcMain.handle('import:selectFiles', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'Select Files to Import',
      defaultPath: app.getPath('documents'),
      filters: [
        {
          name: 'Supported Files',
          extensions: ['txt', 'json', 'ltxt', 'ljson', 'lenc', 'md'],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, files: [] };
    }

    const files = await Promise.all(
      result.filePaths.map(async (filePath) => {
        try {
          const content = await fs.promises.readFile(filePath, 'utf-8');
          return {
            name: path.basename(filePath),
            path: filePath,
            content,
            ext: path.extname(filePath).toLowerCase(),
          } as ImportFileInfo;
        } catch (err) {
          console.error(`Failed to read file ${filePath}:`, err);
          return null;
        }
      }),
    );

    return {
      canceled: false,
      files: files.filter(Boolean) as ImportFileInfo[],
    };
  });

  ipcMain.handle('import:selectDestinationFolder', async () => {
    const config = await readConfigFile();
    const notesRoot = config?.defaultPath
      ? path.join(config.defaultPath, 'notes')
      : undefined;

    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Destination Folder',
      defaultPath: notesRoot,
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const selected = result.filePaths[0];

    if (notesRoot && !isInsideRoot(notesRoot, selected)) {
      return {
        canceled: false,
        folderPath: selected,
        outsideRoot: true,
        notesRoot,
      };
    }

    return {
      canceled: false,
      folderPath: selected,
      outsideRoot: false,
    };
  });

  ipcMain.handle('import:getNotesRootPath', async () => {
    const config = await readConfigFile();
    return config?.defaultPath ? path.join(config.defaultPath, 'notes') : null;
  });

  ipcMain.handle(
    'import:writeFile',
    async (_event, filePath: string, content: string) => {
      try {
        // Security: refuse writes outside the notes folder ({defaultPath}/notes)
        const config = await readConfigFile();
        const notesRoot = config?.defaultPath
          ? path.join(config.defaultPath, 'notes')
          : null;
        if (notesRoot && !isInsideRoot(notesRoot, filePath)) {
          return {
            success: false,
            error: 'Destination is outside the notes folder',
          };
        }

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return { success: true };
      } catch (error) {
        console.error('Import write error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  );

  ipcMain.handle('import:fileExists', async (_event, filePath: string) => {
    try {
      // Only check existence inside the notes folder ({defaultPath}/notes)
      const config = await readConfigFile();
      const notesRoot = config?.defaultPath
        ? path.join(config.defaultPath, 'notes')
        : null;
      if (notesRoot && !isInsideRoot(notesRoot, filePath)) {
        return false;
      }
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  });
}
