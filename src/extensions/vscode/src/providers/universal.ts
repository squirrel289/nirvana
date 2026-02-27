/**
 * Universal provider - workspace-only event capture using VS Code APIs
 * Works without any AI assistant extensions
 */

import * as vscode from 'vscode';
import { Provider, WorkspaceEvent, ProviderConfig } from './interface';

export class UniversalProvider implements Provider {
  readonly name = 'universal';

  private config: ProviderConfig;
  private context: vscode.ExtensionContext;
  private events: WorkspaceEvent[] = [];
  private disposables: vscode.Disposable[] = [];
  private captureTimer: NodeJS.Timeout | null = null;

  constructor(config: ProviderConfig, context: vscode.ExtensionContext) {
    this.config = config;
    this.context = context;
  }

  async activate(): Promise<void> {
    // File system watcher
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
    fileWatcher.onDidCreate((uri) => this.onFileCreated(uri));
    fileWatcher.onDidChange((uri) => this.onFileModified(uri));
    fileWatcher.onDidDelete((uri) => this.onFileDeleted(uri));
    this.disposables.push(fileWatcher);

    // Text document changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) =>
        this.onDocumentChanged(e)
      )
    );

    // Diagnostics
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics((e) =>
        this.onDiagnosticsChanged(e)
      )
    );

    // Terminal output (limited)
    this.disposables.push(
      vscode.window.onDidCloseTerminal((terminal) =>
        this.onTerminalClosed(terminal)
      )
    );

    console.log('UniversalProvider activated');
  }

  async deactivate(): Promise<void> {
    this.stopCapture();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }

  async isAvailable(): Promise<boolean> {
    // Universal provider is always available
    return true;
  }

  startCapture(): void {
    if (this.captureTimer) {
      return;
    }

    // Periodic event processing
    this.captureTimer = setInterval(() => {
      // Placeholder for future periodic tasks
    }, this.config.captureInterval);
  }

  stopCapture(): void {
    if (this.captureTimer) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
  }

  getEvents(): WorkspaceEvent[] {
    const events = [...this.events];
    this.events = []; // Clear after retrieval
    return events;
  }

  // Event handlers

  private onFileCreated(uri: vscode.Uri): void {
    this.addEvent({
      timestamp: new Date().toISOString(),
      provider: this.name,
      event_type: 'file.created',
      metadata: {
        path: uri.fsPath,
        scheme: uri.scheme,
      },
    });
  }

  private onFileModified(uri: vscode.Uri): void {
    this.addEvent({
      timestamp: new Date().toISOString(),
      provider: this.name,
      event_type: 'file.modified',
      metadata: {
        path: uri.fsPath,
        scheme: uri.scheme,
      },
    });
  }

  private onFileDeleted(uri: vscode.Uri): void {
    this.addEvent({
      timestamp: new Date().toISOString(),
      provider: this.name,
      event_type: 'file.deleted',
      metadata: {
        path: uri.fsPath,
        scheme: uri.scheme,
      },
    });
  }

  private onDocumentChanged(e: vscode.TextDocumentChangeEvent): void {
    if (e.contentChanges.length === 0) {
      return;
    }

    this.addEvent({
      timestamp: new Date().toISOString(),
      provider: this.name,
      event_type: 'document.changed',
      metadata: {
        path: e.document.uri.fsPath,
        languageId: e.document.languageId,
        changeCount: e.contentChanges.length,
      },
    });
  }

  private onDiagnosticsChanged(e: vscode.DiagnosticChangeEvent): void {
    for (const uri of e.uris) {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      if (diagnostics.length > 0) {
        this.addEvent({
          timestamp: new Date().toISOString(),
          provider: this.name,
          event_type: 'diagnostics.changed',
          metadata: {
            path: uri.fsPath,
            errorCount: diagnostics.filter(
              (d) => d.severity === vscode.DiagnosticSeverity.Error
            ).length,
            warningCount: diagnostics.filter(
              (d) => d.severity === vscode.DiagnosticSeverity.Warning
            ).length,
          },
        });
      }
    }
  }

  private onTerminalClosed(terminal: vscode.Terminal): void {
    this.addEvent({
      timestamp: new Date().toISOString(),
      provider: this.name,
      event_type: 'terminal.closed',
      metadata: {
        name: terminal.name,
        exitStatus: terminal.exitStatus?.code,
      },
    });
  }

  private addEvent(event: WorkspaceEvent): void {
    this.events.push(event);
  }
}
