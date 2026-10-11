import { db } from "./db";

/** سجل التدقيق: كل فعل حسّاس يُسجَّل (يُعرض في الألماسية فقط) */
export async function audit(params: {
  salonId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await db.auditLog.create({
    data: {
      salonId: params.salonId,
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      meta: params.meta ? (params.meta as object) : undefined,
    },
  });
}
