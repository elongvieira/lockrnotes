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

  // Status bar info
  wordCount: number;
  setWordCount: (count: number) => void;
  isEncrypted: boolean;
  setIsEncrypted: (encrypted: boolean) => void;
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

  // Status bar state
  const [wordCount, setWordCount] = useState<number>(0);
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);

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
      wordCount,
      setWordCount,
      isEncrypted,
      setIsEncrypted,
    }),
    [currentFile, tabs, activeTab, refreshSidebar, wordCount, isEncrypted],
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
