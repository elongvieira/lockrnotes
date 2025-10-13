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
   */
  async createFile(
    targetPath: string,
    fileData: FileCreationData,
  ): Promise<boolean> {
    try {
      // Validate input
      if (!targetPath || !fileData.filename.trim()) {
        throw new Error('Invalid target path or filename');
      }

      // Skip encrypted files for now
      if (fileData.encrypted) {
        throw new Error('Encrypted files not yet implemented');
      }

      // Get template for file type
      const template = this.templates[fileData.type];
      if (!template) {
        throw new Error(`Unsupported file type: ${fileData.type}`);
      }

      // Prepare filename
      const cleanFilename = this.sanitizeFilename(fileData.filename);
      const filename = `${cleanFilename}${template.extension}`;

      // Generate content
      const content = template.generateContent(cleanFilename);

      // Create file path
      const filePath = `${targetPath}/${filename}`;

      // Create the file
      const success = await fileSystemService.createFile(filePath, content);

      if (!success) {
        throw new Error('Failed to create file');
      }

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in FileCreationService.createFile:', error);
      return false;
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
   * Validates if encryption is supported (for future implementation)
   */
  isEncryptionSupported(): boolean {
    return false; // TODO: Implement encryption
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
