# -*- coding: utf-8 -*-
"""ملف Excel: تكاليف تشغيل منصة دلال — مراجع معادلات صريحة ومُتحقق منها"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

DARK = "9D174D"
thin = Side(style="thin", color="E4E4E7")
border = Border(left=thin, right=thin, top=thin, bottom=thin)
SAR = '#,##0" ر.س"'
PCT = "0.0%"
YEL = PatternFill("solid", fgColor="FEF9C3")

wb = Workbook()


def style_header(ws, row, cols):
    for c in cols:
        cell = ws.cell(row=row, column=c)
        cell.font = Font(bold=True, color="FFFFFF", size=11)
        cell.fill = PatternFill("solid", fgColor=DARK)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border


def title_cell(ws, ref, text):
    ws[ref] = text
    ws[ref].font = Font(bold=True, size=14, color=DARK)


def note(ws, ref, text):
    ws[ref] = text
    ws[ref].font = Font(size=9, italic=True, color="71717A")
    ws[ref].alignment = Alignment(wrap_text=True, vertical="top")


def data_row(ws, row, values, fmts=None, bold=False):
    for j, v in enumerate(values):
        cell = ws.cell(row=row, column=2 + j, value=v)
        cell.border = border
        cell.alignment = Alignment(vertical="center", wrap_text=True,
                                   horizontal="center" if isinstance(v, (int, float)) else "right")
        if bold:
            cell.font = Font(bold=True)
        if fmts and j < len(fmts) and fmts[j]:
            cell.number_format = fmts[j]


# ============ 1) الملخص التنفيذي ============
ws = wb.active
ws.title = "الملخص التنفيذي"
ws.sheet_view.rightToLeft = True
ws["B2"] = "منصة دلال — الملخص التنفيذي للتكاليف والإيرادات"
ws["B2"].font = Font(bold=True, size=16, color=DARK)
ws["B3"] = "نظام إدارة مواعيد الصالونات النسائية"
ws["B3"].font = Font(size=11, color="71717A")

ws["B5"], ws["C5"], ws["D5"] = "البند", "القيمة", "ملاحظة"
style_header(ws, 5, [2, 3, 4])

# الصفوف 6-12 (مراجع ثابتة معروفة)
data = [
    ("متوسط الإيراد الشهري للعميلة (اشتراك)", 400, "وسيط بين باقة 199 و999 ريال — خلية مرجعية C6", SAR),
    ("تكلفة خدمة الصالون الواحد شهرياً", "=تكلفة!C21", "مربوط بورقة التكلفة — تتحدث تلقائياً", SAR),
    ("هامش الربح الإجمالي (متوسط)", "=1-C7/C6", "بعد كل التكاليف المباشرة", PCT),
    ("استثمار البدء المطلوب", 3500, "تفصيله في PDF شروط البدء", SAR),
    ("نقطة التعادل", "=السيناريوهات!C18", "أول شهر صافٍ موجب — من ورقة السيناريوهات", '0" أشهر"'),
    ("المستهدف سنة أولى (صالونات)", 300, "هدف تسويقي", '0" صالون"'),
    ("الإيراد الشهري المتوقع عند 300 صالون", "=C6*C11", "متوسط الاشتراك × عدد الصالونات", SAR),
]
r = 6
for i, (a, b, c, fmt) in enumerate(data):
    rr = r + i
    data_row(ws, rr, [a, b, c], fmts=[None, fmt, None])
    ws.cell(row=rr, column=3).font = Font(bold=True, color=DARK)

for ref in ["C9", "C11", "C12"]:
    ws[ref].fill = YEL
note(ws, "B14", "الخلايا الصفراء أهداف/قرارات. كل ما عداه معادلات حية مرتبطة بالأوراق الأخرى.")
for col, w in zip("BCD", [42, 18, 46]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

# ============ 2) تكلفة الصالون الواحد ============
ws = wb.create_sheet("تكلفة")
ws.sheet_view.rightToLeft = True
title_cell(ws, "B2", "تكلفة خدمة الصالون الواحد شهرياً")
ws["B4"] = "أولاً: الافتراضات (عدّل الخلايا الزرقاء — الكل يُعاد حسابه)"
ws["B4"].font = Font(bold=True, size=12, color=DARK)

# صفوف الافتراضات: 5..10 — مراجعها أدناه ثابتة
assumptions = [
    ("متوسط المواعيد شهرياً (خط أساس)", 100, '0" موعد"'),
    ("رسائل واتساب لكل موعد (تأكيد+تذكير+متابعة)", 3, "0"),
    ("سعر رسالة واتساب (هللة)", 2.5, '0.0" هللة"'),
    ("متوسط سعر الخدمة", 300, SAR),
    ("نسبة العربون من سعر الخدمة", 0.2, PCT),
    ("عمولة بوابة الدفع (على العربون)", 0.015, PCT),
]
for i, (name, val, fmt) in enumerate(assumptions):
    rr = 5 + i
    data_row(ws, rr, [name, val, ""], fmts=[None, fmt, None])
    ws.cell(row=rr, column=3).font = Font(color="0000FF", bold=True)

ws["B12"] = "ثانياً: بنود التكلفة الشهرية"
ws["B12"].font = Font(bold=True, size=12, color=DARK)
ws["B13"], ws["C13"], ws["D13"] = "البند", "التكلفة/شهر", "طريقة الحساب"
style_header(ws, 13, [2, 3, 4])

costs = [
    ("رسائل واتساب (Meta Cloud API)", "=C5*C6*C7/100", "المواعيد × الرسائل × سعر الرسالة (هللة÷100)"),
    ("رسوم بوابة الدفع (على العربون)", "=C5*C8*C9*C10", "المواعيد × السعر × العربون × العمولة"),
    ("حصة الصالون من الخوادم", "=خوادم!E9/خوادم!C15", "خوادم 300 صالون ÷ 300"),
    ("حصة الصالون من الدعم الفني", "=الدعم!E13/خوادم!C15", "تكلفة الدعم الكلية عند 300 ÷ 300 صالون"),
    ("حصة الصالون من تكلفة اكتساب العميل", 30, "CAC موزعة على 12 شهراً"),
]
for i, (a, b, c) in enumerate(costs):
    rr = 14 + i
    data_row(ws, rr, [a, b, c], fmts=[None, SAR, None])
    ws.cell(row=rr, column=4).font = Font(size=9, color="71717A")

ws["B20"] = "إجمالي تكلفة الصالون الواحد شهرياً"
ws["C20"] = "=SUM(C14:C18)"
ws["B20"].font = ws["C20"].font = Font(bold=True, size=12)
ws["C20"].number_format = SAR
ws["B20"].fill = ws["C20"].fill = YEL

ws["B22"], ws["C22"] = "الاشتراك المحصل (متوسط)", 400
ws["C22"].number_format = SAR
ws["C22"].font = Font(color="0000FF", bold=True)
ws["B23"] = "هامش الربح الشهري لكل صالون"
ws["C23"] = "=C22-C20"
ws["C23"].number_format = SAR
ws["C23"].font = Font(bold=True, color="166534")
ws["B24"] = "نسبة الهامش"
ws["C24"] = "=C23/C22"
ws["C24"].number_format = PCT
ws["C24"].font = Font(bold=True, color="166534")

note(ws, "B26", "الأرقام محافظة: رسائل Meta الخدمية أرخص فعلياً، والدعم ينخفض مع قاعدة المعرفة والفيديوهات.")
for col, w in zip("BCD", [42, 16, 52]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

# ============ 3) الخوادم ============
ws = wb.create_sheet("خوادم")
ws.sheet_view.rightToLeft = True
title_cell(ws, "B2", "تكلفة الخوادم حسب حجم المنصة")
ws["B4"], ws["C4"], ws["D4"], ws["E4"], ws["F4"] = "عدد الصالونات", "الاستضافة (Vercel)", "قاعدة البيانات (Supabase)", "الإجمالي/شهر", "ملاحظات"
style_header(ws, 4, [2, 3, 4, 5, 6])

servers = [
    (25, 0, 0, "خطط مجانية تكفي بسهولة"),
    (100, 320, 360, "خطة Pro لقاعدة البيانات"),
    (300, 320, 720, "قاعدة أكبر + نسخ احتياطي يومي"),
    (700, 1200, 1440, "خوادم داخل السعودية (متطلبات PDPL)"),
    (1500, 2100, 2880, "توسع بنيوي + موازنات حمل"),
]
for i, (n, v, d, m) in enumerate(servers):
    rr = 5 + i
    data_row(ws, rr, [n, v, d, f"=C{rr}+D{rr}", m], fmts=['0', SAR, SAR, SAR, None])
    ws.cell(row=rr, column=2).font = Font(bold=True)

ws["B12"] = "الإجمالي السنوي عند 300 صالون"
ws["E12"] = "=E7*12"
ws["E12"].number_format = SAR
ws["E12"].font = Font(bold=True)

ws["B14"] = "قيم مرجعية تستخدمها ورقة التكلفة:"
ws["B14"].font = Font(bold=True, size=11, color=DARK)
ws["B15"], ws["C15"] = "عدد الصالونات المرجعي", 300
ws["C15"].font = Font(color="0000FF", bold=True)

note(ws, "B18", "PDPL: عند تجاوز ~500 صالون يُنصح بترحيل لخوادم داخل المملكة (STC/Oracle الرياض) — التكلفة مشمولة في صف 700+.")
for col, w in zip("BCDEF", [16, 20, 26, 16, 44]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

# ============ 4) الدعم ============
ws = wb.create_sheet("الدعم")
ws.sheet_view.rightToLeft = True
title_cell(ws, "B2", "تكلفة الدعم الفني الشهرية")
ws["B4"], ws["C4"], ws["D4"], ws["E4"] = "عدد الصالونات", "موظفو الدعم", "التكلفة/شهر", "ملاحظة"
style_header(ws, 4, [2, 3, 4, 5])

sup = [
    (50, 1, 6150, "موظف واحد + أدوات"),
    (150, 1, 6150, "الحد الأقصى لموظف واحد"),
    (400, 2, 12300, "فريق من اثنين"),
    (1000, 4, 24600, "فريق + نوبات"),
]
for i, (n, s, c, m) in enumerate(sup):
    rr = 5 + i
    data_row(ws, rr, [n, s, c, m], fmts=['0', '0', SAR, None])
    ws.cell(row=rr, column=2).font = Font(bold=True)

ws["B11"] = "الدعم المرجعي عند 300 صالون (استقراء خطي بين 150 و400)"
ws["E13"] = "=ROUND(E8+(E9-E8)*(300-150)/(400-150),0)"
ws["E13"].number_format = SAR
ws["E13"].font = Font(color="0000FF", bold=True)
ws["B13"] = "القيمة المرجعية ↑"

ws["B16"] = "توزيع تذاكر الدعم المتوقع"
ws["B16"].font = Font(bold=True, size=12, color=DARK)
ws["B17"], ws["C17"], ws["D17"] = "النوع", "النسبة", "الوسيلة"
style_header(ws, 17, [2, 3, 4])
tickets = [
    ("إعداد أول مرة (Onboarding)", 0.35, "استدعاء مجدول + فيديو تعريفي"),
    ("استفسارات استخدام", 0.45, "واتساب أعمال + قاعدة معرفة"),
    ("مشاكل تقنية فعلية", 0.15, "مراقبة استباقية تقللها"),
    ("فواتير واشتراكات", 0.05, "أتمتة كاملة"),
]
for i, (a, b, c) in enumerate(tickets):
    rr = 18 + i
    data_row(ws, rr, [a, b, c], fmts=[None, PCT, None])

note(ws, "B23", "قاعدة التشغيل: 1 موظف يخدم ~150 صالون مريحاً (~40 تذكرة/يوم). الفيديوهات وقاعدة المعرفة تخفض التذاكر ~40%.")
for col, w in zip("BCDE", [36, 14, 16, 42]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

# ============ 5) السيناريوهات ============
ws = wb.create_sheet("السيناريوهات")
ws.sheet_view.rightToLeft = True
title_cell(ws, "B2", "سيناريو أول سنة — إيراد مقابل تكلفة (محافظ)")
ws["B4"], ws["C4"], ws["D4"], ws["E4"], ws["F4"], ws["G4"] = "الشهر", "صالونات نشطة", "إيراد/شهر", "تكاليف/شهر", "صافي/شهر", "صافي تراكمي"
style_header(ws, 4, [2, 3, 4, 5, 6, 7])

counts = [5, 10, 20, 35, 55, 80, 110, 145, 180, 220, 260, 300]
for i, n in enumerate(counts):
    rr = 5 + i
    ws.cell(row=rr, column=2, value=i + 1).border = border
    ws.cell(row=rr, column=3, value=n).border = border
    ws.cell(row=rr, column=3).font = Font(bold=True)
    ws.cell(row=rr, column=4, value=f"=C{rr}*400").number_format = SAR
    ws.cell(row=rr, column=4).border = border
    # تكلفة: دعم (يتوسع كل 150 صالون) + خوادم تدرجية + تكاليف متغيرة لكل صالون
    ws.cell(row=rr, column=5, value=f"=ROUNDUP(C{rr}/150,0)*6150+IF(C{rr}<=25,0,IF(C{rr}<=100,680,IF(C{rr}<=300,1040,3120)))+C{rr}*(تكلفة!C14+تكلفة!C15+تكلفة!C18)")
    ws.cell(row=rr, column=5).number_format = SAR
    ws.cell(row=rr, column=5).border = border
    ws.cell(row=rr, column=6, value=f"=D{rr}-E{rr}").number_format = SAR
    ws.cell(row=rr, column=6).border = border
    ws.cell(row=rr, column=7, value=f"=F{rr}" if i == 0 else f"=G{rr-1}+F{rr}").number_format = SAR
    ws.cell(row=rr, column=7).border = border

ws["B18"] = "نقطة التعادل — أول شهر صافٍ موجب"
ws["B18"].font = Font(bold=True)
ws["C18"] = '=MATCH(TRUE,INDEX(F5:F16>0,0),0)'
ws["C18"].font = Font(bold=True, color="166534")
ws["B19"] = "الصافي التراكمي نهاية السنة"
ws["C19"] = "=G16"
ws["C19"].number_format = SAR
ws["C19"].font = Font(bold=True, color="166534")
ws["C19"].fill = YEL

note(ws, "B21", "محافظ: لا يشمل دفعات سنوية مقدمة (تحسّن التدفق)، ولا رسوم تثبيت، ولا خدمات ترحيل مدفوعة.")
for col, w in zip("BCDEFG", [8, 14, 16, 16, 16, 16]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

wb.save("دلال-تكاليف-التشغيل.xlsx")
print("saved OK")
