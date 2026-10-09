/**
 * اختبار دخان في المتصفح الحقيقي — يتطلب:
 *   1) تشغيل الخادم: npm run build && npm start   (على http://localhost:3100 أو BASE_URL)
 *   2) بيانات تجريبية: npm run db:seed
 *   3) تشغيل: npm run test:e2e
 *  CHROME_PATH اختياري (مسار Chromium إن لم يكن Playwright قد ثبّته).
 *  يحتاج playwright-core: npm i -D playwright-core
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS_DIR ?? "/tmp";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function newPage(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ locale: "ar-SA", viewport, timezoneId: "Asia/Riyadh" });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  return { ctx, page };
}

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Test1234!");
  await Promise.all([page.waitForURL(/\/dashboard/), page.click('button:has-text("دخول")')]);
}

// ─── 1) رحلة العميلة: حجز مع عربون ───────────────────────────
{
  const { ctx, page } = await newPage({ width: 390, height: 844 }); // جوال
  await page.goto(`${BASE}/lumina`);
  check("صفحة الصالون تعرض اسم الصالون", (await page.textContent("h1")).includes("صالون لومينا"));

  await page.click('button:has-text("قص وتصفيف")');
  await page.locator('h2:has-text("اختاري الموظفة")').waitFor();
  await page.locator('section:has(h2:has-text("اختاري الموظفة")) button').first().click();
  // نختار أول يوم فيه مواعيد متاحة (اليوم قد يكون انتهى دوامه)
  const dayChips = page.locator('section:has(h2:has-text("اختاري اليوم")) button');
  await dayChips.first().waitFor();
  const dayCount = await dayChips.count();
  let slotLabel = null;
  for (let i = 0; i < dayCount && !slotLabel; i++) {
    await page.locator('section:has(h2:has-text("اختاري اليوم")) button').nth(i).click();
    await page.locator('h2:has-text("اختاري الوقت")').waitFor();
    await page.waitForTimeout(600);
    const slots = page.locator('section:has(h2:has-text("اختاري الوقت")) button:not(:has-text("السابق"))');
    if ((await slots.count()) > 0) {
      slotLabel = (await slots.first().textContent())?.trim();
      await slots.first().click();
    } else {
      await page.locator('section:has(h2:has-text("اختاري الوقت")) button:has-text("السابق")').click();
      await page.locator('h2:has-text("اختاري اليوم")').waitFor();
    }
  }
  check("يوجد موعد متاح في الأيام القادمة", !!slotLabel, slotLabel ?? "");

  await page.fill('input[name="name"]', "عميلة تجريبية");
  await page.fill('input[name="phone"]', "0512345678");
  await page.check('input[name="policy"]');
  await page.screenshot({ path: `${SHOTS}/01-booking-details-mobile.png`, fullPage: true });
  await Promise.all([page.waitForURL(/sandbox\/pay/), page.click('button[type="submit"]:has-text("متابعة إلى الدفع")')]);
  check("بعد الحجز بعربون تُحوَّل إلى صفحة الدفع", page.url().includes("/sandbox/pay/"), slotLabel);

  await page.screenshot({ path: `${SHOTS}/02-sandbox-pay-mobile.png`, fullPage: true });
  await Promise.all([page.waitForURL(/booking\/MT-/), page.click('button[name="outcome"][value="paid"]')]);
  const body = await page.textContent("body");
  check("بعد الدفع يتأكد الحجز وتظهر رسالة النجاح", body.includes("تم استلام العربون"));
  check("الصفحة تعرض حالة الحجز مؤكد", body.includes("مؤكد"));
  await page.screenshot({ path: `${SHOTS}/03-booking-confirmed-mobile.png`, fullPage: true });
  await ctx.close();
}

// ─── 2) تسجيل صالون جديد بباقة الفضية ─────────────────────────
{
  const { ctx, page } = await newPage();
  const stamp = Date.now().toString(36);
  await page.goto(`${BASE}/signup?plan=SILVER`);
  await page.fill('input[name="salonName"]', "صالون اختبار جديد");
  await page.fill('input[name="slug"]', `new-${stamp}`);
  await page.fill('input[name="whatsapp"]', "0500001234");
  await page.fill('input[name="ownerName"]', "مالكة جديدة");
  await page.fill('input[name="email"]', `owner-${stamp}@test.sa`);
  await page.fill('input[name="password"]', "Secret123!");
  await page.check('input[name="terms"]');
  await Promise.all([page.waitForURL(/dashboard\?welcome=1/), page.click('button:has-text("أدخلي إلى لوحتك")')]);
  check("التسجيل ينشئ صالوناً ويدخل إلى اللوحة", page.url().includes("welcome=1"));
  const trialBanner = await page.textContent("main");
  check("تظهر رسالة التجربة المجانية (14 يوماً)", trialBanner.includes("فترة تجريبية") || trialBanner.includes("التجريبية"));
  await ctx.close();
}

// ─── 3) حدود الباقات في الواجهة ─────────────────────────────
{
  const { ctx, page } = await newPage();
  await login(page, "indie@demo.mutrafa.sa");
  let nav = await page.textContent("aside");
  check("المستقلة: لا ترى قائمة الانتظار في القائمة", !nav.includes("قائمة الانتظار"));
  await page.goto(`${BASE}/dashboard/waitlist`);
  check("المستقلة: صفحة قائمة الانتظار تعرض بطاقة الترقية", (await page.textContent("main")).includes("رقّي باقتك"));
  await page.goto(`${BASE}/dashboard/calendars`);
  check("المستقلة: بلوغ حد التقويم معروض بوضوح", (await page.textContent("main")).includes("بلغتِ الحد الأقصى للتقويمات"));
  await page.goto(`${BASE}/dashboard/team`);
  check("المستقلة: بلوغ حد حسابات الإدارة معروض", (await page.textContent("main")).includes("بلغتِ حد حسابات الإدارة"));
  await page.screenshot({ path: `${SHOTS}/04-dashboard-indie-team.png`, fullPage: false });
  await ctx.close();
}
{
  const { ctx, page } = await newPage();
  await login(page, "gold@demo.mutrafa.sa");
  await page.goto(`${BASE}/dashboard/audit`);
  check("الذهبية: سجل التدقيق مقفل (بطاقة ترقية للألماسية)", (await page.textContent("main")).includes("سجل التدقيق") && (await page.textContent("main")).includes("الألماسية"));
  await page.goto(`${BASE}/dashboard/reports`);
  const rep = await page.textContent("main");
  check("الذهبية: جدول العمولات ظاهر", rep.includes("مستحق العمولة"));
  check("الذهبية: تقرير الشهر يعرض الإيراد والعربون", rep.includes("عربون محصّل") && rep.includes("إيراد الخدمات المكتملة"));
  await page.goto(`${BASE}/dashboard`);
  await page.screenshot({ path: `${SHOTS}/05-dashboard-gold-today.png`, fullPage: false });
  check("الذهبية: لوحة اليوم تعرض الإشغال", (await page.textContent("main")).includes("الإشغال"));
  await ctx.close();
}
{
  const { ctx, page } = await newPage();
  await login(page, "silver@demo.mutrafa.sa");
  await page.goto(`${BASE}/dashboard/reports`);
  check("الفضية: العمولات مقفلة (بطاقة الترقية)", (await page.textContent("main")).includes("العمولات متاحة") || (await page.textContent("main")).includes("حساب العمولات"));
  await page.goto(`${BASE}/dashboard/services`);
  check("الفضية: لا حقل مهلة إلغاء لكل خدمة", !(await page.textContent("main")).includes("مهلة الإلغاء المجاني (ساعات)"));
  await ctx.close();
}
{
  const { ctx, page } = await newPage();
  await login(page, "diamond@demo.mutrafa.sa");
  await page.goto(`${BASE}/dashboard/audit`);
  const audit = await page.textContent("main");
  check("الألماسية: سجل التدقيق يعرض سجلات حقيقية", audit.includes("appointment") || audit.includes("salon"));
  await page.goto(`${BASE}/dashboard/services`);
  check("الألماسية: حقل مهلة الإلغاء لكل خدمة متاح", (await page.textContent("main")).includes("مهلة الإلغاء المجاني (ساعات)"));
  await ctx.close();
}
{
  const { ctx, page } = await newPage();
  await login(page, "trial@demo.mutrafa.sa");
  check("التجربة: الشريط يعرض عدد الأيام المتبقية", (await page.textContent("main")).includes("متبقٍ"));
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
