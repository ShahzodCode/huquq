import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

// Old links looked like "#huquqlar" / "#modda-50"; HashRouter wants "#/huquqlar".
const h = location.hash;
if (h && !h.startsWith("#/")) location.replace("#/" + h.slice(1));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
