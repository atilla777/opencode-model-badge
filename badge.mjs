const FALLBACK = { color: "#94A3B8", icon: "◇" };
const DEFAULTS = {
  "gpt-6-luna": { color: "#F1F5F9", icon: "☾" },
  "gpt-6.1-sol": { color: "#FACC15", icon: "☀️" },
};

// Skip the hue ranges of the default model colors (yellow and blue) so the
// project label is always visually distinct from the model badge.
const PROJECT_HUES = [[0, 34], [71, 179], [241, 359]];
const PROJECT_LIGHTNESS = [60, 64, 68, 72];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function projectHash(name) {
  let hash = 2166136261;
  for (const character of name.toLowerCase()) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const channel = (offset) => {
    const k = (offset + hue / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * value).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

export function projectColor(name) {
  const hash = projectHash(name);
  const span = PROJECT_HUES.reduce((sum, [start, end]) => sum + end - start + 1, 0);
  const lightness = PROJECT_LIGHTNESS[(hash >>> 8) % PROJECT_LIGHTNESS.length];
  let offset = hash % span;
  for (const [start, end] of PROJECT_HUES) {
    const range = end - start + 1;
    if (offset < range) return hslToHex(start + offset, 68, lightness);
    offset -= range;
  }
}

function directoryName(directory) {
  if (typeof directory !== "string") return undefined;
  const parts = directory.split(/[\\/]+/).filter(Boolean);
  return parts.at(-1);
}

export function projectDetails(location, projects = []) {
  if (!location) return undefined;
  const info = typeof location === "string" ? { directory: location } : location;
  const project = info.project?.id
    ? (Array.isArray(projects) ? projects : []).find((item) => item.id === info.project.id)
    : undefined;
  const directory = project?.canonical
    ?? info.project?.canonical
    ?? project?.directory
    ?? info.project?.directory
    ?? info.directory;
  const name = (
    (typeof project?.name === "string" && project.name.trim())
    || directoryName(directory)
  )?.trim();
  if (!name) return undefined;
  return { name, label: name.toUpperCase(), color: projectColor(name) };
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
