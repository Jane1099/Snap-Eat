import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { initializeTheme } from "./lib/theme";

initializeTheme();
createRoot(document.getElementById("root")!).render(<App />);
