import Anthropic from "@anthropic-ai/sdk";
import { createServer, type IncomingMessage as HttpRequest } from "node:http";
import { Agent, isApproval } from "./agent.js";
import { BrowserService } from "./browser.js";
import { TIME_ZONE, receiveFile } from "./files.js";
import { UsageMeter } from "./usage.js";
import { WhatsAppClient, extractMessages, verifySignature, type IncomingMessage, type WhatsAppMedia } from "./whatsapp.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const PORT = Number(process.env.PORT ?? 3300);
const FILES_DIR = process.env.FILES_DIR ?? "/data/files";
const STATE_DIR = process.env.STATE_DIR ?? "/data/state";
const PHONE_NUMBER_ID = required("WHATSAPP_PHONE_NUMBER_ID");
const APP_SECRET = required("WHATSAPP_APP_SECRET");
const VERIFY_TOKEN = required("WHATSAPP_VERIFY_TOKEN");
const OWNER = required("OWNER_WHATSAPP_NUMBER").replace(/\D/g, "");
const RESET_COMMANDS = new Set(["/new", "/جديد"]);
const REFUSALS = new Set(["لا", "لأ", "لاء", "الغ", "إلغاء", "الغاء", "cancel", "no"]);

const whatsapp = new WhatsAppClient(
  required("WHATSAPP_ACCESS_TOKEN"),
  PHONE_NUMBER_ID,
  process.env.WHATSAPP_API_VERSION ?? "v21.0",
);
const meter = new UsageMeter(`${STATE_DIR}/usage.json`, Number(process.env.MONTHLY_BUDGET_SAR ?? 300));
const browser =
  process.env.BROWSER_ENABLED === "true"
    ? new BrowserService({
        profileDir: `${STATE_DIR}/browser-profile`,
        policyFile: `${STATE_DIR}/browser-policy.json`,
        pendingFile: `${STATE_DIR}/browser-pending.json`,
        executablePath: process.env.CHROMIUM_PATH,
        noSandbox: process.env.BROWSER_NO_SANDBOX === "1",
      })
    : undefined;
const agent = new Agent({
  client: new Anthropic(),
  whatsapp,
  model: process.env.AGENT_MODEL ?? "claude-haiku-5-5",
  ownerNumber: OWNER,
  filesDir: FILES_DIR,
  stateDir: STATE_DIR,
  meter,
  browser,
});

const timeFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  timeZone: TIME_ZONE,
  weekday: "long",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const MEDIA_LABELS: Record<string, string> = { image: "صورة", document: "مستند", audio: "رسالة صوتية", video: "فيديو" };

async function toContent(message: IncomingMessage): Promise<Anthropic.Beta.BetaContentBlockParam[] | null> {
  const stamp = `[${timeFormat.format(new Date())}]`;
  if (message.type === "text" && message.text) {
    return [{ type: "text", text: `${stamp}\n${message.text.body}` }];
  }
  if (message.type === "location" && message.location) {
    const { latitude, longitude, name, address } = message.location;
    const label = [name, address].filter(Boolean).join(" - ");
    return [{ type: "text", text: `${stamp}\nأرسل موقع: ${label} (${latitude}, ${longitude})` }];
  }
  const media = message[message.type as "image" | "document" | "audio" | "video"] as WhatsAppMedia | undefined;
  if (!media || !(message.type in MEDIA_LABELS)) return null;

  const { data, mimeType } = await whatsapp.downloadMedia(media.id);
  const file = await receiveFile(FILES_DIR, STATE_DIR, data, mimeType, message.type, media.filename);
  const lines = [
    stamp,
    file.duplicate
      ? `أرسل ${MEDIA_LABELS[message.type]} مطابق تماماً لملف محفوظ سابقاً في: ${file.path} (ما انحفظ مرة ثانية، SHA-256: ${file.sha256})`
      : `أرسل ${MEDIA_LABELS[message.type]} وانحفظ تلقائياً في: ${file.path} (${Math.ceil(data.length / 1024)} KB، SHA-256: ${file.sha256})`,
  ];
  if (message.type === "audio") lines.push("(ما تقدر تسمع الصوتيات؛ اطلب منه يكتب لك إذا احتجت المحتوى)");
  if (media.caption) lines.push(`تعليقه: ${media.caption}`);
  return [{ type: "text", text: lines.join("\n") }];
}

async function handle(message: IncomingMessage): Promise<void> {
  if (message.from !== OWNER) {
    console.warn(`Ignored message from non-owner ${message.from}`);
    return;
  }
  whatsapp.markReadWithTyping(message.id).catch((err) => console.warn("markRead failed:", err.message));

  if (message.type === "text" && RESET_COMMANDS.has(message.text?.body.trim() ?? "")) {
    await agent.reset();
    await whatsapp.sendText(OWNER, "بدأنا محادثة جديدة.");
    return;
  }

  const text = message.type === "text" ? message.text?.body.trim() : undefined;
  if (browser?.pendingText() && text) {
    const word = text.split(/\s+/)[0]?.replace(/[.!،,؟?]+$/u, "").toLowerCase() ?? "";
    if (isApproval(text)) {
      await whatsapp.sendText(OWNER, await browser.approve());
      return;
    }
    if (REFUSALS.has(word)) {
      await whatsapp.sendText(OWNER, await browser.cancel());
      return;
    }
  }

  const content = await toContent(message);
  if (!content) {
    await whatsapp.sendText(OWNER, "هذا النوع من الرسائل غير مدعوم حالياً.");
    return;
  }
  await whatsapp.sendText(OWNER, await agent.runTurn(content, message.text?.body));
}

// One message at a time keeps the conversation history in order.
let queue: Promise<void> = Promise.resolve();
const seen = new Set<string>();

function enqueue(message: IncomingMessage): void {
  if (seen.has(message.id)) return; // Meta retries deliveries it thinks failed
  seen.add(message.id);
  if (seen.size > 1000) seen.delete(seen.values().next().value!);

  queue = queue.then(() =>
    handle(message).catch(async (err) => {
      console.error("Failed to handle message:", err);
      await whatsapp.sendText(OWNER, "صار خطأ تقني، جرّب مرة ثانية بعد شوي.").catch(() => {});
    }),
  );
}

// Webhook payloads are small (media is fetched separately), so anything bigger is not from Meta.
const MAX_BODY_BYTES = 1024 * 1024;

async function readBody(req: HttpRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error("payload too large");
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200).end("ok");
    return;
  }

  if (url.pathname !== "/webhook") {
    res.writeHead(404).end();
    return;
  }

  if (req.method === "GET") {
    const ok = url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === VERIFY_TOKEN;
    res.writeHead(ok ? 200 : 403).end(ok ? (url.searchParams.get("hub.challenge") ?? "") : "");
    return;
  }

  if (req.method === "POST") {
    let body: Buffer;
    try {
      body = await readBody(req);
    } catch {
      if (!res.headersSent) res.writeHead(413).end();
      return;
    }
    if (!verifySignature(body, req.headers["x-hub-signature-256"] as string | undefined, APP_SECRET)) {
      res.writeHead(401).end();
      return;
    }
    res.writeHead(200).end();
    try {
      for (const message of extractMessages(JSON.parse(body.toString("utf8")), PHONE_NUMBER_ID)) {
        enqueue(message);
      }
    } catch (err) {
      console.error("Unreadable webhook payload:", err);
    }
    return;
  }

  res.writeHead(405).end();
});

await meter.load();
await browser?.load();
await agent.init();
server.listen(PORT, () => console.log(`Assistant listening on :${PORT}`));
