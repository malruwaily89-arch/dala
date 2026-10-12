import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createServer } from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";
import { BrowserService } from "./browser.js";
import { classifyControl, isPaymentPage } from "./browser-policy.js";

const CHROMIUM = process.env.CHROMIUM_PATH;

const PAGES: Record<string, string> = {
  "/form": `<html><head><title>طلب</title></head><body><h1>طلب</h1>
    <label for="s">الموضوع</label><input id="s" name="subject" type="text" form="f">
    <button type="submit" form="f">إرسال</button>
    <form id="f" method="post" action="/submit"></form></body></html>`,
  "/phone": `<html><head><title>الجوال</title></head><body><label for="p">رقم الجوال</label><input id="p" type="tel" name="phone"></body></html>`,
  "/login": `<html><head><title>دخول</title></head><body><label for="pw">كلمة المرور</label><input id="pw" type="password" name="pw"></body></html>`,
  "/checkout": `<html><head><title>الدفع</title></head><body><h1>الدفع</h1><label for="c">رقم البطاقة</label><input id="c" autocomplete="cc-number"></body></html>`,
  "/pay-button": `<html><head><title>السلة</title></head><body><button type="button">ادفع الآن</button></body></html>`,
  "/links": `<html><head><title>روابط</title></head><body><a href="https://127.0.0.1:PORT/form">نموذج</a><a href="http://example.invalid/">بدون تشفير</a></body></html>`,
};

async function selfSignedCert(): Promise<{ key: string; cert: string }> {
  const dir = await mkdtemp(path.join(tmpdir(), "assistant-tls-"));
  const key = path.join(dir, "key.pem");
  const cert = path.join(dir, "cert.pem");
  execFileSync(
    "openssl",
    ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", key, "-out", cert, "-days", "1", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1"],
    { stdio: "ignore" },
  );
  return { key: await readFile(key, "utf8"), cert: await readFile(cert, "utf8") };
}

