import {
  CancellationToken,
  commands,
  Disposable,
  TextEditor,
  Uri,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  window,
} from "vscode";
import { NewLineagePanel } from "./newLineagePanel";

// Mirrors upstream lineagePanel.ts, minus dbt project and telemetry dependencies.
export interface LineagePanelView extends WebviewViewProvider {
  init(): void;
  changedActiveColorTheme(): void;
  changedActiveTextEditor(event: TextEditor | undefined): void;
  handleCommand(message: { command: string; args: any }): Promise<void> | void;
  resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext<unknown>,
    token: CancellationToken,
  ): void | Thenable<void>;
}

export class LineagePanel implements WebviewViewProvider, Disposable {
  public static readonly viewType = "dbtPowerUser.Lineage";

  private panel: WebviewView | undefined;
  private context: WebviewViewResolveContext<unknown> | undefined;
  private token: CancellationToken | undefined;
  private disposables: Disposable[] = [];

  public constructor(private lineagePanel: NewLineagePanel) {
    window.onDidChangeActiveColorTheme(
      async () => {
        this.getPanel().changedActiveColorTheme();
      },
      null,
      this.disposables,
    );
    window.onDidChangeActiveTextEditor((event: TextEditor | undefined) => {
      this.getPanel().changedActiveTextEditor(event);
    });
  }

  private getPanel() {
    return this.lineagePanel;
  }

  dispose() {
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private init = async () => {
    await this.getPanel().resolveWebviewView(
      this.panel!,
      this.context!,
      this.token!,
    );
  };

  resolveWebviewView(
    panel: WebviewView,
    context: WebviewViewResolveContext<unknown>,
    token: CancellationToken,
  ): void | Thenable<void> {
    this.panel = panel;
    this.context = context;
    this.token = token;

    this.init();
    panel.webview.onDidReceiveMessage(this.handleWebviewMessage, null, []);
  }

  private handleWebviewMessage = async (message: {
    command: string;
    args: any;
  }) => {
    const { command, args } = message;

    if (command === "openFile") {
      const url = args.params?.url;
      if (!url) {
        return;
      }
      await commands.executeCommand("vscode.open", Uri.file(url), {
        preview: false,
        preserveFocus: true,
      });
      return;
    }

    if (command === "init") {
      this.getPanel()?.init();
      return;
    }

    this.getPanel().handleCommand(message);
  };
}
