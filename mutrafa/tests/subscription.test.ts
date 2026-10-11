import { test } from "node:test";
import assert from "node:assert/strict";
import { accessStateOf, canAcceptBookings, effectivePlanOf, trialEndsFrom } from "../lib/subscription";

const started = new Date("2026-10-01T00:00:00Z");
const trialEnd = trialEndsFrom(started); // 14 يوماً

test("التجربة: نشطة قبل 14 يوماً ومنتهية بعدها", () => {
  const sub = { status: "TRIALING" as const, plan: "SILVER" as const, trialEndsAt: trialEnd, currentPeriodEnd: trialEnd };
  assert.equal(accessStateOf(sub, new Date("2026-10-10T00:00:00Z")), "trial");
  assert.equal(accessStateOf(sub, new Date("2026-10-16T00:00:00Z")), "trial_expired");
  assert.equal(canAcceptBookings("trial_expired"), false);
});

test("أثناء التجربة تُطبَّق ميزات الذهبية بغض النظر عن الباقة المختارة", () => {
  const sub = { status: "TRIALING" as const, plan: "INDIE" as const, trialEndsAt: trialEnd, currentPeriodEnd: trialEnd };
  assert.equal(effectivePlanOf(sub, new Date("2026-10-05T00:00:00Z")), "GOLD");
  assert.equal(effectivePlanOf(sub, new Date("2026-10-20T00:00:00Z")), "INDIE");
});

test("الاشتراك المدفوع: نشط داخل الفترة، ومتأخر بعد انتهائها", () => {
  const periodEnd = new Date("2026-11-01T00:00:00Z");
  const sub = { status: "ACTIVE" as const, plan: "GOLD" as const, trialEndsAt: null, currentPeriodEnd: periodEnd };
  assert.equal(accessStateOf(sub, new Date("2026-10-15T00:00:00Z")), "active");
  assert.equal(accessStateOf(sub, new Date("2026-11-03T00:00:00Z")), "past_due");
  assert.equal(canAcceptBookings("past_due"), true, "المتأخر يبقى مفتوحاً مع تنبيه");
});

test("الموقوف والملغى لا يقبلان حجوزات", () => {
  const base = { plan: "GOLD" as const, trialEndsAt: null, currentPeriodEnd: new Date("2099-01-01") };
  assert.equal(canAcceptBookings(accessStateOf({ ...base, status: "SUSPENDED" }, new Date())), false);
  assert.equal(canAcceptBookings(accessStateOf({ ...base, status: "CANCELED" }, new Date())), false);
});
