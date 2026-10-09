import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSaPhone, displayPhone } from "../lib/phone";
import { halalasFromSar, formatSar } from "../lib/money";
import { isFreeCancellation, effectiveCancellationHours } from "../lib/cancellation";
import { entitlementsFor } from "../lib/plans";
import { generateBookingCode, isBookingCode } from "../lib/booking-code";

test("أرقام الجوال: تقبل الصيغ السعودية وتوحّدها على 9665XXXXXXXX", () => {
  assert.equal(normalizeSaPhone("0512345678"), "966512345678");
  assert.equal(normalizeSaPhone("+966 51 234 5678"), "966512345678");
  assert.equal(normalizeSaPhone("966512345678"), "966512345678");
  assert.equal(normalizeSaPhone("0412345678"), null, "يجب أن يبدأ بـ 05");
  assert.equal(normalizeSaPhone("051234567"), null, "9 أرقام فقط غير صالح");
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
