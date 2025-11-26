export type ActionType = "navigate" | "click" | "input" | "wait";

export interface Action {
  type: ActionType;
  target?: string; // URL for navigate, selector for click/input
  value?: string; // Value for input
  description: string;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  actions: Action[];
  triggerContext: string; // Description of what triggered this workflow
}
