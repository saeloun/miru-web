import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
test("Formik combines field, schema and custom errors at matching array indexes", async () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { Formik } = require("formik");
  const Yup = require("yup");
  let form;
  renderToStaticMarkup(
    React.createElement(Formik, {
      initialValues: { people: [{ email: "", name: "" }] },
      validationSchema: Yup.object({
        people: Yup.array().of(
          Yup.object({ email: Yup.string().required("Email required") })
        ),
      }),
      validate: () => ({ people: [{ name: "Name required" }] }),
      onSubmit: () => {},
      children: value => {
        form = value;
        return null;
      },
    })
  );
  form.registerField("people[0].taxId", { validate: () => "Tax ID required" });
  assert.deepEqual(await form.validateForm(), {
    people: [
      {
        taxId: "Tax ID required",
        email: "Email required",
        name: "Name required",
      },
    ],
  });
});
const copies = new Map();
for (const dir of [".", "docs", "apps/mobile"]) {
  // npm query resolves physical paths for both pnpm's isolated and hoisted layouts.
  for (const pkg of JSON.parse(
    execFileSync(
      "npm",
      [
        "query",
        '[name="minimatch"], [name="deepmerge"], [name="glob"]',
        "--prefix",
        dir,
      ],
      { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
    )
  ))
    copies.set(pkg.path, pkg);
}

for (const pkg of copies.values()) {
  const label = `${pkg.name}@${pkg.version} ${pkg.path}`;
  if (pkg.name === "glob") {
    test(`${label} walks nested braces and excludes hidden and ignored files`, () => {
      const scratch = mkdtempSync(resolve(tmpdir(), "miru-glob-"));
      try {
        for (const file of [
          "src/a.ts",
          "src/b.js",
          "src/.hidden.ts",
          "ignored/c.ts",
        ]) {
          const path = resolve(scratch, file);
          mkdirSync(resolve(path, ".."), { recursive: true });
          writeFileSync(path, "");
        }
        assert.deepEqual(
          require(pkg.path)
            .sync("**/*.{js,ts}", {
              cwd: scratch,
              nodir: true,
              ignore: "ignored/**",
            })
            .sort(),
          ["src/a.ts", "src/b.js"]
        );
      } finally {
        rmSync(scratch, { recursive: true, force: true });
      }
    });
  }
  if (pkg.name === "minimatch" && pkg.version.startsWith("10.")) {
    for (const format of ["commonjs", "esm"]) {
      test(`${label} ${format} bounds preprocessing and preserves matching`, async () => {
        const entry = resolve(pkg.path, `dist/${format}/index.js`);
        const { Minimatch, minimatch, makeRe } =
          format === "esm"
            ? await import(pathToFileURL(entry))
            : require(entry);
        const matcher = new Minimatch("**/../a/b/".repeat(8) + "tail", {
          optimizationLevel: 2,
          braceExpandMax: 32,
        });
        assert.ok(
          matcher.globParts.length <= 32,
          `expanded to ${matcher.globParts.length} rows`
        );
        const rows = Array.from({ length: 1001 }, (_, i) => [`row-${i}`]);
        let comparisons = 0;
        matcher.partsMatch = () => {
          comparisons++;
          return false;
        };
        matcher.secondPhasePreProcess(rows);
        assert.equal(
          comparisons,
          0,
          "large sets must skip quadratic deduplication"
        );
        assert.equal(minimatch("src/file.ts", "**/*.{js,ts}"), true);
        assert.equal(minimatch("src/.hidden.ts", "**/*.{js,ts}"), false);
        assert.equal(makeRe("*.js").test("file.js"), true);
      });
    }
  }
  if (pkg.name === "minimatch" && pkg.version.startsWith("3.")) {
    test(`${label} retains legacy APIs without the affected optimizer`, () => {
      const match = require(pkg.path);
      assert.equal(typeof match, "function");
      assert.equal(match.Minimatch.prototype.firstPhasePreProcess, undefined);
      assert.equal(match("file.js", "*.{js,ts}"), true);
      assert.equal(match.makeRe("*.js").test("file.js"), true);
    });
  }
  if (pkg.name === "deepmerge" && pkg.version === "2.2.1") {
    for (const format of ["cjs", "es", "umd"]) {
      test(`${label} ${format} rejects prototype keys in target and source`, async () => {
        const entry = resolve(pkg.path, `dist/${format}.js`);
        let merge;
        if (format === "cjs") {
          merge = require(entry);
        } else if (format === "es") {
          const scratch = mkdtempSync(resolve(tmpdir(), "miru-deepmerge-"));
          const copy = resolve(scratch, "es.mjs");
          writeFileSync(copy, readFileSync(entry));
          merge = (await import(pathToFileURL(copy))).default;
          rmSync(scratch, { recursive: true, force: true });
        } else {
          const context = { module: { exports: {} }, exports: {} };
          runInNewContext(readFileSync(entry, "utf8"), context);
          merge = context.module.exports;
        }
        const payload = JSON.parse('{"__proto__":{"miruSyntheticAdmin":true}}');
        for (const result of [
          merge({}, payload),
          merge(Object.create(null), payload),
          merge({ session: null }, { session: payload }).session,
          merge(payload, {}),
        ]) {
          assert.equal(result.miruSyntheticAdmin, undefined);
          assert.equal(Object.hasOwn(result, "__proto__"), false);
        }
        assert.equal({}.miruSyntheticAdmin, undefined);
        const merged = merge(
          { values: [1], nested: { a: 1 } },
          { values: [2], nested: { b: 2 } },
          { arrayMerge: (target, source) => target.concat(source) }
        );
        assert.equal(JSON.stringify(merged.values), "[1,2]");
        assert.equal(JSON.stringify(merged.nested), '{"a":1,"b":2}');
      });
    }
  }
  if (pkg.name === "deepmerge" && pkg.version === "4.3.1") {
    for (const format of ["cjs", "umd"]) {
      test(`${label} ${format} rejects prototype keys in target and source`, () => {
        const entry = resolve(pkg.path, `dist/${format}.js`);
        const context = { module: { exports: {} }, exports: {} };
        if (format === "umd")
          runInNewContext(readFileSync(entry, "utf8"), context);
        const merge =
          format === "cjs" ? require(entry) : context.module.exports;
        const payload = JSON.parse('{"__proto__":{"miruSyntheticAdmin":true}}');
        for (const result of [
          merge({}, payload),
          merge(Object.create(null), payload),
          merge({ session: null }, { session: payload }).session,
          merge(payload, {}),
        ]) {
          assert.equal(result.miruSyntheticAdmin, undefined);
          assert.equal(Object.hasOwn(result, "__proto__"), false);
        }
        assert.equal({}.miruSyntheticAdmin, undefined);
        const symbol = Symbol("field");
        const original = { values: [1], nested: { a: 1 }, [symbol]: "kept" };
        const merged = merge(original, {
          values: [2],
          nested: { b: 2 },
          constructor: "data",
        });
        assert.equal(JSON.stringify(merged.values), "[1,2]");
        assert.equal(JSON.stringify(merged.nested), '{"a":1,"b":2}');
        assert.notEqual(merged.nested, original.nested);
        assert.equal(merged[symbol], "kept");
        assert.equal(
          merged.constructor,
          Object.getPrototypeOf(merged).constructor
        );
      });
    }
  }
}
assert.ok(copies.size > 0, "dependency installs are required");
