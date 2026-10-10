import ExcelJS from "exceljs";
import { access, copyFile, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { PathError, resolveExistingInside, resolveInside } from "./files.js";

export type CellKind = "text" | "number" | "date" | "formula" | "empty";
export interface CellInput {
  value: string;
  kind: CellKind;
}
export interface CellWrite extends CellInput {
  cell: string;
}

const MAX_ROWS = 300;
const MAX_COLS = 30;
const BACKUP_DIR = ".backups";

export function columnNumber(letters: string): number {
  return [...letters.toUpperCase()].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
}

export function columnLetters(n: number): string {
  let letters = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  return letters;
}

function parseAddress(address: string): { row: number; col: number } {
  const match = /^\$?([A-Za-z]{1,3})\$?(\d{1,7})$/.exec(address.trim());
  if (!match || Number(match[2]) === 0) throw new PathError(`عنوان خلية غير صحيح: ${address}`);
  return { row: Number(match[2]), col: columnNumber(match[1]) };
}

function parseRange(range: string): { top: number; left: number; bottom: number; right: number } {
  const [start, end = start] = range.split(":");
  const a = parseAddress(start);
  const b = parseAddress(end);
  return {
    top: Math.min(a.row, b.row),
    left: Math.min(a.col, b.col),
    bottom: Math.max(a.row, b.row),
    right: Math.max(a.col, b.col),
  };
}

function formatDate(date: Date): string {
  const iso = date.toISOString();
  return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.slice(0, 16).replace("T", " ");
}

function formatValue(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDate(value);
  if (typeof value !== "object") return String(value);
  if ("formula" in value || "sharedFormula" in value) {
    const formula = value.formula ?? ("sharedFormula" in value ? value.sharedFormula : "");
    const result = value.result === undefined ? "" : ` → ${formatValue(value.result as ExcelJS.CellValue)}`;
    return `[=${formula}${result}]`;
  }
  if ("richText" in value) return value.richText.map((part) => part.text).join("");
  if ("hyperlink" in value) return value.text;
  if ("error" in value) return value.error;
  return "";
}

function toCellValue(input: CellInput): ExcelJS.CellValue {
  const value = input.value.trim();
  switch (input.kind) {
    case "text":
      return input.value;
    case "number": {
      const n = Number(value.replaceAll(",", ""));
      if (!value || Number.isNaN(n)) throw new PathError(`"${input.value}" مو رقم`);
      return n;
    }
    case "date": {
      const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(value);
      if (!match) throw new PathError(`"${input.value}" مو تاريخ بصيغة YYYY-MM-DD`);
      const [, y, m, d, hh = "0", mm = "0"] = match;
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm)));
    }
    case "formula":
      if (!value) throw new PathError("الصيغة فاضية");
      return { formula: value.replace(/^=/, "") };
    case "empty":
      return null;
  }
}

function setCell(ws: ExcelJS.Worksheet, row: number, col: number, value: ExcelJS.CellValue): void {
  const cell = ws.getCell(row, col);
  cell.value = value;
  // Keep a template's own date format; otherwise avoid Excel's US default (mm-dd-yy).
  if (value instanceof Date && (!cell.numFmt || cell.numFmt === "General")) cell.numFmt = "yyyy-mm-dd";
}

function checkExtension(file: string): void {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".xlsx") return;
  if (ext === ".xls") throw new PathError("صيغة .xls القديمة غير مدعومة؛ يلزم حفظ الملف بصيغة .xlsx");
  throw new PathError("هذي الأداة لملفات Excel بصيغة .xlsx فقط");
}

async function exists(file: string): Promise<boolean> {
  return access(file).then(
    () => true,
    () => false,
  );
}

/** Opens an existing workbook (following symlinks safely) or starts a new one. */
async function openWorkbook(root: string, relativePath: string): Promise<{ wb: ExcelJS.Workbook; full: string; isNew: boolean }> {
  const full = resolveInside(root, relativePath);
  checkExtension(full);
  const wb = new ExcelJS.Workbook();
  if (!(await exists(full))) return { wb, full, isNew: true };
  await wb.xlsx.readFile(await resolveExistingInside(root, relativePath));
  return { wb, full, isNew: false };
}

