const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { Buffer } = require("node:buffer");
const console = require("node:console");
const process = require("node:process");

const expoRequire = createRequire(require.resolve("expo/package.json"));
const supportedReact = expoRequire("./bundledNativeModules.json").react;
assert.equal(require("react").version, supportedReact);
assert.equal(require("react-dom/package.json").version, supportedReact);
const cliRequire = createRequire(expoRequire.resolve("@expo/cli/package.json"));
const metroRequire = createRequire(
  cliRequire.resolve("@expo/metro/package.json")
);
const { getAssetSize, getAssetData } = require(path.join(
  path.dirname(metroRequire.resolve("metro/package.json")),
  "src/Assets.js"
));
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=",
  "base64"
);

async function check() {
  assert.deepEqual(getAssetSize("png", png, "pixel.png"), {
    width: 1,
    height: 1,
  });
  assert.throws(
    () => getAssetSize("png", Buffer.alloc(0), "empty.png"),
    /empty file/
  );
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "miru-metro-assets-")
  );
  try {
    const file = path.join(directory, "pixel.png");
    fs.writeFileSync(file, png);
    const asset = await getAssetData(file, ".", [], null, "/assets");
    assert.equal(asset.width, 1);
    assert.equal(asset.height, 1);
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
  console.log("Metro reads image buffers and paths with image-size 2.");
}

check().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
