import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import App from '../../renderer/App';

// Mock window.electron for jsdom environment
Object.defineProperty(window, 'electron', {
  value: {
    filesystem: {
      readConfig: jest.fn().mockResolvedValue({ firstRun: false }),
      readDirectory: jest.fn().mockResolvedValue([]),
      getItem: jest.fn().mockResolvedValue(null),
      writeConfig: jest.fn().mockResolvedValue(undefined),
    },
    ipcRenderer: {
      sendMessage: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
    },
  },
  writable: true,
});

describe('App', () => {
  it('should render', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });
});
