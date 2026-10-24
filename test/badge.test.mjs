import assert from "node:assert/strict";
import test from "node:test";
import { badgeDetails, modelStyle, parseOptions, projectColor, projectDetails } from "../badge.mjs";

const selected = (modelID, providerID = "openai") => ({ providerID, modelID });

test("defaults preserve the original colors and icons", () => {
  assert.deepEqual(modelStyle(selected("gpt-6-luna")), { color: "#F1F5F9", icon: "☾" });
  assert.deepEqual(modelStyle(selected("gpt-6.1-sol")), { color: "#FACC15", icon: "☀️" });
  for (const id of ["deepseek-v4-pro", "deepseek-v4.1-flash-free", "DeepSeek-v4"]) {
    assert.deepEqual(modelStyle(selected(id, "another-provider")), { color: "#60A5FA", icon: "🐋" });
  }
  for (const id of ["unknown", "not-deepseek", "toString", "constructor"]) {
    assert.deepEqual(modelStyle(selected(id)), { color: "#94A3B8", icon: "◇" });
  }
});

test("keeps the exact catalog name for the selected provider and variant", () => {
  const current = { ...selected("deepseek-v4-pro", "opencode-go"), variant: "max" };
  const models = [
    { providerID: "other", id: current.modelID, name: "Wrong provider" },
    { providerID: current.providerID, id: current.modelID, name: "DeepSeek V4 Pro (New)" },
  ];
  assert.deepEqual(badgeDetails(current, models), {
    name: "DeepSeek V4 Pro (New)", color: "#60A5FA", icon: "🐋", variant: "max",
  });
});

test("handles missing selection, catalog loading and model switches", () => {
  assert.equal(badgeDetails(undefined), undefined);
  assert.equal(badgeDetails(selected("gpt-6-luna")).name, "gpt-6-luna");
  assert.equal(badgeDetails(selected("gpt-6-luna")).icon, "☾");
  assert.equal(badgeDetails(selected("gpt-6.1-sol")).icon, "☀️");
});

test("supports arbitrary model counts and partial per-model overrides", () => {
  const models = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`custom-${i}`, { color: "#123abc", icon: "◆" }]));
  models["gpt-6-luna"] = { icon: "○" };
  const overrides = parseOptions({ models });
  assert.deepEqual(modelStyle(selected("custom-19"), overrides), { color: "#123abc", icon: "◆" });
  assert.deepEqual(modelStyle(selected("gpt-6-luna"), overrides), { color: "#F1F5F9", icon: "○" });
});

test("provider-specific overrides win over shared styles", () => {
  const overrides = parseOptions({ models: {
    "gpt-6-luna": { color: "#112233", icon: "○" },
    "openai/gpt-6-luna": { color: "#abcdef" },
  } });
  assert.deepEqual(modelStyle(selected("gpt-6-luna"), overrides), { color: "#abcdef", icon: "○" });
  assert.equal(modelStyle(selected("gpt-6-luna", "opencode-go"), overrides).color, "#112233");
});

test("allows removing an icon and does not mutate options", () => {
  const options = { models: { "gpt-6-luna": { icon: "" } } };
  const before = structuredClone(options);
  assert.equal(modelStyle(selected("gpt-6-luna"), parseOptions(options)).icon, "");
  assert.deepEqual(options, before);
  assert.equal(Object.keys(parseOptions()).length, 0);
});

const location = (directory, project) => ({
  directory,
  ...(project ? { project: { id: "p1", directory, canonical: directory, ...project } } : {}),
});

function hueOf(color) {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  const hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}

test("project colors are stable for a name and ignore letter case", () => {
  assert.match(projectColor("opencode-model-badge"), /^#[0-9A-F]{6}$/);
  assert.equal(projectColor("opencode-model-badge"), projectColor("opencode-model-badge"));
  assert.equal(projectColor("Opencode-Model-Badge"), projectColor("opencode-model-badge"));
});

test("project colors vary between names and avoid the default model colors", () => {
  const names = ["plums", "slyx", "ris", "moy", "omg", "yamboid", "owl", "kos", "sov", "aleksei"];
  const colors = names.map(projectColor);
  assert.equal(new Set(colors).size, colors.length);
  for (const color of colors) {
    for (const modelColor of ["#60A5FA", "#F1F5F9", "#FACC15", "#94A3B8"]) {
      assert.notEqual(color, modelColor);
    }
  }
});

test("project colors avoid the yellow and blue hue bands of the model badge", () => {
  for (let index = 0; index < 100; index++) {
    const hue = hueOf(projectColor(`project-${index}`));
    assert.ok(hue < 36 || hue > 69, `project-${index} is too yellow (${hue})`);
    assert.ok(hue < 185 || hue > 240, `project-${index} is too blue (${hue})`);
  }
});

test("uses the OpenCode project name and canonical directory for the label", () => {
  const current = location("/home/me/plums/worktree", {
    canonical: "/home/me/plums/opencode-model-badge",
  });
  const project = {
    id: "p1",
    canonical: "/home/me/plums/opencode-model-badge",
    name: "Model Badge",
  };
  assert.deepEqual(projectDetails(current, [project]), {
    name: "Model Badge",
    label: "MODEL BADGE",
    color: projectColor("Model Badge"),
  });
  const withoutName = { ...project, name: "" };
  assert.equal(projectDetails(current, [withoutName]).label, "OPENCODE-MODEL-BADGE");
});

test("falls back to the location directory and ignores unrelated projects", () => {
  const current = location("/home/me/plums/opencode-model-badge/");
  assert.deepEqual(projectDetails(current), {
    name: "opencode-model-badge",
    label: "OPENCODE-MODEL-BADGE",
    color: projectColor("opencode-model-badge"),
  });
  assert.equal(projectDetails(location("/home/me/plums/project/")).name, "project");
  assert.equal(projectDetails(location("C:\\work\\project\\")).name, "project");
  assert.deepEqual(projectDetails("/home/me/plums/plain"), projectDetails(location("/home/me/plums/plain")));
  assert.equal(projectDetails(location("/home/me/plums/plain"), [{ id: "other", name: "Other" }]).name, "plain");
});

test("handles missing location and root directories", () => {
  assert.equal(projectDetails(), undefined);
  assert.equal(projectDetails(null), undefined);
  assert.equal(projectDetails(location("")), undefined);
  assert.equal(projectDetails(location("/")), undefined);
});

test("rejects malformed style config with actionable errors", () => {
  for (const options of [null, [], "wrong"]) assert.throws(() => parseOptions(options), /options must be an object/);
  for (const models of [[], "wrong"]) assert.throws(() => parseOptions({ models }), /models must be an object/);
  for (const color of ["red", "#fff", "#xxxxxx", 123]) {
    assert.throws(() => parseOptions({ models: { custom: { color } } }), /#RRGGBB/);
  }
  assert.throws(() => parseOptions({ models: { custom: { icon: 123 } } }), /icon must be a string/);
  assert.throws(() => parseOptions({ models: { custom: null } }), /invalid style/);
});
