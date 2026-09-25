"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Moyasar?: { init: (config: Record<string, unknown>) => void };
  }
}

interface MoyasarCompletedPayment {
  id: string;
  status: string;
}

/**
 * نموذج دفع Moyasar (Payment Form) — يُحمَّل فقط عند توفر مفتاحي Moyasar.
 * يتولى النموذج نفسه تشفير البطاقة والاتصال بـ Moyasar، ثم يُعيد توجيه
 * العميلة إلى نفس صفحة الدفع مع ?id=... للتحقق النهائي من الخادم.
 */
export function MoyasarCheckoutForm({
  publishableKey,
  amount,
  description,
  callbackUrl,
  onPaymentCreated,
}: {
  publishableKey: string;
  amount: number; // بالريال
  description: string;
  callbackUrl: string;
  onPaymentCreated: (paymentId: string) => Promise<void>;
}) {
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !window.Moyasar) return;
    window.Moyasar.init({
      element: ".mysr-form",
      amount: Math.round(amount * 100),
      currency: "SAR",
      description,
      publishable_api_key: publishableKey,
      callback_url: callbackUrl,
      supported_networks: ["visa", "mastercard", "mada"],
      methods: ["creditcard"],
      on_completed: async (payment: MoyasarCompletedPayment) => {
        try {
          await onPaymentCreated(payment.id);
        } catch {
          // لا نمنع الاستمرار في الدفع بسبب فشل حفظ المعرّف المبكر
        }
      },
    });
  }, [scriptReady, amount, description, publishableKey, callbackUrl, onPaymentCreated]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.13/dist/moyasar.css"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.13/dist/moyasar.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="mysr-form" dir="ltr" />
    </>
  );
}
