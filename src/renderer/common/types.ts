export type ActionType = "navigate" | "click" | "input" | "wait";

export interface Action {
  type: ActionType;
  target?: string;
  value?: string;
  description: string;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  actions: Action[];
  triggerContext: string;
}

export interface Suggestion {
  id: string;
  hash: string;
  type: string;
  title: string;
  description: string;
  workflow: Workflow;
  status: "pending" | "accepted" | "rejected" | "expired";
  timestamp: number;
}
