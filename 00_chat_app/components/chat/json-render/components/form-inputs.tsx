"use client";

import type { ValidationCheck } from "@json-render/core";
import { useBoundProp, useFieldValidation } from "@json-render/react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useId, useRef, useState, type CSSProperties } from "react";
import { CheckIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SpecFadeIn } from "./spec-fade-in";
import { useBrandColors } from "./brand-colors";

type InputProps = {
  label?: string | null;
  name?: string | null;
  type?: "text" | "email" | "number" | null;
  placeholder?: string | null;
  value?: string | null;
  checks?: ValidationCheck[];
};

type TextareaProps = {
  label?: string | null;
  name?: string | null;
  placeholder?: string | null;
  rows?: number | null;
  value?: string | null;
  checks?: ValidationCheck[];
};

type SelectProps = {
  label?: string | null;
  name?: string | null;
  options?: (string | null)[] | null;
  placeholder?: string | null;
  value?: string | null;
  checks?: ValidationCheck[];
};

type RadioProps = {
  label?: string | null;
  name?: string | null;
  options?: (string | null)[] | null;
  value?: string | null;
  checks?: ValidationCheck[];
};

type CheckboxProps = {
  label?: string | null;
  name?: string | null;
  checked?: boolean | null;
  checks?: ValidationCheck[];
};

type SliderProps = {
  label?: string | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;
  value?: number | null;
  checks?: ValidationCheck[];
};

type SwitchProps = {
  label?: string | null;
  name?: string | null;
  checked?: boolean | null;
  checks?: ValidationCheck[];
};

type InputBindings = {
  value?: string;
};

type CheckedBindings = {
  checked?: string;
};

const MAX_INPUT_CHARS = 250;
const MAX_TEXTAREA_CHARS = 2000;

const PLACEHOLDER_PREFIX_RE =
  /^(?:example|exemple|ejemplo|exemplo|e\.?\s*g\.?)\s*[:\-–—,]\s*/i;

const sanitizePlaceholder = (placeholder?: string | null): string =>
  (placeholder ?? "").replace(PLACEHOLDER_PREFIX_RE, "").trim();

const clampText = (value: string, maxChars: number): string =>
  value.length > maxChars ? value.slice(0, maxChars) : value;

const FIELD_LABEL_TEXT_CLASS = "text-xs font-medium leading-tight";

const coerceBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "oui", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "non", "off", ""].includes(normalized)) {
      return false;
    }
  }
  if (value == null) return fallback;
  return Boolean(value);
};

export function MessengerInput({
  props,
  bindings,
  emit,
}: {
  props: InputProps;
  bindings?: InputBindings;
  emit: (event: string) => void;
}) {
  const [boundValue, setBoundValue] = useBoundProp(
    props.value,
    bindings?.value,
  );
  const [localValue, setLocalValue] = useState("");
  const isBound = !!bindings?.value;
  const value = isBound ? (boundValue ?? "") : localValue;
  const setValue = isBound ? setBoundValue : setLocalValue;
  const hasValidation = !!(bindings?.value && props.checks?.length);
  const { errors, validate } = useFieldValidation(
    bindings?.value ?? "",
    hasValidation ? { checks: props.checks ?? [] } : undefined,
  );

  return (
    <SpecFadeIn className="w-full">
      <div className="space-y-[9px] w-full">
        {props.label && (
          <label
            htmlFor={props.name ?? undefined}
            className={cn("block", FIELD_LABEL_TEXT_CLASS)}
          >
            {props.label}
          </label>
        )}
        <Input
          id={props.name ?? undefined}
          name={props.name ?? undefined}
          type={props.type ?? "text"}
          placeholder={sanitizePlaceholder(props.placeholder)}
          value={value}
          maxLength={MAX_INPUT_CHARS}
          className="rounded-md placeholder:text-[13px] leading-5 pt-[3px] pb-[5px] focus-visible:border-muted-foreground/60 focus-visible:ring-0"
          onChange={(e) => setValue(clampText(e.target.value, MAX_INPUT_CHARS))}
          onKeyDown={(e) => {
            if (e.key === "Enter") emit("submit");
          }}
          onFocus={() => emit("focus")}
          onBlur={() => {
            if (hasValidation) validate();
            emit("blur");
          }}
        />
        {errors.length > 0 && (
          <p className="text-sm text-destructive">{errors[0]}</p>
        )}
      </div>
    </SpecFadeIn>
  );
}

