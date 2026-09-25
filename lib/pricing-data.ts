export type Package = {
  name: string;
  nameEn?: string;
  price: number;
  yearly: number;
  tagline: string;
  taglineEn?: string;
  popular?: boolean;
  pro?: boolean;
  features: string[];
  featuresEn?: string[];
};

export const REGULAR_PACKAGES: Package[] = [
  {
    name: "الأساسية",
    nameEn: "Starter",
    price: 199,
    yearly: 1990,
    tagline: "للصالون المنزلي",
    taglineEn: "For home-based salons",
    popular: false,
    features: [
      "حتى موظفتان",
      "صفحة حجز عامة باسم صالونك",
      "دورة عربون كاملة (تمنع الغائبات)",
      "منع تعارض المواعيد تلقائياً",
      "تأكيدات واتساب",
      "سجل عميلات وعداد غيابات",
    ],
    featuresEn: [
      "Up to two staff members",
      "Public booking page with your salon's name",
      "Full deposit flow (stops no-shows)",
      "Automatic double-booking prevention",
      "WhatsApp confirmations",
      "Client records and no-show counter",
    ],
  },
  {
    name: "النمو",
    nameEn: "Growth",
    price: 449,
    yearly: 4490,
    tagline: "للصالون المتوسط",
    taglineEn: "For growing salons",
    popular: true,
    features: [
      "موظفات بلا حد",
      "كل ميزات الأساسية",
      "تذكير آلي قبل الموعد بـ 24 ساعة",
      "قائمة انتظار ذكية (كل إلغاء يتحرر فوراً)",
      "تقارير أسبوعية (إيراد، حضور، وفاء)",
      "عربون مختلف لكل خدمة",
    ],
    featuresEn: [
      "Unlimited staff members",
      "Everything in Starter",
      "Automated reminder 24 hours before appointment",
      "Smart waitlist (every cancellation opens instantly)",
      "Weekly reports (revenue, attendance, loyalty)",
      "Different deposit per service",
    ],
  },
  {
    name: "الاحترافية",
    nameEn: "Pro",
    price: 999,
    yearly: 9990,
    tagline: "للصالون الكبير والواقع ذو الحركة الكثيفة",
    taglineEn: "For large, high-traffic salons",
    popular: false,
    features: [
      "كل ميزات النمو",
      "تقارير متقدمة ونسب إشغال",
      "صلاحيات متعددة (مشرفات، موظفات)",
      "بوابة دفع إلكتروني كاملة",
      "أولوية دعم",
      "إعداد ومساعدة ترحيل",
    ],
    featuresEn: [
      "Everything in Growth",
      "Advanced reports and occupancy rates",
      "Multiple permission levels (supervisors, staff)",
      "Full online payment gateway",
      "Priority support",
      "Setup and migration assistance",
    ],
  },
];

export const PRO_PACKAGES: Package[] = [
  {
    name: "الأساسية برو",
    nameEn: "Starter Pro",
    price: 299,
    yearly: 2990,
    tagline: "كل ميزات الأساسية + تقارير وتقييمات متقدمة",
    taglineEn: "Everything in Starter + advanced reports and ratings",
    pro: true,
    features: [
      "كل ميزات الأساسية العادية",
      "تقرير شهري مفصّل (إيراد، حضور، غياب)",
      "تقييم العميلات بعد كل خدمة (5 نجوم)",
      "إحصائية أكثر الخدمات طلباً",
      "تنبيه تلقائي عند ارتفاع نسبة الإلغاء",
    ],
    featuresEn: [
      "Everything in regular Starter",
      "Detailed monthly report (revenue, attendance, absence)",
      "Client ratings after every service (5 stars)",
      "Most-requested services statistics",
      "Automatic alert when cancellation rate rises",
    ],
  },
  {
    name: "النمو برو",
    nameEn: "Growth Pro",
    price: 599,
    yearly: 5990,
    tagline: "كل ميزات النمو + تقارير وتقييمات متقدمة",
    taglineEn: "Everything in Growth + advanced reports and ratings",
    popular: true,
    pro: true,
    features: [
      "كل ميزات الأساسية برو",
      "مقارنة أداء شهر بشهر (نسب التغيّر %)",
      "تحليل ذروة الأيام والساعات (أكثر الأوقات ازدحاماً)",
      "تقييم أداء كل موظفة على حدة + بانر \"أعلى تقييماً\"",
      "معدل تحصيل العربون ونسبة عدم الحضور",
      "تقرير أسبوعي تلقائي على واتساب",
    ],
    featuresEn: [
      "Everything in Starter Pro",
      "Month-over-month performance comparison (% change)",
      "Peak days/hours analysis (busiest times)",
      "Per-staff performance rating + \"Top rated\" banner",
      "Deposit collection rate and no-show rate",
      "Automatic weekly report on WhatsApp",
    ],
  },
  {
    name: "الاحترافية برو",
    nameEn: "Pro Plus",
    price: 1299,
    yearly: 12990,
    tagline: "كل ميزات الاحترافية + تقارير وتقييمات متقدمة",
    taglineEn: "Everything in Pro + advanced reports and ratings",
    pro: true,
    features: [
      "كل ميزات النمو برو",
      "لوحة تحكم لحظية (إيرادات اليوم، حجوزات الساعة)",
      "تقارير مقارنة بين الفروع (متعدد الفروع)",
      "تحليل ربحية كل خدمة (تكلفة vs إيراد)",
      "بانر \"يحتاج تحسين\" للموظفات + خطط تطوير مقترحة",
      "مدير حساب مخصص + أولوية دعم واتساب",
      "تصدير التقارير PDF/Excel",
    ],
    featuresEn: [
      "Everything in Growth Pro",
      "Real-time dashboard (today's revenue, hourly bookings)",
      "Cross-branch comparison reports (multi-branch)",
      "Per-service profitability analysis (cost vs revenue)",
      "\"Needs improvement\" staff banner + suggested development plans",
      "Dedicated account manager + priority WhatsApp support",
      "PDF/Excel report export",
    ],
  },
];
