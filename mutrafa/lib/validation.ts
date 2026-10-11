import { z } from "zod";
import { isValidSaPhone } from "./phone";
import { isSlugAvailableFormat } from "./reserved";
import { PLAN_CODES } from "./plans";

/** حقل نصي عربي/لاتيني مع حدود الطول */
const text = (min: number, max: number, label: string) =>
  z
    .string({ message: `يرجى إدخال ${label}` })
    .trim()
    .min(min, `${label}: ${min} أحرف على الأقل`)
    .max(max, `${label}: ${max} حرفاً كحد أقصى`);

const phone = z.string().refine(isValidSaPhone, "رقم الجوال غير صالح. اكتبي 9 أرقام تبدأ بـ 5 بعد رمز الدولة +966.");

export const signupSchema = z
  .object({
    salonName: text(2, 80, "اسم الصالون"),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .refine(isSlugAvailableFormat, "اسم الرابط: أحرف إنجليزية صغيرة وأرقام وشرطة، من 3 إلى 30، وغير محجوز"),
    whatsapp: phone,
    ownerName: text(2, 60, "اسمك"),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صالح"),
    password: z.string().min(8, "كلمة المرور: 8 أحرف على الأقل"),
    plan: z.enum(PLAN_CODES, { message: "باقة غير معروفة" }),
    terms: z.literal("on", { message: "يجب الموافقة على الشروط وسياسة الخصوصية" }),
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "يرجى إدخال كلمة المرور"),
});

export const publicBookingSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1, "يرجى اختيار الخدمة"),
  calendarId: z.string().min(1, "يرجى اختيار الموظفة"),
  startsAtIso: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "يرجى اختيار وقت"),
  name: text(2, 60, "الاسم"),
  phone,
  policy: z.literal("on", { message: "يرجى الاطلاع على سياسة الصالون والموافقة عليها" }),
});

export const serviceSchema = z.object({
  name: text(2, 60, "اسم الخدمة"),
  durationMinutes: z.coerce.number().int().min(15, "المدة 15 دقيقة على الأقل").max(480, "المدة 8 ساعات كحد أقصى"),
  priceSar: z.coerce.number().min(0, "السعر لا يكون سالباً").max(100000),
  depositSar: z.coerce.number().min(0).max(100000),
});

export const teamInviteSchema = z.object({
  name: text(2, 60, "الاسم"),
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور: 8 أحرف على الأقل"),
  role: z.enum(["OWNER", "MANAGER", "RECEPTIONIST"]),
});

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "بيانات غير صالحة";
}