export function MessengerTextarea({
  props,
  bindings,
  emit,
}: {
  props: TextareaProps;
  bindings?: InputBindings;
  emit: (event: string) => void;
}) {
  const [boundValue, setBoundValue] = useBoundProp(
    props.value,
    bindings?.value,
  );
  const [localValue, setLocalValue] = useState("");
  const isBound = !!bindings?.value;
  const value = isBound ? (boundValue ?? "") : localValue;
  const setValue = isBound ? setBoundValue : setLocalValue;
  const hasValidation = !!(bindings?.value && props.checks?.length);
  const { errors, validate } = useFieldValidation(
    bindings?.value ?? "",
    hasValidation ? { checks: props.checks ?? [] } : undefined,
  );

  return (
    <SpecFadeIn className="w-full">
      <div className="space-y-[9px] w-full">
        {props.label && (
          <label
            htmlFor={props.name ?? undefined}
            className={cn("block", FIELD_LABEL_TEXT_CLASS)}
          >
            {props.label}
          </label>
        )}
        <Textarea
          id={props.name ?? undefined}
          name={props.name ?? undefined}
          placeholder={sanitizePlaceholder(props.placeholder)}
          rows={props.rows ?? 3}
          value={value}
          maxLength={MAX_TEXTAREA_CHARS}
          className="[field-sizing:fixed] rounded-md placeholder:text-[13px] leading-5 pt-[11px] pb-[13px] focus-visible:border-muted-foreground/60 focus-visible:ring-0 min-h-24 max-h-48 w-full min-w-full max-w-full resize-none overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words"
          onChange={(e) =>
            setValue(clampText(e.target.value, MAX_TEXTAREA_CHARS))
          }
          onBlur={() => {
            if (hasValidation) validate();
            emit("blur");
          }}
        />
        {errors.length > 0 && (
          <p className="text-sm text-destructive">{errors[0]}</p>
        )}
      </div>
    </SpecFadeIn>
  );
}

export function MessengerSelect(componentProps: any) {
  const { props, bindings, emit } = componentProps as {
    props: SelectProps;
    bindings?: InputBindings;
    emit: (event: string) => void;
  };
  const [boundValue, setBoundValue] = useBoundProp(
    props.value,
    bindings?.value,
  );
  const [localValue, setLocalValue] = useState("");
  const selectId = useId().replace(/:/g, "");
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const isBound = !!bindings?.value;
  const value = isBound ? (boundValue ?? "") : localValue;
  const setValue = isBound ? setBoundValue : setLocalValue;
  const hasValidation = !!(bindings?.value && props.checks?.length);
  const { errors, validate } = useFieldValidation(
    bindings?.value ?? "",
    hasValidation ? { checks: props.checks ?? [] } : undefined,
  );
  const options = (props.options ?? []).filter(
    (option): option is string =>
      typeof option === "string" && option.length > 0,
  );
  const placeholder = sanitizePlaceholder(props.placeholder);

  return (
    <SpecFadeIn className="w-full">
      <div className="space-y-[9px] w-full">
        {props.label && (
          <label
            htmlFor={props.name ?? selectId}
            className={cn("block", FIELD_LABEL_TEXT_CLASS)}
          >
            {props.label}
          </label>
        )}

        <Select
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            openRef.current = nextOpen;
            if (nextOpen) {
              emit("focus");
              return;
            }
            if (hasValidation) validate();
            emit("blur");
          }}
          value={value || undefined}
          onValueChange={(next) => setValue(next)}
        >
          <SelectTrigger
            id={props.name ?? selectId}
            className={cn(
              "w-full rounded-lg text-[13px] leading-5 focus-visible:border-muted-foreground/60 focus-visible:ring-0",
              !value && "text-muted-foreground",
            )}
            onFocus={() => emit("focus")}
            onBlur={() => {
              if (openRef.current) return;
              if (hasValidation) validate();
              emit("blur");
            }}
          >
            <SelectValue placeholder={placeholder || undefined} />
          </SelectTrigger>
          <SelectContent className="z-[10000]">
            {options.map((option, index) => (
              <SelectItem
                key={`${props.name ?? "select"}-${index}`}
                value={option}
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errors.length > 0 && (
          <p className="text-sm text-destructive">{errors[0]}</p>
        )}
      </div>
    </SpecFadeIn>
  );
}

