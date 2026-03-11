"use client";

import { use } from "react";
import { ChatLayout } from "@/components/chat/chat-layout";
import { useTranslations } from "next-intl";

/**
 * Active conversation page.
 *
 * Loads an existing conversation by ID and renders the chat interface.
 * See app/[locale]/(chat)/page.tsx for customization notes.
 */
export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const t = useTranslations();

  return (
    <ChatLayout
      brandName="Acme"
      welcomeMessage={t("chat.welcome_message")}
      conversationId={conversationId}
      basePath=""
    />
  );
}
