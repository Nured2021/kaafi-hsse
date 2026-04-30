import React from "react";
import { createRoot } from "react-dom/client";
import AI from "./AI.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AI />
  </React.StrictMode>
);
