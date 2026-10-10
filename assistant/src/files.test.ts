import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  REGISTER_FILE,
  copyInside,
  extensionFor,
  receiveFile,
  listFiles,
  resolveExistingInside,
  resolveInside,
  safeFilename,
  saveIncoming,
  writeTextFile,
} from "./files.js";

const tempRoot = () => mkdtemp(path.join(tmpdir(), "assistant-files-"));

test("resolveInside rejects paths that escape the folder", () => {
  const root = "/data/files";
  assert.equal(resolveInside(root, "inbox/a.pdf"), "/data/files/inbox/a.pdf");
  assert.equal(resolveInside(root, "."), "/data/files");
  for (const bad of ["../secret", "/etc/passwd", "inbox/../../x", ".."]) {
    assert.throws(() => resolveInside(root, bad), /خارج المجلد/);
  }
});

test("resolveExistingInside rejects symlinks pointing outside the folder", async () => {
  const root = await tempRoot();
  const outside = await tempRoot();
  await writeFile(path.join(outside, "secret.txt"), "x");
  await symlink(path.join(outside, "secret.txt"), path.join(root, "link.txt"));
  await writeFile(path.join(root, "ok.txt"), "y");
  await assert.rejects(resolveExistingInside(root, "link.txt"), /خارج المجلد/);
  assert.equal(await resolveExistingInside(root, "ok.txt"), path.join(root, "ok.txt"));
});

test("safeFilename and extensionFor", () => {
  assert.equal(safeFilename("../../عقد الإيجار.pdf"), "عقد الإيجار.pdf");
  assert.equal(safeFilename('a:b*c?.txt'), "a_b_c_.txt");
  assert.equal(safeFilename(".."), "file");
  assert.equal(extensionFor("audio/ogg; codecs=opus"), "ogg");
  assert.equal(extensionFor("application/x-unknown"), "bin");
});

test("saveIncoming stores under inbox/<Riyadh date>/ without overwriting", async () => {
  const root = await tempRoot();
  const now = new Date("2026-10-10T22:30:15Z"); // already the 11th in Riyadh
  const first = await saveIncoming(root, Buffer.from("one"), "application/pdf", "document", "عقد.pdf", now);
  const second = await saveIncoming(root, Buffer.from("two"), "application/pdf", "document", "عقد.pdf", now);
  const image = await saveIncoming(root, Buffer.from("img"), "image/jpeg", "image", undefined, now);
  assert.equal(first, "inbox/2026-10-11/عقد.pdf");
  assert.equal(second, "inbox/2026-10-11/عقد-2.pdf");
  assert.equal(image, "inbox/2026-10-11/image-013015.jpg");
  assert.equal(await readFile(path.join(root, second), "utf8"), "two");
});

test("writeTextFile only writes text files inside the folder, and listFiles sees them", async () => {
  const root = await tempRoot();
  assert.equal(await writeTextFile(root, "notes/مهام.md", "- شراء"), "notes/مهام.md");
  await assert.rejects(writeTextFile(root, "inbox/x.pdf", "nope"), /الكتابة مسموحة/);
  await assert.rejects(writeTextFile(root, "../x.md", "nope"), /خارج المجلد/);
  assert.match(await listFiles(root), /^notes\/مهام\.md — 1 KB — /);
  assert.equal(await listFiles(await tempRoot()), "المجلد فاضي.");
});

test("receiveFile stores identical content once and logs each new file in the register", async () => {
  const root = await tempRoot();
  const state = await tempRoot();
  const now = new Date("2026-10-10T08:30:00Z");
  const first = await receiveFile(root, state, Buffer.from("فاتورة"), "application/pdf", "document", "فاتورة 1.pdf", now);
  const again = await receiveFile(root, state, Buffer.from("فاتورة"), "application/pdf", "document", "اسم ثاني.pdf", now);
  const other = await receiveFile(root, state, Buffer.from("عقد"), "application/pdf", "document", "عقد.pdf", now);

  assert.equal(first.duplicate, false);
  assert.equal(again.duplicate, true);
  assert.equal(again.path, first.path);
  assert.equal(other.duplicate, false);
  assert.equal(first.sha256.length, 64);
  assert.deepEqual((await readdir(path.join(root, "inbox", "2026-10-10"))).sort(), ["عقد.pdf", "فاتورة 1.pdf"]);

  const register = await readFile(path.join(root, REGISTER_FILE), "utf8");
  const lines = register.trim().split("\n");
  assert.ok(register.startsWith("﻿\"تاريخ الاستلام\""));
  assert.equal(lines.length, 3);
  assert.equal(lines[1], `"2026-10-10 11:30","فاتورة 1.pdf","inbox/2026-10-10/فاتورة 1.pdf","1","application/pdf","${first.sha256}"`);
});

test("copyInside keeps the original and never overwrites", async () => {
  const root = await tempRoot();
  await writeFile(path.join(root, "a.txt"), "أصل");
  assert.equal(await copyInside(root, "a.txt", "منشأة/2026/a.txt"), "منشأة/2026/a.txt");
  assert.equal(await readFile(path.join(root, "a.txt"), "utf8"), "أصل");
  await assert.rejects(copyInside(root, "a.txt", "منشأة/2026/a.txt"), /فيه ملف بنفس الاسم/);
  await assert.rejects(copyInside(root, "a.txt", "../a.txt"), /خارج المجلد/);
});
