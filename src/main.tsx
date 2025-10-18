import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CustomerProvider } from "./contexts/CustomerContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CustomerProvider>
      <App />
    </CustomerProvider>
  </StrictMode>
);
