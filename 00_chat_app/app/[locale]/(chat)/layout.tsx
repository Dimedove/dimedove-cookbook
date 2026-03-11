import { TooltipProvider } from "@/components/ui/tooltip";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("");
  return {
    title: t("metadata.chat_title"),
    description: t("metadata.chat_description"),
  };
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