/** Writes atomically; an existing file is first copied to .backups/ since exceljs drops charts and pivot tables. */
async function saveWorkbook(root: string, full: string, wb: ExcelJS.Workbook, isNew: boolean): Promise<string> {
  let note = "";
  if (!isNew) {
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
    const parsed = path.parse(full);
    const backup = path.join(root, BACKUP_DIR, `${parsed.name}-${stamp}${parsed.ext}`);
    await mkdir(path.dirname(backup), { recursive: true });
    await copyFile(full, backup);
    note = `\nالنسخة الأصلية محفوظة في ${path.relative(root, backup).split(path.sep).join("/")}`;
  }
  await mkdir(path.dirname(full), { recursive: true });
  const tmp = `${full}.tmp`;
  await writeFile(tmp, Buffer.from(await wb.xlsx.writeBuffer()));
  await rename(tmp, full);
  return note;
}

export async function excelRead(root: string, relativePath: string, sheet: string, range: string): Promise<string> {
  const full = await resolveExistingInside(root, relativePath);
  checkExtension(full);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(full);

  const overview = wb.worksheets.map((ws) => `${ws.name} (${ws.actualRowCount ? ws.dimensions.range : "فاضية"})`);
  const ws = sheet ? wb.getWorksheet(sheet) : wb.worksheets[0];
  if (!ws) throw new PathError(`ما فيه ورقة باسم "${sheet}". الأوراق: ${overview.join("، ")}`);

  const header = [`الأوراق: ${overview.join("، ")}`];
  if (!ws.actualRowCount && !range) return [...header, `الورقة "${ws.name}" فاضية.`].join("\n");

  const want = range ? parseRange(range) : ws.dimensions;
  const bottom = Math.min(want.bottom, want.top + MAX_ROWS - 1);
  const right = Math.min(want.right, want.left + MAX_COLS - 1);
  const shown = `${columnLetters(want.left)}${want.top}:${columnLetters(right)}${bottom}`;
  header.push(`ورقة "${ws.name}"، النطاق ${shown}. الصيغ تظهر هكذا [=الصيغة → آخر قيمة محسوبة].`);

  const lines: string[] = [];
  for (let r = want.top; r <= bottom; r++) {
    const cells: string[] = [];
    for (let c = want.left; c <= right; c++) {
      const cell = ws.getCell(r, c);
      if (cell.isMerged && cell.master !== cell) continue;
      const text = formatValue(cell.value);
      if (text) cells.push(`${columnLetters(c)}${r}=${text}`);
    }
    if (cells.length) lines.push(cells.join(" | "));
  }
  if (bottom < want.bottom || right < want.right) {
    lines.push(`(النطاق أكبر من المعروض؛ اطلب نطاقاً آخر مثل ${columnLetters(want.left)}${bottom + 1}:${columnLetters(right)}${Math.min(want.bottom, bottom + MAX_ROWS)})`);
  }
  return [...header, ...(lines.length ? lines : ["النطاق فاضي."])].join("\n");
}

export async function excelWrite(root: string, relativePath: string, sheet: string, cells: CellWrite[]): Promise<string> {
  const values = cells.map((c) => ({ ...parseAddress(c.cell), value: toCellValue(c) }));
  const { wb, full, isNew } = await openWorkbook(root, relativePath);
  const ws = wb.getWorksheet(sheet) ?? wb.addWorksheet(sheet);
  for (const { row, col, value } of values) setCell(ws, row, col, value);
  const note = await saveWorkbook(root, full, wb, isNew);
  return `${isNew ? "أنشأت الملف و" : ""}عدّلت ${cells.length} خلية في ورقة "${ws.name}".${note}`;
}

export async function excelAppendRows(root: string, relativePath: string, sheet: string, rows: CellInput[][]): Promise<string> {
  const values = rows.map((row) => row.map(toCellValue));
  const { wb, full, isNew } = await openWorkbook(root, relativePath);
  const ws = wb.getWorksheet(sheet) ?? wb.addWorksheet(sheet);

  let last = 0;
  ws.eachRow((row, rowNumber) => {
    if (row.hasValues) last = rowNumber;
  });
  values.forEach((row, i) => row.forEach((value, j) => setCell(ws, last + 1 + i, j + 1, value)));

  const note = await saveWorkbook(root, full, wb, isNew);
  return `أضفت ${rows.length} صف في ورقة "${ws.name}" (الصفوف ${last + 1} إلى ${last + rows.length}).${note}`;
}
