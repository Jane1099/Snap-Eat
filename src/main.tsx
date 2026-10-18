import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

if (localStorage.getItem('mind-eat-theme') === 'light') document.documentElement.classList.add('light');
createRoot(document.getElementById("root")!).render(<App />);
