import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANS, PLAN_CODES, entitlementsFor, hasFeature, minimumPlanFor, type Feature } from "../lib/plans";

test("كل باقة أعلى تتضمن كل ميزات الباقة الأدنى (تراكمية)", () => {
  for (let i = 1; i < PLAN_CODES.length; i++) {
    const lower = PLANS[PLAN_CODES[i - 1]].features;
    const upper = new Set(PLANS[PLAN_CODES[i]].features);
    for (const f of lower) assert.ok(upper.has(f), `${PLAN_CODES[i]} يجب أن تتضمن ${f}`);
  }
});

test("حدود الباقات مطابقة للموقع: المستقلة 1/120/1، الفضية 5/400/2، الذهبية 20/1200/4، الألماسية 50/2500/8", () => {
  assert.deepEqual(
    [PLANS.INDIE.calendars, PLANS.INDIE.monthlyBookings, PLANS.INDIE.admins],
    [1, 120, 1]
  );
  assert.deepEqual([PLANS.SILVER.calendars, PLANS.SILVER.monthlyBookings, PLANS.SILVER.admins], [5, 400, 2]);
  assert.deepEqual([PLANS.GOLD.calendars, PLANS.GOLD.monthlyBookings, PLANS.GOLD.admins], [20, 1200, 4]);
  assert.deepEqual(
    [PLANS.DIAMOND.calendars, PLANS.DIAMOND.monthlyBookings, PLANS.DIAMOND.admins],
    [50, 2500, 8]
  );
});

test("أسعار التأسيس والعادية مطابقة للموقع", () => {
  assert.deepEqual(
    PLAN_CODES.map((c) => [PLANS[c].priceSar, PLANS[c].regularPriceSar]),
    [
      [199, 299],
      [299, 399],
      [499, 599],
      [999, 1099],
    ]
  );
});

test("الميزات حسب الباقة: الانتظار اليدوي من الفضية، التلقائي والعمولة والأدوار من الذهبية، السجل من الألماسية", () => {
  const ent = (c: (typeof PLAN_CODES)[number]) => entitlementsFor(c);
  assert.equal(hasFeature(ent("INDIE"), "waitlist.manual"), false);
  assert.equal(hasFeature(ent("SILVER"), "waitlist.manual"), true);
  assert.equal(hasFeature(ent("SILVER"), "waitlist.auto"), false);
  assert.equal(hasFeature(ent("GOLD"), "waitlist.auto"), true);
  assert.equal(hasFeature(ent("GOLD"), "commission"), true);
  assert.equal(hasFeature(ent("GOLD"), "roles"), true);
  assert.equal(hasFeature(ent("GOLD"), "audit.view"), false);
  assert.equal(hasFeature(ent("DIAMOND"), "audit.view"), true);
});

test("الإضافات تضاف فوق حدود الباقة", () => {
  const ent = entitlementsFor("SILVER", [
    { kind: "EXTRA_CALENDAR", quantity: 2 },
    { kind: "EXTRA_BOOKINGS_100", quantity: 1 },
    { kind: "EXTRA_BOOKINGS_500", quantity: 1 },
  ]);
  assert.equal(ent.calendars, 5 + 2);
  assert.equal(ent.monthlyBookings, 400 + 100 + 500);
  assert.equal(ent.admins, 2, "الإضافات لا تزيد حسابات الإدارة");
});

test("أقل باقة تتضمن ميزة معينة", () => {
  const cases: [Feature, string][] = [
    ["waitlist.manual", "SILVER"],
    ["waitlist.auto", "GOLD"],
    ["audit.view", "DIAMOND"],
  ];
  for (const [feature, plan] of cases) assert.equal(minimumPlanFor(feature), plan);
});
