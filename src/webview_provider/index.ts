import { Disposable, window } from "vscode";
import { LineagePanel } from "./lineagePanel";

// Mirrors the upstream Power User webview registration pattern for lineage only.
export class WebviewViewProviders implements Disposable {
  private disposables: Disposable[] = [];

  constructor(private lineagePanel: LineagePanel) {
    this.disposables.push(
      window.registerWebviewViewProvider(
        LineagePanel.viewType,
        this.lineagePanel,
        { webviewOptions: { retainContextWhenHidden: true } },
      ),
    );
  }

  dispose() {
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
