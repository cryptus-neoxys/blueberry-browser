import { WebContents } from "electron";
import {
  streamText,
  generateObject,
  type LanguageModel,
  type CoreMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import * as dotenv from "dotenv";
import { join } from "path";
import type { Window } from "./Window";
import { MemoryService } from "./services/MemoryService";
import { ContextSnapshot } from "./services/ContextAssembler";
import { Workflow } from "./types";

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, "../../.env") });

interface ChatRequest {
  message: string;
  messageId: string;
}

interface StreamChunk {
  content: string;
  isComplete: boolean;
}

type LLMProvider = "openai" | "anthropic";

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
};

const MAX_CONTEXT_LENGTH = 4000;
const DEFAULT_TEMPERATURE = 0.7;

export class LLMClient {
  private readonly webContents: WebContents;
  private window: Window | null = null;
  private readonly provider: LLMProvider;
  private readonly modelName: string;
  private readonly model: LanguageModel | null;
  private messages: CoreMessage[] = [];
  private readonly memoryService: MemoryService;

  constructor(webContents: WebContents) {
    this.webContents = webContents;
    this.provider = this.getProvider();
    this.modelName = this.getModelName();
    this.model = this.initializeModel();
    this.memoryService = new MemoryService();

    this.logInitializationStatus();
  }

  // Set the window reference after construction to avoid circular dependencies
  setWindow(window: Window): void {
    this.window = window;
  }

  async analyzeContextAndSuggestWorkflow(
    context: ContextSnapshot,
  ): Promise<Workflow | null> {
    if (!this.model) return null;

    const workflowSchema = z.object({
      id: z.string().describe("Unique identifier for the workflow"),
      title: z.string().describe("Short, action-oriented title"),
      description: z
        .string()
        .describe("Clear explanation of what this automation does"),
      triggerContext: z
        .string()
        .describe("Why this workflow is being suggested based on the context"),
      isValid: z
        .boolean()
        .describe(
          "Set to true if a valid, helpful workflow was found. Set to false if no pattern was detected.",
        ),
      actions: z.array(
        z.object({
          type: z.enum(["navigate", "click", "input", "wait"]),
          target: z
            .string()
            .optional()
            .describe("URL for navigate, CSS selector for click/input"),
          value: z.string().optional().describe("Text to input"),
          description: z
            .string()
            .describe("Human-readable description of this step"),
        }),
      ),
    });

    try {
      const { object } = await generateObject({
        model: this.model,
        schema: workflowSchema,
        system: `
You are the "Workflow Analyst" for a smart browser. Your goal is to detect repetitive patterns or helpful automations based on the user's current context.

AVAILABLE ACTIONS:
1. navigate(url): Open a specific URL.
2. click(selector): Click an element on the page.
3. input(selector, value): Type text into a field.
4. wait(ms): Pause execution.

ANALYSIS GUIDELINES:
- Look for "Research Sessions": If the user has multiple tabs open about a topic, suggest opening related resources or organizing them.
- Look for "Form Filling": If the user is on a login/signup page, suggest filling known credentials (if safe) or navigating to the dashboard.
- Look for "Daily Routines": If the user opens specific sites together, suggest opening them all at once.

OUTPUT RULES:
- If you find a helpful pattern, set 'isValid' to true and populate 'actions'.
- If the context is random or no clear pattern exists, set 'isValid' to false and return an empty action list.
- Be conservative. Only suggest workflows that clearly save time.
        `,
        prompt: `
Analyze this context:
OPEN TABS:
${JSON.stringify(context.openTabs, null, 2)}

RECENT TELEMETRY (Last 5 mins):
${JSON.stringify(context.recentTelemetry, null, 2)}
        `,
      });

      if (!object.isValid) {
        return null;
      }

      return object as Workflow;
    } catch (error) {
      console.error("Failed to generate workflow suggestion:", error);
      return null;
    }
  }

  private getProvider(): LLMProvider {
    const provider = process.env.LLM_PROVIDER?.toLowerCase();
    if (provider === "anthropic") return "anthropic";
    return "openai"; // Default to OpenAI
  }

  private getModelName(): string {
    return process.env.LLM_MODEL || DEFAULT_MODELS[this.provider];
  }

