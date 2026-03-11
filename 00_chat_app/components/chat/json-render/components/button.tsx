"use client";

import { useBrandColors } from "./brand-colors";
import { SpecFadeIn } from "./spec-fade-in";

/**
 * Custom Button renderer for JSON Render.
 *
 * Uses the agent's configured primary color as the background,
 * matching the team's brand. Falls back to a neutral dark button
 * when no brand colors are configured.
 */
export function MessengerButton({
  props,
  emit,
  on,
}: {
  props: {
    label: string;
    variant?: "primary" | "secondary" | "danger" | null;
    disabled?: boolean | null;
  };
  emit: (event: string) => void;
  on?: (event: string) => {
    emit: () => void;
    bound: boolean;
    shouldPreventDefault: boolean;
  };
}) {
  const { primaryColor, secondaryColor } = useBrandColors();
  const disabled = props.disabled ?? false;

  const hasColors = primaryColor || secondaryColor;

  const buttonStyle: React.CSSProperties = hasColors
    ? {
        background: primaryColor ?? secondaryColor,
        color: "#fff",
      }
    : {};

  const handleClick = () => {
    const press = on?.("press");
    if (press?.bound) {
      press.emit();
      return;
    }

    const submit = on?.("submit");
    if (submit?.bound) {
      submit.emit();
      return;
    }

    // Fallback for older/partial specs.
    emit("press");
    emit("submit");
  };

  return (
    <SpecFadeIn className="w-full" data-jsonui-action-wrapper>
      <button
        data-jsonui-action-button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className="mt-0 inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 w-full transition-opacity disabled:pointer-events-none disabled:opacity-50 hover:opacity-90 active:opacity-80"
        style={buttonStyle}
      >
        {props.label}
      </button>
    </SpecFadeIn>
  );
}
