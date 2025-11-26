import { NativeImage, WebContents, WebContentsView } from "electron";

export class Tab {
  private webContentsView: WebContentsView;
  private _id: string;
  private _title: string;
  private _url: string;
  private _isVisible: boolean = false;

  constructor(id: string, url: string = "https://www.google.com") {
    this._id = id;
    this._url = url;
    this._title = "New Tab";

    // Create the WebContentsView for web content only
    this.webContentsView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Temporarily disable sandbox to test executeJavaScript
        webSecurity: false, // Disable to allow executeJavaScript on pages with CSP
      },
    });

    // Attach debugger to bypass CSP
    this.webContentsView.webContents.debugger.attach();

    // Set up event listeners
    this.setupEventListeners();

    // Load the initial URL
    this.loadURL(url);
  }

  private setupEventListeners(): void {
    // Update title when page title changes
    this.webContentsView.webContents.on("page-title-updated", (_, title) => {
      this._title = title;
    });

    // Update URL when navigation occurs
    this.webContentsView.webContents.on("did-navigate", (_, url) => {
      this._url = url;
      void this.recordTelemetry("did-navigate");
    });

    this.webContentsView.webContents.on("did-navigate-in-page", (_, url) => {
      this._url = url;
      void this.recordTelemetry("did-navigate-in-page");
    });

    this.webContentsView.webContents.on("did-finish-load", async () => {
      // Small delay to ensure page is fully ready
      setTimeout(async () => {
        try {
          console.log(
            `Tab ${this.id} did-finish-load, URL: ${this._url}, isLoading: ${this.webContentsView.webContents.isLoading()}`,
          );
          // Skip if URL is about:blank or similar
          if (
            this._url.startsWith("about:") ||
            this._url.startsWith("chrome:")
          ) {
            return;
          }

          console.log(`Capturing memory for tab ${this.id} at ${this._url}`);
          const text = await this.getTabText();
          const title = this._title;
          const url = this._url;

          const { MemoryService } = await import("./services/MemoryService");
          const memoryService = new MemoryService();

          await memoryService.addEntry(text, "page", {
            url,
            title,
            capturedAt: Date.now(),
          });
          console.log(`Captured memory entry for ${url}`);

          void this.recordTelemetry("memory-captured", {
            contentLength: text.length,
          });
        } catch (error) {
          console.error("Failed to capture page memory entry", error);
        }
      }, 3000);
    });
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get url(): string {
    return this._url;
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  get webContents(): WebContents {
    return this.webContentsView.webContents;
  }

  get view(): WebContentsView {
    return this.webContentsView;
  }

  // Public methods
  show(): void {
    this._isVisible = true;
    this.webContentsView.setVisible(true);
  }

  hide(): void {
    this._isVisible = false;
    this.webContentsView.setVisible(false);
  }

  async screenshot(): Promise<NativeImage> {
    return await this.webContentsView.webContents.capturePage();
  }

  async runJs(code: string): Promise<unknown> {
    return await this.webContentsView.webContents.executeJavaScript(code);
  }

  async getTabHtml(): Promise<string> {
    try {
      return (await this.runJs(
        "try { return document.documentElement ? document.documentElement.outerHTML : ''; } catch(e) { return ''; }",
      )) as string;
    } catch (error) {
      console.warn(`Failed to extract HTML from tab ${this._id}:`, error);
      return "";
    }
  }

  async getTabText(): Promise<string> {
    try {
      const result =
        await this.webContentsView.webContents.debugger.sendCommand(
          "Runtime.evaluate",
          {
            expression: `
          (function() {
            try {
              if (document.readyState !== 'complete') {
                return '';
              }
              return document.documentElement.innerText || '';
            } catch (e) {
              console.error('Script error in tab:', e);
              return '';
            }
          })()
        `,
            returnByValue: true,
          },
        );
      const text = result.result.value || "";
      return text;
    } catch (error) {
      console.error(`Failed to extract text from tab ${this.id}:`, error);
      return "";
    }
  }

  loadURL(url: string): Promise<void> {
    this._url = url;
    return this.webContentsView.webContents.loadURL(url);
  }

  goBack(): void {
    if (this.webContentsView.webContents.navigationHistory.canGoBack()) {
      this.webContentsView.webContents.navigationHistory.goBack();
    }
  }

  goForward(): void {
    if (this.webContentsView.webContents.navigationHistory.canGoForward()) {
      this.webContentsView.webContents.navigationHistory.goForward();
    }
  }

  reload(): void {
    this.webContentsView.webContents.reload();
  }

  stop(): void {
    this.webContentsView.webContents.stop();
  }

  destroy(): void {
    this.webContentsView.webContents.close();
  }

  private async recordTelemetry(
    eventType: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      const { TelemetryService } = await import("./services/TelemetryService");
      const telemetryService = new TelemetryService();
      await telemetryService.recordEvent({
        tabId: this._id,
        title: this._title,
        url: this._url,
        eventType,
        metadata,
        lastActiveAt: Date.now(),
      });
    } catch (error) {
      console.error("Failed to record telemetry", error);
    }
  }
}