  private initializeModel(): LanguageModel | null {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    switch (this.provider) {
      case "anthropic":
        return anthropic(this.modelName);
      case "openai":
        return openai(this.modelName);
      default:
        return null;
    }
  }

  private getApiKey(): string | undefined {
    switch (this.provider) {
      case "anthropic":
        return process.env.ANTHROPIC_API_KEY;
      case "openai":
        return process.env.OPENAI_API_KEY;
      default:
        return undefined;
    }
  }

  private logInitializationStatus(): void {
    if (this.model) {
      console.log(
        `✅ LLM Client initialized with ${this.provider} provider using model: ${this.modelName}`,
      );
    } else {
      const keyName =
        this.provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
      console.error(
        `❌ LLM Client initialization failed: ${keyName} not found in environment variables.\n` +
          `Please add your API key to the .env file in the project root.`,
      );
    }
  }

  async sendChatMessage(request: ChatRequest): Promise<void> {
    try {
      // Get screenshot from active tab if available
      let screenshot: string | null = null;
      if (this.window) {
        const activeTab = this.window.activeTab;
        if (activeTab) {
          try {
            const image = await activeTab.screenshot();
            screenshot = image.toDataURL();
          } catch (error) {
            console.error("Failed to capture screenshot:", error);
          }
        }
      }

      // Build user message content with screenshot first, then text
      const userContent: Array<{
        type: string;
        image?: string;
        text?: string;
      }> = [];

      // Add screenshot as the first part if available
      if (screenshot) {
        userContent.push({
          type: "image",
          image: screenshot,
        });
      }

      // Add text content
      userContent.push({
        type: "text",
        text: request.message,
      });

      // Create user message in CoreMessage format
      const userMessage: CoreMessage = {
        role: "user",
        content:
          userContent.length === 1 ? request.message : (userContent as never),
      };

      this.messages.push(userMessage);

      // Send updated messages to renderer
      this.sendMessagesToRenderer();

      if (!this.model) {
        this.sendErrorMessage(
          request.messageId,
          "LLM service is not configured. Please add your API key to the .env file.",
        );
        return;
      }

      const messages = await this.prepareMessagesWithContext();
      await this.streamResponse(messages, request.messageId);
    } catch (error) {
      console.error("Error in LLM request:", error);
      this.handleStreamError(error, request.messageId);
    }
  }

  clearMessages(): void {
    this.messages = [];
    this.sendMessagesToRenderer();
  }

  getMessages(): CoreMessage[] {
    return this.messages;
  }

  private sendMessagesToRenderer(): void {
    this.webContents.send("chat-messages-updated", this.messages);
  }

  private async prepareMessagesWithContext(): Promise<CoreMessage[]> {
    // Get page context from active tab
    let pageUrl: string | null = null;
    let pageText: string | null = null;

    if (this.window) {
      const activeTab = this.window.activeTab;
      if (activeTab) {
        pageUrl = activeTab.url;
        try {
          pageText = await activeTab.getTabText();
        } catch (error) {
          console.error("Failed to get page text:", error);
        }
      }
    }

    // Get the last user message for RAG search
    const lastUserMessage = this.messages
      .filter((m) => m.role === "user")
      .pop();
    const searchQuery =
      typeof lastUserMessage?.content === "string"
        ? lastUserMessage.content
        : "";

    // Retrieve relevant memory context
    let memoryContext = "";
    if (searchQuery) {
      try {
        const relevantMemories =
          await this.memoryService.searchSimilar(searchQuery);
        if (relevantMemories.length > 0) {
          memoryContext = this.buildMemoryContext(relevantMemories);
        }
      } catch (error) {
        console.error("Failed to retrieve memory context:", error);
      }
    }

    // Build system message
    const systemMessage: CoreMessage = {
      role: "system",
      content: this.buildSystemPrompt(pageUrl, pageText, memoryContext),
    };

    // Include all messages in history (system + conversation)
    return [systemMessage, ...this.messages];
  }

