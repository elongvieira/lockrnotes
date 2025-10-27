import * as fs from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { readConfigFile } from '../config';
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
      // Skip the .lockrnotes folder (contains encryption key)
      if (filePath.includes('.lockrnotes')) {
        continue;
      }

      const relativePath = path.relative(sourcePath, filePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');

      try {
        // Check if file is encrypted
        const parsed = JSON.parse(fileContent);
        if (parsed.type === 'lockrnotes-encrypted') {
          // Decrypt and add to ZIP
          const decrypted = await managedEncryptionService.decryptContent(
            parsed as EncryptedFileData,
            filePath,
          );

          // Use original extension from encrypted data
          const originalName = relativePath.replace(
            path.extname(relativePath),
            parsed.originalExtension || '.txt',
          );
          zip.addFile(originalName, Buffer.from(decrypted, 'utf-8'));
          filesExported++;
        } else {
          // Not encrypted, add as is
          zip.addFile(relativePath, Buffer.from(fileContent, 'utf-8'));
          filesExported++;
        }
      } catch {
        // Not a JSON file or not encrypted, add as is
        zip.addFile(relativePath, Buffer.from(fileContent, 'utf-8'));
        filesExported++;
      }
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
