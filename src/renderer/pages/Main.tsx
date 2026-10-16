import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppBar from '../components/AppBar';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import StatusBar from '../components/StatusBar';
import NotificationSnackbar from '../components/NotificationSnackbar';
import { AppProvider } from '../contexts/AppContext';

function MainContent() {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      const api = window.encryptionAPI;
      if (!api) return;
      api
        .getStorageStatus()
        .then((status) => {
          if (!status?.weak) return undefined;
          window.dispatchEvent(
            new CustomEvent('show-notification', {
              detail: {
                message: t('notifications.weakOsEncryption'),
                severity: 'warning',
              },
            }),
          );
          return undefined;
        })
        .catch(() => undefined);
    }, 0);
    return () => clearTimeout(timer);
  }, [t]);

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
