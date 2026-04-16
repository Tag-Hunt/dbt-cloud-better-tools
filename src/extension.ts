import * as vscode from "vscode";
import { LineagePanel } from "./webview_provider/lineagePanel";
import { WebviewViewProviders } from "./webview_provider";
import { NewLineagePanel } from "./webview_provider/newLineagePanel";

const LINEAGE_PANEL_CONTAINER_ID = "lineage_view";

export function activate(context: vscode.ExtensionContext): void {
  const newLineagePanel = new NewLineagePanel(context.extensionUri);
  const lineagePanel = new LineagePanel(newLineagePanel);
  const webviewViewProviders = new WebviewViewProviders(lineagePanel);

  const openLineageDemo = vscode.commands.registerCommand(
    "dbtCloudBetterTools.openLineageDemo",
    async () => {
      await vscode.commands.executeCommand(
        `workbench.view.extension.${LINEAGE_PANEL_CONTAINER_ID}`,
      );
    },
  );

  context.subscriptions.push(
    openLineageDemo,
    webviewViewProviders,
    lineagePanel,
    newLineagePanel,
  );
}

export function deactivate(): void {}
