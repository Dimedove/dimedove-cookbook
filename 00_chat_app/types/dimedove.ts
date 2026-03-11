// ── Conversation types ──────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  object: "conversation";
  created_at: number;
  external_user_id?: string | null;
  title?: string | null;
  generated_title?: Record<string, string> | null;
}

export interface ConversationList {
  object: "list";
  data: Conversation[];
  first_id?: string | null;
  last_id?: string | null;
  has_more: boolean;
}

export interface ConversationItemPart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
}

export interface ConversationItem {
  type: string;
  role?: string;
  parts?: ConversationItemPart[];
  content?: string | Array<{ type: string; text?: string }>;
  name?: string;
  arguments?: string;
  call_id?: string;
}

export interface ConversationDetail extends Conversation {
  items: ConversationItem[];
}

// ── Request types ───────────────────────────────────────────────────────────

export interface MessageInput {
  role?: string;
  content: string;
}

export interface SendMessageRequest {
  message: MessageInput;
  stream?: boolean;
}

export interface ConversationCreateRequest {
  external_user_id?: string;
  title?: string;
}

export interface ConversationUpdateRequest {
  title?: string | null;
}

// ── Response types ──────────────────────────────────────────────────────────

export interface ResponseOutputItem {
  type: string;
  role?: string;
  content?: Array<{ type: string; text?: string }>;
  name?: string;
  arguments?: string;
  call_id?: string;
}

export interface ResponseSchema {
  id: string;
  object: "response";
  created_at: number;
  conversation_id: string;
  output: ResponseOutputItem[];
  status: string;
}

// ── SSE Event types ─────────────────────────────────────────────────────────

export type DimedoveSSEEvent =
  | { type: "response.created"; id: string; status: string; conversation_id: string }
  | { type: "response.output_text.delta"; delta: string; output_index: number; content_index: number }
  | { type: "response.output_text.done"; text: string; output_index: number; content_index: number }
  | { type: "response.function_call.start"; name: string; call_id: string; output_index: number }
  | { type: "response.function_call_arguments.delta"; delta: string; call_id: string; output_index: number }
  | { type: "response.function_call_arguments.done"; name: string; arguments: string; call_id: string; output_index: number }
  | { type: "response.completed"; id: string; status: string }
  | { type: "response.failed"; id: string; status: string; error?: { message: string } };

// ── App metrics types ─────────────────────────────────────────────────────

export interface AppMetrics {
  total_conversations: number;
  total_messages: number;
  total_users: number;
}

// ── App config types ───────────────────────────────────────────────────────

export interface AppConfig {
  app_id: string;
  stream: boolean;
  generative_ui: boolean;
  agent: {
    name: string | null;
    config: {
      primary_color: string | null;
      secondary_color: string | null;
    };
  };
}
