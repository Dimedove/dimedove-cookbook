"use client";

import type { UIMessage } from "@ai-sdk/react";
import { setByPath } from "@json-render/core";
import { ChatMarkdown } from "./chat-markdown";
import { ChatToolCall } from "./chat-tool-call";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useJsonRenderMessage,
  Renderer,
  JSONUIProvider,
} from "@json-render/react";
import { registry } from "./json-render/registry";
import {
  collectStateFromRenderedInputs,
  extractSpecFieldMeta,
  extractSpecFieldLabels,
  formatStateValueForSubmit,
  humanizeSubmittedFieldLabel,
} from "./json-render/submit-helpers";
import { BrandColorsProvider } from "./json-render/components/brand-colors";

const SPEC_BLOCK_RE = /```spec\b[\s\S]*?(?:```|$)/gi;
const SPEC_ARTIFACT_LINE_RE = /^(?:```spec|```|>)$/;

type BrandColors = {
  primaryColor?: string;
  secondaryColor?: string;
};

interface Props {
  message: UIMessage;
  assistantIcon?: ReactNode;
  isStreaming?: boolean;
  onSendMessage?: (text: string) => void;
  isLatestAssistantMessage?: boolean;
  brandColors?: BrandColors;
  submittedFormText?: string;
}

// Group consecutive text parts into single blocks so they render as one bubble
function groupParts(parts: UIMessage["parts"]) {
  const groups: Array<
    | { type: "text"; text: string; key: number }
    | { type: "dynamic-tool"; part: UIMessage["parts"][number]; key: number }
  > = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.type === "text") {
      const last = groups[groups.length - 1];
      if (last && last.type === "text") {
        last.text += "\n\n" + part.text;
      } else {
        groups.push({ type: "text", text: part.text, key: i });
      }
    } else if (part.type === "dynamic-tool") {
      groups.push({ type: "dynamic-tool", part, key: i });
    }
  }

  return groups;
}

