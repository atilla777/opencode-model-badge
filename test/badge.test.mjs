import assert from "node:assert/strict";
import test from "node:test";
import { badgeDetails, modelStyle, parseOptions } from "../badge.mjs";

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

test("rejects malformed style config with actionable errors", () => {
  for (const options of [null, [], "wrong"]) assert.throws(() => parseOptions(options), /options must be an object/);
  for (const models of [[], "wrong"]) assert.throws(() => parseOptions({ models }), /models must be an object/);
  for (const color of ["red", "#fff", "#xxxxxx", 123]) {
    assert.throws(() => parseOptions({ models: { custom: { color } } }), /#RRGGBB/);
  }
  assert.throws(() => parseOptions({ models: { custom: { icon: 123 } } }), /icon must be a string/);
  assert.throws(() => parseOptions({ models: { custom: null } }), /invalid style/);
});
