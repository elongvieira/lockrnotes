import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import { useTranslation } from 'react-i18next';
import FileCreationDialog from './FileCreationDialog';
import PasswordDialog from './PasswordDialog';
import JsonEditor from './JsonEditor';
import { fileCreationService } from '../services/fileCreationService';
import type { FileCreationData } from '../types/fileCreation';
import { fileSystemService } from '../services/fileSystemService';
import { sessionKeyService } from '../services/sessionKeyService';
import { useAppContext } from '../contexts/AppContext';
import './Editor.css';

interface FileTab {
  id: string;
  filename: string;
  content: string;
  isDirty: boolean;
  isEncrypted: boolean;
  originalExtension?: string;
  filePath: string;
  encryptedPassword?: string; // Senha criptografada com chave de sessão
}

interface PendingEncryptedFile {
  savedTab: any;
  rawContent: string;
}

export default function Editor() {
  const {
    tabs,
    setTabs,
    activeTab,
    setActiveTab,
    refreshSidebar,
    setCurrentFile,
    setWordCount,
    setIsEncrypted,
    showNotification,
    triggerSavePulse,
    setOpenFileInEditor,
  } = useAppContext();

  const { t } = useTranslation();
  const [fileDialogOpen, setFileDialogOpen] = useState<boolean>(false);
  const [isRestoringTabs, setIsRestoringTabs] = useState<boolean>(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [pendingEncryptedFiles, setPendingEncryptedFiles] = useState<
    PendingEncryptedFile[]
  >([]);
  const [currentPendingFile, setCurrentPendingFile] =
    useState<PendingEncryptedFile | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [restoredTabs, setRestoredTabs] = useState<FileTab[]>([]);

  // Initialize session key on mount
  useEffect(() => {
    sessionKeyService.initialize();
    return () => {
      // Clear session key on unmount
      sessionKeyService.clear();
    };
  }, []);

  // Carregar abas salvas ao montar o componente
  useEffect(() => {
    const restoreTabs = async () => {
      try {
        const config = await fileSystemService.readConfig();

        // Carregar configuração de autoSave
        if (config && config.autoSave !== undefined) {
          setAutoSaveEnabled(config.autoSave);
        }

        if (config && config.openTabs && Array.isArray(config.openTabs)) {
          const managedEncryptedTabs: FileTab[] = [];
          const manualEncryptedFiles: PendingEncryptedFile[] = [];

          // Process each saved tab
          const tabResults = await Promise.all(
            config.openTabs.map(async (savedTab: any) => {
              try {
                const fileContent = await fileSystemService.readFile(
                  savedTab.filePath,
                );
                if (fileContent !== null) {
                  // Check if manually encrypted
                  const isManuallyEncrypted =
                    await window.manualEncryptionAPI.isManuallyEncrypted(
                      fileContent,
                    );

                  if (isManuallyEncrypted) {
                    return {
                      type: 'manual',
                      savedTab,
                      rawContent: fileContent,
                    };
                  }

                  let content = fileContent;
                  const isEncrypted = savedTab.isEncrypted || false;

                  // If file is managed encrypted, decrypt it
                  if (isEncrypted) {
                    try {
                      const isContentEncrypted =
                        await window.encryptionAPI.isContentEncrypted(
                          fileContent,
                        );

                      if (isContentEncrypted) {
                        const encryptedData = JSON.parse(fileContent);
                        const decrypted =
                          await window.encryptionAPI.decryptContent(
                            encryptedData,
                            savedTab.filePath,
                          );
                        content = decrypted;
                      }
                    } catch (decryptErr) {
                      // eslint-disable-next-line no-console
                      console.warn(
                        `Failed to decrypt tab: ${savedTab.filename}`,
                        decryptErr,
                      );
                      return null;
                    }
                  }

                  return {
                    type: 'managed',
                    tab: {
                      id: savedTab.id,
                      filename: savedTab.filename,
                      content,
                      isDirty: false,
                      isEncrypted,
                      originalExtension: savedTab.originalExtension,
                      filePath: savedTab.filePath,
                    },
                  };
                }
              } catch (err) {
                // eslint-disable-next-line no-console
                console.warn(
                  `Failed to restore tab: ${savedTab.filename}`,
                  err,
                );
              }
              return null;
            }),
          );

          // Separate managed and manual encrypted files
          tabResults.forEach((result) => {
            if (result) {
              if (result.type === 'manual') {
                manualEncryptedFiles.push({
                  savedTab: result.savedTab,
                  rawContent: result.rawContent,
                });
              } else if (result.type === 'managed' && result.tab) {
                managedEncryptedTabs.push(result.tab);
              }
            }
          });

          // Set tabs that were successfully loaded (non-manually encrypted)
          setRestoredTabs(managedEncryptedTabs);
          setTabs(managedEncryptedTabs);

          // Set active tab if any were loaded
          if (managedEncryptedTabs.length > 0) {
            if (config.activeTabId) {
              const activeExists = managedEncryptedTabs.find(
                (tab) => tab.id === config.activeTabId,
              );
              if (activeExists) {
                setActiveTab(config.activeTabId);
              } else {
                setActiveTab(managedEncryptedTabs[0].id);
              }
            } else {
              setActiveTab(managedEncryptedTabs[0].id);
            }
          }

          // Queue manually encrypted files for password prompts
          if (manualEncryptedFiles.length > 0) {
            setPendingEncryptedFiles(manualEncryptedFiles);
            setCurrentPendingFile(manualEncryptedFiles[0]);
            setPasswordDialogOpen(true);
          } else {
            setIsRestoringTabs(false);
          }
        } else {
          setIsRestoringTabs(false);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to restore tabs:', error);
        setIsRestoringTabs(false);
      }
    };

    restoreTabs();
  }, [setTabs, setActiveTab]);

  // Handle password confirmation for manually encrypted files during restoration
  const handlePasswordConfirm = useCallback(
    async (password: string) => {
      if (!currentPendingFile) return;

      try {
        setPasswordError('');

        // Decrypt the file
        const encryptedData = JSON.parse(currentPendingFile.rawContent);
        const result = await window.manualEncryptionAPI.decryptContent(
          encryptedData,
          password,
        );

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Decryption failed');
        }

        // Encrypt password with session key for storage in memory
        const encryptedPassword =
          await sessionKeyService.encryptPassword(password);

        // Create tab for decrypted file
        const newTab: FileTab = {
          id: currentPendingFile.savedTab.id,
          filename: currentPendingFile.savedTab.filename,
          content: result.data,
          isDirty: false,
          isEncrypted: currentPendingFile.savedTab.isEncrypted || false,
          originalExtension: currentPendingFile.savedTab.originalExtension,
          filePath: currentPendingFile.savedTab.filePath,
          encryptedPassword, // Store encrypted password in memory
        };

        // Add tab to existing tabs
        setTabs((prev) => [...prev, newTab]);
        setRestoredTabs((prev) => [...prev, newTab]);

        // Move to next file in queue
        const currentIndex = pendingEncryptedFiles.findIndex(
          (f) => f.savedTab.filePath === currentPendingFile.savedTab.filePath,
        );

        if (currentIndex < pendingEncryptedFiles.length - 1) {
          // More files to process
          setCurrentPendingFile(pendingEncryptedFiles[currentIndex + 1]);
          setPasswordError('');
        } else {
          // All files processed
          setPasswordDialogOpen(false);
          setCurrentPendingFile(null);
          setPendingEncryptedFiles([]);
          setIsRestoringTabs(false);

          // Set active tab after all files are restored
          const allTabs = [...restoredTabs, newTab];
          if (allTabs.length > 0) {
            setActiveTab(allTabs[0].id);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to decrypt file:', error);
        setPasswordError(t('passwordDialog.wrongPassword'));
      }
    },
    [
      currentPendingFile,
      pendingEncryptedFiles,
      restoredTabs,
      setTabs,
      setActiveTab,
      t,
    ],
  );

  // Handle password dialog cancel
  const handlePasswordCancel = useCallback(() => {
    // Move to next file in queue or finish restoration
    const currentIndex = pendingEncryptedFiles.findIndex(
      (f) =>
        currentPendingFile &&
        f.savedTab.filePath === currentPendingFile.savedTab.filePath,
    );

    if (currentIndex < pendingEncryptedFiles.length - 1) {
      // More files to process
      setCurrentPendingFile(pendingEncryptedFiles[currentIndex + 1]);
      setPasswordError('');
    } else {
      // All files processed (or skipped)
      setPasswordDialogOpen(false);
      setCurrentPendingFile(null);
      setPendingEncryptedFiles([]);
      setIsRestoringTabs(false);

      // Set active tab if any tabs were restored
      if (restoredTabs.length > 0) {
        setActiveTab(restoredTabs[0].id);
      }
    }
  }, [currentPendingFile, pendingEncryptedFiles, restoredTabs, setActiveTab]);

  // Salvar abas sempre que mudarem (depois da restauração inicial)
  useEffect(() => {
    if (isRestoringTabs) return;

    const saveTabs = async () => {
      try {
        const tabsToSave = tabs.map((tab) => ({
          id: tab.id,
          filename: tab.filename,
          filePath: tab.filePath,
          isEncrypted: tab.isEncrypted,
          originalExtension: tab.originalExtension,
        }));

        await fileSystemService.updateConfig({
          openTabs: tabsToSave,
          activeTabId: activeTab,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to save tabs:', error);
      }
    };

    saveTabs();
  }, [tabs, activeTab, isRestoringTabs]);

  // Função para abrir um novo arquivo em uma aba
  const openFile = useCallback(
    async (
      filePath: string,
      filename: string,
      originalExtension: string | undefined,
      content: string,
      isEncrypted: boolean,
      password?: string,
    ) => {
      // If password is provided, encrypt it with session key
      let encryptedPassword: string | undefined;
      if (password) {
        encryptedPassword = await sessionKeyService.encryptPassword(password);
      }

      setTabs((prev) => {
        // If file is already open, focus existing tab and optionally update content
        const existing = prev.find((tabItem) => tabItem.filePath === filePath);
        if (existing) {
          // If provided content differs, update the tab content but keep isDirty as false
          if (content && existing.content !== content) {
            const updated = prev.map((tabItem) =>
              tabItem.filePath === filePath
                ? { ...tabItem, content, encryptedPassword }
                : tabItem,
            );
            // focus existing
            setActiveTab(existing.id);
            return updated;
          }

          setActiveTab(existing.id);
          return prev;
        }

        const fileId = `file-${Date.now()}-${Math.random()}`;
        const newTab: FileTab = {
          id: fileId,
          filename,
          content,
          isDirty: false,
          isEncrypted,
          originalExtension,
          filePath,
          encryptedPassword,
        };

        // focus new tab
        setActiveTab(fileId);
        return [...prev, newTab];
      });
    },
    [setTabs, setActiveTab],
  );

  // Função para fechar uma aba
  const closeTab = (tabId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    setTabs((prev) => {
      const newTabs = prev.filter((tab) => tab.id !== tabId);

      // Se fechou a aba ativa, seleciona outra
      if (activeTab === tabId && newTabs.length > 0) {
        const tabIndex = prev.findIndex((tab) => tab.id === tabId);
        const nextActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        setActiveTab(newTabs[nextActiveIndex]?.id || null);
      } else if (newTabs.length === 0) {
        setActiveTab(null);
      }

      return newTabs;
    });
  };

  // Função para atualizar o conteúdo de uma aba
  const updateTabContent = (tabId: string, content: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId ? { ...tab, content, isDirty: true } : tab,
      ),
    );
  };

  // Função para salvar arquivo
  const saveFile = useCallback(
    async (tabId: string) => {
      const targetTab = tabs.find((tab) => tab.id === tabId);
      if (!targetTab) return;

      try {
        let success = false;

        // Check if file has a password (manual encryption)
        if (targetTab.encryptedPassword) {
          // eslint-disable-next-line no-console
          console.log(
            'Saving manually encrypted file:',
            targetTab.filename,
            'Password stored:',
            !!targetTab.encryptedPassword,
          );

          // Decrypt the password from memory
          let password: string;
          try {
            password = await sessionKeyService.decryptPassword(
              targetTab.encryptedPassword,
            );
            // eslint-disable-next-line no-console
            console.log('Password decrypted successfully');
          } catch (decryptErr) {
            // eslint-disable-next-line no-console
            console.error(
              'Failed to decrypt password from memory:',
              decryptErr,
            );
            throw new Error('Failed to retrieve stored password');
          }

          // Get original extension
          const originalExt = targetTab.originalExtension || '.txt';
          // eslint-disable-next-line no-console
          console.log('Original extension:', originalExt);

          // Encrypt content with password
          const encryptResult = await window.manualEncryptionAPI.encryptContent(
            targetTab.content,
            password,
            originalExt,
          );

          // eslint-disable-next-line no-console
          console.log('Encryption result:', encryptResult.success);

          if (encryptResult.success && encryptResult.data) {
            // Save encrypted content
            const encryptedContent = JSON.stringify(
              encryptResult.data,
              null,
              2,
            );
            // eslint-disable-next-line no-console
            console.log(
              'Saving to disk:',
              targetTab.filePath,
              'Content length:',
              encryptedContent.length,
            );

            success = await fileSystemService.saveFile(
              targetTab.filePath,
              encryptedContent,
            );
            // eslint-disable-next-line no-console
            console.log('File saved to disk:', targetTab.filename, success);
          } else {
            throw new Error(encryptResult.error || 'Encryption failed');
          }
        } else {
          // eslint-disable-next-line no-console
          console.log('Saving managed encrypted file:', targetTab.filename);

          // Use standard save with managed encryption
          success = await fileSystemService.saveFileWithEncryption(
            targetTab.filePath,
            targetTab.content,
            targetTab.isEncrypted,
            targetTab.originalExtension,
          );
        }

        if (success) {
          // Marcar aba como não modificada
          setTabs((prev) =>
            prev.map((tabItem) =>
              tabItem.id === tabId ? { ...tabItem, isDirty: false } : tabItem,
            ),
          );
          // Trigger status bar save pulse instead of a global notification
          triggerSavePulse();
        } else {
          showNotification(t('notifications.fileSaveError'), 'error');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error saving file:', error);
        showNotification(t('notifications.fileSaveError'), 'error');
      }
    },
    [tabs, setTabs, showNotification, t, triggerSavePulse],
  );

  // Obter aba ativa
  const currentTab = tabs.find((tab) => tab.id === activeTab);

  // Atualizar status no context quando aba mudar
  useEffect(() => {
    if (currentTab) {
      setCurrentFile(currentTab.filePath);
      setIsEncrypted(currentTab.isEncrypted);

      // Calcular contagem de palavras
      const wordCount = currentTab.content
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      setWordCount(wordCount);
    } else {
      setCurrentFile(null);
      setIsEncrypted(false);
      setWordCount(0);
    }
  }, [currentTab, setCurrentFile, setIsEncrypted, setWordCount]);

  // Register openFile function in context (so Sidebar can open files)
  useEffect(() => {
    setOpenFileInEditor(() => openFile);
  }, [openFile, setOpenFileInEditor]);

  // Listener para Ctrl+S (salvar arquivo)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (activeTab) {
          saveFile(activeTab);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, tabs, saveFile]);

  // Auto-save quando conteúdo muda
  useEffect(() => {
    if (!autoSaveEnabled || !currentTab || !currentTab.isDirty) {
      return undefined;
    }

    const timer = setTimeout(() => {
      saveFile(currentTab.id);
    }, 1500); // Salva após 1.5 segundos de inatividade

    return () => {
      clearTimeout(timer);
    };
  }, [currentTab, saveFile, autoSaveEnabled]);

  // Função para abrir dialog de criação de arquivo
  const handleCreateFile = () => {
    setFileDialogOpen(true);
  };

  // Função para fechar dialog
  const handleFileDialogClose = () => {
    setFileDialogOpen(false);
  };

  // Função para confirmar criação de arquivo
  const handleFileDialogConfirm = async (fileData: FileCreationData) => {
    try {
      const notesPath = await fileSystemService.getDefaultNotesDirectory();
      const result = await fileCreationService.createFile(notesPath, fileData);

      if (result.success && result.filename && result.filePath) {
        // Abrir o arquivo criado no editor com o nome completo (incluindo extensão)
        await openFile(
          result.filePath,
          result.filename,
          result.originalExtension,
          '',
          fileData.encrypted,
          result.password, // Pass the password if manual encryption was used
        );

        // Atualizar contexto
        setCurrentFile(result.filePath);
        setIsEncrypted(fileData.encrypted);

        // Notificar sidebar para fazer refresh via context
        refreshSidebar();

        // Mostrar notificação de sucesso
        showNotification(t('notifications.fileCreated'), 'success');
      } else {
        // Mostrar notificação de erro se a criação falhou
        showNotification(t('notifications.fileCreationError'), 'error');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating file:', error);
      // Mostrar notificação de erro
      showNotification(t('notifications.fileCreationError'), 'error');
    }
    setFileDialogOpen(false);
  };

  // Função para criar uma nova aba em branco (antigo comportamento)
  const createNewTab = () => {
    handleCreateFile();
  };

  return (
    <Box className="editor-container">
      {/* Área das tabs */}
      {tabs.length > 0 && (
        <Box className="editor-tabs-container">
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            className="editor-tabs"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                label={
                  <Box className="tab-label-box">
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100px',
                      }}
                    >
                      {tab.isDirty ? '● ' : ''}
                      {tab.filename || 'Untitled'}
                      {tab.isEncrypted && ' 🔒'}
                    </Typography>
                    <IconButton
                      component="span"
                      size="small"
                      onClick={(e) => closeTab(tab.id, e)}
                      className="tab-close-btn"
                      aria-label={`close-${tab.filename}`}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                }
                value={tab.id}
                title={tab.filePath}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Área de conteúdo */}
      {currentTab ? (
        <Card className="editor-card" elevation={2}>
          {/* Container do editor */}
          <Box className="editor-content">
            {currentTab.filePath.endsWith('.json') ||
            (currentTab.isEncrypted &&
              currentTab.originalExtension === '.json') ? (
              <JsonEditor
                content={currentTab.content}
                onContentChange={(newContent) =>
                  updateTabContent(currentTab.id, newContent)
                }
                filePath={currentTab.filePath}
              />
            ) : (
              <TextField
                multiline
                fullWidth
                placeholder={
                  t('editor.placeholder') || 'Digite seu conteúdo aqui...'
                }
                value={currentTab.content}
                onChange={(e) =>
                  updateTabContent(currentTab.id, e.target.value)
                }
                variant="outlined"
                className="editor-textfield"
              />
            )}
          </Box>
        </Card>
      ) : (
        // Tela de boas-vindas quando não há abas abertas
        <Box className="editor-welcome">
          <Typography variant="h5" className="editor-welcome-title">
            {t('editor.welcome.title') || 'LockrNotes Editor'}
          </Typography>
          <Typography variant="body1" className="editor-welcome-text">
            {t('editor.welcome.message') ||
              'Clique em um arquivo na barra lateral para abri-lo em uma nova aba, ou crie uma nova aba para começar a escrever.'}
          </Typography>
          <IconButton
            onClick={createNewTab}
            size="large"
            className="editor-welcome-btn"
          >
            <AddIcon />
          </IconButton>
        </Box>
      )}

      <FileCreationDialog
        open={fileDialogOpen}
        onClose={handleFileDialogClose}
        onConfirm={handleFileDialogConfirm}
      />

      <PasswordDialog
        open={passwordDialogOpen}
        filename={currentPendingFile?.savedTab.filename || ''}
        onConfirm={handlePasswordConfirm}
        onClose={handlePasswordCancel}
        error={passwordError}
      />
    </Box>
  );
}
