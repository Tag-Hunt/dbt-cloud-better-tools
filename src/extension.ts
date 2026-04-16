import * as vscode from "vscode";
import {
  getColumns,
  getDownstreamTables,
  getExposureDetails,
  getRootLineage,
  getUpstreamTables,
} from "./lineageDemoData";

export function activate(context: vscode.ExtensionContext): void {
  const helloWorld = vscode.commands.registerCommand(
    "dbtCloudBetterTools.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello from dbt Cloud Better Tools.");
    },
  );

  const openLineageDemo = vscode.commands.registerCommand(
    "dbtCloudBetterTools.openLineageDemo",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "dbtCloudBetterTools.lineageDemo",
        "Lineage Demo",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
        },
      );

      const readmePath = vscode.Uri.joinPath(
        context.extensionUri,
        "README.md",
      ).fsPath;
      const bootstrap = {
        theme: getTheme(),
        dynamicLineage: getRootLineage(readmePath),
      };

      panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, bootstrap);

      const themeListener = vscode.window.onDidChangeActiveColorTheme(() => {
        panel.webview.postMessage({
          command: "setTheme",
          args: { theme: getTheme() },
        });
      });

      const messageListener = panel.webview.onDidReceiveMessage(async (message) => {
        const { command, syncRequestId, args } = message as {
          command: string;
          syncRequestId?: string;
          args?: { params?: Record<string, unknown> };
        };
        const params = args?.params ?? {};
        const response = (body: unknown, status = true, error?: string) => {
          if (!syncRequestId) {
            return;
          }
          panel.webview.postMessage({
            command: "response",
            args: {
              syncRequestId,
              status,
              body,
              error,
            },
          });
        };

        try {
          switch (command) {
            case "upstreamTables":
              response({
                tables: getUpstreamTables(String(params.table ?? ""), readmePath),
              });
              return;
            case "downstreamTables":
              response({
                tables: getDownstreamTables(
                  String(params.table ?? ""),
                  readmePath,
                ),
              });
              return;
            case "getColumns":
              response(getColumns(String(params.table ?? "")));
              return;
            case "getConnectedColumns":
              response({ column_lineage: [] });
              return;
            case "getLineageSettings":
              response({
                showSelectEdges: true,
                showNonSelectEdges: false,
                defaultExpansion: 1,
              });
              return;
            case "persistLineageSettings":
              response({ ok: true });
              return;
            case "getExposureDetails":
              response(getExposureDetails(String(params.name ?? "")));
              return;
            case "getFunctionDetails":
              response(undefined);
              return;
            case "openProblemsTab":
              await vscode.commands.executeCommand(
                "workbench.action.problems.focus",
              );
              response({ ok: true });
              return;
            case "showInfoNotification":
              if (typeof params.message === "string") {
                void vscode.window.showInformationMessage(params.message);
              }
              response({ ok: true });
              return;
            case "telemetryEvents":
            case "sendFeedback":
            case "previewFeature":
              response({ ok: true });
              return;
            case "openFile":
              if (typeof params.url === "string") {
                const uri = vscode.Uri.file(params.url);
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc, {
                  preview: false,
                  preserveFocus: true,
                });
              }
              response({ ok: true });
              return;
            default:
              response(undefined, false, `Unsupported command: ${command}`);
          }
        } catch (error) {
          response(
            undefined,
            false,
            error instanceof Error ? error.message : String(error),
          );
        }
      });

      panel.onDidDispose(() => {
        themeListener.dispose();
        messageListener.dispose();
      });
    },
  );

  context.subscriptions.push(helloWorld, openLineageDemo);
}

export function deactivate(): void {}

function getTheme(): "dark" | "light" {
  return [
    vscode.ColorThemeKind.Light,
    vscode.ColorThemeKind.HighContrastLight,
  ].includes(vscode.window.activeColorTheme.kind)
    ? "light"
    : "dark";
}

function getWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  bootstrap: unknown,
): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "lineage-demo", "app.js"),
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "lineage-demo", "app.css"),
  );

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; img-src ${webview.cspSource} data:; font-src ${webview.cspSource} data:;"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>Lineage Demo</title>
  </head>
  <body>
    <div id="root" data-bootstrap="${escapeHtmlAttribute(JSON.stringify(bootstrap))}"></div>
    <script type="module" src="${scriptUri}"></script>
  </body>
</html>`;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
