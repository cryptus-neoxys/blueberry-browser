import { app, BrowserWindow } from "electron";
import { electronApp } from "@electron-toolkit/utils";
import { Window } from "./Window";
import { AppMenu } from "./Menu";
import { EventManager } from "./EventManager";
import { PatternDetectionService } from "./services/PatternDetectionService";

let mainWindow: Window | null = null;
let eventManager: EventManager | null = null;
let menu: AppMenu | null = null;
let patternDetectionService: PatternDetectionService | null = null;

const createWindow = (): Window => {
  // Ensure previous event manager is cleaned up
  if (eventManager) {
    eventManager.cleanup();
    eventManager = null;
  }

  const window = new Window();
  menu = new AppMenu(window);
  eventManager = new EventManager(window);

  // Initialize pattern detection service
  patternDetectionService = new PatternDetectionService(window, eventManager);

  // Load the window content after event manager is ready
  window.load();

  // Set up 5-minute interval for pattern analysis
  setInterval(
    async () => {
      if (patternDetectionService) {
        await patternDetectionService.analyzePatterns();

        // TODO: Implement any additional logic needed after pattern analysis, inside patternDetectionService (prefer) or inside analyzePatterns
      }
    },
    5 * 60 * 1000
  );

  return window;
};

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  mainWindow = createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (eventManager) {
    eventManager.cleanup();
    eventManager = null;
  }

  // Clean up references
  if (mainWindow) {
    mainWindow = null;
  }
  if (menu) {
    menu = null;
  }

  // TODO: @cryptus-neoxys to ask why???
  if (process.platform !== "darwin") {
    app.quit();
  }
});
