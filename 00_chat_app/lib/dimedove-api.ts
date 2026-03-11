/**
 * Dimedove Apps API client.
 *
 * This module handles all server-side communication with the Dimedove API.
 * It uses environment variables for configuration — see .env.example for
 * the required values.
 */

import type {
  AppConfig,
  AppMetrics,
  Conversation,
  ConversationList,
  ConversationDetail,
  ConversationCreateRequest,
  ConversationUpdateRequest,
} from "@/types/dimedove";

const API_BASE = process.env.DIMEDOVE_API_BASE || "https://api.dimedove.com/v1";

function getAppId(): string {
  const appId = process.env.DIMEDOVE_APP_ID;
  if (!appId) throw new Error("DIMEDOVE_APP_ID is not set");
  return appId;
}

function getApiKey(): string {
  const key = process.env.DIMEDOVE_API_KEY;
  if (!key) throw new Error("DIMEDOVE_API_KEY is not set");
  return key;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

function baseUrl(): string {
  return `${API_BASE}/apps/${getAppId()}`;
}

export async function getAppConfig(): Promise<AppConfig> {
  const res = await fetch(`${baseUrl()}/config`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to get app config: ${res.status}`);
  return res.json();
}

export async function getAppMetrics(): Promise<AppMetrics> {
  const res = await fetch(`${baseUrl()}/metrics`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to get app metrics: ${res.status}`);
  return res.json();
}

export async function createConversation(
  body?: ConversationCreateRequest,
): Promise<Conversation> {
  const res = await fetch(`${baseUrl()}/conversations`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
  return res.json();
}

export async function listConversations(
  limit = 50,
  order: "asc" | "desc" = "desc",
  after?: string,
  before?: string,
): Promise<ConversationList> {
  const params = new URLSearchParams({ limit: String(limit), order });
  if (after) params.set("after", after);
  if (before) params.set("before", before);
  const res = await fetch(`${baseUrl()}/conversations?${params}`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to list conversations: ${res.status}`);
  return res.json();
}

export async function listUserConversations(
  externalUserId: string,
  limit = 50,
  order: "asc" | "desc" = "desc",
  after?: string,
  before?: string,
): Promise<ConversationList> {
  const params = new URLSearchParams({ limit: String(limit), order });
  if (after) params.set("after", after);
  if (before) params.set("before", before);
  const res = await fetch(
    `${API_BASE}/apps/${getAppId()}/users/${encodeURIComponent(externalUserId)}/conversations?${params}`,
    { method: "GET", headers: headers() },
  );
  if (!res.ok)
    throw new Error(`Failed to list user conversations: ${res.status}`);
  return res.json();
}

export async function getConversation(
  conversationId: string,
): Promise<ConversationDetail> {
  const res = await fetch(`${baseUrl()}/conversations/${conversationId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to get conversation: ${res.status}`);
  return res.json();
}

export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  const res = await fetch(`${baseUrl()}/conversations/${conversationId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`);
}

export async function updateConversation(
  conversationId: string,
  body: ConversationUpdateRequest,
): Promise<Conversation> {
  const res = await fetch(`${baseUrl()}/conversations/${conversationId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update conversation: ${res.status}`);
  return res.json();
}

export async function sendMessage(
  conversationId: string,
  content: string,
  stream: boolean,
): Promise<Response> {
  const res = await fetch(`${baseUrl()}/conversations/${conversationId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      message: { role: "user", content },
      stream,
    }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  return res;
}

export async function sendMessageStream(
  conversationId: string,
  content: string,
): Promise<Response> {
  return sendMessage(conversationId, content, true);
}

/**
 * Async generator that parses SSE events from a ReadableStream.
 * Yields parsed JSON objects for each `data:` line (skips `event:` lines and comments).
 */
export async function* parseDimedoveSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<Record<string, unknown>> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("event:") || trimmed.startsWith(":")) {
        continue;
      }
      if (trimmed.startsWith("data:")) {
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          yield JSON.parse(payload);
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}
