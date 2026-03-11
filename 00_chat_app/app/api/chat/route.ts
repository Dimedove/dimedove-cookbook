import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from "ai";
import { sendMessage, sendMessageStream, parseDimedoveSSE } from "@/lib/dimedove-api";
import type { ResponseSchema } from "@/types/dimedove";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, conversationId, stream: shouldStream = true } = await req.json();

  // Extract the last user message
  const lastMessage = messages[messages.length - 1];
  const content =
    lastMessage?.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { text: string }) => p.text)
      .join("") ||
    lastMessage?.content ||
    "";

  if (!conversationId) {
    return new Response("Missing conversationId", { status: 400 });
  }

  // Non-streaming: fetch full JSON response and convert to UIMessageStream
  if (!shouldStream) {
    const jsonResponse = await sendMessage(conversationId, content, false);
    const result: ResponseSchema = await jsonResponse.json();

    if (result.status === "failed") {
      return new Response("Response generation failed", { status: 500 });
    }

    const uiStream = createUIMessageStream({
      execute: async ({ writer }) => {
        for (const item of result.output) {
          if (item.type === "message" && item.content) {
            for (const part of item.content) {
              if (part.type === "text" && part.text) {
                const textId = generateId();
                writer.write({ type: "text-start", id: textId });
                writer.write({ type: "text-delta", id: textId, delta: part.text });
                writer.write({ type: "text-end", id: textId });
              }
            }
          } else if (item.type === "function_call") {
            const callId = item.call_id || generateId();
            const toolName = item.name || "tool";
            let input: unknown = {};
            try { input = JSON.parse(item.arguments || "{}"); } catch { /* empty */ }

            writer.write({ type: "tool-input-start", toolCallId: callId, toolName, dynamic: true });
            writer.write({ type: "tool-input-available", toolCallId: callId, toolName, input, dynamic: true });
            writer.write({ type: "tool-output-available", toolCallId: callId, output: input, dynamic: true });
          } else if (item.type === "data_spec") {
            writer.write({ type: "data-spec" as any, data: (item as any).data });
          }
        }
      },
      onError: (error) => {
        console.error("Non-streaming conversion error:", error);
        return error instanceof Error ? error.message : "Error";
      },
    });

    return createUIMessageStreamResponse({ stream: uiStream });
  }

  // Streaming: existing SSE parsing logic
  const response = await sendMessageStream(conversationId, content);
  if (!response.body) {
    return new Response("No stream body", { status: 502 });
  }

  const reader = response.body.getReader();

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      let currentTextId: string | null = null;
      const toolCallNames: Record<string, string> = {};
      const toolCallArgs: Record<string, string> = {};

      for await (const event of parseDimedoveSSE(reader)) {
        const type = event.type as string;

        switch (type) {
          case "response.created": {
            break;
          }

          case "response.output_text.delta": {
            const delta = event.delta as string;
            if (delta) {
              if (!currentTextId) {
                currentTextId = generateId();
                writer.write({ type: "text-start", id: currentTextId });
              }
              writer.write({
                type: "text-delta",
                id: currentTextId,
                delta,
              });
            }
            break;
          }

          case "response.output_text.done": {
            if (currentTextId) {
              writer.write({ type: "text-end", id: currentTextId });
              currentTextId = null;
            }
            break;
          }

          case "response.function_call.start": {
            const callId = event.call_id as string;
            const toolName = event.name as string;
            toolCallNames[callId] = toolName;
            toolCallArgs[callId] = "";
            writer.write({
              type: "tool-input-start",
              toolCallId: callId,
              toolName,
              dynamic: true,
            });
            break;
          }

          case "response.function_call_arguments.delta": {
            const callId = event.call_id as string;
            const argsDelta = event.delta as string;
            if (argsDelta) {
              toolCallArgs[callId] =
                (toolCallArgs[callId] || "") + argsDelta;
              writer.write({
                type: "tool-input-delta",
                toolCallId: callId,
                inputTextDelta: argsDelta,
              });
            }
            break;
          }

          case "response.function_call_arguments.done": {
            const callId = event.call_id as string;
            const toolName =
              (event.name as string) || toolCallNames[callId] || "tool";
            const argsStr =
              (event.arguments as string) || toolCallArgs[callId] || "{}";
            let input: unknown = {};
            try {
              input = JSON.parse(argsStr);
            } catch {
              input = {};
            }

            // Emit tool-input-available (marks the tool call input as complete)
            writer.write({
              type: "tool-input-available",
              toolCallId: callId,
              toolName,
              input,
              dynamic: true,
            });

            // Emit tool-output-available (marks the tool call as fully resolved)
            writer.write({
              type: "tool-output-available",
              toolCallId: callId,
              output: input,
              dynamic: true,
            });

            delete toolCallArgs[callId];
            delete toolCallNames[callId];
            break;
          }

          case "response.data_spec": {
            // Close any open text stream before emitting spec
            if (currentTextId) {
              writer.write({ type: "text-end", id: currentTextId });
              currentTextId = null;
            }
            writer.write({
              type: "data-spec" as any,
              data: event.data as Record<string, unknown>,
            });
            break;
          }

          case "response.failed": {
            const error = event.error as
              | { message: string }
              | undefined;
            throw new Error(
              error?.message || "Response generation failed",
            );
          }

          case "response.completed": {
            break;
          }
        }
      }

      // Close any open text stream
      if (currentTextId) {
        writer.write({ type: "text-end", id: currentTextId });
      }
    },
    onError: (error) => {
      console.error("Stream error:", error);
      return error instanceof Error ? error.message : "Stream error";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
