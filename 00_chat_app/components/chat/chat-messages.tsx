"use client";

import type { UIMessage } from "@ai-sdk/react";
import { useEffect, useRef, useState, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Scroller } from "@/components/ui/scroller";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { ChatMessage } from "./chat-message";
import { Skeleton } from "@/components/ui/skeleton";

type BrandColors = {
  primaryColor?: string;
  secondaryColor?: string;
};

interface Props {
  messages: UIMessage[];
  status: string;
  assistantIcon?: ReactNode;
  welcomeMessage?: string;
  brandName?: string;
  onSendMessage?: (text: string) => void;
  brandColors?: BrandColors;
}

export function ChatMessages({
  messages,
  status,
  assistantIcon,
  welcomeMessage,
  brandName,
  onSendMessage,
  brandColors,
}: Props) {
  const t = useTranslations();
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  // Scroll to bottom instantly on initial load / page refresh when messages exist
  const hasScrolledOnLoad = useRef(false);
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledOnLoad.current) {
      hasScrolledOnLoad.current = true;
      scrollToBottom("instant");
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (status === "submitted") {
      setHasSentMessage(true);
      // Scroll the user's new message to the top of the viewport (ChatGPT-like shift up)
      requestAnimationFrame(() => {
        lastMessageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [status]);

  // Auto-scroll while streaming if user is at the bottom
  useEffect(() => {
    if (status === "streaming" && isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, status, isAtBottom, scrollToBottom]);

  // Clear scroll padding on first user-initiated scroll after streaming completes
  useEffect(() => {
    if (!hasSentMessage || status !== "ready") return;
    const container = containerRef.current;
    if (!container) return;

    // Skip the first scroll tick (could be the auto-scroll settling)
    let skipFirst = true;
    const onScroll = () => {
      if (skipFirst) {
        skipFirst = false;
        return;
      }
      setHasSentMessage(false);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasSentMessage, status, containerRef]);

  const lastMessage = messages[messages.length - 1];
  const isLoading =
    status === "submitted" && (!lastMessage || lastMessage.role === "user");

  // Find the last assistant message index for generative UI interaction control
  const lastAssistantIndex = messages.reduce(
    (acc, msg, i) => (msg.role === "assistant" ? i : acc),
    -1,
  );

  return (
    <Scroller
      ref={containerRef}
      orientation="vertical"
      className="flex-1 min-h-0"
      hideScrollbar
    >
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-6 space-y-6 md:space-y-8">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-4xl font-semibold mb-2">
              {brandName || t("chat.ai_assistant")}
            </div>
            <p className="text-lg text-muted-foreground max-w-md">
              {welcomeMessage || t("chat.welcome_message")}
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          // Find the next user message's text for hydrating submitted form values
          let submittedFormText: string | undefined;
          if (message.role === "assistant" && index < messages.length - 1) {
            const nextMsg = messages[index + 1];
            if (nextMsg?.role === "user") {
              const textPart = nextMsg.parts.find((p) => p.type === "text");
              if (textPart && textPart.type === "text") {
                submittedFormText = textPart.text;
              }
            }
          }

          const isLastMessage = index === messages.length - 1;

          return (
            <div
              key={message.id}
              ref={isLastMessage ? lastMessageRef : undefined}
            >
              <ChatMessage
                message={message}
                assistantIcon={assistantIcon}
                isStreaming={
                  status === "streaming" &&
                  isLastMessage &&
                  message.role === "assistant"
                }
                onSendMessage={onSendMessage}
                isLatestAssistantMessage={index === lastAssistantIndex}
                brandColors={brandColors}
                submittedFormText={submittedFormText}
              />
            </div>
          );
        })}

        {/* Skeleton + sentinel area with padding to allow the user message to scroll up */}
        <div className={hasSentMessage ? "min-h-[50vh]" : ""}>
          {isLoading && (
            <div className="flex gap-5">
              {assistantIcon && (
                <div className="size-7 shrink-0 mt-0.5">{assistantIcon}</div>
              )}
              <div className="flex flex-col gap-2 flex-1 max-w-[80%]">
                <Skeleton className="h-4 w-5/12" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          )}

          <motion.div
            ref={endRef}
            className="shrink-0 min-w-[24px] min-h-[20px]"
            onViewportLeave={onViewportLeave}
            onViewportEnter={onViewportEnter}
          />
        </div>
      </div>
    </Scroller>
  );
}