async function startServer(submissions: Record<string, string>[]): Promise<{ port: number; close: () => void }> {
  const tls = await selfSignedCert();
  return new Promise((resolve) => {
    const server = createServer({ key: tls.key, cert: tls.cert }, (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", "https://x");
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

async function newBrowser(executablePath: string | undefined = CHROMIUM): Promise<BrowserService> {
  const dir = await mkdtemp(path.join(tmpdir(), "assistant-browser-"));
  const browser = new BrowserService({
    profileDir: path.join(dir, "profile"),
    pendingFile: path.join(dir, "pending.json"),
    executablePath,
    noSandbox: true,
    ignoreCertificateErrors: true,
    idleMs: 60_000,
  });
  await browser.load();
  return browser;
}

test("policy: passwords, cards and payment buttons are refused; submit and personal fields need approval", () => {
  assert.equal(classifyControl({ tag: "input", type: "password" }), "password");
  assert.equal(classifyControl({ tag: "input", type: "text", label: "كلمة المرور" }), "password");
  assert.equal(classifyControl({ tag: "input", autocomplete: "one-time-code" }), "password");
  assert.equal(classifyControl({ tag: "input", label: "رقم البطاقة" }), "payment");
  assert.equal(classifyControl({ tag: "input", autocomplete: "cc-number" }), "payment");
  assert.equal(classifyControl({ tag: "button", label: "ادفع الآن" }), "payment");
  assert.equal(classifyControl({ tag: "input", type: "submit", label: "Pay now" }), "payment");
  assert.equal(classifyControl({ tag: "button", label: "إرسال" }), "submit");
  assert.equal(classifyControl({ tag: "input", type: "tel" }), "personal");
  assert.equal(classifyControl({ tag: "input", label: "الموضوع" }), "normal");
  // Links that only mention these words can still be followed.
  assert.equal(classifyControl({ tag: "a", label: "نسيت كلمة المرور؟" }), "normal");
  assert.equal(classifyControl({ tag: "a", label: "Payroll reports" }), "normal");

  assert.equal(isPaymentPage({ url: "https://shop.example/checkout/step2", hasCardFields: false, frameUrls: [] }), true);
  assert.equal(isPaymentPage({ url: "https://shop.example/%D8%A7%D9%84%D8%AF%D9%81%D8%B9", hasCardFields: false, frameUrls: [] }), true);
  assert.equal(isPaymentPage({ url: "https://shop.example/about", hasCardFields: false, frameUrls: ["https://checkout.moyasar.com/x"] }), true);
  assert.equal(isPaymentPage({ url: "https://pay.sadad.com.sa/x", hasCardFields: false, frameUrls: [] }), true);
  assert.equal(isPaymentPage({ url: "https://shop.example/payroll", hasCardFields: false, frameUrls: [] }), false);
  assert.equal(isPaymentPage({ url: "https://shop.example/about", hasCardFields: false, frameUrls: [] }), false);
});

test("browser: a launch failure is reported with its reason", async () => {
  const browser = await newBrowser(path.join(tmpdir(), "no-such-chromium"));
  try {
    await assert.rejects(browser.open("https://127.0.0.1:9/"), /تعذر تشغيل المتصفح: .+/);
  } finally {
    await browser.close();
  }
});

test("browser: https pages open without asking, plain http is refused, load errors are reported", { skip: !CHROMIUM && "set CHROMIUM_PATH to run" }, async () => {
  const { port, close } = await startServer([]);
  const browser = await newBrowser();
  try {
    // Any https page opens straight away, with no approval request.
    assert.match(await browser.open(`https://localhost:${port}/links`), /الصفحة: روابط/);
    assert.equal(browser.pendingText(), null);

    // Following an https link to another host needs no approval either.
    assert.match(await browser.click(indexOf(await browser.read(), "نموذج")), /الصفحة: طلب/);

    // Plain http is refused outright.
    assert.match(await browser.open("http://example.invalid/"), /لازم يبدأ بـ https:\/\//);

    // A plain-http link is refused, and the owner ends up on the page they were on.
    await browser.open(`https://localhost:${port}/links`);
    const refused = await browser.click(indexOf(await browser.read(), "بدون تشفير"));
    assert.match(refused, /ما أفتح http:\/\/example\.invalid\/ لأنه غير مشفر/);
    assert.match(refused, /الصفحة: روابط/);

    // A failed load is reported, not shown as an empty page.
    const gone = await startServer([]);
    gone.close();
    assert.match(await browser.open(`https://localhost:${gone.port}/`), /تعذر فتح localhost: .*net::ERR_/);
  } finally {
    await browser.close();
    close();
  }
});

test("browser: approvals for submits and personal data, refusals for passwords, cards and payments", { skip: !CHROMIUM && "set CHROMIUM_PATH to run" }, async () => {
  const submissions: Record<string, string>[] = [];
  const { port, close } = await startServer(submissions);
  const browser = await newBrowser();
  const base = `https://localhost:${port}`;

  try {
    // Form: normal fields fill directly, submit waits for approval.
    const form = await browser.open(`${base}/form`);
    assert.match(form, /الصفحة: طلب/);
    const subject = indexOf(form, "الموضوع");
    assert.match(await browser.fill(subject, "طلب تجريبي"), /كتبت في حقل/);
    assert.match(await browser.fill(subject, "4111 1111 1111 1111"), /ما أكتب أرقام بطاقات/);
    const submit = indexOf(form, "إرسال");
    assert.match(await browser.click(submit), /أحتاج موافقتك قبل ما أضغط على "إرسال"/);
    assert.equal(submissions.length, 0, "submit must not run before approval");
    assert.match(browser.pendingText() ?? "", /إرسال/);
    assert.match(await browser.approve(), /تم الإرسال/);
    assert.deepEqual(submissions, [{ subject: "طلب تجريبي" }]);
    assert.equal(browser.pendingText(), null);

    // Personal data needs approval for that exact value.
    const phone = await browser.open(`${base}/phone`);
    assert.match(await browser.fill(indexOf(phone, "رقم الجوال"), "0500000000"), /أحتاج موافقتك قبل ما أكتب/);
    assert.match(await browser.approve(), /كتبت في حقل/);

    // Passwords are never typed by the assistant.
    const login = await browser.open(`${base}/login`);
    assert.match(await browser.fill(indexOf(login, "كلمة المرور"), "secret"), /ما أكتب كلمات المرور/);
    assert.equal(browser.pendingText(), null);

    // A payment button is refused outright, with no approval request.
    const cart = await browser.open(`${base}/pay-button`);
    assert.match(cart, /ادفع الآن \(دفع أو بطاقة، ما أنفذه\)/);
    assert.match(await browser.click(indexOf(cart, "ادفع الآن")), /ما أنفذ عمليات الدفع/);
    assert.equal(browser.pendingText(), null);

    // Payment page: stop, and refuse every action on it.
    const checkout = await browser.open(`${base}/checkout`);
    assert.match(checkout, /وصلت لصفحة دفع/);
    assert.match(await browser.read(), /وصلت لصفحة دفع/);
    assert.match(await browser.click(0), /صفحة دفع/);
  } finally {
    await browser.close();
    close();
  }
});
