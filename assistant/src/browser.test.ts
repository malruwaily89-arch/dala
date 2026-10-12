import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { BrowserService } from "./browser.js";
import { classifyControl, DEFAULT_TRUSTED_DOMAINS, isHostApproved, isPaymentPage, parseDomainList } from "./browser-policy.js";

const CHROMIUM = process.env.CHROMIUM_PATH;

const PAGES: Record<string, string> = {
  "/form": `<html><head><title>طلب</title></head><body><h1>طلب</h1>
    <label for="s">الموضوع</label><input id="s" name="subject" type="text" form="f">
    <button type="submit" form="f">إرسال</button>
    <form id="f" method="post" action="/submit"></form></body></html>`,
  "/phone": `<html><head><title>الجوال</title></head><body><label for="p">رقم الجوال</label><input id="p" type="tel" name="phone"></body></html>`,
  "/login": `<html><head><title>دخول</title></head><body><label for="pw">كلمة المرور</label><input id="pw" type="password" name="pw"></body></html>`,
  "/checkout": `<html><head><title>الدفع</title></head><body><h1>الدفع</h1><label for="c">رقم البطاقة</label><input id="c" autocomplete="cc-number"></body></html>`,
  "/outside": `<html><head><title>خارج</title></head><body><a href="http://localhost:PORT/form">انتقل</a></body></html>`,
};

function startServer(submissions: Record<string, string>[]): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", "http://x");
      if (req.method === "POST" && url.pathname === "/submit") {
        let body = "";
        req.on("data", (c: Buffer) => (body += c));
        req.on("end", () => {
          submissions.push(Object.fromEntries(new URLSearchParams(body)));
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end("<html><head><title>تم</title></head><body><h1>تم الإرسال</h1></body></html>");
        });
        return;
      }
      const page = PAGES[url.pathname];
      if (!page) return res.writeHead(404).end();
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page.replaceAll("PORT", String(port)));
    });
    let port = 0;
    server.listen(0, "127.0.0.1", () => {
      port = (server.address() as { port: number }).port;
      resolve({ port, close: () => server.close() });
    });
  });
}

const indexOf = (text: string, label: string) => {
  const m = new RegExp(`\\[(\\d+)\\] [^\\n]*: ${label}`).exec(text);
  assert.ok(m, `no control labelled ${label} in:\n${text}`);
  return Number(m[1]);
};

test("policy: payment, password, submit and personal controls are classified", () => {
  assert.equal(classifyControl({ tag: "input", autocomplete: "cc-number" }), "payment");
  assert.equal(classifyControl({ tag: "input", type: "password" }), "password");
  assert.equal(classifyControl({ tag: "button", label: "ادفع الآن" }), "submit");
  assert.equal(classifyControl({ tag: "input", type: "tel" }), "personal");
  assert.equal(classifyControl({ tag: "input", label: "الموضوع" }), "normal");
  assert.equal(isPaymentPage({ url: "https://shop.example/checkout/step2", hasCardFields: false, frameUrls: [] }), true);
  assert.equal(isPaymentPage({ url: "https://shop.example/about", hasCardFields: false, frameUrls: ["https://checkout.moyasar.com/x"] }), true);
  assert.equal(isPaymentPage({ url: "https://shop.example/about", hasCardFields: false, frameUrls: [] }), false);
  assert.equal(isHostApproved("api.shop.example", ["shop.example"]), true);
  assert.equal(isHostApproved("evilshop.example", ["shop.example"]), false);
  assert.equal(isHostApproved("zatca.gov.sa", DEFAULT_TRUSTED_DOMAINS), true);
  assert.equal(isHostApproved("gov.sa.evil.example", DEFAULT_TRUSTED_DOMAINS), false);
  assert.equal(isHostApproved("notgoogle.com", DEFAULT_TRUSTED_DOMAINS), false);
  assert.deepEqual(parseDomainList(" https://Shop.example/path , b.sa:443 ,, "), ["shop.example", "b.sa"]);
});

test("browser: a launch failure is reported with its reason", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "assistant-browser-"));
  const browser = new BrowserService({
    profileDir: path.join(dir, "profile"),
    policyFile: path.join(dir, "policy.json"),
    pendingFile: path.join(dir, "pending.json"),
    executablePath: path.join(dir, "no-such-chromium"),
    noSandbox: true,
    trustedDomains: ["127.0.0.1"],
    idleMs: 60_000,
  });
  await browser.load();
  try {
    await assert.rejects(browser.open("http://127.0.0.1:9/"), /تعذر تشغيل المتصفح: .+/);
  } finally {
    await browser.close();
  }
});

