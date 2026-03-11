"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type StackProps = {
  direction?: "horizontal" | "vertical" | null;
  gap?: "none" | "sm" | "md" | "lg" | null;
  align?: "start" | "center" | "end" | "stretch" | null;
  justify?: "start" | "center" | "end" | "between" | "around" | null;
};

/**
 * Messenger-specific Stack renderer.
 *
 * Use a slightly larger default vertical gap so generated forms have
 * better spacing between fields without requiring prompt-perfect specs.
 */
export function MessengerStack({
  props,
  children,
}: {
  props: StackProps;
  children?: React.ReactNode;
}) {
  const isVertical = (props.direction ?? "vertical") === "vertical";

  const normalizedProps: StackProps = {
    ...props,
    gap: isVertical ? "lg" : props.gap ?? "md",
  };

  const gapClass =
    {
      none: "gap-0",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    }[normalizedProps.gap ?? "md"] ?? "gap-3";

  const alignClass =
    {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    }[normalizedProps.align ?? "stretch"] ?? "items-stretch";

  if (!isVertical) {
    const gridAlignClass =
      {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
      }[normalizedProps.align ?? "stretch"] ?? "items-stretch";

    return (
      <div
        className={cn(
          "grid w-full min-w-0 grid-cols-1 sm:grid-cols-2",
          gapClass,
          gridAlignClass
        )}
      >
        {React.Children.map(children, (child) => (
          <div className="w-full min-w-0">{child}</div>
        ))}
      </div>
    );
  }

  const justifyClass =
    {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    }[normalizedProps.justify ?? "start"] ?? "justify-start";

  return (
    <div className={cn("flex w-full min-w-0 flex-col", gapClass, alignClass, justifyClass)}>
      {children}
    </div>
  );
}
