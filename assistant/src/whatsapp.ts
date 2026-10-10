import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH_BASE = "https://graph.facebook.com";
const TEXT_LIMIT = 4000;

export interface WhatsAppMedia {
  id: string;
  mime_type: string;
  caption?: string;
  filename?: string;
}

export interface IncomingMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  image?: WhatsAppMedia;
  document?: WhatsAppMedia;
  audio?: WhatsAppMedia;
  video?: WhatsAppMedia;
  location?: { latitude: number; longitude: number; name?: string; address?: string };
}

export function verifySignature(rawBody: Buffer, header: string | undefined, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Messages addressed to our phone number only; status updates and other numbers are ignored. */
export function extractMessages(payload: unknown, phoneNumberId: string): IncomingMessage[] {
  const entries = (payload as { entry?: { changes?: { field?: string; value?: any }[] }[] })?.entry ?? [];
  const messages: IncomingMessage[] = [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      if (change.value?.metadata?.phone_number_id !== phoneNumberId) continue;
      messages.push(...(change.value.messages ?? []));
    }
  }
  return messages;
}

export function chunkText(text: string, limit = TEXT_LIMIT): string[] {
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n", limit);
    if (cut < limit / 2) cut = rest.lastIndexOf(" ", limit);
    if (cut < limit / 2) cut = limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export class WhatsAppClient {
  constructor(
    private readonly token: string,
    private readonly phoneNumberId: string,
    private readonly apiVersion: string,
  ) {}

  private async graph(path: string, init: RequestInit = {}): Promise<Response> {
    const res = await fetch(`${GRAPH_BASE}/${this.apiVersion}/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.token}`, ...init.headers },
    });
    if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
    return res;
  }

  private sendMessage(body: Record<string, unknown>): Promise<Response> {
    return this.graph(`${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    });
  }

  async sendText(to: string, text: string): Promise<void> {
    for (const body of chunkText(text)) {
      await this.sendMessage({ to, type: "text", text: { body, preview_url: false } });
    }
  }

  async markReadWithTyping(messageId: string): Promise<void> {
    await this.sendMessage({ status: "read", message_id: messageId, typing_indicator: { type: "text" } });
  }

  async downloadMedia(mediaId: string): Promise<{ data: Buffer; mimeType: string }> {
    const meta = (await (await this.graph(mediaId)).json()) as { url: string; mime_type: string };
    const file = await fetch(meta.url, { headers: { Authorization: `Bearer ${this.token}` } });
    if (!file.ok) throw new Error(`WhatsApp media download ${file.status}`);
    return { data: Buffer.from(await file.arrayBuffer()), mimeType: meta.mime_type };
  }

  async sendDocument(to: string, data: Buffer, filename: string, mimeType: string): Promise<void> {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", mimeType);
    form.append("file", new Blob([new Uint8Array(data)], { type: mimeType }), filename);
    const { id } = (await (await this.graph(`${this.phoneNumberId}/media`, { method: "POST", body: form })).json()) as {
      id: string;
    };
    await this.sendMessage({ to, type: "document", document: { id, filename } });
  }
}
