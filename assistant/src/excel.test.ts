import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { columnLetters, columnNumber, excelAppendRows, excelRead, excelWrite } from "./excel.js";

const tempRoot = () => mkdtemp(path.join(tmpdir(), "assistant-excel-"));

test("column letters round-trip", () => {
  for (const [n, letters] of [[1, "A"], [26, "Z"], [27, "AA"], [52, "AZ"], [703, "AAA"]] as const) {
    assert.equal(columnLetters(n), letters);
    assert.equal(columnNumber(letters), n);
  }
});

test("excelWrite creates a workbook that Excel can read back, with typed values and formulas", async () => {
  const root = await tempRoot();
  const result = await excelWrite(root, "حسابات/2026.xlsx", "المصروفات", [
    { cell: "A1", value: "التاريخ", kind: "text" },
    { cell: "B1", value: "البيان", kind: "text" },
    { cell: "C1", value: "المبلغ", kind: "text" },
    { cell: "A2", value: "2026-10-01", kind: "date" },
    { cell: "B2", value: "إيجار", kind: "text" },
    { cell: "C2", value: "1,500.50", kind: "number" },
    { cell: "C3", value: "=SUM(C2:C2)", kind: "formula" },
  ]);
  assert.match(result, /^أنشأت الملف وعدّلت 7 خلية في ورقة "المصروفات"\.$/);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(root, "حسابات/2026.xlsx"));
  const ws = wb.getWorksheet("المصروفات")!;
  assert.equal(ws.getCell("C2").value, 1500.5);
  assert.ok(ws.getCell("A2").value instanceof Date);
  assert.deepEqual(ws.getCell("C3").value, { formula: "SUM(C2:C2)" });

  const read = await excelRead(root, "حسابات/2026.xlsx", "", "");
  assert.match(read, /الأوراق: المصروفات \(A1:C3\)/);
  assert.match(read, /A2=2026-10-01 \| B2=إيجار \| C2=1500\.5/);
  assert.match(read, /C3=\[=SUM\(C2:C2\)\]/);
});

test("bad input is rejected before anything is written", async () => {
  const root = await tempRoot();
  await assert.rejects(excelWrite(root, "a.xlsx", "S", [{ cell: "A1", value: "ألف", kind: "number" }]), /مو رقم/);
  await assert.rejects(excelWrite(root, "a.xlsx", "S", [{ cell: "1A", value: "x", kind: "text" }]), /عنوان خلية/);
  await assert.rejects(excelWrite(root, "a.xlsx", "S", [{ cell: "A1", value: "10/10/2026", kind: "date" }]), /YYYY-MM-DD/);
  assert.deepEqual(await readdir(root), []);
  await assert.rejects(excelWrite(root, "../a.xlsx", "S", []), /خارج المجلد/);
  await assert.rejects(excelWrite(root, "old.xls", "S", []), /\.xls القديمة/);
});

test("excelAppendRows adds after the last filled row and backs up the original", async () => {
  const root = await tempRoot();
  await excelWrite(root, "دفتر.xlsx", "قيود", [
    { cell: "A1", value: "البيان", kind: "text" },
    { cell: "B1", value: "مدين", kind: "text" },
    { cell: "A2", value: "رصيد افتتاحي", kind: "text" },
    { cell: "B2", value: "10000", kind: "number" },
  ]);
  const result = await excelAppendRows(root, "دفتر.xlsx", "قيود", [
    [
      { value: "شراء أثاث", kind: "text" },
      { value: "2500", kind: "number" },
    ],
    [
      { value: "الإجمالي", kind: "text" },
      { value: "=SUM(B2:B3)", kind: "formula" },
    ],
  ]);
  assert.match(result, /الصفوف 3 إلى 4/);
  assert.match(result, /النسخة الأصلية محفوظة في \.backups\/دفتر-.*\.xlsx/);
  assert.equal((await readdir(path.join(root, ".backups"))).length, 1);

  const read = await excelRead(root, "دفتر.xlsx", "قيود", "A3:B4");
  assert.match(read, /A3=شراء أثاث \| B3=2500/);
  assert.match(read, /A4=الإجمالي \| B4=\[=SUM\(B2:B3\)\]/);
});

test("excelRead shows formula results from Excel, skips merged duplicates, and pages large sheets", async () => {
  const root = await tempRoot();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("بيانات");
  ws.getCell("A1").value = "عنوان مدموج";
  ws.mergeCells("A1:C1");
  ws.getCell("A2").value = { formula: "1+1", result: 2 };
  for (let r = 3; r <= 400; r++) ws.getCell(r, 1).value = r;
  await writeFile(path.join(root, "كبير.xlsx"), Buffer.from(await wb.xlsx.writeBuffer()));

  const read = await excelRead(root, "كبير.xlsx", "بيانات", "");
  assert.match(read, /^A1=عنوان مدموج$/m);
  assert.match(read, /A2=\[=1\+1 → 2\]/);
  assert.match(read, /النطاق أكبر من المعروض؛ اطلب نطاقاً آخر مثل A301:C400/);
  await assert.rejects(excelRead(root, "كبير.xlsx", "مو موجودة", ""), /ما فيه ورقة باسم "مو موجودة"\. الأوراق: بيانات/);
});
