import assert from "node:assert/strict";
import {
  beginPasskeyRegistration,
  beginPasskeyAuthentication,
} from "../../app/javascript/src/utils/passkeys.ts";

let received;
const credential = { toJSON: () => ({ id: "credential-id" }) };
globalThis.window = { atob, btoa, PublicKeyCredential: class {} };
Object.defineProperty(globalThis, "navigator", {
  value: {
    credentials: {
      create: async options => {
        received = options;
        return credential;
      },
      get: async options => {
        received = options;
        return credential;
      },
    },
  },
  configurable: true,
});

assert.deepEqual(
  await beginPasskeyRegistration({
    challenge: "AQID",
    user: { id: "BAUG" },
    excludeCredentials: [{ id: "BwgJ", type: "public-key" }],
  }),
  { id: "credential-id" }
);
assert.deepEqual([...received.publicKey.challenge], [1, 2, 3]);
assert.deepEqual([...received.publicKey.user.id], [4, 5, 6]);
assert.deepEqual([...received.publicKey.excludeCredentials[0].id], [7, 8, 9]);

await beginPasskeyAuthentication({
  challenge: "AQID",
  allowCredentials: [{ id: "BwgJ", type: "public-key" }],
});
assert.deepEqual([...received.publicKey.allowCredentials[0].id], [7, 8, 9]);

const parsed = {
  challenge: new Uint8Array([1, 2, 3]),
  user: { id: new Uint8Array([4, 5, 6]) },
};
window.PublicKeyCredential.parseCreationOptionsFromJSON = () => parsed;
await beginPasskeyRegistration({ challenge: "AQID", user: { id: "BAUG" } });
assert.equal(received.publicKey, parsed);
console.log("Passkey native and fallback option parsing checks passed");
