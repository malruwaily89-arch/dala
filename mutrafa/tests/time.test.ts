import { test } from "node:test";
import assert from "node:assert/strict";
import { formatLocalTime, localDayBounds, localDayKey, localMonthBounds, zonedToUtc } from "../lib/time";
import { computeAvailableSlots, parseWorkingHours, DEFAULT_WORKING_HOURS } from "../lib/availability";

const TZ = "Asia/Riyadh"; // UTC+3 بلا تغيير صيفي

test("الساعة 10:00 بتوقيت الرياض = 07:00 UTC", () => {
  assert.equal(zonedToUtc(2026, 11, 1, 10, 0, TZ).toISOString(), "2026-11-01T07:00:00.000Z");
});

test("يوم محلي يبدأ 00:00 محلياً وينتهي عند 00:00 من اليوم التالي", () => {
  const { start, end } = localDayBounds("2026-11-01", TZ);
  assert.equal(start.toISOString(), "2026-10-31T21:00:00.000Z");
  assert.equal(end.toISOString(), "2026-11-01T21:00:00.000Z");
});

test("منتصف الليل UTC قد يقع في يوم محلي مختلف", () => {
  // 23:30 UTC يوم 31 أكتوبر = 02:30 محلياً يوم 1 نوفمبر
  assert.equal(localDayKey(new Date("2026-10-31T23:30:00Z"), TZ), "2026-11-01");
  assert.equal(formatLocalTime(new Date("2026-10-31T23:30:00Z"), TZ), "02:30");
});

test("حدود الشهر المحلي", () => {
  const { start, end } = localMonthBounds(new Date("2026-10-15T12:00:00Z"), TZ);
  assert.equal(start.toISOString(), "2026-09-30T21:00:00.000Z");
  assert.equal(end.toISOString(), "2026-10-31T21:00:00.000Z");
});

test("المواعيد المتاحة: تستثني المشغول والماضي وتحترم ساعات العمل", () => {
  const busy = [{ start: zonedToUtc(2026, 11, 1, 10, 0, TZ), end: zonedToUtc(2026, 11, 1, 11, 0, TZ) }];
  const slots = computeAvailableSlots({
    dayKey: "2026-11-01",
    timeZone: TZ,
    hours: { start: "09:00", end: "12:00", days: [0, 1, 2, 3, 4, 5, 6] },
    durationMinutes: 60,
    busy,
    now: new Date("2026-10-01T00:00:00Z"),
  });
  const labels = slots.map((s) => formatLocalTime(s, TZ));
  // 09:00 يتقاطع مع 10:00؟ لا (ينتهي 10:00 بالضبط) — متاح. 09:30 ينتهي 10:30 يتقاطع.
  assert.deepEqual(labels, ["09:00", "11:00"]);
});

test("الموعد الذي ينتهي بعد ساعات العمل لا يُعرض", () => {
  const slots = computeAvailableSlots({
    dayKey: "2026-11-01",
    timeZone: TZ,
    hours: { start: "09:00", end: "10:00", days: [0, 1, 2, 3, 4, 5, 6] },
    durationMinutes: 60,
    busy: [],
    now: new Date("2026-10-01T00:00:00Z"),
  });
  assert.deepEqual(slots.map((s) => formatLocalTime(s, TZ)), ["09:00"]);
});

test("يوم خارج أيام العمل لا يعيد مواعيد", () => {
  const slots = computeAvailableSlots({
    dayKey: "2026-11-01", // 2026-11-01 يوم الأحد
    timeZone: TZ,
    hours: { start: "09:00", end: "21:00", days: [1, 2, 3] },
    durationMinutes: 60,
    busy: [],
    now: new Date("2026-10-01T00:00:00Z"),
  });
  assert.equal(slots.length, 0);
});

test("ساعات العمل المعطوبة تعود للافتراضي", () => {
  assert.deepEqual(parseWorkingHours("not json"), DEFAULT_WORKING_HOURS);
  assert.deepEqual(parseWorkingHours({ start: "25:00", end: "21:00", days: [1] }), DEFAULT_WORKING_HOURS);
  assert.deepEqual(parseWorkingHours({ start: "10:00", end: "18:00", days: [1, 1, 2] }), {
    start: "10:00",
    end: "18:00",
    days: [1, 2],
  });
});
