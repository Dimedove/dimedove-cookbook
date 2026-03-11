"use client";

import { Wrench, Loader2, Check, ChevronDown, AlertCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, type ReactNode } from "react";

interface Props {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  errorText?: string;
}

function getStateIcon(state: string): ReactNode {
  switch (state) {
    case "partial-call":
      return (
        <Loader2 className="size-3.5 text-amber-500 animate-spin shrink-0" />
      );
    case "call":
    case "input-available":
      return (
        <Loader2 className="size-3.5 text-blue-500 animate-spin shrink-0" />
      );
    case "output-available":
    case "result":
      return <Check className="size-3.5 text-green-500 shrink-0" />;
    case "output-error":
      return <AlertCircle className="size-3.5 text-red-500 shrink-0" />;
    default:
      return (
        <Loader2 className="size-3.5 text-muted-foreground animate-spin shrink-0" />
      );
  }
}

export function ChatToolCall({ toolName, args, state, errorText }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg my-2 bg-muted/30 min-w-[300px]">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-lg">
            <Wrench className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono text-muted-foreground">
              {toolName}
            </span>
            <div className="flex-1" />
            {getStateIcon(state)}
            <ChevronDown
              className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-2 border-t">
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap mt-2 max-h-40 overflow-y-auto scrollbar-none">
              {JSON.stringify(args, null, 2)}
            </pre>
            {state === "output-error" && errorText && (
              <div className="text-xs text-red-500 mt-2">{errorText}</div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
