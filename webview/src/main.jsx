import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.jsx";

const root = document.getElementById("root");
const rawBootstrap = root?.dataset.bootstrap ?? "{}";
const bootstrap = JSON.parse(rawBootstrap);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App bootstrap={bootstrap} />
  </React.StrictMode>,
);
