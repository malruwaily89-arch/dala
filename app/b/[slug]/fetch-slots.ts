"use server";

import { getAvailableSlots, getAvailableSlotsAnyStaff } from "@/lib/scheduling";

export async function fetchSlotsAction(params: {
  tenantId: string;
  staffId: string;
  serviceId: string;
  dateIso: string;
}): Promise<string[]> {
  const { tenantId, staffId, serviceId, dateIso } = params;
  const date = new Date(dateIso);
  const slots =
    staffId === "any"
      ? await getAvailableSlotsAnyStaff({ tenantId, serviceId, date })
      : await getAvailableSlots({ tenantId, staffId, serviceId, date });
  return slots.map((s) => s.toISOString());
}
