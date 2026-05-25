import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

if (!window.location.pathname.startsWith("/admin")) {
  const targetPath = "/admin" + window.location.pathname + window.location.search + window.location.hash;
  window.location.replace(targetPath);
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}



