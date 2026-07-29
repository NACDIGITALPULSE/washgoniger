import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * When the user comes back from iPay Money, restore the pending order context
 * and route them to the confirmation screen (unless they're already on it).
 */
export const IPayReturnHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/order-confirmation") return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("washgo_pending_ipay");
    } catch {
      return;
    }
    if (!raw) return;
    try {
      const ctx = JSON.parse(raw);
      // Expire after 2h
      if (!ctx?.order || (ctx.ts && Date.now() - ctx.ts > 2 * 60 * 60 * 1000)) {
        localStorage.removeItem("washgo_pending_ipay");
        return;
      }
      localStorage.removeItem("washgo_pending_ipay");
      navigate("/order-confirmation", {
        replace: true,
        state: {
          order: ctx.order,
          adminWhatsApp: ctx.adminWhatsApp,
          clientWhatsApp: ctx.clientWhatsApp,
          fromIpay: true,
        },
      });
    } catch {
      localStorage.removeItem("washgo_pending_ipay");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
