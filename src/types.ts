export type AIState = "idle" | "thinking" | "typing";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
}
