// iPay Money checkout helper.
// Loads the official iPay checkout script and triggers a payment for an order.
// The user's browser is redirected to iPay's hosted checkout, then back to
// the Supabase edge function `ipaymoney-callback` which updates the order
// and redirects to the app tracking page.

const IPAY_PUBLIC_KEY = "pk_ce889bf4539e4c45b9db3261118449c6";
const IPAY_SCRIPT_SRC = "https://i-pay.money/checkout.js";
const CALLBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ipaymoney-callback`;

let scriptPromise: Promise<void> | null = null;

export const loadIPayScript = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${IPAY_SCRIPT_SRC}"]`,
    );
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = IPAY_SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Impossible de charger iPay Money"));
    document.head.appendChild(s);
  });
  return scriptPromise;
};

export interface IPayCheckoutParams {
  orderId: string;
  orderNumber: string;
  amount: number; // FCFA
  phone: string;
  fullName: string;
  email?: string;
  sandbox?: boolean;
}

/** Programmatically trigger iPay checkout by creating a hidden button and clicking it. */
export const startIPayCheckout = async (p: IPayCheckoutParams): Promise<void> => {
  await loadIPayScript();

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ipaymoney-button";
  btn.style.display = "none";
  btn.setAttribute("data-amount", String(Math.round(p.amount)));
  btn.setAttribute("data-environement", p.sandbox ? "sandbox" : "live");
  btn.setAttribute("data-key", IPAY_PUBLIC_KEY);
  btn.setAttribute(
    "data-transaction-id",
    `washgo-${p.orderNumber}-${Date.now()}`,
  );
  btn.setAttribute("data-sdk", "web");
  btn.setAttribute(
    "data-callback-url",
    `${CALLBACK_URL}?state=${encodeURIComponent(p.orderId)}`,
  );
  btn.setAttribute("data-phone", p.phone);
  btn.setAttribute("data-full-name", p.fullName);
  if (p.email) btn.setAttribute("data-email", p.email);
  document.body.appendChild(btn);
  btn.click();
  setTimeout(() => btn.remove(), 5000);
};
