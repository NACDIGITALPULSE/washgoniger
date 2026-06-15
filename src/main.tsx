import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "./pwa/registerSW";
import { prefetchEssentials } from "./pwa/prefetchEssentials";

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Remove the boot loader once React has mounted.
requestAnimationFrame(() => {
  const loader = document.getElementById("app-boot-loader");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 350);
  }
});

registerSW();
prefetchEssentials();
