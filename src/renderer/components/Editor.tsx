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
import JsonEditor from './JsonEditor';
import { fileCreationService, FileCreationData } from '../services/fileService';
import { fileSystemService } from '../services/fileSystemService';
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

  // Função para abrir um novo arquivo em uma aba
  const openFile = useCallback(
    (
      filePath: string,
      filename: string,
      originalExtension?: string,
      content = '',
      isEncrypted = false,
    ) => {
      setTabs((prev) => {
        // If file is already open, focus existing tab and optionally update content
        const existing = prev.find((tabItem) => tabItem.filePath === filePath);
        if (existing) {
          // If provided content differs, update the tab content but keep isDirty as false
          if (content && existing.content !== content) {
            const updated = prev.map((tabItem) =>
              tabItem.filePath === filePath ? { ...tabItem, content } : tabItem,
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
        let contentToSave = targetTab.content;

        // If file is encrypted, encrypt content before saving
        if (targetTab.isEncrypted) {
          try {
            const originalExt = targetTab.originalExtension || '.txt';
            const encryptedData = await window.encryptionAPI.encryptContent(
              targetTab.content,
              targetTab.filePath,
              originalExt,
            );
            contentToSave = JSON.stringify(encryptedData, null, 2);
          } catch (encryptError) {
            // eslint-disable-next-line no-console
            console.error('Error encrypting file:', encryptError);
            showNotification(
              `${t('notifications.fileSaveError')}: Encryption failed`,
              'error',
            );
            return;
          }
        }

        const success = await fileSystemService.saveFile(
          targetTab.filePath,
          contentToSave,
        );

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
        openFile(
          result.filePath,
          result.filename,
          undefined,
          '',
          fileData.encrypted,
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
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
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
    </Box>
  );
}
