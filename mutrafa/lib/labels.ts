/** تسميات عربية للحالات — مكان واحد لكل الواجهات */

export const APPOINTMENT_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING_DEPOSIT: { label: "بانتظار العربون", tone: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "مؤكد", tone: "bg-emerald-100 text-emerald-800" },
  COMPLETED: { label: "مكتمل", tone: "bg-sky-100 text-sky-800" },
  NO_SHOW: { label: "لم تحضر", tone: "bg-rose-100 text-rose-800" },
  CANCELLED: { label: "ملغى", tone: "bg-zinc-200 text-zinc-700" },
  EXPIRED: { label: "انتهت المهلة", tone: "bg-zinc-100 text-zinc-500" },
};

export const ACCESS_LABEL: Record<string, { label: string; tone: string }> = {
  trial: { label: "فترة تجريبية", tone: "bg-gold-soft text-gold" },
  active: { label: "نشط", tone: "bg-emerald-100 text-emerald-800" },
  past_due: { label: "متأخر السداد", tone: "bg-amber-100 text-amber-800" },
  trial_expired: { label: "انتهت التجربة", tone: "bg-rose-100 text-rose-800" },
  suspended: { label: "موقوف", tone: "bg-rose-100 text-rose-800" },
  canceled: { label: "ملغى", tone: "bg-zinc-200 text-zinc-700" },
};

export const SOURCE_LABEL: Record<string, string> = {
  LINK: "صفحة الحجز",
  WHATSAPP: "واتساب",
  DASHBOARD: "لوحة التحكم",
};

export const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export const ROLE_LABEL_SHORT: Record<string, string> = {
  OWNER: "مالكة",
  MANAGER: "مشرفة",
  RECEPTIONIST: "استقبال",
};
