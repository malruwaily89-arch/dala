import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright-core";
import { classifyControl, hostOf, isHostApproved, isPaymentPage, type ControlInfo, type Sensitivity } from "./browser-policy.js";

export type PendingAction =
  | { kind: "domain"; host: string; url: string }
  | { kind: "click"; index: number; label: string; url: string; host: string }
  | { kind: "fill"; index: number; label: string; value: string; url: string; host: string };

interface Control extends ControlInfo {
  index: number;
  tag: string;
  value?: string;
}

interface Policy {
  domains: string[];
}

export interface BrowserOptions {
  profileDir: string;
  policyFile: string;
  pendingFile: string;
  executablePath?: string;
  noSandbox: boolean;
  idleMs?: number;
}

const PAGE_TEXT_LIMIT = 4000;
const NAV_TIMEOUT_MS = 30_000;
const ACTION_TIMEOUT_MS = 10_000;
const CARD_NUMBER = /(?:\d[ -]?){13,19}/;

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
  private policy: Policy = { domains: [] };
  private pending: PendingAction | null = null;
  private blocked: { host: string; url: string } | null = null;
  private paymentBlocked = false;
  private idleTimer: NodeJS.Timeout | null = null;
  private bodyText = "";

  constructor(private readonly opts: BrowserOptions) {}

  async load(): Promise<void> {
    await mkdir(path.dirname(this.opts.policyFile), { recursive: true });
    this.policy = JSON.parse(await readFile(this.opts.policyFile, "utf8").catch(() => '{"domains":[]}'));
    this.pending = JSON.parse(await readFile(this.opts.pendingFile, "utf8").catch(() => "null"));
  }

  pendingText(): string | null {
    const p = this.pending;
    if (!p) return null;
    if (p.kind === "domain") return `أحتاج موافقتك لفتح ${p.host}. اكتب "موافق" أو "لا".`;
    if (p.kind === "click") return `أحتاج موافقتك قبل الضغط على "${p.label}" في ${p.host}. اكتب "موافق" أو "لا".`;
    return `أحتاج موافقتك لكتابة قيمة في حقل "${p.label}" في ${p.host}. اكتب "موافق" أو "لا".`;
  }

  async cancel(): Promise<string> {
    if (!this.pending) return "ما فيه خطوة تنتظر.";
    await this.setPending(null);
    return "تم الإلغاء.";
  }

  async open(url: string): Promise<string> {
    this.touch();
    if (!/^https?:\/\//i.test(url) || !hostOf(url)) return "الرابط غير صالح؛ لازم يبدأ بـ https://";
    const host = hostOf(url);
    if (!isHostApproved(host, this.policy.domains)) {
      await this.setPending({ kind: "domain", host, url });
      return this.pendingText() ?? "";
    }
    const page = await this.ensurePage();
    this.blocked = null;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS }).catch(() => undefined);
    return this.afterNavigation();
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
    if (kind === "password" || kind === "payment") return "ما أتعامل مع هذا الحقل.";
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
    if (kind === "password") return "ما أكتب كلمات المرور؛ هذي تدخلها بنفسك.";
    if (kind === "payment") return "هذا حقل دفع، ما أكتب فيه.";
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
    if (p.kind === "domain") {
      if (!this.policy.domains.includes(p.host)) {
        this.policy.domains.push(p.host);
        await this.savePolicy();
      }
      return this.open(p.url);
    }
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
    });
    await this.context.route("**/*", (route) => {
      const req = route.request();
      if (req.isNavigationRequest() && req.frame().parentFrame() === null) {
        const host = hostOf(req.url());
        if (!isHostApproved(host, this.policy.domains) && req.url() !== "about:blank") {
          this.blocked = { host, url: req.url() };
          return route.abort("blockedbyclient");
        }
      }
      return route.continue();
    });
    this.page = this.context.pages()[0] ?? (await this.context.newPage());
    return this.page;
  }

  private preflight(index: number): string | null {
    if (!this.page) return "افتح صفحة أولاً.";
    if (this.paymentBlocked) return "هذي صفحة دفع، توقفت هنا ولا أنفذ فيها أي خطوة.";
    if (!this.controls[index]) return "رقم العنصر غير معروف؛ اقرأ الصفحة من جديد.";
    return null;
  }

  private async afterNavigation(): Promise<string> {
    if (this.blocked) {
      const { host, url } = this.blocked;
      this.blocked = null;
      await this.setPending({ kind: "domain", host, url });
      return `الموقع ${host} غير مسموح حالياً. ${this.pendingText() ?? ""}`;
    }
    return this.snapshotText();
  }

  private async performClick(index: number): Promise<string> {
    const page = this.page!;
    if (this.paymentBlocked) return "هذي صفحة دفع، توقفت هنا.";
    await page.locator(`[data-ai-idx="${index}"]`).first().click({ timeout: ACTION_TIMEOUT_MS });
    await page.waitForLoadState("domcontentloaded", { timeout: NAV_TIMEOUT_MS }).catch(() => undefined);
    return this.afterNavigation();
  }

  private async performFill(index: number, value: string): Promise<string> {
    const page = this.page!;
    if (this.paymentBlocked) return "هذي صفحة دفع، توقفت هنا.";
    const control = this.controls[index]!;
    await page.locator(`[data-ai-idx="${index}"]`).first().fill(value, { timeout: ACTION_TIMEOUT_MS });
    return `كتبت في حقل «${control.label || control.name || "بدون اسم"}».`;
  }

  private async snapshotText(): Promise<string> {
    await this.refreshControls();
    const page = this.page!;
    const facts = {
      url: page.url(),
      hasCardFields: this.controls.some((c) => classifyControl(c) === "payment"),
      frameUrls: page.frames().map((f) => f.url()),
    };
    this.paymentBlocked = isPaymentPage(facts);
    const title = await page.title().catch(() => "");
    if (this.paymentBlocked) {
      return `وصلت لصفحة دفع (${facts.url})، توقفت هنا ولن أنفذ أي خطوة فيها. أكمل بنفسك إذا أردت.`;
    }
    const lines = this.controls.map((c) => {
      const kind = classifyControl(c);
      const tag = c.type ? `${c.tag} ${c.type}` : c.tag;
      const note = kind === "submit" ? " (يحتاج موافقتك)" : kind === "personal" ? " (بيانات شخصية، يحتاج موافقتك)" : kind === "password" ? " (كلمة مرور، لا أكتب فيه)" : "";
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

  private async savePolicy(): Promise<void> {
    await writeJson(this.opts.policyFile, this.policy);
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(`${file}.tmp`, JSON.stringify(value));
  await rename(`${file}.tmp`, file);
}