export function MessengerCheckbox(componentProps: any) {
  const { props, bindings, emit } = componentProps as {
    props: CheckboxProps;
    bindings?: CheckedBindings;
    emit: (event: string) => void;
  };
  const { primaryColor, secondaryColor } = useBrandColors();
  const [boundChecked, setBoundChecked] = useBoundProp(
    props.checked,
    bindings?.checked,
  );
  const [localChecked, setLocalChecked] = useState<boolean>(!!props.checked);
  const checkboxId = useId().replace(/:/g, "");
  const isBound = !!bindings?.checked;
  const checked = isBound
    ? coerceBoolean(boundChecked, !!props.checked)
    : localChecked;
  const setChecked = (next: boolean) => {
    if (isBound) {
      setBoundChecked(next as any);
      return;
    }
    setLocalChecked(next);
  };
  const hasValidation = !!(bindings?.checked && props.checks?.length);
  const { errors, validate } = useFieldValidation(
    bindings?.checked ?? "",
    hasValidation ? { checks: props.checks ?? [] } : undefined,
  );
  const checkedFillColor =
    primaryColor || secondaryColor || "hsl(var(--primary))";

  return (
    <SpecFadeIn className="w-full">
      <div className="w-full space-y-1.5">
        <label
          htmlFor={props.name ?? checkboxId}
          className="flex cursor-pointer items-start gap-2.5 rounded-md py-0.5"
        >
          <CheckboxPrimitive.Root
            id={props.name ?? checkboxId}
            name={props.name ?? undefined}
            checked={checked}
            onCheckedChange={(next) => {
              const normalized = next === true;
              setChecked(normalized);
              emit("change");
            }}
            onFocus={() => emit("focus")}
            onBlur={() => {
              if (hasValidation) validate();
              emit("blur");
            }}
            style={
              checked
                ? {
                    backgroundColor: checkedFillColor,
                    borderColor: checkedFillColor,
                  }
                : undefined
            }
            className={cn(
              "mt-0.5 size-4 shrink-0 rounded-[4px] border border-input bg-transparent shadow-xs outline-none transition-shadow",
              "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
              "focus-visible:ring-2 focus-visible:ring-muted-foreground/30 focus-visible:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current transition-none">
              <CheckIcon className="size-3.5" />
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Root>

          {props.label && (
            <span className="text-sm leading-5 text-foreground">
              {props.label}
            </span>
          )}
        </label>

        {errors.length > 0 && (
          <p className="text-sm text-destructive">{errors[0]}</p>
        )}
      </div>
    </SpecFadeIn>
  );
}

export function MessengerRadio(componentProps: any) {
  const { props, bindings, emit } = componentProps as {
    props: RadioProps;
    bindings?: InputBindings;
    emit: (event: string) => void;
  };
  const { primaryColor, secondaryColor } = useBrandColors();
  const [boundValue, setBoundValue] = useBoundProp(
    props.value,
    bindings?.value,
  );
  const [localValue, setLocalValue] = useState("");
  const groupId = useId().replace(/:/g, "");
  const isBound = !!bindings?.value;
  const value = isBound ? (boundValue ?? "") : localValue;
  const setValue = isBound ? setBoundValue : setLocalValue;
  const hasValidation = !!(bindings?.value && props.checks?.length);
  const { errors, validate } = useFieldValidation(
    bindings?.value ?? "",
    hasValidation ? { checks: props.checks ?? [] } : undefined,
  );
  const options = (props.options ?? []).filter(
    (option): option is string =>
      typeof option === "string" && option.length > 0,
  );
  const statePath = props.name
    ? props.name.startsWith("/")
      ? props.name
      : `/${props.name}`
    : undefined;
  const groupLabelKey = props.name ?? `radio-${groupId}`;
  const domGroupName = `${groupLabelKey}-${groupId}`;
  const radioAccentColor =
    primaryColor || secondaryColor || "hsl(var(--primary))";

  return (
    <SpecFadeIn className="w-full">
      <div
        className="w-full space-y-2"
        onFocusCapture={() => emit("focus")}
        onBlurCapture={(e) => {
          const next = e.relatedTarget as Node | null;
          if (next && e.currentTarget.contains(next)) return;
          if (hasValidation) validate();
          emit("blur");
        }}
      >
        {props.label && (
          <div className={FIELD_LABEL_TEXT_CLASS}>{props.label}</div>
        )}

        <div
          role="radiogroup"
          aria-label={props.label ?? groupLabelKey}
          className="grid gap-2"
        >
          {options.map((option, index) => {
            const optionId = `${domGroupName}-${index}`;

            return (
              <label
                key={optionId}
                htmlFor={optionId}
                className="flex cursor-pointer items-start gap-2.5 rounded-md py-0.5"
              >
                <input
                  id={optionId}
                  name={domGroupName}
                  data-jsonui-state-path={statePath}
                  type="radio"
                  value={option}
                  checked={value === option}
                  onChange={() => setValue(option)}
                  style={{ accentColor: radioAccentColor }}
                  className={cn(
                    "mt-0.5 size-4 shrink-0 cursor-pointer accent-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                />
                <span className="text-sm leading-5">{option}</span>
              </label>
            );
          })}
        </div>

        {errors.length > 0 && (
          <p className="text-sm text-destructive">{errors[0]}</p>
        )}
      </div>
    </SpecFadeIn>
  );
}

export function MessengerSwitch(componentProps: any) {
  const { props, bindings, emit } = componentProps as {
    props: SwitchProps;
    bindings?: CheckedBindings;
    emit: (event: string) => void;
  };
  const { primaryColor, secondaryColor } = useBrandColors();
  const [boundChecked, setBoundChecked] = useBoundProp(
    props.checked,
    bindings?.checked,
  );
  const [localChecked, setLocalChecked] = useState<boolean>(!!props.checked);
  const switchId = useId().replace(/:/g, "");
  const isBound = !!bindings?.checked;
  const checked = isBound
    ? coerceBoolean(boundChecked, !!props.checked)
    : localChecked;
  const setChecked = (next: boolean) => {
    if (isBound) {
      setBoundChecked(next as any);
      return;
    }
    setLocalChecked(next);
  };
  const hasValidation = !!(bindings?.checked && props.checks?.length);
  const { errors, validate } = useFieldValidation(
    bindings?.checked ?? "",
    hasValidation ? { checks: props.checks ?? [] } : undefined,
  );

  const checkedTrackColor =
    primaryColor || secondaryColor || "hsl(var(--primary))";
  const thumbTransform = checked ? "translateX(16px)" : "translateX(0px)";

  return (
    <SpecFadeIn className="w-full">
      <div className="w-full space-y-2.5">
        <label
          htmlFor={props.name ?? switchId}
          className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-md py-0.5"
        >
          {props.label && (
            <span className="flex-1 text-sm leading-5 text-foreground">
              {props.label}
            </span>
          )}

          <SwitchPrimitive.Root
            id={props.name ?? switchId}
            name={props.name ?? undefined}
            checked={checked}
            onCheckedChange={(next) => {
              setChecked(next);
              emit("change");
            }}
            onFocus={() => emit("focus")}
            onBlur={() => {
              if (hasValidation) validate();
              emit("blur");
            }}
            className={cn(
              "peer mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors outline-none",
              "border-border/70 bg-muted/70",
              "focus-visible:ring-2 focus-visible:ring-muted-foreground/30 focus-visible:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            style={checked ? { backgroundColor: checkedTrackColor } : undefined}
          >
            <SwitchPrimitive.Thumb
              style={{ transform: thumbTransform }}
              className={cn(
                "pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200",
              )}
            />
          </SwitchPrimitive.Root>
        </label>

        {errors.length > 0 && (
          <p className="text-sm text-destructive">{errors[0]}</p>
        )}
      </div>
    </SpecFadeIn>
  );
}

export function MessengerSlider(componentProps: any) {
  const { props, bindings, emit } = componentProps as {
    props: SliderProps;
    bindings?: { value?: string };
    emit: (event: string) => void;
  };
  const { primaryColor, secondaryColor } = useBrandColors();
  const [boundValue, setBoundValue] = useBoundProp(
    props.value,
    bindings?.value,
  );
  const min = typeof props.min === "number" ? props.min : 0;
  const max = typeof props.max === "number" ? props.max : 100;
  const step =
    typeof props.step === "number" && props.step > 0 ? props.step : 1;
  const initialValue = typeof props.value === "number" ? props.value : min;
  const [localValue, setLocalValue] = useState<number>(initialValue);
  const isBound = !!bindings?.value;
  const rawValue = isBound
    ? (boundValue as number | string | null | undefined)
    : localValue;
  const numericValueFromRaw =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string" && rawValue.trim() !== ""
        ? Number(rawValue)
        : initialValue;
  const currentValue = Number.isFinite(numericValueFromRaw)
    ? Math.min(max, Math.max(min, numericValueFromRaw))
    : initialValue;
  const setValue = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    if (isBound) {
      setBoundValue(clamped as any);
      return;
    }
    setLocalValue(clamped);
  };
  const hasValidation = !!(bindings?.value && props.checks?.length);
  const { errors, validate } = useFieldValidation(
    bindings?.value ?? "",
    hasValidation ? { checks: props.checks ?? [] } : undefined,
  );

  const sliderRangeBackground =
    primaryColor && secondaryColor
      ? `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
      : primaryColor || secondaryColor || "hsl(var(--primary))";

  const rangeStyle = {
    background: sliderRangeBackground,
  } as CSSProperties;

  return (
    <SpecFadeIn className="w-full">
      <div
        className="w-full space-y-4 pb-3"
        onFocusCapture={() => emit("focus")}
      >
        {props.label && (
          <div className="flex items-center justify-between gap-3">
            <div className={FIELD_LABEL_TEXT_CLASS}>{props.label}</div>
            <div className="text-xs leading-tight text-muted-foreground tabular-nums">
              {currentValue}
            </div>
          </div>
        )}

        <div className="px-1 pt-1 pb-0">
          <SliderPrimitive.Root
            min={min}
            max={max}
            step={step}
            value={[currentValue]}
            onValueChange={(values) => {
              const next = values[0];
              if (typeof next === "number") setValue(next);
            }}
            onValueCommit={() => {
              if (hasValidation) validate();
              emit("blur");
            }}
            className="relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50"
          >
            <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted/70 shadow-inner">
              <SliderPrimitive.Range
                className="absolute h-full rounded-full"
                style={rangeStyle}
              />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              className={cn(
                "block size-4 shrink-0 rounded-full border bg-background shadow-sm outline-none",
                "border-border/80",
                "focus-visible:ring-2 focus-visible:ring-muted-foreground/30 focus-visible:ring-offset-0",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            />
          </SliderPrimitive.Root>
        </div>

        {errors.length > 0 && (
          <p className="text-sm text-destructive">{errors[0]}</p>
        )}
      </div>
    </SpecFadeIn>
  );
}
