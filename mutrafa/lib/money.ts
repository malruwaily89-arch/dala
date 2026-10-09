/** كل المبالغ في قاعدة البيانات بالهللة (Int). هذه الدوال تحوّل بين الهللة والريال بأمان. */

export function halalasFromSar(sar: number | string): number {
  const value = typeof sar === "string" ? Number(sar.replace(",", ".")) : sar;
  if (!Number.isFinite(value) || value < 0) throw new Error("مبلغ غير صالح");
  return Math.round(value * 100);
}

export function sarFromHalalas(halalas: number): number {
  return halalas / 100;
}

export function formatSar(halalas: number): string {
  const sar = halalas / 100;
  const formatted = Number.isInteger(sar) ? sar.toLocaleString("en-US") : sar.toFixed(2);
  return `${formatted} ر.س`;
}
