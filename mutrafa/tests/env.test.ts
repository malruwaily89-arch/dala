import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { sandboxPaymentsAllowed } from "../lib/env";

const original = { ...process.env };
const env = process.env as Record<string, string | undefined>;
const setEnv = (key: string, value: string) => {
  env[key] = value;
};
afterEach(() => {
  for (const key of Object.keys(env)) delete env[key];
  Object.assign(env, original);
});

test("الدفع التجريبي متاح في التطوير، ومعطّل في الإنتاج ما لم يُفعَّل صراحة", () => {
  setEnv("NODE_ENV", "development");
  assert.equal(sandboxPaymentsAllowed(), true);

  setEnv("NODE_ENV", "production");
  delete env.ALLOW_SANDBOX_PAYMENTS;
  assert.equal(sandboxPaymentsAllowed(), false, "لا يُقبل في الإنتاج افتراضياً");

  setEnv("ALLOW_SANDBOX_PAYMENTS", "true");
  assert.equal(sandboxPaymentsAllowed(), true);
});