export function ChatMessage({
  message,
  assistantIcon,
  isStreaming,
  onSendMessage,
  isLatestAssistantMessage,

  brandColors,
  submittedFormText,
}: Props) {
  const isUser = message.role === "user";
  const allGroups = groupParts(message.parts);

  // JSON Render: extract spec from data-spec parts emitted by the backend
  const { spec, hasSpec } = useJsonRenderMessage(message.parts ?? []);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const hasSubmittedRef = useRef(false);
  const jsonRenderRootRef = useRef<HTMLDivElement>(null);
  const formStateRef = useRef<Record<string, unknown>>({});
  const onSendMessageRef = useRef(onSendMessage);
  onSendMessageRef.current = onSendMessage;

  const hasSubmittedFormText = !!submittedFormText;
  const disableSpecInteractions =
    hasSpec &&
    message.role === "assistant" &&
    (!isLatestAssistantMessage || hasSubmitted || hasSubmittedFormText);

  // Hydrate form fields with submitted values and hide buttons on disabled forms
  useEffect(() => {
    if (!disableSpecInteractions) return;

    const root = jsonRenderRootRef.current;
    if (!root) return;

    // Hide submit/action buttons on disabled forms
    const buttons = root.querySelectorAll<HTMLElement>(
      "[data-jsonui-action-wrapper]",
    );
    buttons.forEach((btn) => {
      btn.style.display = "none";
    });

    // Hydrate form fields with submitted values from the user's reply message
    if (!submittedFormText) return;

    // Parse "Label: Value" lines from the submitted text
    const lines = submittedFormText
      .split("\n")
      .map((line) => {
        const colonIdx = line.indexOf(":");
        if (colonIdx < 0) return null;
        return {
          label: line.slice(0, colonIdx).trim(),
          value: line.slice(colonIdx + 1).trim(),
        };
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;

    if (lines.length === 0) return;

    const submittedByLabel = new Map<string, string>();
    lines.forEach(({ label, value }) => {
      submittedByLabel.set(label.toLowerCase(), value);
    });

    const fields = root.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input, textarea, select");

    fields.forEach((field) => {
      // Match by aria-label, associated label, or name
      const id = field.getAttribute("id") || "";
      const name = field.getAttribute("name") || "";
      let labelText = field.getAttribute("aria-label")?.trim() || "";

      if (!labelText && id) {
        const labelEl = root.querySelector<HTMLLabelElement>(
          `label[for="${id}"]`,
        );
        labelText = labelEl?.textContent?.trim() || "";
      }
      if (!labelText && name) {
        const labelEl = root.querySelector<HTMLLabelElement>(
          `label[for="${name}"]`,
        );
        labelText = labelEl?.textContent?.trim() || "";
      }

      const submittedValue = labelText
        ? submittedByLabel.get(labelText.toLowerCase())
        : undefined;

      if (submittedValue === undefined) return;

      if (field instanceof HTMLInputElement) {
        if (field.type === "radio") {
          field.checked = field.value === submittedValue;
          field.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }
        if (field.type === "checkbox") {
          const lower = submittedValue.toLowerCase();
          field.checked = ["true", "1", "yes", "oui"].includes(lower);
          field.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }
      }

      field.value = submittedValue;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, [disableSpecInteractions, submittedFormText]);

  // Always show text first, then tool calls at the bottom
  const groups = [
    ...allGroups.filter((g) => g.type === "text"),
    ...allGroups.filter((g) => g.type === "dynamic-tool"),
  ];

  const handleStateChange = useCallback(
    (changes: Array<{ path: string; value: unknown }>) => {
      if (changes.length === 0) return;

      const nextState = { ...formStateRef.current };
      for (const { path, value } of changes) {
        setByPath(nextState, path, value);
      }
      formStateRef.current = nextState;
    },
    [],
  );

  const jsonRenderHandlers = useMemo(
    () => ({
      submit: () => {
        if (disableSpecInteractions || hasSubmittedRef.current) return;

        const domState = collectStateFromRenderedInputs(
          jsonRenderRootRef.current,
        );
        const specFieldMeta = extractSpecFieldMeta(spec);
        const specLabels = extractSpecFieldLabels(spec);
        const fieldLabels = {
          ...domState.labels,
          ...specLabels,
        };
        const mergedState = domState.values;

        const rawEntries = Object.entries(mergedState).map(([key, value]) => ({
          key,
          value,
          type: specFieldMeta[key]?.type,
        }));
        const checkboxFieldCount = rawEntries.filter(
          (entry) => entry.type === "Checkbox",
        ).length;
        const checkedCheckboxCount = rawEntries.filter(
          (entry) => entry.type === "Checkbox" && entry.value === true,
        ).length;

        const entries = rawEntries
          .filter((entry) => {
            if (
              entry.type === "Checkbox" &&
              checkboxFieldCount > 1 &&
              checkedCheckboxCount > 0 &&
              entry.value === false
            ) {
              return false;
            }

            const formattedValue = formatStateValueForSubmit(entry.value);
            return formattedValue.trim().length > 0;
          })
          .map(
            (entry) =>
              [entry.key, formatStateValueForSubmit(entry.value)] as const,
          );

        if (entries.length === 0 || !onSendMessageRef.current) return;

        const text = entries
          .map(([key, val]) => {
            const label = fieldLabels[key] || humanizeSubmittedFieldLabel(key);
            return `${label}: ${val}`;
          })
          .join("\n");

        hasSubmittedRef.current = true;
        setHasSubmitted(true);
        onSendMessageRef.current(text);
      },
    }),
    [disableSpecInteractions, spec],
  );

  const handleJsonRenderKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disableSpecInteractions) return;
      if (event.defaultPrevented) return;
      if (event.key !== "Enter") return;
      if ((event.nativeEvent as KeyboardEvent).isComposing) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();
      const isTextarea = tagName === "textarea";

      if (isTextarea && event.shiftKey) return;

      event.preventDefault();
      jsonRenderHandlers.submit();
    },
    [disableSpecInteractions, jsonRenderHandlers],
  );

  return (
    <div className="flex gap-3">
      {!isUser && assistantIcon && (
        <div className="size-7 shrink-0 mt-0.5">{assistantIcon}</div>
      )}
      <div
        className={`flex flex-col gap-1 w-full min-w-0 ${isUser ? "items-end ml-auto max-w-[90%] md:max-w-[80%]" : "items-start max-w-[90%] md:max-w-[80%]"}`}
      >
        {groups.map((group, groupIndex) => {
          if (group.type === "text") {

            // Strip spec fence blocks and artifact lines from text when spec parts are present
            const displayText = hasSpec
              ? group.text
                  .replace(SPEC_BLOCK_RE, "")
                  .split("\n")
                  .filter((line) => !SPEC_ARTIFACT_LINE_RE.test(line.trim()))
                  .join("\n")
                  .trim()
              : group.text;
            if (!displayText) return null;
            return isUser ? (
              <div
                key={group.key}
                className="rounded-2xl px-4 py-2.5 text-base leading-relaxed bg-muted"
              >
                <p className="whitespace-pre-wrap">{displayText}</p>
              </div>
            ) : (
              <div key={group.key} className="pl-1 text-base leading-relaxed">
                <ChatMarkdown text={displayText} />
              </div>
            );
          }
          const dynPart = group.part as {
            type: "dynamic-tool";
            toolName: string;
            toolCallId: string;
            state: string;
            input?: unknown;
            output?: unknown;
            errorText?: string;
          };
          return (
            <ChatToolCall
              key={dynPart.toolCallId || group.key}
              toolName={dynPart.toolName}
              args={(dynPart.input as Record<string, unknown>) || {}}
              state={dynPart.state}
              errorText={
                dynPart.state === "output-error" ? dynPart.errorText : undefined
              }
            />
          );
        })}

        {/* JSON Render: render structured UI from data-spec parts */}
        {hasSpec && (
          <BrandColorsProvider value={brandColors ?? {}}>
            <div
              ref={jsonRenderRootRef}
              className={`w-full ${disableSpecInteractions ? "pointer-events-none opacity-70" : ""}`}
              onKeyDown={handleJsonRenderKeyDown}
            >
              <JSONUIProvider
                registry={registry}
                handlers={jsonRenderHandlers}
                onStateChange={handleStateChange}
              >
                <Renderer
                  spec={spec}
                  registry={registry}
                  loading={isStreaming}
                />
              </JSONUIProvider>
            </div>
          </BrandColorsProvider>
        )}
      </div>
    </div>
  );
}
