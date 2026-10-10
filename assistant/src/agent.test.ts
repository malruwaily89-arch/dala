import type Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { Agent } from "./agent.js";
import type { WhatsAppClient } from "./whatsapp.js";

type FakeResponse = { stop_reason: string; content: unknown[] } | Error;

async function setup(responses: FakeResponse[], model = "claude-opus-5-5") {
  const dir = await mkdtemp(path.join(tmpdir(), "assistant-agent-"));
  const filesDir = path.join(dir, "files");
  const stateDir = path.join(dir, "state");
  const calls: any[] = [];
  const uploads: string[] = [];
  const sent: unknown[][] = [];
  const client = {
    beta: {
      messages: {
        create: async (params: unknown) => {
          calls.push(structuredClone(params));
          const next = responses.shift();
          if (!next) throw new Error("unexpected extra API call");
          if (next instanceof Error) throw next;
          return next;
        },
      },
    },
    files: {
      upload: async ({ file }: { file: { name: string } }) => {
        uploads.push(file.name);
        return { id: `file_${uploads.length}` };
      },
    },
  } as unknown as Anthropic;
  const whatsapp = { sendDocument: async (...args: unknown[]) => void sent.push(args) } as unknown as WhatsAppClient;
  const make = () => new Agent({ client, whatsapp, model, ownerNumber: "966500000000", filesDir, stateDir });
  const agent = make();
  await agent.init();
  return { agent, make, calls, uploads, sent, filesDir, stateDir };
}

const userText = (text: string): Anthropic.Beta.BetaContentBlockParam[] => [{ type: "text", text }];
const toolUse = (id: string, name: string, input: object) => ({ type: "tool_use", id, name, input });
const reply = (text: string) => ({ stop_reason: "end_turn", content: [{ type: "text", text }] });

test("runs tools until the model is done, then persists the conversation", async () => {
  const { agent, calls, stateDir, filesDir } = await setup([
    { stop_reason: "tool_use", content: [toolUse("t1", "list_files", { folder: "." })] },
    reply("عندك ملف واحد."),
  ]);
  await mkdir(path.join(filesDir, "inbox"), { recursive: true });
  await writeFile(path.join(filesDir, "inbox", "a.txt"), "hi");

  assert.equal(await agent.runTurn(userText("وش عندي ملفات؟")), "عندك ملف واحد.");

  assert.equal(calls[0].model, "claude-opus-5-5");
  assert.equal(calls[0].fallbacks, "default");
  assert.deepEqual(calls[0].betas, ["compact-2026-01-12", "server-side-fallback-2026-07-01"]);
  assert.deepEqual(calls[0].context_management, { edits: [{ type: "compact_20260112" }] });
  const toolResult = calls[1].messages[2].content[0];
  assert.equal(toolResult.type, "tool_result");
  assert.equal(toolResult.tool_use_id, "t1");
  assert.match(toolResult.content, /^inbox\/a\.txt — 1 KB/);

  const saved = JSON.parse(await readFile(path.join(stateDir, "conversation.json"), "utf8"));
  assert.equal(saved.messages.length, 4);
});

test("read_file uploads a PDF once and returns it as a document block", async () => {
  const { agent, calls, uploads, filesDir } = await setup([
    { stop_reason: "tool_use", content: [toolUse("t1", "read_file", { path: "عقد.pdf" })] },
    { stop_reason: "tool_use", content: [toolUse("t2", "read_file", { path: "عقد.pdf" })] },
    reply("قرأته."),
  ]);
  await writeFile(path.join(filesDir, "عقد.pdf"), "%PDF-1.4");
  await agent.runTurn(userText("لخص العقد"));
  assert.deepEqual(uploads, ["عقد.pdf"]);
  assert.deepEqual(calls[1].messages[2].content[0].content, [
    { type: "document", source: { type: "file", file_id: "file_1" }, title: "عقد.pdf" },
  ]);
  assert.equal(calls[2].messages[4].content[0].content[0].source.file_id, "file_1");
});

test("tool errors go back to the model instead of failing the turn", async () => {
  const { agent, calls } = await setup([
    { stop_reason: "tool_use", content: [toolUse("t1", "read_file", { path: "../../etc/passwd" })] },
    reply("ما أقدر."),
  ]);
  await agent.runTurn(userText("افتح الملف"));
  const result = calls[1].messages[2].content[0];
  assert.equal(result.is_error, true);
  assert.match(result.content, /خارج المجلد/);
});

test("send_file sends the document to the owner", async () => {
  const { agent, sent, filesDir } = await setup([
    { stop_reason: "tool_use", content: [toolUse("t1", "send_file", { path: "صورة.png" })] },
    reply("أرسلته."),
  ]);
  await writeFile(path.join(filesDir, "صورة.png"), "png");
  await agent.runTurn(userText("ارسل الصورة"));
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0], "966500000000");
  assert.equal(sent[0][2], "صورة.png");
  assert.equal(sent[0][3], "image/png");
});

test("a refusal or an API error rolls the turn back", async () => {
  const { agent, calls } = await setup([
    { stop_reason: "refusal", content: [] },
    new Error("boom"),
    reply("أهلاً"),
  ]);
  assert.equal(await agent.runTurn(userText("طلب مرفوض")), "ما أقدر أساعدك في هذا الطلب.");
  await assert.rejects(agent.runTurn(userText("خطأ")), /boom/);
  await agent.runTurn(userText("مرحبا"));
  assert.equal(calls[2].messages.length, 1);
  assert.equal(calls[2].messages[0].content[0].text, "مرحبا");
});

test("a tool call cut off at max_tokens is answered with an error and not run", async () => {
  const { agent, sent, calls } = await setup([
    { stop_reason: "max_tokens", content: [toolUse("t1", "send_file", { path: "x" })] },
    reply("تمام"),
  ]);
  assert.equal(await agent.runTurn(userText("ارسل")), "تم.");
  assert.equal(sent.length, 0);
  await agent.runTurn(userText("كمل"));
  const last = calls[1].messages;
  assert.equal(last[2].content[0].is_error, true);
  assert.equal(last[2].content[0].tool_use_id, "t1");
});

test("changing the prompt archives the old conversation and starts fresh", async () => {
  const { agent, make, stateDir, calls } = await setup([reply("أهلاً"), reply("هلا")]);
  await agent.runTurn(userText("مرحبا"));
  await writeFile(path.join(stateDir, "prompt.md"), "أنت مساعد محمد الشخصي.");

  const fresh = make();
  await fresh.init();
  await fresh.runTurn(userText("من أنت؟"));
  assert.equal(calls[1].messages.length, 1);
  assert.match(calls[1].system, /^أنت مساعد محمد الشخصي\./);
  assert.ok((await readdir(stateDir)).some((f) => /^conversation-.*\.json$/.test(f)));
});

test("models without server-side fallback don't send it", async () => {
  const { agent, calls } = await setup([reply("هلا")], "claude-haiku-5-5");
  await agent.runTurn(userText("مرحبا"));
  assert.equal(calls[0].fallbacks, undefined);
  assert.deepEqual(calls[0].betas, ["compact-2026-01-12"]);
});
