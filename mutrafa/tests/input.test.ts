import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSaPhone, displayPhone } from "../lib/phone";
import { halalasFromSar, formatSar } from "../lib/money";
import { isFreeCancellation, effectiveCancellationHours } from "../lib/cancellation";
import { entitlementsFor } from "../lib/plans";
import { generateBookingCode, isBookingCode } from "../lib/booking-code";

test("أرقام الجوال: 9 أرقام تبدأ بـ 5 بعد +966، والصيغ الملصوقة مقبولة", () => {
  assert.equal(normalizeSaPhone("512345678"), "966512345678", "الإدخال الرسمي");
  assert.equal(normalizeSaPhone("0512345678"), "966512345678");
  assert.equal(normalizeSaPhone("+966 51 234 5678"), "966512345678");
  assert.equal(normalizeSaPhone("966512345678"), "966512345678");
  assert.equal(normalizeSaPhone("412345678"), null, "يجب أن يبدأ بالرقم 5");
  assert.equal(normalizeSaPhone("51234567"), null, "أقل من 9 أرقام غير صالح");
  assert.equal(normalizeSaPhone("5123456789"), null, "أكثر من 9 أرقام غير صالح");
  assert.equal(displayPhone("966512345678"), "0512345678");
});

test("المبالغ بالهللة بدقة: 199.5 ريال = 19950 هللة", () => {
  assert.equal(halalasFromSar("199.5"), 19950);
  assert.equal(halalasFromSar(0.1 + 0.2), 30, "لا أخطاء الفاصلة العشرية");
  assert.throws(() => halalasFromSar(-1));
  assert.equal(formatSar(19900), "199 ر.س");
  assert.equal(formatSar(19950), "199.50 ر.س");
});

test("سياسة الإلغاء: مجاني قبل المهلة فقط", () => {
  const startsAt = new Date("2026-11-02T10:00:00Z");
  assert.equal(isFreeCancellation(startsAt, new Date("2026-11-01T10:00:00Z"), 24), true, "بالضبط 24 ساعة مجاني");
  assert.equal(isFreeCancellation(startsAt, new Date("2026-11-01T10:01:00Z"), 24), false);
});

test("السياسة الخاصة بالخدمة تُطبَّق فقط مع ميزة الذهبية", () => {
  assert.equal(effectiveCancellationHours(24, 48, entitlementsFor("GOLD")), 48);
  assert.equal(effectiveCancellationHours(24, 48, entitlementsFor("SILVER")), 24);
  assert.equal(effectiveCancellationHours(24, null, entitlementsFor("GOLD")), 24);
});

test("رقم الحجز: بصيغة MT-XXXXXX بلا أحرف ملتبسة", () => {
  for (let i = 0; i < 200; i++) {
    const code = generateBookingCode();
    assert.ok(isBookingCode(code), code);
    assert.doesNotMatch(code, /[01IO]/);
  }
  assert.equal(isBookingCode("MT-0OIL11"), false);
});
