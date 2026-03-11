"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type CardProps = {
  title?: string | null;
  description?: string | null;
  maxWidth?: "sm" | "md" | "lg" | "full" | null;
  centered?: boolean | null;
};

/**
 * Messenger-specific Card renderer.
 *
 * Tweaks vs default shadcn card:
 * - no drop shadow
 * - no border
 * - no horizontal padding
 * - a small amount of vertical padding
 */
export function MessengerCard({
  props,
  children,
}: {
  props: CardProps;
  children?: React.ReactNode;
}) {
  const maxWidthClass =
    props.maxWidth === "full"
      ? "max-w-none"
      : props.maxWidth === "sm"
        ? "max-w-xl"
        : props.maxWidth === "md"
          ? "max-w-2xl"
          : "max-w-2xl";

  return (
    <div
      className={cn(
        "w-full rounded-xl border-0 bg-transparent text-card-foreground px-0 py-2.5 shadow-none",
        maxWidthClass,
      )}
    >
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
