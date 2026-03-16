"use client";

import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ChatSidebar, getConversationTitle } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import type {
  AppConfig,
  Conversation,
  ConversationDetail,
  ConversationItem,
} from "@/types/dimedove";
import { generateId } from "ai";
import { RingLoader } from "@/components/common/ring-loader";
import { useTranslations, useLocale } from "next-intl";

const PENDING_MESSAGE_KEY = "pendingMessage";

type BrandColors = {
  primaryColor?: string;
  secondaryColor?: string;
};

interface Props {
  brandName: string;
  logo?: ReactNode;
  assistantIcon?: ReactNode;
  welcomeMessage?: string;
  conversationId?: string;
  basePath?: string;
}

function mapItemsToMessages(items: ConversationItem[]): UIMessage[] {
  const messages: UIMessage[] = [];

  for (const item of items) {
    if (item.type !== "message" || !item.role) continue;

    const uiParts: UIMessage["parts"] = [];

    for (const part of item.parts || []) {
      if (part.type === "text" && part.text) {
        uiParts.push({ type: "text", text: part.text });
      } else if (part.type === "tool-call") {
        uiParts.push({
          type: "dynamic-tool",
          toolCallId: part.toolCallId || generateId(),
          toolName: part.toolName || "tool",
          state: "output-available",
          input: part.input ?? {},
          output: part.output ?? {},
        } as unknown as UIMessage["parts"][number]);
      } else if (part.type === "data-spec") {
        // Pass through data-spec parts for generative UI rendering
        uiParts.push(part as unknown as UIMessage["parts"][number]);
      }
    }

    if (uiParts.length > 0) {
      messages.push({
        id: generateId(),
        role: item.role as "user" | "assistant",
        parts: uiParts,
      });
    }
  }

  return messages;
}

export function ChatLayout({
  brandName,
  logo,
  assistantIcon,
  welcomeMessage,
  conversationId,
  basePath = "",
}: Props) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  // ── User identification ───────────────────────────────────────────────────
  // A random user ID is generated once and persisted in localStorage.
  // In your production app, replace this with your authenticated user's ID
  // (e.g., from your auth provider, database, session, etc.).
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const key = "dimedove-tmp-user-id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    setUserId(id);
  }, []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(!conversationId);
  const [input, setInput] = useState("");
  const [brandColors, setBrandColors] = useState<BrandColors>({});
  const [appStream, setAppStream] = useState<boolean | null>(null);
  const pendingMessageSent = useRef(false);

  // Fetch conversation list for current user
  const fetchConversations = useCallback(async (uid: string) => {
    try {
      const params = new URLSearchParams({ external_user_id: uid });
      const res = await fetch(`/api/conversations?${params}`);
      const data = await res.json();
      setConversations(data.data || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchConversations(userId);
  }, [fetchConversations, userId]);

  // Load app config (brand colors + streaming setting) once on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await fetch("/api/config");
        if (!res.ok)
          throw new Error(`Failed to fetch app config: ${res.status}`);
        const config: AppConfig = await res.json();
        if (!isMounted) return;

        setAppStream(config.stream);
        setBrandColors({
          primaryColor: config.agent?.config?.primary_color ?? undefined,
          secondaryColor: config.agent?.config?.secondary_color ?? undefined,
        });
      } catch (err) {
        console.error("Failed to fetch app config:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load conversation history when conversationId prop is provided
  useEffect(() => {
    if (!conversationId) {
      setHistoryLoaded(true);
      return;
    }
    setHistoryLoaded(false);
    (async () => {
      try {
        const res = await fetch(`/api/conversations?id=${conversationId}`);
        const detail: ConversationDetail = await res.json();
        const msgs = mapItemsToMessages(detail.items || []);
        setInitialMessages(msgs);
        setActiveId(conversationId);
      } catch (err) {
        console.error("Failed to load conversation:", err);
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, [conversationId]);

  const { messages, sendMessage, status, stop } = useChat({
    id: activeId || undefined,
    messages: initialMessages,
    experimental_throttle: 50,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId: activeId, stream: appStream ?? true },
    }),
  });

  // Send pending message after conversation loads and config is ready
  useEffect(() => {
    if (!conversationId || pendingMessageSent.current) return;
    if (appStream === null) return; // Wait for config to load
    const pending = sessionStorage.getItem(PENDING_MESSAGE_KEY);
    if (!pending) return;
    if (activeId !== conversationId) return;
    pendingMessageSent.current = true;
    sessionStorage.removeItem(PENDING_MESSAGE_KEY);
    sendMessage({ text: pending });
    setTimeout(() => fetchConversations(userId), 3000);
  }, [
    conversationId,
    activeId,
    appStream,
    sendMessage,
    fetchConversations,
    userId,
  ]);

  // Navigate to a conversation
  const navigateToConversation = useCallback(
    (id: string) => {
      router.push(`${basePath}/c/${id}`);
    },
    [router, basePath],
  );

  // Create new conversation (navigate to clean state)
  const handleNew = useCallback(() => {
    router.push(basePath || "/");
  }, [router, basePath]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    // No active conversation — create one and redirect
    if (!activeId) {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ external_user_id: userId }),
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const conv: Conversation = await res.json();
        setConversations((prev) => [conv, ...prev]);
        setInput("");
        sessionStorage.setItem(PENDING_MESSAGE_KEY, text);
        router.push(`${basePath}/c/${conv.id}`);
        return;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

    setInput("");
    sendMessage({ text });

    setTimeout(() => fetchConversations(userId), 3000);
  }, [
    input,
    activeId,
    userId,
    sendMessage,
    fetchConversations,
    router,
    basePath,
  ]);

  // Handle form submission from generative UI
  const handleSendFormMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !activeId) return;
      sendMessage({ text });
      setTimeout(() => fetchConversations(userId), 3000);
    },
    [activeId, sendMessage, fetchConversations, userId],
  );

  const isLoading = status === "submitted" || status === "streaming";

  const activeConversation = activeId
    ? conversations.find((c) => c.id === activeId)
    : null;
  const activeTitle = activeConversation
    ? getConversationTitle(activeConversation, locale)
    : null;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={navigateToConversation}
          brandName={brandName}
          logo={logo}
          loading={conversationsLoading}
        />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-background">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              {activeTitle && (
                <span className="truncate text-sm font-medium">
                  {activeTitle}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNew}
                className="size-8"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          {!historyLoaded ? (
            <div className="flex-1 flex items-center justify-center">
              <RingLoader size={24} />
            </div>
          ) : messages.length === 0 && !activeId ? (
            <div className="flex-1 px-3 md:px-4">
              <div className="relative top-[30%] w-full max-w-3xl mx-auto">
                <div className="text-2xl md:text-3xl font-medium max-w-md text-center mx-auto mb-6">
                  {welcomeMessage || t("chat.welcome_message")}
                </div>
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSubmit}
                  onStop={stop}
                  isLoading={isLoading}
                />
              </div>
            </div>
          ) : (
            <>
              <ChatMessages
                messages={messages}
                status={status}
                assistantIcon={assistantIcon}
                welcomeMessage={welcomeMessage}
                brandName={brandName}
                onSendMessage={handleSendFormMessage}
                brandColors={brandColors}
              />
              <div className="shrink-0 bg-background">
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSubmit}
                  onStop={stop}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
