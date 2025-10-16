import { fileSystemService } from './fileSystemService';

export interface FileCreationData {
  filename: string;
  type: 'text' | 'keyvalue';
  encrypted: boolean;
  encryptionType?: 'managed' | 'manual';
  password?: string;
}

export interface FileTemplate {
  extension: string;
  generateContent: (filename: string, data?: any) => string;
}

class FileCreationService {
  private templates: Record<string, FileTemplate> = {
    text: {
      extension: '.txt',
      generateContent: (filename: string) => {
        return `📝 ${filename}

Suas anotações começam aqui...

Você pode escrever qualquer coisa neste arquivo de texto.
- Lista de tarefas
- Ideias
- Rascunhos
- Notas importantes

Data de criação: ${new Date().toLocaleDateString('pt-BR')}`;
      },
    },
    keyvalue: {
      extension: '.json',
      generateContent: (filename: string) => {
        const jsonStructure = {
          name: filename,
          version: '1.0.0',
          description: 'Arquivo de configuração em formato JSON',
          author: 'Usuário',
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          config: {
            theme: 'dark',
            language: 'pt-BR',
            autoSave: true,
            notifications: true,
          },
          data: {
            example_key_1: 'valor_exemplo_1',
            example_key_2: 'valor_exemplo_2',
            example_key_3: 'valor_exemplo_3',
            nested_object: {
              property1: 'valor1',
              property2: 'valor2',
              property3: true,
            },
          },
          metadata: {
            tags: ['exemplo', 'configuracao', 'json'],
            category: 'config',
            priority: 'normal',
          },
        };
        return JSON.stringify(jsonStructure, null, 2);
      },
    },
  };

  /**
   * Creates a new file based on the provided data
   * Returns an object with success status and the full filename with extension
   */
  async createFile(
    targetPath: string,
    fileData: FileCreationData,
  ): Promise<{ success: boolean; filename?: string; filePath?: string }> {
    try {
      // Validate input
      if (!targetPath || !fileData.filename.trim()) {
        throw new Error('Invalid target path or filename');
      }

      // Get template for file type
      const template = this.templates[fileData.type];
      if (!template) {
        throw new Error(`Unsupported file type: ${fileData.type}`);
      }

      // Prepare filename and content
      const cleanFilename = this.sanitizeFilename(fileData.filename);
      const originalExtension = template.extension;
      let filename = `${cleanFilename}${originalExtension}`;
      let content = template.generateContent(cleanFilename);

      // Handle managed encryption
      if (fileData.encrypted && fileData.encryptionType === 'managed') {
        try {
          const filePath = `${targetPath}/${filename}`;

          // Criptografa o conteúdo
          const encryptedData = await window.encryptionAPI.encryptContent(
            content,
            filePath,
            originalExtension,
          );

          // Altera extensão baseada no tipo original
          const encryptedExtension =
            this.getEncryptedExtension(originalExtension);
          filename = `${cleanFilename}${encryptedExtension}`;

          // Conteúdo vira JSON com dados criptografados
          content = JSON.stringify(encryptedData, null, 2);
        } catch (error) {
          console.error('Encryption failed:', error);
          throw new Error('Failed to encrypt file');
        }
      } else if (fileData.encrypted && fileData.encryptionType === 'manual') {
        // TODO: Implementar criptografia manual com senha do usuário
        throw new Error('Manual encryption not yet implemented');
      }

      // Create file path
      const filePath = `${targetPath}/${filename}`;

      // Create the file
      const success = await fileSystemService.createFile(filePath, content);

      if (!success) {
        throw new Error('Failed to create file');
      }

      return { success: true, filename, filePath };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in FileCreationService.createFile:', error);
      return { success: false };
    }
  }

  /**
   * Gets the encrypted extension based on original extension
   */
  private getEncryptedExtension(originalExtension: string): string {
    switch (originalExtension) {
      case '.txt':
        return '.ltxt'; // Lockr Text
      case '.json':
        return '.ljson'; // Lockr JSON
      default:
        return '.lenc'; // Lockr Encrypted
    }
  }

  /**
   * Sanitizes filename by removing invalid characters and extensions
   */
  private sanitizeFilename(filename: string): string {
    let cleanName = filename.trim();

    // Remove existing extension if present
    const lastDotIndex = cleanName.lastIndexOf('.');
    if (lastDotIndex > 0) {
      cleanName = cleanName.substring(0, lastDotIndex);
    }

    // Remove invalid characters for filenames
    cleanName = cleanName.replace(/[<>:"/\\|?*]/g, '');

    // Replace spaces with underscores (optional)
    cleanName = cleanName.replace(/\s+/g, '_');

    return cleanName || 'untitled';
  }

  /**
   * Gets available file types
   */
  getAvailableTypes(): string[] {
    return Object.keys(this.templates);
  }

  /**
   * Gets template information for a specific type
   */
  getTemplate(type: string): FileTemplate | undefined {
    return this.templates[type];
  }

  /**
   * Adds or updates a file template
   */
  registerTemplate(type: string, template: FileTemplate): void {
    this.templates[type] = template;
  }

  /**
   * Validates if encryption is supported
   */
  isEncryptionSupported(): boolean {
    return true; // Agora suportamos criptografia gerenciada!
  }

  /**
   * Generates a preview of what the file content would look like
   */
  generatePreview(filename: string, type: string): string {
    const template = this.templates[type];
    if (!template) {
      return 'Tipo de arquivo não suportado';
    }

    const cleanFilename = this.sanitizeFilename(filename || 'exemplo');
    return template.generateContent(cleanFilename);
  }
}

// Export singleton instance
export const fileCreationService = new FileCreationService();
