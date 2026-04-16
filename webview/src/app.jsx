import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ApiHelper, CLL, Lineage } from "./vendor/altimate/altimate-components.js";
import "./app.css";

const vscode =
  typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : undefined;

const pendingRequests = new Map();

function postMessage(message) {
  if (vscode) {
    vscode.postMessage(message);
  }
}

function executeRequest(command, params = {}) {
  const syncRequestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    pendingRequests.set(syncRequestId, { resolve, reject });
    postMessage({
      command,
      syncRequestId,
      args: { params },
    });
  });
}

ApiHelper.get = async (url, data = {}) => executeRequest(url, data);
ApiHelper.post = async (url, data = {}) => executeRequest(url, data);

function setBodyTheme(theme) {
  document.body.classList.remove("vscode-dark", "vscode-light");
  document.body.classList.add(theme === "dark" ? "vscode-dark" : "vscode-light");
}

export default function App({ bootstrap }) {
  const [theme, setTheme] = useState(bootstrap.theme ?? "dark");
  const [dynamicLineage, setDynamicLineage] = useState(
    bootstrap.dynamicLineage,
  );

  useEffect(() => {
    setBodyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!dynamicLineage) {
      return;
    }

    document.dispatchEvent(
      new CustomEvent("renderStartNode", {
        detail: {
          ...dynamicLineage,
          lightdashEnabled: false,
          showCodeModal: true,
          config: { exportFinalLineage: false },
        },
      }),
    );
  }, [dynamicLineage]);

  useEffect(() => {
    const handleMessage = (event) => {
      const { command, args } = event.data ?? {};
      if (command === "response" && args?.syncRequestId) {
        const pending = pendingRequests.get(args.syncRequestId);
        if (!pending) {
          return;
        }
        pendingRequests.delete(args.syncRequestId);
        if (args.status) {
          pending.resolve(args.body);
        } else {
          pending.reject(new Error(args.error ?? "Request failed"));
        }
        return;
      }

      if (command === "render") {
        setDynamicLineage(args);
        return;
      }

      if (command === "setTheme") {
        setTheme(args?.theme ?? "dark");
        return;
      }

      if (command === "columnLineage" && args?.event === "cancel") {
        CLL.onCancel();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const content = useMemo(() => {
    if (!dynamicLineage) {
      return null;
    }

    return (
      <Lineage
        theme={theme}
        lineageType="dynamic"
        dynamicLineage={dynamicLineage}
        allowSyncColumnsWithDB={false}
      />
    );
  }, [dynamicLineage, theme]);

  return <div className="lineage-root">{content}</div>;
}
