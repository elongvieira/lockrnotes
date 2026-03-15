import { createRoot } from 'react-dom/client';
import './i18n';
import App from './App';
import SshTerminalPage from './pages/SshTerminalPage';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

// If the window was opened as an SSH terminal, render only the terminal page
const isSshTerminal = window.location.hash.startsWith('#ssh-terminal/');
root.render(isSshTerminal ? <SshTerminalPage /> : <App />);
