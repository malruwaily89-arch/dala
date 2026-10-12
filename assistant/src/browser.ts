import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright-core";
import { classifyControl, hostOf, isPaymentPage, isTextField, type ControlInfo, type Sensitivity } from "./browser-policy.js";

export type PendingAction =
  | { kind: "click"; index: number; label: string; url: string; host: string }
  | { kind: "fill"; index: number; label: string; value: string; url: string; host: string };

interface Control extends ControlInfo {
  index: number;
  tag: string;
  value?: string;
}

export interface BrowserOptions {
  profileDir: string;
  pendingFile: string;
  executablePath?: string;
  noSandbox: boolean;
  /** Tests only: the local test server uses a self-signed certificate. */
  ignoreCertificateErrors?: boolean;
  idleMs?: number;
}

const PAGE_TEXT_LIMIT = 4000;
const NAV_TIMEOUT_MS = 30_000;
const ACTION_TIMEOUT_MS = 10_000;
const CARD_NUMBER = /(?:\d[ -]?){13,19}/;
const PAYMENT_STOP = "هذي صفحة دفع، توقفت هنا ولا أنفذ فيها أي خطوة.";

// Marks interactive elements with data-ai-idx and returns them with their visible labels.
const SNAPSHOT_JS = `(() => {
  const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link]';
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const labelOf = (e) => {
    const byFor = e.id ? document.querySelector('label[for="' + CSS.escape(e.id) + '"]') : null;
    return (
      e.getAttribute('aria-label') ||
      (byFor && byFor.innerText) ||
      e.getAttribute('placeholder') ||
      (e.tagName === 'INPUT' && ['submit', 'button'].includes(e.type) ? e.value : '') ||
      (e.innerText || '').trim() ||
      e.getAttribute('title') ||
      e.getAttribute('name') ||
      ''
    ).replace(/\\s+/g, ' ').trim().slice(0, 80);
  };
  const els = [...document.querySelectorAll(sel)].filter(visible);
  const controls = els.map((e, i) => {
    e.setAttribute('data-ai-idx', String(i));
    const secret = e.type === 'password';
    return {
      index: i,
      tag: e.tagName.toLowerCase(),
      type: (e.getAttribute('type') || '').toLowerCase(),
      name: e.getAttribute('name') || '',
      id: e.id || '',
      autocomplete: e.getAttribute('autocomplete') || '',
      label: labelOf(e),
      value: secret ? '' : (e.tagName === 'INPUT' && e.type !== 'checkbox' && e.type !== 'radio' ? e.value : ''),
    };
  });
  return {
    title: document.title,
    url: location.href,
    text: (document.body ? document.body.innerText : '').replace(/\\n{3,}/g, '\\n\\n').slice(0, ${PAGE_TEXT_LIMIT}),
    controls,
    frameUrls: [...document.querySelectorAll('iframe')].map((f) => f.src).filter(Boolean),
  };
})()`;

export class BrowserService {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private controls: Control[] = [];
  private pending: PendingAction | null = null;
  private paymentBlocked = false;
  /** Set when a navigation to a plain-http address was refused during the last action. */
  private blockedUrl: string | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private bodyText = "";

  constructor(private readonly opts: BrowserOptions) {}

  async load(): Promise<void> {
    await mkdir(path.dirname(this.opts.pendingFile), { recursive: true });
    const saved = JSON.parse(await readFile(this.opts.pendingFile, "utf8").catch(() => "null")) as PendingAction | null;
    // Requests saved by an older version are dropped.
    this.pending = saved?.kind === "click" || saved?.kind === "fill" ? saved : null;
  }

  pendingText(): string | null {
    const p = this.pending;
    if (!p) return null;
    if (p.kind === "click") return `أحتاج موافقتك قبل ما أضغط على "${p.label}" في ${p.host}. اكتب "موافق" أو "لا".`;
    return `أحتاج موافقتك قبل ما أكتب قيمة في حقل "${p.label}" في ${p.host}. اكتب "موافق" أو "لا".`;
  }

  async cancel(): Promise<string> {
    if (!this.pending) return "ما فيه خطوة تنتظر.";
    await this.setPending(null);
    return "تم الإلغاء.";
  }

