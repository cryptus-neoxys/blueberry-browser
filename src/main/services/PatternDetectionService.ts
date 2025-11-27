import { createHash, randomUUID } from "crypto";
import { Window } from "../Window";
import { EventManager } from "../EventManager";
import { ContextAssembler, ContextSnapshot } from "./ContextAssembler";
import { getDatabase } from "../database";
import { SuggestionDocType } from "../database/schema";
import { Workflow } from "../types";

export class PatternDetectionService {
  private window: Window;
  private eventManager: EventManager;
  private contextAssembler: ContextAssembler;
  private isAnalyzing: boolean = false;

  constructor(window: Window, eventManager: EventManager) {
    this.window = window;
    this.eventManager = eventManager;
    this.contextAssembler = new ContextAssembler();
    this.contextAssembler.setWindow(window);
  }

  async analyzePatterns(): Promise<void> {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    try {
      const context = await this.contextAssembler.assemble();

      // Get LLM Client from Sidebar
      const llmClient = this.window.sidebar?.client;
      if (!llmClient) {
        console.warn("LLM Client not available");
        return;
      }

      const workflow =
        await llmClient.analyzeContextAndSuggestWorkflow(context);

      if (workflow) {
        await this.processWorkflow(workflow, context);
      }
    } catch (error) {
      console.error("Error in pattern detection:", error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  private async processWorkflow(
    workflow: Workflow,
    context: ContextSnapshot,
  ): Promise<void> {
    const hash = this.hashWorkflow(workflow);
    const status = await this.checkSuggestionStatus(hash);

    if (
      status === "rejected" ||
      status === "accepted" ||
      status === "pending"
    ) {
      // Already handled or pending
      return;
    }

    // New suggestion
    const suggestion = await this.saveSuggestion(workflow, hash, context);

    // Emit to sidebar
    this.eventManager.sendToSidebar("proactive-suggestion", suggestion);
  }

  private hashWorkflow(workflow: Workflow): string {
    const content = JSON.stringify({
      actions: workflow.actions,
      trigger: workflow.triggerContext,
    });
    return createHash("sha256").update(content).digest("hex");
  }

  private async checkSuggestionStatus(hash: string): Promise<string | null> {
    const db = await getDatabase();
    const doc = await db.suggestions
      .findOne({
        selector: { hash },
      })
      .exec();
    return doc ? doc.status : null;
  }

  private async saveSuggestion(
    workflow: Workflow,
    hash: string,
    context: ContextSnapshot,
  ): Promise<SuggestionDocType> {
    const db = await getDatabase();
    const id = randomUUID();

    const doc = await db.suggestions.insert({
      id,
      hash,
      type: "workflow",
      title: workflow.title,
      description: workflow.description,
      workflow,
      status: "pending",
      timestamp: Date.now(),
      contextSnapshot: context,
    });

    return doc.toJSON() as SuggestionDocType;
  }

  /**
   * Trigger analysis after new memory entry
   */
  async onNewEntry(): Promise<void> {
    await this.analyzePatterns();
  }
}
