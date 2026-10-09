import { cancelAppointmentAction, completeAppointmentAction, confirmDepositAction, noShowAppointmentAction } from "@/app/actions/appointments";
import { btnDanger, btnGhost } from "../ui";

/** أزرار الإجراء حسب حالة الموعد — تظهر فقط لمن يملك صلاحية إدارة المواعيد */
export function AppointmentActions({ id, status }: { id: string; status: string }) {
  const btn = `${btnGhost} px-3 py-1.5 text-xs`;
  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING_DEPOSIT" && (
        <form action={confirmDepositAction}>
          <input type="hidden" name="id" value={id} />
          <button className={btn}>تأكيد العربون (تحويل)</button>
        </form>
      )}
      {status === "CONFIRMED" && (
        <>
          <form action={completeAppointmentAction}>
            <input type="hidden" name="id" value={id} />
            <button className={btn}>مكتمل</button>
          </form>
          <form action={noShowAppointmentAction}>
            <input type="hidden" name="id" value={id} />
            <button className={btn}>لم تحضر</button>
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