  private buildMemoryContext(
    memories: Array<{ content: string; similarity: number; type: string }>,
  ): string {
    const parts = ["\n## Relevant Context from Memory:"];

    memories.forEach((memory, index) => {
      parts.push(
        `\n[${index + 1}] (similarity: ${memory.similarity.toFixed(3)}, type: ${memory.type})`,
      );
      parts.push(this.truncateText(memory.content, 500));
    });

    return parts.join("\n");
  }

  private buildSystemPrompt(
    url: string | null,
    pageText: string | null,
    memoryContext: string = "",
  ): string {
    const parts: string[] = [
      "You are a helpful AI assistant integrated into a web browser.",
      "You can analyze and discuss web pages with the user.",
      "The user's messages may include screenshots of the current page as the first image.",
    ];

    if (memoryContext) {
      parts.push(memoryContext);
      parts.push(
        "\nUse the above context from previous interactions and browsing history when relevant to the user's query.",
      );
    }

    if (url) {
      parts.push(`\nCurrent page URL: ${url}`);
    }

    if (pageText) {
      const truncatedText = this.truncateText(pageText, MAX_CONTEXT_LENGTH);
      parts.push(`\nPage content (text):\n${truncatedText}`);
    }

    parts.push(
      "\nPlease provide helpful, accurate, and contextual responses about the current webpage.",
      "If the user asks about specific content, refer to the page content and/or screenshot provided.",
    );

    return parts.join("\n");
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  private async streamResponse(
    messages: CoreMessage[],
    messageId: string,
  ): Promise<void> {
    if (!this.model) {
      throw new Error("Model not initialized");
    }

    const result = await streamText({
      model: this.model,
      messages,
      temperature: DEFAULT_TEMPERATURE,
      maxRetries: 3,
      abortSignal: undefined,
    });

    await this.processStream(result.textStream, messageId);
  }

  private async processStream(
    textStream: AsyncIterable<string>,
    messageId: string,
  ): Promise<void> {
    let accumulatedText = "";

    // Create a placeholder assistant message
    const assistantMessage: CoreMessage = {
      role: "assistant",
      content: "",
    };

    // Keep track of the index for updates
    const messageIndex = this.messages.length;
    this.messages.push(assistantMessage);

    for await (const chunk of textStream) {
      accumulatedText += chunk;

      // Update assistant message content
      this.messages[messageIndex] = {
        role: "assistant",
        content: accumulatedText,
      };
      this.sendMessagesToRenderer();

      this.sendStreamChunk(messageId, {
        content: chunk,
        isComplete: false,
      });
    }

    // Final update with complete content
    this.messages[messageIndex] = {
      role: "assistant",
      content: accumulatedText,
    };
    this.sendMessagesToRenderer();

    // Send the final complete signal
    this.sendStreamChunk(messageId, {
      content: accumulatedText,
      isComplete: true,
    });

    // Store completed chat turn in memory
    try {
      await this.memoryService.addEntry(accumulatedText, "chat", {
        messageId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to store chat memory entry", error);
    }
  }

  private handleStreamError(error: unknown, messageId: string): void {
    console.error("Error streaming from LLM:", error);

    const errorMessage = this.getErrorMessage(error);
    this.sendErrorMessage(messageId, errorMessage);
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof Error)) {
      return "An unexpected error occurred. Please try again.";
    }

    const message = error.message.toLowerCase();

    if (message.includes("401") || message.includes("unauthorized")) {
      return "Authentication error: Please check your API key in the .env file.";
    }

    if (message.includes("429") || message.includes("rate limit")) {
      return "Rate limit exceeded. Please try again in a few moments.";
    }

    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("econnrefused")
    ) {
      return "Network error: Please check your internet connection.";
    }

    if (message.includes("timeout")) {
      return "Request timeout: The service took too long to respond. Please try again.";
    }

    return "Sorry, I encountered an error while processing your request. Please try again.";
  }

  private sendErrorMessage(messageId: string, errorMessage: string): void {
    this.sendStreamChunk(messageId, {
      content: errorMessage,
      isComplete: true,
    });
  }

  private sendStreamChunk(messageId: string, chunk: StreamChunk): void {
    this.webContents.send("chat-response", {
      messageId,
      content: chunk.content,
      isComplete: chunk.isComplete,
    });
  }
}
