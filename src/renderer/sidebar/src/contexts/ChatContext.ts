import { createContext } from "react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string) => void;
  clearChat: () => void;
  getPageContent: () => Promise<string | null>;
  getPageText: () => Promise<string | null>;
  getCurrentUrl: () => Promise<string | null>;
}

export const ChatContext = createContext<ChatContextType | null>(null);
