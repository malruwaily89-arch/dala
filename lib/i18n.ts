export type Language = 'en' | 'ar'

export const translations = {
  en: {
    dir: 'ltr',
    header: {
      nav: {
        features: 'Features',
        howItWorks: 'How it works',
        salons: 'Salons',
        pricing: 'Pricing',
      },
      signIn: 'Sign in',
      startTrial: 'Start free trial',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
    },
    hero: {
      badge: 'Booking management for beauty businesses',
      title: 'Make booking easier for your clients',
      subtitle:
        'Create a booking page for your beauty business, add your services and availability, and follow appointments from one dashboard. Designed for salons and independent beauty professionals.',
      emailPlaceholder: 'Enter your work email',
      startTrial: 'Start free trial',
      trialNote: '14-day free trial · No card required',
      bookDemo: 'Explore a demo booking page',
      trustLine: 'For salons and independent beauty professionals',
      liveTitle: 'See the booking flow',
      liveDesc:
        'Explore a sample page and see how clients choose a service and appointment time.',
    },
    features: {
      eyebrow: 'The platform',
      title: 'The essentials for managing appointments',
      subtitle:
        'Keep your booking page, services, team availability, and appointment details together in one workspace.',
      more: 'Learn more',
      items: [
        {
          title: 'Online booking page',
          desc: 'Let clients choose a service and an available appointment time from your business page.',
          href: '/features/booking',
        },
        {
          title: 'Staff & calendars',
          desc: 'Add team members and organize their services, schedules, and available times.',
          href: '/features/team',
        },
        {
          title: 'Payments & deposits',
          desc: 'Set up deposits for eligible services and follow their payment status with each booking.',
          href: '/features/payments',
        },
        {
          title: 'Client CRM',
          desc: 'Review client contact details and booking history from their profiles.',
          href: '/features/clients',
        },
        {
          title: 'Marketing & reminders',
          desc: 'Manage booking confirmations and WhatsApp reminders when messaging is configured.',
          href: '/features/marketing',
        },
        {
          title: 'Insights & reports',
          desc: 'Review revenue, attendance, and service activity in your reports.',
          href: '/features/reports',
        },
      ],
    },
    howItWorks: {
      eyebrow: 'Simple by design',
      title: 'Set up your booking workflow in three steps',
      steps: [
        {
          title: 'Create your business account',
          desc: 'Add your business details to prepare its booking workspace.',
        },
        {
          title: 'Add services and availability',
          desc: 'List your services and available times; add team members if you work with a team.',
        },
        {
          title: 'Share your booking page',
          desc: 'Give clients your booking link and follow their appointments from the dashboard.',
        },
      ],
    },
    salons: {
      eyebrow: 'Try the booking experience',
      title: 'See the booking page from a client’s point of view',
      viewAll: 'View all',
      reviews: 'reviews',
      bookingsPerMonth: 'bookings / mo',
      viewSalon: 'View salon',
      emptyTitle: 'Explore a sample booking page',
      emptyDesc: 'See how a client can review services and available appointment times before creating your own page.',
      demoLink: 'Open the demo booking page',
      items: [
        { name: 'Maison Rosé Atelier', city: 'Riyadh', tags: ['Hair', 'Color', 'Styling'] },
        { name: 'Lumière Nail Lounge', city: 'Jeddah', tags: ['Nails', 'Manicure', 'Art'] },
        { name: 'Serein Skin & Spa', city: 'Dubai', tags: ['Facials', 'Spa', 'Wellness'] },
      ],
    },
    testimonials: {
      eyebrow: 'Loved across the Gulf',
      title: 'Trusted by salon owners and their clients',
      emptyTitle: 'Coming soon',
      emptyDesc: 'Client reviews will appear here soon.',
      items: [],
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'Plans that grow with your salon',
      subtitle:
        'Choose the plan that fits your business. Individual clients always book for free.',
      earlyAccessBadge: 'Launch pricing for the first 20 paid subscriptions',
      mostPopular: 'Most popular',
      perMonth: '/ month',
      plans: [
        {
          name: 'Starter',
          price: 'SAR 199',
          desc: 'For home-based salons',
          features: [
            'Up to two staff members',
            "Public booking page with your salon's name",
            'Full deposit flow (stops no-shows)',
            'Automatic double-booking prevention',
            'WhatsApp confirmations',
            'Client records and no-show counter',
          ],
          cta: 'Start your free trial',
        },
        {
          name: 'Growth',
          price: 'SAR 449',
          desc: 'For growing salons',
          features: [
            'Unlimited staff members',
            'Everything in Starter',
            'Automated reminder 24 hours before appointment',
            'Smart waitlist (every cancellation opens instantly)',
            'Weekly reports (revenue, attendance, loyalty)',
            'Different deposit per service',
          ],
          cta: 'Start your free trial',
        },
        {
          name: 'Pro',
          price: 'SAR 999',
          desc: 'For large, high-traffic salons',
          features: [
            'Everything in Growth',
            'Advanced reports and occupancy rates',
            'Multiple permission levels (supervisors, staff)',
            'Full online payment gateway',
            'Priority support',
            'Setup and migration assistance',
          ],
          cta: 'Start your free trial',
        },
      ],
    },
    footer: {
      description:
        'The all-in-one booking and management platform for beauty salons and women’s personal care across Saudi Arabia and the Gulf.',
      columns: [
        {
          heading: 'Product',
          links: ['Features', 'Pricing', 'For salons', 'Book a demo'],
        },
        {
          heading: 'Company',
          links: ['About Dalal', 'Careers', 'Press', 'Contact'],
        },
        {
          heading: 'Resources',
          links: ['Help center', 'Partner login', 'Community', 'Status'],
        },
      ],
      rights: 'All rights reserved.',
      privacy: 'Privacy',
      terms: 'Terms',
    },
  },
  ar: {
    dir: 'rtl',
    header: {
      nav: {
        features: 'المميزات',
        howItWorks: 'كيف تعمل',
        salons: 'الصالونات',
        pricing: 'الأسعار',
      },
      signIn: 'تسجيل الدخول',
      startTrial: 'ابدئي التجربة المجانية',
      openMenu: 'فتح القائمة',
      closeMenu: 'إغلاق القائمة',
    },
    hero: {
      badge: 'إدارة حجوزات لأعمال التجميل',
      title: 'اجعلي الحجز أسهل لعميلاتكِ',
      subtitle:
        'أنشئي صفحة حجز لنشاطكِ، أضيفي خدماتكِ وأوقاتكِ المتاحة، وتابعي المواعيد من لوحة واحدة. دلال مصممة للصالونات والخبيرات المستقلات في مجال التجميل.',
      emailPlaceholder: 'أدخلي بريدكِ الإلكتروني',
      startTrial: 'ابدئي التجربة المجانية',
      trialNote: 'تجربة مجانية ١٤ يوماً · دون بطاقة',
      bookDemo: 'استكشفي صفحة حجز تجريبية',
      trustLine: 'للصالونات والخبيرات المستقلات في مجال التجميل',
      liveTitle: 'شاهدي خطوات الحجز',
      liveDesc:
        'تصفحي صفحة نموذجية وشاهدي كيف تختار العميلة الخدمة ووقت الموعد.',
    },
    features: {
      eyebrow: 'المنصة',
      title: 'أساسيات تساعدكِ على تنظيم المواعيد',
      subtitle:
        'اجمعي صفحة الحجز والخدمات وتوفّر الفريق وتفاصيل المواعيد في مساحة عمل واحدة.',
      more: 'اعرفي المزيد',
      items: [
        {
          title: 'صفحة حجز إلكترونية',
          desc: 'تتيح لعميلاتكِ اختيار الخدمة ووقت الموعد المتاح من صفحة نشاطكِ.',
          href: '/features/booking',
        },
        {
          title: 'الفريق والتقويم',
          desc: 'أضيفي عضوات الفريق ونظّمي خدماتهن وجداولهن والأوقات المتاحة.',
          href: '/features/team',
        },
        {
          title: 'المدفوعات والعرابين',
          desc: 'فعّلي العربون للخدمات المناسبة وتابعي حالة الدفع مع كل حجز.',
          href: '/features/payments',
        },
        {
          title: 'إدارة العميلات',
          desc: 'راجعي بيانات التواصل وسجل الحجوزات من ملفات العميلات.',
          href: '/features/clients',
        },
        {
          title: 'التسويق والتذكيرات',
          desc: 'تابعي تأكيدات الحجز وتذكيرات واتساب عند إعداد خدمة الرسائل.',
          href: '/features/marketing',
        },
        {
          title: 'التحليلات والتقارير',
          desc: 'راجعي الإيرادات والحضور ونشاط الخدمات ضمن تقارير اللوحة.',
          href: '/features/reports',
        },
      ],
    },
    howItWorks: {
      eyebrow: 'بسيطة بالتصميم',
      title: 'جهّزي طريقة حجزكِ في ثلاث خطوات',
      steps: [
        {
          title: 'أنشئي حساب نشاطكِ',
          desc: 'أضيفي بيانات نشاطكِ لتهيئة مساحة إدارة الحجوزات.',
        },
        {
          title: 'أضيفي الخدمات والأوقات',
          desc: 'أدرجي خدماتكِ وأوقاتكِ المتاحة، وأضيفي عضوات الفريق إن وُجدن.',
        },
        {
          title: 'شاركي صفحة الحجز',
          desc: 'أرسلي رابط الحجز لعميلاتكِ وتابعي المواعيد من لوحة التحكم.',
        },
      ],
    },
    salons: {
      eyebrow: 'استكشفي تجربة الحجز',
      title: 'شاهدي صفحة الحجز كما تراها العميلة',
      viewAll: 'عرض الكل',
      reviews: 'تقييم',
      bookingsPerMonth: 'حجز / شهرياً',
      viewSalon: 'عرض الصالون',
      emptyTitle: 'جرّبي صفحة حجز نموذجية',
      emptyDesc: 'شاهدي كيف تستعرض العميلة الخدمات والأوقات المتاحة قبل إنشاء صفحتكِ.',
      demoLink: 'افتحي صفحة الحجز التجريبية',
      items: [
        { name: 'ميزون روزيه أتيليه', city: 'الرياض', tags: ['شعر', 'صبغة', 'تصفيف'] },
        { name: 'لوميير نيل لاونج', city: 'جدة', tags: ['أظافر', 'مانيكير', 'رسم'] },
        { name: 'سيرين سكين آند سبا', city: 'دبي', tags: ['بشرة', 'سبا', 'استجمام'] },
      ],
    },
    testimonials: {
      eyebrow: 'محبوبة في أنحاء الخليج',
      title: 'موثوقة لدى أصحاب الصالونات وعميلاتهم',
      emptyTitle: 'قريباً',
      emptyDesc: 'تقييمات العميلات ستظهر هنا قريباً.',
      items: [],
    },
    pricing: {
      eyebrow: 'الأسعار',
      title: 'باقات تنمو مع صالونكِ',
      subtitle:
        'اختاري الباقة التي تناسب أعمالكِ. العميلات الأفراد يحجزن مجاناً دائماً.',
      earlyAccessBadge: 'أسعار الإطلاق لأول 20 اشتراكاً مدفوعاً فقط',
      mostPopular: 'الأكثر شيوعاً',
      perMonth: '/ شهرياً',
      plans: [
        {
          name: 'الأساسية',
          price: '١٩٩ ر.س',
          desc: 'للصالون المنزلي',
          features: [
            'حتى موظفتان',
            'صفحة حجز عامة باسم صالونك',
            'دورة عربون كاملة (تمنع الغائبات)',
            'منع تعارض المواعيد تلقائياً',
            'تأكيدات واتساب',
            'سجل عميلات وعداد غيابات',
          ],
          cta: 'ابدئي تجربتك المجانية',
        },
        {
          name: 'النمو',
          price: '٤٤٩ ر.س',
          desc: 'للصالون المتوسط',
          features: [
            'موظفات بلا حد',
            'كل ميزات الأساسية',
            'تذكير آلي قبل الموعد بـ 24 ساعة',
            'قائمة انتظار ذكية (كل إلغاء يتحرر فوراً)',
            'تقارير أسبوعية (إيراد، حضور، وفاء)',
            'عربون مختلف لكل خدمة',
          ],
          cta: 'ابدئي تجربتك المجانية',
        },
        {
          name: 'الاحترافية',
          price: '٩٩٩ ر.س',
          desc: 'للصالون الكبير والواقع ذو الحركة الكثيفة',
          features: [
            'كل ميزات النمو',
            'تقارير متقدمة ونسب إشغال',
            'صلاحيات متعددة (مشرفات، موظفات)',
            'بوابة دفع إلكتروني كاملة',
            'أولوية دعم',
            'إعداد ومساعدة ترحيل',
          ],
          cta: 'ابدئي تجربتك المجانية',
        },
      ],
    },
    footer: {
      description:
        'المنصة المتكاملة لإدارة الحجوزات لصالونات التجميل والعناية النسائية في المملكة العربية السعودية ودول الخليج.',
      columns: [
        {
          heading: 'المنتج',
          links: ['المميزات', 'الأسعار', 'للصالونات', 'احجزي عرضاً'],
        },
        {
          heading: 'الشركة',
          links: ['عن دلال', 'الوظائف', 'الصحافة', 'تواصلي معنا'],
        },
        {
          heading: 'الموارد',
          links: ['مركز المساعدة', 'دخول الشركاء', 'المجتمع', 'الحالة'],
        },
      ],
      rights: 'جميع الحقوق محفوظة.',
      privacy: 'الخصوصية',
      terms: 'الشروط',
    },
  },
} as const

export type Translation = (typeof translations)[Language]
