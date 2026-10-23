const FALLBACK = { color: "#94A3B8", icon: "◇" };
const DEFAULTS = {
  "gpt-6-luna": { color: "#F1F5F9", icon: "☾" },
  "gpt-6.1-sol": { color: "#FACC15", icon: "☀️" },
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Validate once during setup; no config files, timers or server hooks are needed.
export function parseOptions(options = {}) {
  if (!isObject(options)) throw new TypeError("model-badge: options must be an object");
  const models = options.models ?? {};
  if (!isObject(models)) throw new TypeError("model-badge: models must be an object");
  const result = Object.create(null);
  for (const [id, style] of Object.entries(models)) {
    if (!id || !isObject(style)) throw new TypeError(`model-badge: invalid style for ${id}`);
    if (style.color !== undefined && (typeof style.color !== "string" || !/^#[0-9a-f]{6}$/i.test(style.color))) {
      throw new TypeError(`model-badge: ${id}.color must be a #RRGGBB hex color`);
    }
    if (style.icon !== undefined && typeof style.icon !== "string") {
      throw new TypeError(`model-badge: ${id}.icon must be a string`);
    }
    result[id] = {
      ...(style.color !== undefined ? { color: style.color } : {}),
      ...(style.icon !== undefined ? { icon: style.icon } : {}),
    };
  }
  return result;
}

export function modelStyle(selected, overrides = {}) {
  const base = /^deepseek(?:-|$)/i.test(selected.modelID)
    ? { color: "#60A5FA", icon: "🐋" }
    : Object.hasOwn(DEFAULTS, selected.modelID) ? DEFAULTS[selected.modelID] : FALLBACK;
  const qualified = `${selected.providerID}/${selected.modelID}`;
  return {
    ...base,
    ...(Object.hasOwn(overrides, selected.modelID) ? overrides[selected.modelID] : {}),
    ...(Object.hasOwn(overrides, qualified) ? overrides[qualified] : {}),
  };
}

export function badgeDetails(selected, models = [], overrides = {}) {
  if (!selected) return undefined;
  const model = models.find(
    (item) => item.providerID === selected.providerID && item.id === selected.modelID,
  );
  return {
    name: model?.name || selected.modelID,
    ...modelStyle(selected, overrides),
    variant: selected.variant,
  };
}
