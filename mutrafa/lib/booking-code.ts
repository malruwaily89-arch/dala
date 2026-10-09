import { randomInt } from "crypto";

/** رقم حجز قصير وواضح للعرض: MT-7K3QZ9 — بلا أحرف ملتبسة (0/O، 1/I) */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `MT-${code}`;
}

export function isBookingCode(value: string): boolean {
  return /^MT-[A-Z2-9]{6}$/.test(value);
}
