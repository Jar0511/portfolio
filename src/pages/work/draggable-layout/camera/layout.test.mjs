import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("./layout.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
});
const { calculateCameraLayout } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("1–6 camera tiles fit wide, tall, shallow and unmeasured walls", () => {
  for (const size of [
    { width: 740, height: 285 },
    { width: 240, height: 500 },
    { width: 900, height: 120 },
    { width: 0, height: 0 },
  ]) {
    for (let count = 1; count <= 6; count++) {
      const actual = calculateCameraLayout(count, size);
      assert.ok(actual.width >= 0);
      if (actual.width === 0) continue;
      const rows = Math.ceil(count / actual.columns);
      assert.ok(actual.columns * actual.width + (actual.columns - 1) * 8 <= size.width + 0.001);
      assert.ok((rows * actual.width * 9) / 16 + (rows - 1) * 8 <= size.height + 0.001);
    }
  }
});

test("the arrangement changes with available aspect ratio instead of using a fixed square grid", () => {
  assert.equal(calculateCameraLayout(4, { width: 740, height: 285 }).columns, 2);
  assert.equal(calculateCameraLayout(6, { width: 740, height: 285 }).columns, 3);
  assert.equal(calculateCameraLayout(6, { width: 240, height: 500 }).columns, 1);
  assert.equal(calculateCameraLayout(6, { width: 900, height: 120 }).columns, 6);
  assert.equal(calculateCameraLayout(6, { width: 0, height: 0 }).width, 0);
});
