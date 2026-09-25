# -*- coding: utf-8 -*-
"""ملف Excel: الدراسة المالية — التكاليف التأسيسية، التشغيلية، خطة التوظيف، وتوقعات 12 شهراً.
يُكمِّل هذا الملف make_excel.py (الذي يحسب التكلفة الحدّية لكل صالون بلا رواتب فريق)
بإضافة خطة توظيف فعلية وتوقعات ربح/خسارة شهرية كاملة على مدى سنة.
"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

DARK = "9D174D"
thin = Side(style="thin", color="E4E4E7")
border = Border(left=thin, right=thin, top=thin, bottom=thin)
SAR = '#,##0" ر.س"'
YEL = PatternFill("solid", fgColor="FEF9C3")
GREEN = Font(bold=True, color="166534")
RED = Font(bold=True, color="B91C1C")

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


def data_row(ws, row, values, fmts=None, start_col=2):
    for j, v in enumerate(values):
        cell = ws.cell(row=row, column=start_col + j, value=v)
        cell.border = border
        cell.alignment = Alignment(vertical="center", wrap_text=True,
                                    horizontal="center" if isinstance(v, (int, float)) else "right")
        if fmts and j < len(fmts) and fmts[j]:
            cell.number_format = fmts[j]


# ============ 1) التكاليف التأسيسية ============
ws = wb.active
ws.title = "التكاليف التأسيسية"
ws.sheet_view.rightToLeft = True
title_cell(ws, "B2", "التكاليف التأسيسية لمرة واحدة")
ws["B3"] = "منصة دلال — قبل استقبال أول عميل مدفوع"
ws["B3"].font = Font(size=11, color="71717A")

ws["B5"], ws["C5"], ws["D5"] = "البند", "التكلفة (ر.س)", "ملاحظة"
style_header(ws, 5, [2, 3, 4])

setup_costs = [
    ("سجل تجاري + معروف + غرفة تجارة + عنوان وطني", 1000, "إلزامي قبل أي بيع"),
    ("تفعيل حساب تاجر (Moyasar/Tap)", 1000, "رسوم تفعيل تقديرية لبوابة الدفع"),
    ("دومين + بريد رسمي + أدوات (سنة أولى)", 500, "Google Workspace/Zoho + دومين"),
    ("هوية بصرية + مواد تسويقية + فيديو تعريفي", 800, "شعار، بروشور، فيديو قصير"),
    ("احتياطي تشغيلي (شهرين خوادم/دعم جزئي)", 200, "الخطط المجانية تكفي البداية"),
]
r = 6
for i, (a, b, c) in enumerate(setup_costs):
    data_row(ws, r + i, [a, b, c], fmts=[None, SAR, None])

total_row = r + len(setup_costs)
ws.cell(row=total_row, column=2, value="الإجمالي").font = Font(bold=True)
ws.cell(row=total_row, column=3, value=f"=SUM(C{r}:C{r + len(setup_costs) - 1})").number_format = SAR
ws.cell(row=total_row, column=3).font = Font(bold=True, color=DARK)
ws.cell(row=total_row, column=2).fill = ws.cell(row=total_row, column=3).fill = YEL
for c in (2, 3, 4):
    ws.cell(row=total_row, column=c).border = border

note(ws, f"B{total_row + 2}", "مطابق لتقدير وثيقة شروط-البدء.html — الاستثمار الأولي محدود لأن البنية التقنية (MVP) جاهزة مسبقاً.")
for col, w in zip("BCD", [46, 18, 42]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

# ============ 2) التشغيلية الشهرية ============
ws = wb.create_sheet("التشغيلية الشهرية")
ws.sheet_view.rightToLeft = True
title_cell(ws, "B2", "التكاليف التشغيلية الشهرية")
ws["B3"] = "التكلفة المتغيرة لكل صالون + تكلفة الخوادم حسب حجم القاعدة"
ws["B3"].font = Font(size=11, color="71717A")

ws["B5"] = "أولاً: التكلفة المتغيرة لكل صالون شهرياً (100 موعد، سعر خدمة 300 ر.س)"
ws["B5"].font = Font(bold=True, size=12, color=DARK)
ws["B6"], ws["C6"], ws["D6"] = "البند", "التكلفة (ر.س)", "طريقة الحساب"
style_header(ws, 6, [2, 3, 4])

var_costs = [
    ("رسائل واتساب (Meta Cloud API)", 7.5, "100 موعد × 3 رسائل × 2.5 هللة"),
    ("رسوم بوابة الدفع على العربون", 90, "100 × 300 × 20% عربون × 1.5% عمولة"),
    ("تكلفة اكتساب العميل (CAC) موزعة", 30, "360 ر.س ÷ 12 شهراً"),
]
for i, (a, b, c) in enumerate(var_costs):
    data_row(ws, 7 + i, [a, b, c], fmts=[None, SAR, None])

ws["B10"] = "إجمالي التكلفة المتغيرة/صالون"
ws["C10"] = "=SUM(C7:C9)"
ws["B10"].font = Font(bold=True)
ws["C10"].font = Font(bold=True, color=DARK)
ws["C10"].number_format = SAR
ws["B10"].fill = ws["C10"].fill = YEL

ws["B13"] = "ثانياً: تكلفة الخوادم حسب حجم القاعدة الكاملة (لا لكل صالون)"
ws["B13"].font = Font(bold=True, size=12, color=DARK)
ws["B14"], ws["C14"], ws["D14"] = "نطاق عدد الصالونات", "الاستضافة+قاعدة البيانات/شهر", "ملاحظة"
style_header(ws, 14, [2, 3, 4])

servers = [
    ("حتى 25", 0, "خطط مجانية تكفي بسهولة"),
    ("26–100", 680, "خطة Pro لقاعدة البيانات"),
    ("101–300", 1040, "قاعدة أكبر + نسخ احتياطي يومي"),
    ("301–700", 2640, "خوادم داخل السعودية (PDPL)"),
    ("701–1500", 4980, "توسع بنيوي + موازنات حمل"),
]
for i, (a, b, c) in enumerate(servers):
    data_row(ws, 15 + i, [a, b, c], fmts=[None, SAR, None])

note(ws, "B21", "مصدر الأرقام: ورقتا 'تكلفة' و'خوادم' في دلال-تكاليف-التشغيل.xlsx — بلا أي رواتب فريق (تلك في ورقة خطة التوظيف).")
for col, w in zip("BCD", [30, 22, 46]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

# ============ 3) خطة التوظيف ============
ws = wb.create_sheet("خطة التوظيف")
ws.sheet_view.rightToLeft = True
title_cell(ws, "B2", "خطة التوظيف المتدرجة")
ws["B3"] = "رواتب واقعية للسوق السعودي 2026 — تُفعَّل كل مرحلة عند تجاوز عتبة الصالونات"
ws["B3"].font = Font(size=11, color="71717A")

ws["B5"], ws["C5"], ws["D5"], ws["E5"], ws["F5"] = "المرحلة", "نطاق الصالونات", "الأدوار المضافة", "التكلفة/شهر", "إجمالي فريق/شهر"
style_header(ws, 5, [2, 3, 4, 5, 6])

hiring = [
    ("1 — الانطلاق", "0–20", "مؤسس (بلا راتب) + مسوّقة بدوام جزئي", 1800, 1800),
    ("2 — التوسع الأولي", "21–100", "+ موظفة دعم بدوام جزئي", 3000, 4800),
    ("3 — التثبيت", "101–200", "مسوّقة ودعم دوام كامل + مندوبة مبيعات", 3800 + 4500 + 6150 - 4500, 14450),
    ("4 — النمو", "201–300+", "+ دعم ثانية دوام كامل + مساعدة مبيعات", 8650, 23100),
]
for i, (a, b, c, d, e) in enumerate(hiring):
    rr = 6 + i
    data_row(ws, rr, [a, b, c, d, e], fmts=[None, None, None, SAR, SAR])
    ws.cell(row=rr, column=6).font = Font(bold=True, color=DARK)

ws["B12"] = "الأساس المرجعي للرواتب الفردية"
ws["B12"].font = Font(bold=True, size=12, color=DARK)
ws["B13"], ws["C13"], ws["D13"] = "الدور", "بدوام جزئي (ر.س)", "بدوام كامل (ر.س)"
style_header(ws, 13, [2, 3, 4])

roles = [
    ("مسوّقة", "1,500–2,000", "4,000–5,000"),
    ("موظفة دعم", "2,500–3,500", "5,000–6,500"),
    ("مندوبة مبيعات", "—", "أساسي 2,500–3,500 + عمولة"),
]
for i, (a, b, c) in enumerate(roles):
    data_row(ws, 14 + i, [a, b, c])

note(ws, "B18", "قاعدة الدعم: موظفة واحدة تخدم ~150 صالوناً بارتياح — مطابقة لورقة 'الدعم' في دلال-تكاليف-التشغيل.xlsx.")
for col, w in zip("BCDEF", [20, 16, 40, 16, 18]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

# ============ 4) التوقعات 12 شهراً ============
ws = wb.create_sheet("التوقعات 12 شهراً")
ws.sheet_view.rightToLeft = True
title_cell(ws, "B2", "توقعات مالية 12 شهراً — مسار النمو الطموح")
ws["B3"] = "الافتراض: متوسط اشتراك 400 ر.س/صالون، تكلفة متغيرة 130 ر.س/صالون"
ws["B3"].font = Font(size=11, color="71717A")

ws["B5"], ws["C5"], ws["D5"], ws["E5"], ws["F5"], ws["G5"], ws["H5"], ws["I5"] = (
    "الشهر", "صالونات نشطة", "الإيراد (MRR)", "تكلفة متغيرة", "خوادم", "فريق", "إجمالي التكاليف", "صافي الشهر"
)
style_header(ws, 5, [2, 3, 4, 5, 6, 7, 8, 9])
ws["J5"] = "صافٍ تراكمي"
style_header(ws, 5, [10])

counts = [5, 10, 20, 35, 55, 80, 110, 145, 180, 220, 260, 300]
servers_cost = [0, 0, 0, 680, 680, 680, 1040, 1040, 1040, 1040, 1040, 1040]
staff_cost = [1800, 1800, 1800, 4800, 4800, 4800, 14450, 14450, 14450, 23100, 23100, 23100]

for i, n in enumerate(counts):
    rr = 6 + i
    ws.cell(row=rr, column=2, value=i + 1).border = border
    ws.cell(row=rr, column=3, value=n).border = border
    ws.cell(row=rr, column=3).font = Font(bold=True)
    ws.cell(row=rr, column=4, value=f"=C{rr}*400").number_format = SAR
    ws.cell(row=rr, column=5, value=f"=C{rr}*130").number_format = SAR
    ws.cell(row=rr, column=6, value=servers_cost[i]).number_format = SAR
    ws.cell(row=rr, column=7, value=staff_cost[i]).number_format = SAR
    ws.cell(row=rr, column=8, value=f"=E{rr}+F{rr}+G{rr}").number_format = SAR
    ws.cell(row=rr, column=8).font = Font(bold=True)
    ws.cell(row=rr, column=9, value=f"=D{rr}-H{rr}").number_format = SAR
    net_cell = ws.cell(row=rr, column=9)
    ws.cell(row=rr, column=10,
            value=f"=I{rr}" if i == 0 else f"=J{rr - 1}+I{rr}").number_format = SAR
    for c in range(2, 11):
        ws.cell(row=rr, column=c).border = border

ws["B19"] = "نقطة التعادل — أول شهر صافٍ موجب"
ws["B19"].font = Font(bold=True)
ws["C19"] = "=MATCH(TRUE,INDEX(I6:I17>0,0),0)"
ws["C19"].font = GREEN
ws["B20"] = "الصافي التراكمي نهاية السنة"
ws["C20"] = "=J17"
ws["C20"].number_format = SAR
ws["C20"].font = GREEN
ws["C20"].fill = YEL

note(ws, "B22", "تحذير: مسار نمو طموح (تقريباً مضاعف شهرياً في أول 6 أشهر). راجع ورقة تحليل الحساسية والخطة التشغيلية لمسارات أبطأ وأكثر تحفظاً.")
for col, w in zip("BCDEFGHIJ", [8, 14, 14, 14, 12, 14, 16, 14, 16]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

# ============ 5) تحليل الحساسية ============
ws = wb.create_sheet("تحليل الحساسية")
ws.sheet_view.rightToLeft = True
title_cell(ws, "B2", "تحليل الحساسية")

ws["B4"] = "أولاً: عدد الصالونات المطلوب للتعادل عند كل مرحلة توظيف (هامش مساهمة 270 ر.س/صالون)"
ws["B4"].font = Font(bold=True, size=12, color=DARK)
ws["B5"], ws["C5"], ws["D5"] = "المرحلة", "التكاليف الثابتة (فريق+خوادم)", "صالونات مطلوبة للتعادل"
style_header(ws, 5, [2, 3, 4])

thresholds = [
    ("1 — الانطلاق", 1800),
    ("2 — التوسع الأولي", 5480),
    ("3 — التثبيت", 15490),
    ("4 — النمو", 24140),
]
for i, (a, b) in enumerate(thresholds):
    rr = 6 + i
    data_row(ws, rr, [a, b, f"=ROUNDUP(C{rr}/270,0)"], fmts=[None, SAR, '0" صالون"'])
    ws.cell(row=rr, column=4).font = Font(bold=True, color=DARK)

ws["B12"] = "ثانياً: أثر معدل الاضطراب (Churn) الشهري على قاعدة 150 صالوناً"
ws["B12"].font = Font(bold=True, size=12, color=DARK)
ws["B13"], ws["C13"], ws["D13"], ws["E13"] = "معدل Churn شهري", "صالونات مفقودة/شهر", "تكلفة تعويض (CAC 360 ر.س)", "ملاحظة"
style_header(ws, 13, [2, 3, 4, 5])

churn = [
    (0.03, "صحي لـ SaaS B2B محلي"),
    (0.07, "تحذير — يستدعي مراجعة الاحتفاظ"),
    (0.12, "خطر حقيقي على النمو التراكمي"),
]
for i, (rate, note_txt) in enumerate(churn):
    rr = 14 + i
    ws.cell(row=rr, column=2, value=rate).number_format = "0%"
    ws.cell(row=rr, column=3, value=f"=ROUND(150*B{rr},1)").number_format = "0.0"
    ws.cell(row=rr, column=4, value=f"=C{rr}*360").number_format = SAR
    ws.cell(row=rr, column=5, value=note_txt)
    for c in range(2, 6):
        ws.cell(row=rr, column=c).border = border
        ws.cell(row=rr, column=c).alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

note(ws, "B18", "خلاصة: Churn أعلى من ~7% شهرياً يجعل مسار '300 صالون بنهاية السنة' غير قابل للتحقق حتى مع ثبات معدل الاكتساب.")
for col, w in zip("BCDE", [26, 24, 26, 44]):
    ws.column_dimensions[col].width = w
ws.column_dimensions["A"].width = 2

wb.save("دلال-الدراسة-المالية.xlsx")
print("saved OK")
