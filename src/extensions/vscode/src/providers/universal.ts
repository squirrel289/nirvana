/**
 * Universal provider - workspace-only event capture using VS Code APIs
 * Works without any AI assistant extensions
 */

import * as vscode from 'vscode';
import { Provider, WorkspaceEvent, ProviderConfig } from './interface';

export class UniversalProvider implements Provider {
  readonly name = 'universal';
  private static readonly COMPLETION_STATUSES = new Set([
    'closed',
    'completed',
    'done',
  ]);

  private config: ProviderConfig;
  private context: vscode.ExtensionContext;
  private events: WorkspaceEvent[] = [];
  private disposables: vscode.Disposable[] = [];
  private captureTimer: NodeJS.Timeout | null = null;
  private workItemStatusByPath = new Map<string, string>();

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

    const timestamp = new Date().toISOString();

    this.addEvent({
      timestamp,
      provider: this.name,
      event_type: 'document.changed',
      metadata: {
        path: e.document.uri.fsPath,
        languageId: e.document.languageId,
        changeCount: e.contentChanges.length,
      },
    });

    const completionEvent = this.detectCompletionEvent(e.document, timestamp);
    if (completionEvent) {
      this.addEvent(completionEvent);
    }
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

  private detectCompletionEvent(
    document: vscode.TextDocument,
    detectedAt: string
  ): WorkspaceEvent | null {
    const path = document.uri.fsPath;

    if (!this.isBacklogPath(path)) {
      return null;
    }

    const frontmatter = this.extractFrontmatter(document.getText());
    if (!frontmatter) {
      return null;
    }

    const workItemId = this.extractFrontmatterField(frontmatter, 'id');
    const status = this.extractFrontmatterField(frontmatter, 'status');

    if (!workItemId || !status) {
      return null;
    }

    const currentStatus = status.toLowerCase();
    const previousStatus = this.workItemStatusByPath.get(path);
    this.workItemStatusByPath.set(path, currentStatus);

    if (!previousStatus || previousStatus === currentStatus) {
      return null;
    }

    if (
      !UniversalProvider.COMPLETION_STATUSES.has(currentStatus) ||
      UniversalProvider.COMPLETION_STATUSES.has(previousStatus)
    ) {
      return null;
    }

    return {
      timestamp: detectedAt,
      provider: this.name,
      event_type: 'work_item.completed',
      metadata: {
        workItemId,
        previousStatus,
        currentStatus,
        path,
        detectedAt,
      },
    };
  }

  private isBacklogPath(path: string): boolean {
    return path.includes('/backlog/') || path.includes('\\backlog\\');
  }

  private extractFrontmatter(documentText: string): string | null {
    const match = /^---\s*\r?\n([\s\S]*?)\r?\n---/.exec(documentText);
    return match?.[1] ?? null;
  }

  private extractFrontmatterField(
    frontmatter: string,
    field: string
  ): string | undefined {
    const pattern = new RegExp(`^${field}:\\s*(.+)$`, 'm');
    const match = pattern.exec(frontmatter);
    if (!match) {
      return undefined;
    }

    return match[1].trim().replace(/^['"]|['"]$/g, '');
  }
}
