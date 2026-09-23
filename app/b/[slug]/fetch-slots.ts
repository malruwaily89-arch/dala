"use server";

import { getAvailableSlots } from "@/lib/scheduling";

export async function fetchSlotsAction(params: {
  tenantId: string;
  staffId: string;
  serviceId: string;
  dateIso: string;
}): Promise<string[]> {
  const { tenantId, staffId, serviceId, dateIso } = params;
  const date = new Date(dateIso);
  const slots = await getAvailableSlots({ tenantId, staffId, serviceId, date });
  return slots.map((s) => s.toISOString());
}
