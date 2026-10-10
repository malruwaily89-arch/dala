import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { chunkText, extractMessages, verifySignature } from "./whatsapp.js";

test("verifySignature accepts Meta's HMAC and rejects anything else", () => {
  const body = Buffer.from('{"entry":[]}');
  const good = `sha256=${createHmac("sha256", "secret").update(body).digest("hex")}`;
  assert.equal(verifySignature(body, good, "secret"), true);
  assert.equal(verifySignature(body, good, "other-secret"), false);
  assert.equal(verifySignature(Buffer.from("tampered"), good, "secret"), false);
  assert.equal(verifySignature(body, undefined, "secret"), false);
  assert.equal(verifySignature(body, "sha256=abc", "secret"), false);
});

test("extractMessages keeps only messages sent to our number", () => {
  const payload = {
    entry: [
      {
        changes: [
          { field: "messages", value: { metadata: { phone_number_id: "111" }, messages: [{ id: "a", from: "9665", type: "text" }] } },
          { field: "messages", value: { metadata: { phone_number_id: "222" }, messages: [{ id: "b", from: "9665", type: "text" }] } },
          { field: "messages", value: { metadata: { phone_number_id: "111" }, statuses: [{ id: "c" }] } },
        ],
      },
    ],
  };
  assert.deepEqual(
    extractMessages(payload, "111").map((m) => m.id),
    ["a"],
  );
  assert.deepEqual(extractMessages({}, "111"), []);
});

test("chunkText splits long replies under the WhatsApp limit", () => {
  const text = Array.from({ length: 300 }, (_, i) => `سطر رقم ${i} فيه كلام`).join("\n");
  const chunks = chunkText(text, 500);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((c) => c.length <= 500));
  assert.equal(chunks.join("\n"), text);
  assert.deepEqual(chunkText("قصير"), ["قصير"]);
});
