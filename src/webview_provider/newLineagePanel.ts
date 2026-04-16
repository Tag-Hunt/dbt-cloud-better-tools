import * as vscode from "vscode";
import {
  getColumns,
  getDownstreamTables,
  getExposureDetails,
  getRootLineage,
  getUpstreamTables,
} from "../lineageDemoData";

// This keeps the upstream inner-panel split while demo data stands in for real dbt state.
export class NewLineagePanel implements vscode.Disposable {
  protected viewPath = "/lineage";
  protected panelDescription = "Lineage panel";

  private readonly demoProjectRoot: string;
  private panel: vscode.WebviewView | undefined;

  public constructor(private readonly extensionUri: vscode.Uri) {
    this.demoProjectRoot = vscode.Uri.joinPath(
      extensionUri,
      "examples",
      "demo_dbt_project",
    ).fsPath;
  }

  dispose(): void {}

  changedActiveTextEditor(_event: vscode.TextEditor | undefined) {
    // Keep the upstream method shape. Real editor-sync behavior comes later.
  }

  changedActiveColorTheme() {
    if (!this.panel) {
      return;
    }
    this.panel.webview.postMessage({
      command: "setTheme",
      args: { theme: getTheme() },
    });
  }

  init() {
    if (!this.panel) {
      return;
    }
    this.changedActiveColorTheme();
    this.renderStartingNode();
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken,
  ): void {
    this.panel = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };
    webviewView.webview.html = getWebviewHtml(
      webviewView.webview,
      this.extensionUri,
      { theme: getTheme() },
    );
  }

  private renderStartingNode() {
    if (!this.panel) {
      return;
    }
    this.panel.webview.postMessage({
      command: "render",
      args: getRootLineage(this.demoProjectRoot),
    });
  }

  async handleCommand(message: {
    command: string;
    args: any;
    syncRequestId?: string;
  }): Promise<void> {
    if (!this.panel) {
      return;
    }

    const { command, args = {}, syncRequestId } = message;
    const { id = syncRequestId, params = {} } = args;

    const respond = (body: unknown, status = true, error?: string) => {
      this.panel?.webview.postMessage({
        command: "response",
        args: {
          id,
          syncRequestId,
          body,
          status,
          error,
        },
      });
    };

    try {
      if (command === "upstreamTables") {
        respond({
          tables: getUpstreamTables(String(params.table ?? ""), this.demoProjectRoot),
        });
        return;
      }

      if (command === "downstreamTables") {
        respond({
          tables: getDownstreamTables(
            String(params.table ?? ""),
            this.demoProjectRoot,
          ),
        });
        return;
      }

      if (command === "getColumns") {
        respond(getColumns(String(params.table ?? "")));
        return;
      }

      if (command === "getExposureDetails") {
        respond(getExposureDetails(String(params.name ?? "")));
        return;
      }

      if (command === "getFunctionDetails") {
        respond(undefined);
        return;
      }

      if (command === "getConnectedColumns") {
        respond({ column_lineage: [] });
        return;
      }

      if (command === "getLineageSettings") {
        respond({
          showSelectEdges: true,
          showNonSelectEdges: false,
          defaultExpansion: 1,
        });
        return;
      }

      if (command === "persistLineageSettings") {
        respond({ ok: true });
        return;
      }

      if (command === "openProblemsTab") {
        await vscode.commands.executeCommand("workbench.action.problems.focus");
        respond({ ok: true });
        return;
      }

      if (command === "showInfoNotification") {
        if (typeof params.message === "string") {
          void vscode.window.showInformationMessage(params.message);
        }
        respond({ ok: true });
        return;
      }

      if (
        command === "telemetryEvents" ||
        command === "sendFeedback" ||
        command === "previewFeature"
      ) {
        respond({ ok: true });
        return;
      }

      respond(undefined, false, `Unsupported command: ${command}`);
    } catch (error) {
      respond(
        undefined,
        false,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

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
    <title>Lineage</title>
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
