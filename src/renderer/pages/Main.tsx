import AppBar from '../components/AppBar';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import StatusBar from '../components/StatusBar';
import NotificationSnackbar from '../components/NotificationSnackbar';
import { AppProvider, useAppContext } from '../contexts/AppContext';

function MainContent() {
  const { currentFile, isEncrypted, wordCount } = useAppContext();

  return (
    <>
      <AppBar />
      <div className="app-container">
        <Sidebar />
        <Editor />
      </div>
      <StatusBar
        currentFile={currentFile || undefined}
        isEncrypted={isEncrypted}
        wordCount={wordCount}
        status="Ready"
      />
    </>
  );
}

export default function Main() {
  return (
    <AppProvider>
      <MainContent />
      <NotificationSnackbar />
    </AppProvider>
  );
}
