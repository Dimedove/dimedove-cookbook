/**
 * Helper utilities for collecting and formatting generative UI form data
 * before sending it as a chat message.
 *
 * Extracted from the web app's message.tsx for reuse in the demos project.
 */

export const formatStateValueForSubmit = (
  value: unknown,
  options?: { trueLabel?: string; falseLabel?: string }
): string => {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") {
    return value
      ? (options?.trueLabel ?? "Yes")
      : (options?.falseLabel ?? "No");
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const toStatePath = (key: string): string =>
  key.startsWith("/") ? key : `/${key}`;

const getBoundStatePath = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  const maybePath = (value as { $bindState?: unknown }).$bindState;
  if (typeof maybePath !== "string" || maybePath.trim().length === 0) {
    return null;
  }
  return toStatePath(maybePath.trim());
};

type SpecFieldMeta = {
  label?: string;
  type?: string;
  options?: string[];
};

export const extractSpecFieldMeta = (
  spec: unknown
): Record<string, SpecFieldMeta> => {
  if (!spec || typeof spec !== "object") return {};

  const elements = (spec as { elements?: Record<string, unknown> }).elements;
  if (!elements || typeof elements !== "object") return {};

  const metaByPath: Record<string, SpecFieldMeta> = {};

  const register = (
    path: string | null,
    next: { label?: string; type?: string; options?: string[] }
  ) => {
    if (!path) return;
    const current = metaByPath[path] ?? {};
    metaByPath[path] = {
      label: next.label || current.label,
      type: next.type || current.type,
      options:
        next.options && next.options.length > 0
          ? next.options
          : current.options,
    };
  };

  Object.values(elements).forEach((element) => {
    if (!element || typeof element !== "object") return;

    const type =
      typeof (element as { type?: unknown }).type === "string"
        ? ((element as { type?: string }).type || "").trim()
        : "";

    const props = (element as { props?: Record<string, unknown> }).props;
    if (!props || typeof props !== "object") return;

    const label =
      typeof props.label === "string" ? props.label.trim() : "";
    const name = typeof props.name === "string" ? props.name.trim() : "";
    const valuePath = getBoundStatePath(props.value);
    const checkedPath = getBoundStatePath(props.checked);
    const options = Array.isArray(props.options)
      ? props.options.filter(
          (option): option is string =>
            typeof option === "string" && option.trim().length > 0
        )
      : undefined;

    const nextMeta = {
      label: label || undefined,
      type: type || undefined,
      options,
    };

    if (name) register(toStatePath(name), nextMeta);
    register(valuePath, nextMeta);
    register(checkedPath, nextMeta);
  });

  return metaByPath;
};

export const extractSpecFieldLabels = (
  spec: unknown
): Record<string, string> => {
  const labels: Record<string, string> = {};
  const metaByPath = extractSpecFieldMeta(spec);
  Object.entries(metaByPath).forEach(([path, meta]) => {
    if (meta.label) labels[path] = meta.label;
  });
  return labels;
};

export const humanizeSubmittedFieldLabel = (path: string): string => {
  const cleaned = path.replace(/^\//, "").replaceAll("/", " ");
  const withSpaces = cleaned
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!withSpaces) return path;

  return withSpaces
    .split(" ")
    .map((word) => {
      if (word.length <= 2) return word.toUpperCase();
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

const findLabelTextByFor = (root: HTMLElement, forValue: string): string => {
  const labels = root.querySelectorAll<HTMLLabelElement>("label[for]");
  for (const labelEl of labels) {
    if ((labelEl.getAttribute("for") || "") === forValue) {
      const text = labelEl.textContent?.trim() || "";
      if (text) return text;
    }
  }
  return "";
};

export const collectStateFromRenderedInputs = (
  root: HTMLElement | null
): { values: Record<string, unknown>; labels: Record<string, string> } => {
  if (!root) return { values: {}, labels: {} };

  const state: Record<string, unknown> = {};
  const labels: Record<string, string> = {};
  const fields = root.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >("input, textarea, select");

  fields.forEach((field) => {
    const explicitStatePath = (
      field.getAttribute("data-jsonui-state-path") || ""
    ).trim();
    const key = field.getAttribute("name") || field.getAttribute("id");
    if (!explicitStatePath && !key) return;

    const statePath =
      explicitStatePath || (key!.startsWith("/") ? key! : `/${key!}`);

    if (field instanceof HTMLInputElement) {
      if (field.type === "radio") {
        if (!labels[statePath]) {
          const radiogroup = field.closest('[role="radiogroup"]');
          const groupLabel =
            radiogroup?.getAttribute("aria-label")?.trim() || "";
          if (groupLabel) {
            labels[statePath] = groupLabel;
          }
        }
        if (!field.checked) return;
        state[statePath] = field.value;
        return;
      }

      if (field.type === "checkbox") {
        state[statePath] = field.checked;
        return;
      }

      if (field.type === "file") {
        return;
      }
    }

    const id = field.getAttribute("id") || "";
    const domLabel =
      field.getAttribute("aria-label")?.trim() ||
      (id ? findLabelTextByFor(root, id) : "") ||
      (field.getAttribute("name")
        ? findLabelTextByFor(root, field.getAttribute("name") || "")
        : "") ||
      "";

    if (domLabel) {
      labels[statePath] = domLabel;
    }

    state[statePath] = field.value;
  });

  return { values: state, labels };
};
