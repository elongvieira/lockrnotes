import AppBar from '../components/AppBar';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import StatusBar from '../components/StatusBar';
import NotificationSnackbar from '../components/NotificationSnackbar';
import { AppProvider } from '../contexts/AppContext';

function MainContent() {
  return (
    <>
      <AppBar />
      <div className="app-container">
        <Sidebar />
        <Editor />
      </div>
      <StatusBar />
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
