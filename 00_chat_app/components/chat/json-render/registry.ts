import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { messengerCatalog } from "./catalog";
import { MessengerButton } from "./components/button";
import { MessengerCard } from "./components/card";
import { MessengerStack } from "./components/stack";
import {
  MessengerCheckbox,
  MessengerInput,
  MessengerRadio,
  MessengerSelect,
  MessengerSlider,
  MessengerSwitch,
  MessengerTextarea,
} from "./components/form-inputs";

/**
 * Component registry that maps catalog entries to pre-built shadcn/ui
 * React implementations. Custom overrides are used where the defaults
 * need visual polish.
 *
 * The type cast is needed because @json-render/shadcn exports components
 * typed with BaseComponentProps (catalog-agnostic) while defineRegistry
 * expects ComponentFn tied to a specific catalog.
 */
export const { registry } = defineRegistry(messengerCatalog, {
  components: {
    // Layout & display
    Card: MessengerCard,
    Stack: MessengerStack,
    Heading: shadcnComponents.Heading,
    Text: shadcnComponents.Text,
    Badge: shadcnComponents.Badge,
    Separator: shadcnComponents.Separator,
    Alert: shadcnComponents.Alert,
    Table: shadcnComponents.Table,
    Progress: shadcnComponents.Progress,
    // Form & input
    Input: MessengerInput,
    Textarea: MessengerTextarea,
    Select: MessengerSelect,
    Checkbox: MessengerCheckbox,
    Radio: MessengerRadio,
    Switch: MessengerSwitch,
    Slider: MessengerSlider,
    Button: MessengerButton,
  } as any,
  actions: {
    // No-op default — overridden at render time via JSONUIProvider handlers
    submit: async () => {},
  } as any,
});
