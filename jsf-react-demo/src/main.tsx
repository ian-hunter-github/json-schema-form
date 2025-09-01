import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Import modified base styles for class-based theming
import "./base-styles.css";
import "../../packages/jsf-react/src/styles/base/_components.css";
// Import themes
import "./themes.css";

createRoot(document.getElementById("root")!).render(<App />);
