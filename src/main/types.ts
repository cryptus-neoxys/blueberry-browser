export type ActionType =
  | "navigate"
  | "click"
  | "input"
  | "wait"
  | "reorder-tabs";

export interface Action {
  type: ActionType;
  target?: string; // URL for navigate, selector for click/input
  value?: string; // Value for input
  payload?: Record<string, unknown>; // Additional data for actions like reorder-tabs
  description?: string;
}

export interface Workflow {
  id: string;
  title: string;
  description?: string;
  actions: Action[];
  triggerContext?: string; // Description of what triggered this workflow
}
