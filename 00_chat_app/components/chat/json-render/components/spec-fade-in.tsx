"use client";

import * as React from "react";
import { type HTMLMotionProps, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SpecFadeIn({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children" | "className">) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      className={cn(className)}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
