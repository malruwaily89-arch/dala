import { mkdir, readdir, realpath, stat, writeFile, access } from "node:fs/promises";
import path from "node:path";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "video/mp4": "mp4",
  "video/3gpp": "3gp",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/zip": "zip",
};

export const TEXT_EXTENSIONS = new Set([".txt", ".md", ".csv", ".json", ".log"]);
export const IMAGE_TYPES: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export const TIME_ZONE = "Asia/Riyadh";

const localParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export class PathError extends Error {}

/** Resolves a model-supplied relative path and rejects anything outside root. */
export function resolveInside(root: string, relativePath: string): string {
  const target = path.resolve(root, relativePath);
  const rel = path.relative(root, target);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new PathError("المسار خارج المجلد المسموح");
  }
  return target;
}

/** Same as resolveInside, but also follows symlinks of an existing file (synced folders can contain them). */
export async function resolveExistingInside(root: string, relativePath: string): Promise<string> {
  const target = resolveInside(root, relativePath);
  const [realRoot, realTarget] = await Promise.all([realpath(root), realpath(target)]);
  resolveInside(realRoot, path.relative(realRoot, realTarget));
  return target;
}

export function extensionFor(mimeType: string): string {
  return EXTENSIONS[mimeType.split(";")[0].trim()] ?? "bin";
}

export function safeFilename(name: string): string {
  const cleaned = path
    .basename(name)
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, "_")
    .trim();
  return cleaned && cleaned !== "." && cleaned !== ".." ? cleaned : "file";
}

async function exists(file: string): Promise<boolean> {
  return access(file).then(
    () => true,
    () => false,
  );
}

/** Saves an incoming WhatsApp file under inbox/YYYY-MM-DD/ and returns its path relative to root. */
export async function saveIncoming(
  root: string,
  data: Buffer,
  mimeType: string,
  kind: string,
  originalName: string | undefined,
  now = new Date(),
): Promise<string> {
  const part = Object.fromEntries(localParts.formatToParts(now).map((p) => [p.type, p.value]));
  const day = `${part.year}-${part.month}-${part.day}`;
  const time = `${part.hour}${part.minute}${part.second}`;
  const ext = extensionFor(mimeType);
  const base = originalName ? safeFilename(originalName) : `${kind}-${time}.${ext}`;
  const dir = path.join(root, "inbox", day);
  await mkdir(dir, { recursive: true });

  const parsed = path.parse(base);
  let candidate = base;
  for (let n = 2; await exists(path.join(dir, candidate)); n++) {
    candidate = `${parsed.name}-${n}${parsed.ext}`;
  }
  await writeFile(path.join(dir, candidate), data);
  return path.posix.join("inbox", day, candidate);
}

export async function listFiles(root: string, folder = ".", limit = 300): Promise<string> {
  const start = resolveInside(root, folder);
  const lines: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (lines.length >= limit || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const info = await stat(full);
        const rel = path.relative(root, full).split(path.sep).join("/");
        lines.push(`${rel} — ${Math.ceil(info.size / 1024)} KB — ${info.mtime.toISOString().slice(0, 16).replace("T", " ")}`);
      }
    }
  }
  await walk(start);
  if (lines.length === 0) return "المجلد فاضي.";
  return lines.length >= limit ? `${lines.join("\n")}\n(عرضت أول ${limit} ملف فقط)` : lines.join("\n");
}

export async function writeTextFile(root: string, relativePath: string, content: string): Promise<string> {
  const target = resolveInside(root, relativePath);
  if (!TEXT_EXTENSIONS.has(path.extname(target).toLowerCase())) {
    throw new PathError(`الكتابة مسموحة فقط لملفات ${[...TEXT_EXTENSIONS].join(" ")}`);
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
  return path.relative(root, target).split(path.sep).join("/");
}
