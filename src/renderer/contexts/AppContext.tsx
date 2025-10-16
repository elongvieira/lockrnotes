import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from 'react';

interface FileTab {
  id: string;
  filename: string;
  content: string;
  isDirty: boolean;
  isEncrypted: boolean;
  originalExtension?: string;
  filePath: string;
}

interface AppContextType {
  // Current file state
  currentFile: string | null;
  setCurrentFile: (file: string | null) => void;

  // Editor tabs state
  tabs: FileTab[];
  setTabs: (tabs: FileTab[] | ((prev: FileTab[]) => FileTab[])) => void;
  activeTab: string | null;
  setActiveTab: (tabId: string | null) => void;

  // Sidebar refresh
  refreshSidebar: () => void;
  setRefreshSidebar: (fn: () => void) => void;

  // Editor file opening
  openFileInEditor: (
    filePath: string,
    filename: string,
    originalExtension?: string,
    content?: string,
    isEncrypted?: boolean,
  ) => void;
  setOpenFileInEditor: (
    fn: (
      filePath: string,
      filename: string,
      originalExtension?: string,
      content?: string,
      isEncrypted?: boolean,
    ) => void,
  ) => void;

  // Status bar info
  wordCount: number;
  setWordCount: (count: number) => void;
  isEncrypted: boolean;
  setIsEncrypted: (encrypted: boolean) => void;

  // Notifications
  showNotification: (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info',
  ) => void;
  hideNotification: () => void;
  // Save pulse indicator (timestamp updated when a successful save happens)
  lastSavedAt: number | null;
  triggerSavePulse: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // File state
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  // Editor tabs state
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Sidebar refresh function
  const [refreshSidebar, setRefreshSidebar] = useState<() => void>(
    () => () => {},
  );

  // Editor file opening function
  const [openFileInEditor, setOpenFileInEditor] = useState<
    (
      filePath: string,
      filename: string,
      originalExtension?: string,
      content?: string,
      isEncrypted?: boolean,
    ) => void
  >(() => () => {});

  // Status bar state
  const [wordCount, setWordCount] = useState<number>(0);
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);

  // Notification functions
  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info',
  ) => {
    // This will be handled by the notification component
    window.dispatchEvent(
      new CustomEvent('show-notification', {
        detail: { message, severity },
      }),
    );
  };

  const hideNotification = () => {
    window.dispatchEvent(new CustomEvent('hide-notification'));
  };

  // Save pulse state
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const triggerSavePulse = () => {
    setLastSavedAt(Date.now());
  };

  const contextValue: AppContextType = useMemo(
    () => ({
      currentFile,
      setCurrentFile,
      tabs,
      setTabs,
      activeTab,
      setActiveTab,
      refreshSidebar,
      setRefreshSidebar,
      openFileInEditor,
      setOpenFileInEditor,
      wordCount,
      setWordCount,
      isEncrypted,
      setIsEncrypted,
      showNotification,
      hideNotification,
      lastSavedAt,
      triggerSavePulse,
    }),
    [
      currentFile,
      tabs,
      activeTab,
      refreshSidebar,
      openFileInEditor,
      wordCount,
      isEncrypted,
      lastSavedAt,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
