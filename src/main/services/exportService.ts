import * as fs from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { readConfigFile } from '../config';
import { exportEntryName } from './exportNames';
import {
  managedEncryptionService,
  EncryptedFileData,
} from './managedEncryptionService';

interface ExportResult {
  success: boolean;
  zipPath?: string;
  error?: string;
  filesExported?: number;
}

async function getAllFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await scan(dirPath);
  return files;
}

export async function exportAllFiles(
  destinationFolder: string,
): Promise<ExportResult> {
  try {
    // Get the source folder from config
    const config = await readConfigFile();
    if (!config?.defaultPath) {
      return {
        success: false,
        error: 'No default path configured',
      };
    }

    const sourcePath = config.defaultPath;

    // Check if source folder exists
    try {
      await fs.access(sourcePath);
    } catch {
      return {
        success: false,
        error: 'Source folder does not exist',
      };
    }

    // Create ZIP file
    const zip = new AdmZip();
    let filesExported = 0;

    // Read all files recursively
    const files = await getAllFiles(sourcePath);

    for (const filePath of files) {
      const relativePath = path.relative(sourcePath, filePath);
      if (relativePath.split(path.sep).includes('.lockrnotes')) {
        continue;
      }

      const bytes = await fs.readFile(filePath);
      let archived = bytes;
      let archivedName = relativePath;

      try {
        const parsed = JSON.parse(bytes.toString('utf8'));
        if (parsed.type === 'lockrnotes-encrypted') {
          const decrypted = await managedEncryptionService.decryptContent(
            parsed as EncryptedFileData,
            filePath,
          );
          archived = Buffer.from(decrypted, 'utf8');
          archivedName = exportEntryName(
            relativePath,
            parsed.originalExtension || '.txt',
          );
        }
      } catch {
        // Keep the original bytes, including files that are not UTF-8 JSON.
      }

      zip.addFile(archivedName, archived);
      filesExported++;
    }

    // Generate ZIP filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `lockrnotes-export-${timestamp}.zip`;
    const zipPath = path.join(destinationFolder, zipFileName);

    // Write ZIP file
    zip.writeZip(zipPath);

    return {
      success: true,
      zipPath,
      filesExported,
    };
  } catch (error) {
    console.error('Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
