import { vi } from "vitest";

// Mock Electron
vi.mock("electron", () => {
  return {
    app: {
      getPath: vi.fn(() => "/tmp"),
      on: vi.fn(),
      whenReady: vi.fn().mockResolvedValue(undefined),
    },
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
      removeHandler: vi.fn(),
      removeAllListeners: vi.fn(),
    },
    BrowserWindow: class {
      on = vi.fn();
      webContents = {
        send: vi.fn(),
      };
    },
    BaseWindow: class {
      on = vi.fn();
      setMinimumSize = vi.fn();
      getBounds = vi.fn(() => ({ width: 1000, height: 800 }));
      contentView = {
        addChildView: vi.fn(),
      };
    },
    WebContentsView: class {
      webContents = {
        loadURL: vi.fn(),
        loadFile: vi.fn(),
        on: vi.fn(),
        debugger: {
          attach: vi.fn(),
        },
      };
      setBounds = vi.fn();
    },
    shell: {
      openExternal: vi.fn(),
    },
  };
});

// Mock @electron-toolkit/utils
vi.mock("@electron-toolkit/utils", () => ({
  is: {
    dev: true,
  },
  electronApp: {
    setAppUserModelId: vi.fn(),
  },
}));
