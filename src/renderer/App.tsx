import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Suspense, useState, useEffect } from 'react';
import './App.css';
import './styles/scrollbar.css';
import Main from './pages/Main';
import theme from './theme';
import WelcomeDialog from './components/WelcomeDialog';
import { fileSystemService } from './services/fileSystemService';

export default function App() {
  const [welcomeOpen, setWelcomeOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkFirstRun = async () => {
    try {
      const config = await fileSystemService.readConfig();

      // Show welcome dialog if firstRun is true or config doesn't exist
      if (!config || config.firstRun === true) {
        setWelcomeOpen(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking first run:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFirstRun();
  }, []);

  const handleWelcomeClose = () => {
    setWelcomeOpen(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense fallback={<div>Loading...</div>}>
        <Router>
          <Routes>
            <Route path="/" element={<Main />} />
          </Routes>
        </Router>
      </Suspense>
      <WelcomeDialog open={welcomeOpen} onClose={handleWelcomeClose} />
    </ThemeProvider>
  );
}
