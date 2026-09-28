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
      badge: 'The booking platform for beauty businesses',
      title: 'Run and grow your salon, beautifully',
      subtitle:
        'Dalal is the all-in-one booking and management platform for beauty salons and women’s personal-care studios across Saudi Arabia and the Gulf. Take online bookings, manage staff and payments, and delight every client, from one elegant dashboard.',
      emailPlaceholder: 'Enter your work email',
      startTrial: 'Start free trial',
      trialNote: '14-day free trial · No card required',
      bookDemo: 'Book a demo',
      rating: '4.9 rated by salon owners',
      salonsGrowing: 'salons growing with Dalal',
      liveTitle: 'Live in minutes',
      liveDesc:
        'Set up your booking page, add services, and start accepting appointments the same day.',
    },
    features: {
      eyebrow: 'The platform',
      title: 'Everything your salon needs, in one place',
      subtitle:
        'Dalal brings bookings, staff, payments, and clients together, so you can spend less time managing and more time creating beauty.',
      more: 'Learn more',
      items: [
        {
          title: 'Online booking',
          desc: 'A beautiful booking page your clients can reserve from 24/7.',
          href: '/features/booking',
        },
        {
          title: 'Staff & calendars',
          desc: 'Manage specialists, shifts, and availability in real time.',
          href: '/features/team',
        },
        {
          title: 'Payments & deposits',
          desc: 'Take deposits and payments securely, with automatic payouts.',
          href: '/features/payments',
        },
        {
          title: 'Client CRM',
          desc: 'Profiles, history, and loyalty that keep clients coming back.',
          href: '/features/clients',
        },
        {
          title: 'Marketing & reminders',
          desc: 'Automated reminders and promotions that reduce no-shows.',
          href: '/features/marketing',
        },
        {
          title: 'Insights & reports',
          desc: 'Track revenue, top services, and growth from one dashboard.',
          href: '/features/reports',
        },
      ],
    },
    howItWorks: {
      eyebrow: 'Simple by design',
      title: 'Go live in three simple steps',
      steps: [
        {
          title: 'Create your page',
          desc: 'Set up your branded booking page in minutes, no technical skills needed.',
        },
        {
          title: 'Add services & staff',
          desc: 'List your services, prices, and specialists, then set your availability.',
        },
        {
          title: 'Start growing',
          desc: 'Accept online bookings and payments, and watch your calendar fill up.',
        },
      ],
    },
    salons: {
      eyebrow: 'Success stories',
      title: 'Salons growing with Dalal',
      viewAll: 'View all',
      reviews: 'reviews',
      bookingsPerMonth: 'bookings / mo',
      viewSalon: 'View salon',
      emptyTitle: 'Coming soon',
      emptyDesc: 'Featured salons will appear here soon.',
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
      badge: 'منصة الحجز لأعمال التجميل',
      title: 'أديري صالونكِ ونمّيه بأناقة',
      subtitle:
        'دلال منصة متكاملة لإدارة الحجوزات لصالونات التجميل واستوديوهات العناية النسائية في المملكة العربية السعودية ودول الخليج. استقبلي الحجوزات إلكترونياً، وأديري فريقكِ ومدفوعاتكِ، وأسعدي كل عميلة من لوحة تحكم أنيقة واحدة.',
      emailPlaceholder: 'أدخلي بريدكِ الإلكتروني',
      startTrial: 'ابدئي التجربة المجانية',
      trialNote: 'تجربة مجانية ١٤ يوماً · دون بطاقة',
      bookDemo: 'احجزي عرضاً تجريبياً',
      rating: 'تقييم ٤٫٩ من أصحاب الصالونات',
      salonsGrowing: 'صالون ينمو مع دلال',
      liveTitle: 'انطلقي خلال دقائق',
      liveDesc:
        'جهّزي صفحة الحجز، أضيفي خدماتكِ، وابدئي باستقبال المواعيد في اليوم نفسه.',
    },
    features: {
      eyebrow: 'المنصة',
      title: 'كل ما يحتاجه صالونكِ في مكان واحد',
      subtitle:
        'تجمع دلال الحجوزات والفريق والمدفوعات والعميلات معاً، لتقضي وقتاً أقل في الإدارة ووقتاً أكثر في صناعة الجمال.',
      more: 'اعرفي المزيد',
      items: [
        {
          title: 'الحجز الإلكتروني',
          desc: 'صفحة حجز أنيقة يمكن لعميلاتكِ الحجز منها على مدار الساعة.',
          href: '/features/booking',
        },
        {
          title: 'الفريق والتقويم',
          desc: 'أديري الأخصائيات والمناوبات والأوقات المتاحة لحظياً.',
          href: '/features/team',
        },
        {
          title: 'المدفوعات والعرابين',
          desc: 'استقبلي العرابين والمدفوعات بأمان مع تحويلات تلقائية.',
          href: '/features/payments',
        },
        {
          title: 'إدارة العميلات',
          desc: 'ملفات وسجل وولاء يبقي عميلاتكِ يعدن إليكِ.',
          href: '/features/clients',
        },
        {
          title: 'التسويق والتذكيرات',
          desc: 'تذكيرات وعروض تلقائية تقلّل من المواعيد الفائتة.',
          href: '/features/marketing',
        },
        {
          title: 'التحليلات والتقارير',
          desc: 'تابعي الإيرادات وأفضل الخدمات والنمو من لوحة واحدة.',
          href: '/features/reports',
        },
      ],
    },
    howItWorks: {
      eyebrow: 'بسيطة بالتصميم',
      title: 'انطلقي في ثلاث خطوات بسيطة',
      steps: [
        {
          title: 'أنشئي صفحتكِ',
          desc: 'جهّزي صفحة الحجز بعلامتكِ التجارية خلال دقائق، دون خبرة تقنية.',
        },
        {
          title: 'أضيفي الخدمات والفريق',
          desc: 'أدرجي خدماتكِ وأسعاركِ وأخصائياتكِ، ثم حدّدي أوقاتكِ المتاحة.',
        },
        {
          title: 'ابدئي النمو',
          desc: 'استقبلي الحجوزات والمدفوعات إلكترونياً وشاهدي تقويمكِ يمتلئ.',
        },
      ],
    },
    salons: {
      eyebrow: 'قصص نجاح',
      title: 'صالونات تنمو مع دلال',
      viewAll: 'عرض الكل',
      reviews: 'تقييم',
      bookingsPerMonth: 'حجز / شهرياً',
      viewSalon: 'عرض الصالون',
      emptyTitle: 'قريباً',
      emptyDesc: 'صالونات مميزة ستظهر هنا قريباً.',
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
