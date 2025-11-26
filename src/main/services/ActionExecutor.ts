import { Workflow, Action } from "../types";
import { Window } from "../Window";

export class ActionExecutor {
  private window: Window;

  constructor(window: Window) {
    this.window = window;
  }

  async executeWorkflow(workflow: Workflow): Promise<void> {
    console.log(`Executing workflow: ${workflow.title}`);

    for (const action of workflow.actions) {
      await this.executeAction(action);
    }

    console.log(`Workflow ${workflow.title} completed`);
  }

  private async executeAction(action: Action): Promise<void> {
    console.log(`Executing action: ${action.type}`, action);

    const activeTab = this.window.activeTab;
    if (!activeTab) {
      console.warn("No active tab to execute action on");
      return;
    }

    try {
      switch (action.type) {
        case "navigate":
          if (action.target) {
            await activeTab.loadURL(action.target);
          }
          break;

        case "click":
          if (action.target) {
            await activeTab.runJs(`
              (() => {
                const el = document.querySelector('${action.target}');
                if (el) {
                  el.click();
                  return true;
                }
                return false;
              })()
            `);
          }
          break;

        case "input":
          if (action.target && action.value) {
            await activeTab.runJs(`
              (() => {
                const el = document.querySelector('${action.target}');
                if (el) {
                  el.value = '${action.value}';
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                  return true;
                }
                return false;
              })()
            `);
          }
          break;

        case "wait": {
          const ms = parseInt(action.value || "1000", 10);
          await new Promise((resolve) => setTimeout(resolve, ms));
          break;
        }

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
      throw error;
    }
  }
}
