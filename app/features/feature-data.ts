import {
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Heart,
  Sparkles,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type FeatureSlug =
  | "booking"
  | "team"
  | "payments"
  | "clients"
  | "marketing"
  | "reports";

export type FeatureContent = {
  badge: string;
  title: string;
  subtitle: string;
  howTitle: string;
  howIntro: string;
  steps: { title: string; body: string }[];
  mockTitle: string;
  mockNote: string;
  examplesTitle: string;
  examples: { title: string; body: string }[];
  benefitsTitle: string;
  benefits: string[];
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  seePricing: string;
};

export type FeatureEntry = {
  slug: FeatureSlug;
  icon: LucideIcon;
  ar: FeatureContent;
  en: FeatureContent;
};

export const FEATURES: FeatureEntry[] = [
  {
    slug: "booking",
    icon: CalendarCheck,
    ar: {
      badge: "الحجز الإلكتروني",
      title: "صفحة حجز تحجز عميلاتك على مدار الساعة",
      subtitle:
        "رابط واحد باسم علامتك… تختار العميلة الخدمة والوقت، تدفع العربون، ويتأكد الحجز — بدون مكالمة واحدة.",
      howTitle: "كيف يعمل الحجز الإلكتروني",
      howIntro:
        "رحلة الحجز من فتح الرابط حتى التأكيد لا تأخذ من عميلتك أكثر من دقيقة، وكل خطوة مصممة لتعمل من نفسها.",
      steps: [
        {
          title: "تفتح العميلة رابط صفحتك",
          body: "من بايو سناب شات أو إنستغرام أو واتساب — بدون تطبيق وبدون تسجيل.",
        },
        {
          title: "تختار الخدمة والوقت",
          body: "الخدمات والأسعار والأخصائيات والأوقات المتاحة تظهر لها مباشرة.",
        },
        {
          title: "تدفع العربون إلكترونياً",
          body: "عربون صغير عبر بوابة دفع آمنة يثبّت الموعد فوراً.",
        },
        {
          title: "يتأكد الحجز لحظياً",
          body: "تصلك رسالة تأكيد، ويظهر الموعد في تقويمك وجدول موظفتك تلقائياً.",
        },
      ],
      mockTitle: "هكذا تبدو صفحة الحجز لعميلتك",
      mockNote: "محاكاة لواجهة الحجز: اختيار الخدمة، ثم الموعد، ثم دفع العربون.",
      examplesTitle: "رحلة حجز حقيقية",
      examples: [
        {
          title: "عميلة تختار خدمة",
          body: "تفتح نوف رابطك وتختار «قص وتصفيف» — 120 ر.س، مع صورة الخدمة ومدتها.",
        },
        {
          title: "تختار الموعد المناسب",
          body: "الخميس الساعة 5:00 م مع سارة — النظام يعرض الأوقات المتاحة فقط، فلا يحدث تعارض أبداً.",
        },
        {
          title: "تدفع العربون ويتأكد الحجز",
          body: "عربون 40 ر.س يُثبّت الموعد، وتصل رسالة تأكيد فورية لها، ويظهر الحجز في تقويمك.",
        },
      ],
      benefitsTitle: "ماذا تكسبين من الحجز الإلكتروني",
      benefits: [
        "صفحة حجز عامة باسم صالونك وألوانه",
        "تعمل على الجوال بالكامل — حيث تتصفح عميلاتك",
        "منع الحجز المزدوج على نفس الوقت تلقائياً",
        "عربون يثبّت الموعد ويمنع الغائبات",
        "تأكيد فوري عبر واتساب من رقمك المعروف",
        "قائمة انتظار تملأ كل موعد ملغى فوراً",
      ],
      ctaTitle: "جهّزي صفحة حجزك خلال دقائق",
      ctaBody: "ابدئي تجربتك المجانية لمدة 14 يوماً — بدون بطاقة، وشاركي رابطك مع عميلاتك اليوم.",
      ctaButton: "ابدئي تجربتك المجانية",
      seePricing: "شاهدي الباقات والأسعار",
    },
    en: {
      badge: "Online booking",
      title: "A booking page that fills your calendar 24/7",
      subtitle:
        "One branded link… your client picks a service and a time, pays the deposit, and the booking is confirmed — without a single phone call.",
      howTitle: "How online booking works",
      howIntro:
        "From opening the link to confirmation, booking takes your client under a minute — and every step runs itself.",
      steps: [
        {
          title: "Your client opens your page link",
          body: "From your Snapchat, Instagram, or WhatsApp bio — no app and no sign-up.",
        },
        {
          title: "She picks a service and a time",
          body: "Services, prices, specialists, and open slots appear instantly.",
        },
        {
          title: "She pays the deposit online",
          body: "A small deposit through a secure gateway locks the slot right away.",
        },
        {
          title: "The booking is confirmed instantly",
          body: "She gets a confirmation message, and the appointment appears in your calendar automatically.",
        },
      ],
      mockTitle: "This is what your client sees",
      mockNote: "A mockup of the booking flow: pick a service, a time, then pay the deposit.",
      examplesTitle: "A real booking journey",
      examples: [
        {
          title: "A client picks a service",
          body: "Nouf opens your link and chooses “Cut & Style” — SAR 120, with duration shown.",
        },
        {
          title: "She picks a time",
          body: "Thursday at 5:00 PM with Sara — the system only shows open slots, so double-booking never happens.",
        },
        {
          title: "She pays and it's confirmed",
          body: "A SAR 40 deposit locks the slot, she gets an instant confirmation, and the booking lands in your calendar.",
        },
      ],
      benefitsTitle: "What online booking gives you",
      benefits: [
        "A public booking page with your salon's name and colors",
        "Fully mobile-first — where your clients actually browse",
        "Automatic double-booking prevention",
        "A deposit that locks slots and stops no-shows",
        "Instant WhatsApp confirmation from the number clients know",
        "A smart waitlist that fills every cancelled slot",
      ],
      ctaTitle: "Set up your booking page in minutes",
      ctaBody: "Start your 14-day free trial — no card required — and share your link today.",
      ctaButton: "Start your free trial",
      seePricing: "See plans & pricing",
    },
  },
  {
    slug: "team",
    icon: CalendarClock,
    ar: {
      badge: "الفريق والتقويم",
      title: "كل أخصائية بجدولها… وكل المواعيد في مكان واحد",
      subtitle:
        "أضيفي أخصائياتك، حددي مناوباتهن وإجازاتهن، وشاهدي جدول اليوم كاملاً — بدون تعارض ولا ازدواج حجز.",
      howTitle: "كيف تديرين فريقك وتقويمك",
      howIntro:
        "من إضافة موظفة جديدة إلى متابعة جدول اليوم، كل شيء بضع نقرات وينعكس فوراً على صفحة الحجز.",
      steps: [
        {
          title: "أضيفي الأخصائية",
          body: "الاسم، الخدمات التي تقدمها، وساعات عملها — في أقل من دقيقة.",
        },
        {
          title: "حددي المناوبات",
          body: "أيام العمل، الإجازات، وأوقات الذروة — بجدول واضح لكل موظفة.",
        },
        {
          title: "تابعي التقويم اليومي",
          body: "كل موعد يظهر باسم موظفته ووقته، والنظام يمنع التعارض تلقائياً.",
        },
        {
          title: "عدّلي بثقة",
          body: "أي تغيير في الجدول ينعكس فوراً على صفحة الحجز أمام العميلات.",
        },
      ],
      mockTitle: "تقويم المواعيد وإدارة الفريق كما يظهر لك",
      mockNote: "محاكاة للتقويم الأسبوعي: مواعيد كل موظفة وجدول مناوباتها.",
      examplesTitle: "سيناريوهات يومية",
      examples: [
        {
          title: "إضافة موظفة جديدة",
          body: "أضفتِ سارة خلال دقيقة: اسمها وخدماتها وساعاتها — وظهرت فوراً في صفحة الحجز.",
        },
        {
          title: "جدول المناوبات",
          body: "مناوبات الأسبوع واضحة: سارة من 9 ص حتى 5 م، ونورة إجازة الثلاثاء.",
        },
        {
          title: "التقويم اليومي",
          body: "كل موعد مرتبط بموظفته، وأي محاولة حجز على وقت مشغول تُرفض تلقائياً.",
        },
      ],
      benefitsTitle: "ماذا يقدم لك الفريق والتقويم",
      benefits: [
        "جدول مستقل لكل أخصائية",
        "منع تعارض المواعيد تلقائياً",
        "مناوبات وإجازات واضحة",
        "صلاحيات متعددة للمشرفات والموظفات",
        "عرض يومي وأسبوعي للجدول",
        "تغييرات تنعكس فوراً على صفحة الحجز",
      ],
      ctaTitle: "نظّمي فريقك في تقويم واحد",
      ctaBody: "ابدئي تجربتك المجانية لمدة 14 يوماً — وأضيفي فريقك اليوم.",
      ctaButton: "ابدئي تجربتك المجانية",
      seePricing: "شاهدي الباقات والأسعار",
    },
    en: {
      badge: "Team & calendar",
      title: "Every specialist on her own schedule — all in one view",
      subtitle:
        "Add your specialists, set their shifts and time off, and see the whole day's calendar — no conflicts, no double-booking.",
      howTitle: "How you manage your team and calendar",
      howIntro:
        "From adding a new staff member to following the day's schedule, everything takes a few clicks and reflects on the booking page instantly.",
      steps: [
        {
          title: "Add the specialist",
          body: "Name, services she offers, and working hours — in under a minute.",
        },
        {
          title: "Set the shifts",
          body: "Working days, time off, and peak hours — with a clear schedule per staff member.",
        },
        {
          title: "Follow the daily calendar",
          body: "Every appointment shows its specialist and time, and the system blocks conflicts automatically.",
        },
        {
          title: "Edit with confidence",
          body: "Any schedule change reflects instantly on the booking page your clients see.",
        },
      ],
      mockTitle: "The calendar and team view you'll see",
      mockNote: "A mockup of the weekly calendar: each specialist's appointments and shift plan.",
      examplesTitle: "Everyday scenarios",
      examples: [
        {
          title: "Adding a new staff member",
          body: "You added Sara in a minute: name, services, and hours — she appears on the booking page right away.",
        },
        {
          title: "The shift plan",
          body: "The week is clear: Sara works 9–5, and Noura is off on Tuesday.",
        },
        {
          title: "The daily calendar",
          body: "Every appointment is tied to its specialist, and any attempt to book a busy slot is rejected automatically.",
        },
      ],
      benefitsTitle: "What team & calendar gives you",
      benefits: [
        "A separate schedule per specialist",
        "Automatic conflict prevention",
        "Clear shifts and time off",
        "Multiple permission levels for supervisors and staff",
        "Daily and weekly schedule views",
        "Changes that reflect on the booking page instantly",
      ],
      ctaTitle: "Organize your team in one calendar",
      ctaBody: "Start your 14-day free trial — and add your team today.",
      ctaButton: "Start your free trial",
      seePricing: "See plans & pricing",
    },
  },
  {
    slug: "payments",
    icon: CreditCard,
    ar: {
      badge: "المدفوعات والعرابين",
      title: "العربون يُحصَّل قبل أن تختفي العميلة",
      subtitle:
        "كل حجز يُثبَّت بعربون إلكتروني يصل مباشرة إلى حسابك المصرفي، مع تقارير تحصيل واضحة لكل يوم.",
      howTitle: "كيف يعمل نظام العرابين والدفع",
      howIntro:
        "العربون يحمي وقتك: العميلة التي دفعت تحضر، والمواعيد لم تعد تضيع على من لا تأتي.",
      steps: [
        {
          title: "حددي العربون",
          body: "مبلغ ثابت أو عربون مختلف لكل خدمة — أنتِ من يقرر.",
        },
        {
          title: "تدفع العميلة أونلاين",
          body: "بوابة دفع إلكتروني آمنة أثناء الحجز مباشرة.",
        },
        {
          title: "يصل المال لحسابك",
          body: "العربون يُحوَّل مباشرة إلى حسابك المصرفي — لا يمر عبرنا إطلاقاً.",
        },
        {
          title: "تابعي التحصيل",
          body: "تقرير يومي: المحصّل، المعلق، والمكتمل — كل عربون مرتبط بحجزه.",
        },
      ],
      mockTitle: "تقرير المدفوعات كما يظهر لك",
      mockNote: "محاكاة لتقرير التحصيل: عرابون اليوم وحالاتها وربطها بالحجوزات.",
      examplesTitle: "سيناريوهات يومية",
      examples: [
        {
          title: "استلام عربون",
          body: "عميلة حجزت الخميس ودفعت 40 ر.س فوراً — الموعد مؤكد ولا مجال للغياب.",
        },
        {
          title: "تقرير المدفوعات",
          body: "إيراد اليوم، العربونات المؤكدة والمعلقة — كل شيء في نظرة واحدة.",
        },
        {
          title: "متابعة التحصيل",
          body: "كل عربون مرتبط بحجز وحالة واضحة: مدفوع، معلق، أو مكتمل.",
        },
      ],
      benefitsTitle: "ماذا يقدم لك نظام المدفوعات",
      benefits: [
        "المال يصل حسابك المصرفي مباشرة",
        "عربون مختلف لكل خدمة",
        "بوابة دفع إلكتروني كاملة",
        "تقرير تحصيل يومي واضح",
        "ربط كل عربون بحجزه",
        "تقليل المواعيد الفائتة بشكل ملموس",
      ],
      ctaTitle: "حمي وقتك بعربون يحصَّل تلقائياً",
      ctaBody: "ابدئي تجربتك المجانية لمدة 14 يوماً — بدون بطاقة.",
      ctaButton: "ابدئي تجربتك المجانية",
      seePricing: "شاهدي الباقات والأسعار",
    },
    en: {
      badge: "Payments & deposits",
      title: "The deposit is collected before the client disappears",
      subtitle:
        "Every booking is locked with an online deposit that goes straight to your bank account, with clear daily collection reports.",
      howTitle: "How deposits and payments work",
      howIntro:
        "The deposit protects your time: a client who paid shows up, and slots no longer go to waste on no-shows.",
      steps: [
        {
          title: "Set the deposit",
          body: "A flat amount or a different deposit per service — you decide.",
        },
        {
          title: "The client pays online",
          body: "A secure online gateway right inside the booking flow.",
        },
        {
          title: "The money reaches you",
          body: "Deposits transfer directly to your bank account — funds never pass through us.",
        },
        {
          title: "Track collection",
          body: "A daily report: collected, pending, and completed — every deposit tied to its booking.",
        },
      ],
      mockTitle: "The payments report you'll see",
      mockNote: "A mockup of the collection report: today's deposits, statuses, and booking links.",
      examplesTitle: "Everyday scenarios",
      examples: [
        {
          title: "Receiving a deposit",
          body: "A client booked Thursday and paid SAR 40 immediately — the slot is confirmed, no no-show risk.",
        },
        {
          title: "The payments report",
          body: "Today's revenue, confirmed and pending deposits — all at a glance.",
        },
        {
          title: "Tracking collection",
          body: "Every deposit is tied to a booking with a clear status: paid, pending, or completed.",
        },
      ],
      benefitsTitle: "What the payments system gives you",
      benefits: [
        "Money goes directly to your bank account",
        "A different deposit per service",
        "A full online payment gateway",
        "A clear daily collection report",
        "Every deposit tied to its booking",
        "A measurable drop in no-shows",
      ],
      ctaTitle: "Protect your time with automatic deposits",
      ctaBody: "Start your 14-day free trial — no card required.",
      ctaButton: "Start your free trial",
      seePricing: "See plans & pricing",
    },
  },
  {
    slug: "clients",
    icon: Heart,
    ar: {
      badge: "إدارة العميلات",
      title: "ملف لكل عميلة… وذاكرة لا تنسى",
      subtitle:
        "سجل الزيارات، الخدمات المفضلة، الملاحظات، وعداد الغيابات — كل شيء عن عميلتك في مكان واحد.",
      howTitle: "كيف يعمل نظام إدارة العميلات",
      howIntro:
        "الملف يُنشأ تلقائياً من أول حجز، ويُحدَّث مع كل زيارة — بدون أي إدخال يدوي.",
      steps: [
        {
          title: "يُنشأ الملف تلقائياً",
          body: "أول حجز من عميلة جديدة ينشئ ملفها باسمها ورقمها.",
        },
        {
          title: "تُسجَّل كل زيارة",
          body: "كل موعد مكتمل يُضاف لسجلها تلقائياً مع الخدمة والتاريخ.",
        },
        {
          title: "أضيفي ملاحظاتك",
          body: "تفضيلاتها، ملاحظات الخدمة، أو أي شيء تريدين تذكّره.",
        },
        {
          title: "راقبي عداد الغيابات",
          body: "حضورها وغيابها واضحان — لتقرري من يستحق أولوية الحجز.",
        },
      ],
      mockTitle: "ملف العميلة كما يظهر لك",
      mockNote: "محاكاة لملف عميلة: بياناتها، سجل زياراتها، وعداد غياباتها.",
      examplesTitle: "سيناريوهات يومية",
      examples: [
        {
          title: "ملف عميلة",
          body: "نوف العتيبي: 12 زيارة، آخر زيارة قبل 5 أيام، تفضل «قص وتصفيف».",
        },
        {
          title: "سجل الحجوزات",
          body: "كل مواعيدها السابقة والقادمة في قائمة واحدة مرتبة.",
        },
        {
          title: "عداد الغيابات",
          body: "حضورها وغيابها موثقان — تعرفين وفاء كل عميلة قبل أن تحجز.",
        },
      ],
      benefitsTitle: "ماذا يقدم لك نظام إدارة العميلات",
      benefits: [
        "ملف يُنشأ تلقائياً مع أول حجز",
        "سجل زيارات كامل ومرتب",
        "ملاحظات وتفضيلات لكل عميلة",
        "عداد غيابات واضح",
        "تعرفين عميلتك قبل وصولها",
        "بيانات معزولة وآمنة لكل صالون",
      ],
      ctaTitle: "اعرفي كل عميلة قبل أن تدخل بابك",
      ctaBody: "ابدئي تجربتك المجانية لمدة 14 يوماً — بدون بطاقة.",
      ctaButton: "ابدئي تجربتك المجانية",
      seePricing: "شاهدي الباقات والأسعار",
    },
    en: {
      badge: "Client management",
      title: "A profile for every client… and a memory that never fails",
      subtitle:
        "Visit history, favorite services, notes, and a no-show counter — everything about your client in one place.",
      howTitle: "How client management works",
      howIntro:
        "The profile is created automatically from the first booking and updated with every visit — no manual entry.",
      steps: [
        {
          title: "The profile is created automatically",
          body: "A new client's first booking creates her profile with name and number.",
        },
        {
          title: "Every visit is recorded",
          body: "Each completed appointment is added to her history with service and date.",
        },
        {
          title: "Add your notes",
          body: "Her preferences, service notes, or anything you want to remember.",
        },
        {
          title: "Watch the no-show counter",
          body: "Her attendance and absences are clear — so you know who deserves priority.",
        },
      ],
      mockTitle: "The client profile you'll see",
      mockNote: "A mockup of a client profile: her details, visit history, and no-show counter.",
      examplesTitle: "Everyday scenarios",
      examples: [
        {
          title: "A client profile",
          body: "Nouf Al-Otaibi: 12 visits, last visit 5 days ago, prefers “Cut & Style”.",
        },
        {
          title: "The booking history",
          body: "All her past and upcoming appointments in one tidy list.",
        },
        {
          title: "The no-show counter",
          body: "Her attendance is documented — you know each client's loyalty before she books.",
        },
      ],
      benefitsTitle: "What client management gives you",
      benefits: [
        "A profile created automatically with the first booking",
        "A complete, organized visit history",
        "Notes and preferences per client",
        "A clear no-show counter",
        "You know your client before she walks in",
        "Isolated, secure data per salon",
      ],
      ctaTitle: "Know every client before she walks in",
      ctaBody: "Start your 14-day free trial — no card required.",
      ctaButton: "Start your free trial",
      seePricing: "See plans & pricing",
    },
  },
  {
    slug: "marketing",
    icon: Sparkles,
    ar: {
      badge: "التسويق والتذكيرات",
      title: "واتساب يتكلم عنك… قبل الموعد وبعده",
      subtitle:
        "تذكيرات تلقائية تقلّل الغياب، ومتابعات وعروض تُرجع العميلات — كلها من رقمك المعروف لديهن.",
      howTitle: "كيف يعمل نظام التذكيرات والعروض",
      howIntro:
        "الرسائل تُرسل تلقائياً في أوقات ذكية: قبل الموعد ليمنع النسيان، وبعده لتبني الولاء.",
      steps: [
        {
          title: "فعّلي الرسائل مرة واحدة",
          body: "القوالب جاهزة، والرسائل تنطلق من رقمك تلقائياً.",
        },
        {
          title: "تذكير قبل الموعد",
          body: "رسالة قبل 24 ساعة تُذكّر العميلة وتقلّل المواعيد الفائتة.",
        },
        {
          title: "متابعة بعد الزيارة",
          body: "شكر وطلب تقييم يبقيان تجربتك في ذهن العميلة.",
        },
        {
          title: "عروض خاصة",
          body: "رسائل خصم وعروض لعميلات مختارات أو بمناسبة زياراتهن.",
        },
      ],
      mockTitle: "رسائل واتساب التلقائية كما تستلمها عميلتك",
      mockNote: "محاكاة لمحادثة واتساب: تذكير قبل الموعد، رد العميلة، وعرض خاص.",
      examplesTitle: "سيناريوهات يومية",
      examples: [
        {
          title: "تذكير قبل الموعد",
          body: "«مرحباً نوف 🌸 تذكير بموعدك غداً الخميس الساعة 5:00 م».",
        },
        {
          title: "رسالة عرض خاص",
          body: "«نوف 🎁 بمناسبة زياراتك الخمس، خصم 20% على موعدك القادم 🌸».",
        },
        {
          title: "متابعة بعد الزيارة",
          body: "«يسعدنا رأيك بتجربتك اليوم 🌸» — تقييم يبني سمعتك تلقائياً.",
        },
      ],
      benefitsTitle: "ماذا يقدم لك التسويق والتذكيرات",
      benefits: [
        "رسائل من رقمك المعروف لدى عميلاتك",
        "تذكير آلي قبل الموعد بـ 24 ساعة",
        "تقليل ملموس للمواعيد الفائتة",
        "متابعة تلقائية بعد كل خدمة",
        "عروض مخصصة لعميلات مختارات",
        "قوالب جاهزة بدون أي إعداد تقني",
      ],
      ctaTitle: "دعي واتساب يتكلم عنك",
      ctaBody: "ابدئي تجربتك المجانية لمدة 14 يوماً — بدون بطاقة.",
      ctaButton: "ابدئي تجربتك المجانية",
      seePricing: "شاهدي الباقات والأسعار",
    },
    en: {
      badge: "Marketing & reminders",
      title: "WhatsApp speaks for you… before and after every visit",
      subtitle:
        "Automatic reminders that cut no-shows, and follow-ups and offers that bring clients back — all from the number they know.",
      howTitle: "How reminders and offers work",
      howIntro:
        "Messages go out automatically at smart moments: before the appointment to prevent forgetting, and after it to build loyalty.",
      steps: [
        {
          title: "Turn on messaging once",
          body: "Templates are ready, and messages go out from your number automatically.",
        },
        {
          title: "Reminder before the appointment",
          body: "A message 24 hours ahead reminds your client and cuts missed appointments.",
        },
        {
          title: "Follow-up after the visit",
          body: "A thank-you and a rating request keep your experience top of mind.",
        },
        {
          title: "Special offers",
          body: "Discount messages for selected clients or to celebrate their visits.",
        },
      ],
      mockTitle: "The automatic WhatsApp messages your client receives",
      mockNote: "A mockup of a WhatsApp chat: a reminder, the client's reply, and a special offer.",
      examplesTitle: "Everyday scenarios",
      examples: [
        {
          title: "Reminder before the appointment",
          body: "“Hi Nouf 🌸 Reminder of your appointment tomorrow, Thursday at 5:00 PM.”",
        },
        {
          title: "A special offer message",
          body: "“Nouf 🎁 To celebrate your 5 visits — 20% off your next appointment 🌸.”",
        },
        {
          title: "Follow-up after the visit",
          body: "“We'd love your feedback on today's visit 🌸” — reviews that build your reputation automatically.",
        },
      ],
      benefitsTitle: "What marketing & reminders gives you",
      benefits: [
        "Messages from the number your clients already know",
        "Automatic reminder 24 hours before appointments",
        "A measurable drop in missed appointments",
        "Automatic follow-up after every service",
        "Personalized offers for selected clients",
        "Ready-made templates with zero technical setup",
      ],
      ctaTitle: "Let WhatsApp speak for you",
      ctaBody: "Start your 14-day free trial — no card required.",
      ctaButton: "Start your free trial",
      seePricing: "See plans & pricing",
    },
  },
  {
    slug: "reports",
    icon: BarChart3,
    ar: {
      badge: "التحليلات والتقارير",
      title: "أرقام واضحة… قرارات أذكى",
      subtitle:
        "الإيراد، الحضور، أفضل الخدمات، ونسب الإشغال — لوحة تحكم تقرأينها بنظرة واحدة وتقررين بثقة.",
      howTitle: "كيف تعمل لوحة التقارير",
      howIntro:
        "كل حجز وكل عربون وكل زيارة تتحول إلى أرقام مباشرة أمامك — بدون جداول ولا حسابات يدوية.",
      steps: [
        {
          title: "افتحي لوحة التقارير",
          body: "كل المؤشرات في شاشة واحدة أنيقة.",
        },
        {
          title: "تابعي الإيراد",
          body: "إيراد اليوم والأسبوع والشهر — برسم بياني واضح.",
        },
        {
          title: "قارني الأداء",
          body: "مقارنة شهر بشهر ونسب التغيّر (في باقات برو).",
        },
        {
          title: "اكتشفي الأفضل",
          body: "أكثر الخدمات طلباً، أذكى الأوقات، وأفضل أخصائياتك.",
        },
      ],
      mockTitle: "لوحة التقارير كما تظهر لك",
      mockNote: "محاكاة للوحة التحكم: مؤشرات اليوم، رسم الإيرادات، وأفضل الخدمات.",
      examplesTitle: "سيناريوهات يومية",
      examples: [
        {
          title: "رسم الإيرادات",
          body: "أعمدة الإيراد اليومي تُظهر أيام الذروة بوضوح.",
        },
        {
          title: "تقرير الحضور",
          body: "نسب الحضور والإلغاء والغياب لكل أسبوع.",
        },
        {
          title: "أفضل الخدمات",
          body: "الأكثر طلباً والأعلى إيراداً — لتعرفي أين تركّزين.",
        },
      ],
      benefitsTitle: "ماذا تقدم لك التحليلات والتقارير",
      benefits: [
        "تقارير أسبوعية تلقائية",
        "رسم بياني للإيرادات",
        "نسب حضور وإلغاء واضحة",
        "تحليل ذروة الأيام والساعات",
        "مقارنة الأداء شهر بشهر",
        "تصدير التقارير PDF وExcel",
      ],
      ctaTitle: "قرّري بأرقام لا بحدس",
      ctaBody: "ابدئي تجربتك المجانية لمدة 14 يوماً — بدون بطاقة.",
      ctaButton: "ابدئي تجربتك المجانية",
      seePricing: "شاهدي الباقات والأسعار",
    },
    en: {
      badge: "Analytics & reports",
      title: "Clear numbers… smarter decisions",
      subtitle:
        "Revenue, attendance, top services, and occupancy — a dashboard you read at a glance and decide with confidence.",
      howTitle: "How the reports dashboard works",
      howIntro:
        "Every booking, deposit, and visit becomes a number in front of you — no spreadsheets, no manual math.",
      steps: [
        {
          title: "Open the reports dashboard",
          body: "All your key metrics on one elegant screen.",
        },
        {
          title: "Track revenue",
          body: "Today, this week, this month — on a clear chart.",
        },
        {
          title: "Compare performance",
          body: "Month-over-month and % changes (on Pro plans).",
        },
        {
          title: "Discover what works",
          body: "Your most-requested services, busiest times, and top specialists.",
        },
      ],
      mockTitle: "The reports dashboard you'll see",
      mockNote: "A mockup of the dashboard: today's metrics, a revenue chart, and top services.",
      examplesTitle: "Everyday scenarios",
      examples: [
        {
          title: "The revenue chart",
          body: "Daily revenue bars show your peak days at a glance.",
        },
        {
          title: "The attendance report",
          body: "Attendance, cancellation, and no-show rates for each week.",
        },
        {
          title: "Top services",
          body: "Most-requested and highest-revenue — so you know where to focus.",
        },
      ],
      benefitsTitle: "What analytics & reports gives you",
      benefits: [
        "Automatic weekly reports",
        "A clear revenue chart",
        "Attendance and cancellation rates",
        "Peak days and hours analysis",
        "Month-over-month comparison",
        "PDF and Excel report export",
      ],
      ctaTitle: "Decide with numbers, not guesses",
      ctaBody: "Start your 14-day free trial — no card required.",
      ctaButton: "Start your free trial",
      seePricing: "See plans & pricing",
    },
  },
];

export const FEATURES_BY_SLUG = Object.fromEntries(
  FEATURES.map((f) => [f.slug, f])
) as Record<FeatureSlug, FeatureEntry>;

export const FEATURE_SLUGS = FEATURES.map((f) => f.slug);
