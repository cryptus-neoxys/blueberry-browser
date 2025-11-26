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
                try {
                  const el = document.querySelector(${JSON.stringify(action.target)});
                  if (el) {
                    el.click();
                    return true;
                  }
                  return false;
                } catch (e) {
                  console.error("ActionExecutor click error:", e);
                  return false;
                }
              })()
            `);
          }
          break;

        case "input":
          if (action.target && action.value) {
            await activeTab.runJs(`
              (() => {
                try {
                  const el = document.querySelector(${JSON.stringify(action.target)});
                  if (el) {
                    el.value = ${JSON.stringify(action.value)};
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                  }
                  return false;
                } catch (e) {
                  console.error("ActionExecutor input error:", e);
                  return false;
                }
              })()
            `);
          }
          break;

        case "wait": {
          const ms = parseInt(action.value || "1000", 10);
          await new Promise((resolve) => setTimeout(resolve, ms));
          break;
        }

        case "reorder-tabs":
          if (action.payload?.newOrder) {
            const success = this.window.reorderTabs(
              action.payload.newOrder as string[],
            );
            if (!success) {
              console.warn("Failed to reorder tabs: invalid order provided");
            }
          }
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
      throw error;
    }
  }
}