test("browser: trusted sites open without approval, other sites still ask, load errors are reported", { skip: !CHROMIUM && "set CHROMIUM_PATH to run" }, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "assistant-browser-"));
  const { port, close } = await startServer([]);
  const browser = new BrowserService({
    profileDir: path.join(dir, "profile"),
    policyFile: path.join(dir, "policy.json"),
    pendingFile: path.join(dir, "pending.json"),
    executablePath: CHROMIUM,
    noSandbox: true,
    trustedDomains: ["127.0.0.1"],
    idleMs: 60_000,
  });
  await browser.load();

  try {
    // Trusted host: the page opens straight away, no approval request.
    assert.match(await browser.open(`http://127.0.0.1:${port}/form`), /الصفحة: طلب/);
    assert.equal(browser.pendingText(), null);

    // Same server under another host name is not trusted, so the owner is asked.
    assert.match(await browser.open(`http://localhost:${port}/form`), /أحتاج موافقتك لفتح localhost/);
    assert.match(await browser.cancel(), /تم الإلغاء/);

    // A failed load is reported, not shown as an empty page.
    const gone = await startServer([]);
    gone.close();
    assert.match(await browser.open(`http://127.0.0.1:${gone.port}/`), /تعذر فتح 127\.0\.0\.1: .*net::ERR_/);
  } finally {
    await browser.close();
    close();
  }
});

test("browser: approvals, payment stop, password refusal and domain gating", { skip: !CHROMIUM && "set CHROMIUM_PATH to run" }, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "assistant-browser-"));
  const submissions: Record<string, string>[] = [];
  const { port, close } = await startServer(submissions);
  const policyFile = path.join(dir, "policy.json");
  const pendingFile = path.join(dir, "pending.json");
  await import("node:fs/promises").then((fs) => fs.writeFile(policyFile, JSON.stringify({ domains: ["127.0.0.1"] })));
  const browser = new BrowserService({
    profileDir: path.join(dir, "profile"),
    policyFile,
    pendingFile,
    executablePath: CHROMIUM,
    noSandbox: true,
    idleMs: 60_000,
  });
  await browser.load();
  const base = `http://127.0.0.1:${port}`;

  try {
    // Form: normal fields fill directly, submit waits for approval.
    const form = await browser.open(`${base}/form`);
    assert.match(form, /الصفحة: طلب/);
    const subject = indexOf(form, "الموضوع");
    assert.match(await browser.fill(subject, "طلب تجريبي"), /كتبت في حقل/);
    const submit = indexOf(form, "إرسال");
    assert.match(await browser.click(submit), /أحتاج موافقتك قبل الضغط على "إرسال"/);
    assert.equal(submissions.length, 0, "submit must not run before approval");
    assert.match(browser.pendingText() ?? "", /إرسال/);
    assert.match(await browser.approve(), /تم الإرسال/);
    assert.deepEqual(submissions, [{ subject: "طلب تجريبي" }]);
    assert.equal(browser.pendingText(), null);

    // Personal data needs approval for that exact value.
    const phone = await browser.open(`${base}/phone`);
    assert.match(await browser.fill(indexOf(phone, "رقم الجوال"), "0500000000"), /أحتاج موافقتك لكتابة قيمة/);
    assert.match(await browser.approve(), /كتبت في حقل/);

    // Passwords are never typed by the assistant.
    const login = await browser.open(`${base}/login`);
    assert.match(await browser.fill(indexOf(login, "كلمة المرور"), "secret"), /ما أكتب كلمات المرور/);
    assert.equal(browser.pendingText(), null);

    // Payment page: stop, and refuse every action on it.
    const checkout = await browser.open(`${base}/checkout`);
    assert.match(checkout, /وصلت لصفحة دفع/);
    assert.match(await browser.read(), /وصلت لصفحة دفع/);
    assert.match(await browser.click(0), /صفحة دفع/);

    // Navigation to a host that is not approved is blocked, and the owner is asked first.
    const outside = await browser.open(`${base}/outside`);
    assert.match(outside, /الصفحة: /);
    const link = await browser.read();
    assert.match(await browser.click(indexOf(link, "انتقل")), /localhost/);
    assert.match(browser.pendingText() ?? "", /localhost/);
    assert.match(await browser.cancel(), /تم الإلغاء/);
    assert.equal(browser.pendingText(), null);

    // Approving a new domain adds it to the policy file for next time.
    assert.match(await browser.open(`http://localhost:${port}/form`), /أحتاج موافقتك لفتح localhost/);
    assert.match(await browser.approve(), /الصفحة: طلب/);
    const policy = JSON.parse(await readFile(policyFile, "utf8")) as { domains: string[] };
    assert.ok(policy.domains.includes("localhost"));
  } finally {
    await browser.close();
    close();
  }
});
