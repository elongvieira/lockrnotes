import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import App from '../../renderer/App';
import { buildTermsAcceptanceRecord } from '../../renderer/terms/termsDocument';

let acceptedConfig: Record<string, unknown> = { firstRun: false };

beforeAll(async () => {
  acceptedConfig = {
    firstRun: false,
    termsAcceptance: await buildTermsAcceptanceRecord('pt-BR'),
  };
});

// Mock window.electron for jsdom environment
Object.defineProperty(window, 'electron', {
  value: {
    filesystem: {
      readConfig: jest.fn().mockImplementation(() =>
        Promise.resolve(acceptedConfig),
      ),
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
