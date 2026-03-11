"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation } from "@/types/dimedove";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";
interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  brandName?: string;
  logo?: ReactNode;
  loading?: boolean;
}

export function getConversationTitle(c: Conversation): string | null {
  if (c.title) return c.title;
  const gen = c.generated_title;
  if (gen) {
    if (gen["en-ca"]) return gen["en-ca"];
    if (gen["en"]) return gen["en"];
    const keys = Object.keys(gen);
    if (keys.length > 0 && gen[keys[0]]) return gen[keys[0]];
  }
  return null;
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  brandName,
  logo,
  loading,
}: Props) {
  const t = useTranslations();

  return (
    <Sidebar>
      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarMenu className="p-2">
            {conversations.map((c) => (
              <SidebarMenuItem key={c.id}>
                <SidebarMenuButton
                  isActive={c.id === activeId}
                  onClick={() => onSelect(c.id)}
                  className="data-[active=true]:bg-[#ececec]"
                >
                  <span className="truncate text-sm min-w-0">
                    {getConversationTitle(c) || t("chat.untitled")}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {!loading && conversations.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-8">
                {t("chat.no_conversations")}
              </div>
            )}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