  /** Any https site opens without asking. Plain http is refused. */
  async open(url: string): Promise<string> {
    this.touch();
    const host = hostOf(url);
    if (!/^https:\/\//i.test(url) || !host) return "الرابط غير صالح؛ لازم يبدأ بـ https://";
    const page = await this.ensurePage();
    this.blockedUrl = null;
    const failure = await page
      .goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS })
      .then(() => null, firstLine);
    if (this.blockedUrl) {
      const refused = this.blockedUrl;
      this.blockedUrl = null;
      return `ما أفتح ${refused} لأنه غير مشفر (http)، ولا أفتح إلا روابط https.`;
    }
    if (failure) return `تعذر فتح ${host}: ${failure}`;
    return this.snapshotText();
  }

  async read(): Promise<string> {
    this.touch();
    if (!this.page) return "ما فيه صفحة مفتوحة.";
    return this.snapshotText();
  }

  async click(index: number): Promise<string> {
    this.touch();
    const check = this.preflight(index);
    if (check) return check;
    const control = this.controls[index]!;
    const kind: Sensitivity = classifyControl(control);
    if (kind === "password") return "ما أضغط على حقول كلمات المرور.";
    if (kind === "payment") return "هذا زر أو حقل دفع، ما أنفذ عمليات الدفع ولا الشراء. أكمل بنفسك إذا تبي.";
    if (kind === "submit") {
      await this.setPending({ kind: "click", index, label: control.label ?? "", url: this.currentUrl(), host: this.currentHost() });
      return this.pendingText() ?? "";
    }
    return this.performClick(index);
  }

  async fill(index: number, value: string): Promise<string> {
    this.touch();
    const check = this.preflight(index);
    if (check) return check;
    const control = this.controls[index]!;
    const kind: Sensitivity = classifyControl(control);
    if (kind === "password") return "ما أكتب كلمات المرور ولا رموز التحقق؛ هذي تدخلها بنفسك.";
    if (kind === "payment") return "هذا حقل بطاقة أو دفع، ما أكتب فيه.";
    if (control.tag !== "input" && control.tag !== "textarea") return "هذا العنصر ما يُعبّأ بالكتابة.";
    if (CARD_NUMBER.test(value)) return "ما أكتب أرقام بطاقات.";
    if (kind === "personal") {
      await this.setPending({ kind: "fill", index, label: control.label ?? "", value, url: this.currentUrl(), host: this.currentHost() });
      return this.pendingText() ?? "";
    }
    return this.performFill(index, value);
  }

  /** Runs the action waiting for the owner's approval, after checking the page is still the same. */
  async approve(): Promise<string> {
    this.touch();
    const p = this.pending;
    if (!p) return "ما فيه خطوة تنتظر موافقتك.";
    await this.setPending(null);
    if (!this.page || this.currentUrl() !== p.url) return "الصفحة تغيّرت، ألغيت الخطوة. أعد طلبها من جديد.";
    await this.refreshControls();
    const control = this.controls[p.index];
    if (!control || (control.label ?? "") !== p.label) return "العنصر تغيّر في الصفحة، ألغيت الخطوة. أعد طلبها من جديد.";
    if (p.kind === "click") return this.performClick(p.index);
    return this.performFill(p.index, p.value);
  }

  async close(): Promise<void> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    await this.context?.close().catch(() => undefined);
    this.context = null;
    this.page = null;
    this.controls = [];
  }

  private touch(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => void this.close(), this.opts.idleMs ?? 10 * 60_000);
    this.idleTimer.unref();
  }

  private async ensurePage(): Promise<Page> {
    if (this.page && this.context) return this.page;
    await mkdir(this.opts.profileDir, { recursive: true });
    const args = ["--password-store=basic", "--disable-save-password-bubble", "--disable-notifications"];
    if (this.opts.noSandbox) args.push("--no-sandbox");
    try {
      this.context = await chromium.launchPersistentContext(this.opts.profileDir, {
        executablePath: this.opts.executablePath,
        headless: true,
        args,
        viewport: { width: 1280, height: 900 },
        locale: "ar-SA",
        timezoneId: "Asia/Riyadh",
        acceptDownloads: false,
        serviceWorkers: "block",
        permissions: [],
        ignoreHTTPSErrors: this.opts.ignoreCertificateErrors ?? false,
      });
    } catch (err) {
      // The full error goes to `docker logs`; the owner gets its first line.
      console.error("Browser launch failed:", err);
      throw new Error(`تعذر تشغيل المتصفح: ${firstLine(err)}`);
    }
    // Pages reached by a click or a redirect must also be https.
    await this.context.route("**/*", (route) => {
      const req = route.request();
      if (req.isNavigationRequest() && req.frame().parentFrame() === null && !/^(https:|about:blank)/i.test(req.url())) {
        this.blockedUrl = req.url();
        return route.abort("blockedbyclient");
      }
      return route.continue();
    });
    this.page = this.context.pages()[0] ?? (await this.context.newPage());
    return this.page;
  }

  private preflight(index: number): string | null {
    if (!this.page) return "افتح صفحة أولاً.";
    if (this.paymentBlocked) return PAYMENT_STOP;
    if (!this.controls[index]) return "رقم العنصر غير معروف؛ اقرأ الصفحة من جديد.";
    return null;
  }

  private async performClick(index: number): Promise<string> {
    const page = this.page!;
    if (this.paymentBlocked) return PAYMENT_STOP;
    this.blockedUrl = null;
    await page.locator(`[data-ai-idx="${index}"]`).first().click({ timeout: ACTION_TIMEOUT_MS });
    await page.waitForLoadState("domcontentloaded", { timeout: NAV_TIMEOUT_MS }).catch(() => undefined);
    if (this.blockedUrl) {
      // Chromium shows its error page for a refused navigation; go back so the owner sees the previous page.
      await page.goBack({ timeout: ACTION_TIMEOUT_MS }).catch(() => null);
      return this.refusedHttp();
    }
    return this.snapshotText();
  }

  /** Reply for a refused plain-http navigation, followed by the page the owner is still on. */
  private async refusedHttp(): Promise<string> {
    const url = this.blockedUrl;
    this.blockedUrl = null;
    return `ما أفتح ${url} لأنه غير مشفر (http)، ولا أفتح إلا روابط https.\n\n${await this.snapshotText()}`;
  }

  private async performFill(index: number, value: string): Promise<string> {
    const page = this.page!;
    if (this.paymentBlocked) return PAYMENT_STOP;
    const control = this.controls[index]!;
    await page.locator(`[data-ai-idx="${index}"]`).first().fill(value, { timeout: ACTION_TIMEOUT_MS });
    return `كتبت في حقل «${control.label || control.name || "بدون اسم"}».`;
  }

  private async snapshotText(): Promise<string> {
    await this.refreshControls();
    const page = this.page!;
    const facts = {
      url: page.url(),
      hasCardFields: this.controls.some((c) => isTextField(c) && classifyControl(c) === "payment"),
      frameUrls: page.frames().map((f) => f.url()),
    };
    this.paymentBlocked = isPaymentPage(facts);
    const title = await page.title().catch(() => "");
    if (this.paymentBlocked) {
      return `وصلت لصفحة دفع (${facts.url})، توقفت هنا ولن أنفذ أي خطوة فيها. أكمل بنفسك إذا تبي.`;
    }
    const lines = this.controls.map((c) => {
      const kind = classifyControl(c);
      const tag = c.type ? `${c.tag} ${c.type}` : c.tag;
      const note =
        kind === "submit"
          ? " (يحتاج موافقتك)"
          : kind === "personal"
            ? " (بيانات شخصية، يحتاج موافقتك)"
            : kind === "password"
              ? " (كلمة مرور، ما أكتب فيه)"
              : kind === "payment"
                ? " (دفع أو بطاقة، ما أنفذه)"
                : "";
      return `[${c.index}] ${tag}: ${c.label || c.name || "بدون اسم"}${note}`;
    });
    return [`الصفحة: ${title}`, `الرابط: ${facts.url}`, "", "النص:", this.bodyText, "", "العناصر:", ...lines].join("\n");
  }

  private async refreshControls(): Promise<void> {
    const snap = (await this.page!.evaluate(SNAPSHOT_JS)) as {
      text: string;
      controls: Control[];
    };
    this.bodyText = snap.text;
    this.controls = snap.controls;
  }

  private currentUrl(): string {
    return this.page?.url() ?? "";
  }

  private currentHost(): string {
    return hostOf(this.currentUrl());
  }

  private async setPending(p: PendingAction | null): Promise<void> {
    this.pending = p;
    await writeJson(this.opts.pendingFile, p);
  }
}

function firstLine(err: unknown): string {
  return ((err instanceof Error ? err.message : String(err)).split("\n")[0] ?? "").trim();
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(`${file}.tmp`, JSON.stringify(value));
  await rename(`${file}.tmp`, file);
}
