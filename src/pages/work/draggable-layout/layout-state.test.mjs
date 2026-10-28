import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Run the pure reducer without adding a test runtime to the application.
const source = readFileSync(new URL("./layout-state.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
});
const { initialEditor, editorReducer } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const begin = () => editorReducer(initialEditor(), { type: "begin" });

test("all breakpoints start with valid, non-overlapping widget geometry", () => {
  const state = initialEditor();
  for (const [cols, layout] of Object.entries(state.present.layouts)) {
    assert.equal(layout.length, 7);
    for (const item of layout) {
      assert.ok(item.x >= 0 && item.x + item.w <= Number(cols));
      assert.ok(item.h >= item.minH && item.w >= item.minW);
      for (const other of layout) {
        if (item.i === other.i) continue;
        assert.ok(
          item.x + item.w <= other.x ||
            other.x + other.w <= item.x ||
            item.y + item.h <= other.y ||
            other.y + other.h <= item.y,
        );
      }
    }
  }
});

test("undo caps at 30 completed changes and redo branches are discarded", () => {
  let state = begin();
  for (let index = 0; index < 40; index++)
    state = editorReducer(state, { type: "count", count: (index % 2) + 1 });
  assert.equal(state.past.length, 30);
  const current = state.present;
  state = editorReducer(state, { type: "undo" });
  assert.equal(state.future.length, 1);
  state = editorReducer(state, { type: "redo" });
  assert.deepEqual(state.present, current);
  state = editorReducer(state, { type: "undo" });
  state = editorReducer(state, { type: "remove", id: "memo" });
  assert.equal(state.future.length, 0);
});

test("widget deletion, addition and reset undo across every breakpoint", () => {
  let state = begin();
  const original = state.present;
  state = editorReducer(state, { type: "remove", id: "cameras" });
  assert.deepEqual(state.present, original);
  state = editorReducer(state, { type: "remove", id: "memo" });
  assert.ok(!state.present.visible.includes("memo"));
  for (const layout of Object.values(state.present.layouts))
    assert.ok(!layout.some((item) => item.i === "memo"));
  const deleted = state.present;
  state = editorReducer(state, { type: "add", id: "memo" });
  for (const layout of Object.values(state.present.layouts))
    assert.equal(layout.filter((item) => item.i === "memo").length, 1);
  state = editorReducer(state, { type: "undo" });
  assert.deepEqual(state.present, deleted);
  state = editorReducer(state, { type: "reset" });
  assert.deepEqual(state.present, original);
  state = editorReducer(state, { type: "undo" });
  assert.deepEqual(state.present, deleted);
});

test("cancel restores the saved workspace, save establishes the next editing baseline", () => {
  let state = begin();
  const original = state.present;
  state = editorReducer(state, { type: "count", count: 6 });
  state = editorReducer(state, { type: "remove", id: "controller" });
  state = editorReducer(state, { type: "cancel" });
  assert.deepEqual(state.present, original);
  assert.equal(state.editing, false);
  state = editorReducer(state, { type: "begin" });
  state = editorReducer(state, { type: "count", count: 2 });
  state = editorReducer(state, { type: "save" });
  state = editorReducer(state, { type: "begin" });
  state = editorReducer(state, { type: "reset" });
  state = editorReducer(state, { type: "cancel" });
  assert.equal(state.present.cameraCount, 2);
});

test("layout commits affect one breakpoint and no-op callbacks do not add history", () => {
  let state = begin();
  const medium = state.present.layouts[6];
  const before = state;
  state = editorReducer(state, {
    type: "layout",
    cols: 8,
    layout: state.present.layouts[8].map((item) => ({ ...item, moved: false })),
  });
  assert.equal(state, before);
  const layout = state.present.layouts[8].map((item) =>
    item.i === "cameras" ? { ...item, h: item.h + 2 } : item,
  );
  state = editorReducer(state, { type: "layout", cols: 8, layout });
  assert.deepEqual(state.present.layouts[6], medium);
  assert.equal(state.past.length, 1);
  state = editorReducer(state, { type: "undo" });
  assert.deepEqual(state.present, before.present);
  state = editorReducer(state, { type: "save" });
  assert.equal(editorReducer(state, { type: "layout", cols: 8, layout }), state);
});
