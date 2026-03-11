import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { z } from "zod";

/**
 * Messenger catalog — the set of components the LLM is allowed to generate.
 *
 * Uses pre-built shadcn/ui definitions so component props are fully typed
 * and the generated system prompt describes each one accurately.
 */
export const messengerCatalog = defineCatalog(schema, {
  components: {
    // Layout (form-only)
    Card: shadcnComponentDefinitions.Card,
    Stack: shadcnComponentDefinitions.Stack,
    // Data collection
    Input: shadcnComponentDefinitions.Input,
    Textarea: shadcnComponentDefinitions.Textarea,
    Select: shadcnComponentDefinitions.Select,
    Checkbox: shadcnComponentDefinitions.Checkbox,
    Radio: shadcnComponentDefinitions.Radio,
    Switch: shadcnComponentDefinitions.Switch,
    Slider: shadcnComponentDefinitions.Slider,
    Button: shadcnComponentDefinitions.Button,
  },
  actions: {
    submit: {
      params: z.object({}),
      description: "Submit form data as a chat message",
    },
  },
});
