import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDayTimeline, type TimelineBooking } from "../lib/timeline";
import { zonedToUtc } from "../lib/time";

const TZ = "Asia/Riyadh";
const hours = { start: "09:00", end: "12:00", days: [0, 1, 2, 3, 4, 5, 6] };

test("الجدول: شبكة كل ربع ساعة، والحجز يظهر عند بدايته ويغطي خاناته التالية", () => {
  const booking: TimelineBooking = {
    id: "a1",
    code: "MT-AAAAAA",
    customerName: "سارة",
    customerPhone: "966512345678",
    serviceName: "صبغة",
    status: "CONFIRMED",
    start: zonedToUtc(2026, 11, 1, 10, 0, TZ),
    end: zonedToUtc(2026, 11, 1, 11, 0, TZ),
  };
  const rows = buildDayTimeline({
    dayKey: "2026-11-01",
    timeZone: TZ,
    hours,
    bookings: [booking],
    now: new Date("2026-10-01T00:00:00Z"),
  });
  assert.deepEqual(
    rows.map((r) => r.label),
    ["09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45"]
  );
  assert.equal(rows[4].status, "booked");
  assert.equal(rows[4].booking?.code, "MT-AAAAAA");
  assert.equal(rows[5].continued, true);
  assert.equal(rows[5].booking, undefined);
  assert.equal(rows[8].status, "free", "11:00 بعد انتهاء الحجز متاح");
});

test("الخانات الماضية لا تُعرض كمتاحة", () => {
  const rows = buildDayTimeline({
    dayKey: "2026-11-01",
    timeZone: TZ,
    hours,
    bookings: [],
    now: zonedToUtc(2026, 11, 1, 9, 30, TZ),
  });
  assert.equal(rows[0].status, "past");
  assert.equal(rows[2].status, "past");
  assert.equal(rows[3].status, "free");
});

test("يوم إجازة لا يعيد خانات", () => {
  const rows = buildDayTimeline({
    dayKey: "2026-11-01",
    timeZone: TZ,
    hours: { start: "09:00", end: "12:00", days: [1] },
    bookings: [],
    now: new Date("2026-10-01T00:00:00Z"),
  });
  assert.equal(rows.length, 0);
});
