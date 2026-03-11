"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import { useTranslations } from "next-intl";

/**
 * Chat home page (no active conversation).
 *
 * Customize this page to match your brand:
 * - brandName: your company or product name
 * - assistantIcon: a React node shown next to assistant messages
 * - welcomeMessage: the greeting shown before the first message
 * - basePath: the URL prefix for chat routes (empty string = root)
 */
export default function ChatPage() {
  const t = useTranslations();

  return (
    <ChatLayout
      brandName="Acme"
      welcomeMessage={t("chat.welcome_message")}
      basePath=""
    />
  );
}
