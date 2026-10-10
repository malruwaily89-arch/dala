import { cancelAppointmentAction, completeAppointmentAction, confirmDepositAction, noShowAppointmentAction } from "@/app/actions/appointments";
import { btnDanger } from "../ui";

/** أزرار الإجراء حسب حالة الموعد — تظهر فقط لمن يملك صلاحية إدارة المواعيد.
 * الإجراء التالي المتوقع (التأكيد والإكمال) بلون البراند، والثانوي بإطار هادئ، والإلغاء بلون الخطر */
const btnNext = "inline-flex items-center justify-center rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-deep";
const btnSecondary = "inline-flex items-center justify-center rounded-full border border-brand/25 bg-white px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand-soft";

export function AppointmentActions({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING_DEPOSIT" && (
        <form action={confirmDepositAction}>
          <input type="hidden" name="id" value={id} />
          <button className={btnNext}>تأكيد العربون (تحويل)</button>
        </form>
      )}
      {status === "CONFIRMED" && (
        <>
          <form action={completeAppointmentAction}>
            <input type="hidden" name="id" value={id} />
            <button className={btnNext}>مكتمل</button>
          </form>
          <form action={noShowAppointmentAction}>
            <input type="hidden" name="id" value={id} />
            <button className={btnSecondary}>لم تحضر</button>
          </form>
        </>
      )}
      {(status === "CONFIRMED" || status === "PENDING_DEPOSIT") && (
        <form action={cancelAppointmentAction}>
          <input type="hidden" name="id" value={id} />
          <button className={btnDanger}>إلغاء</button>
        </form>
      )}
    </div>
  );
}
