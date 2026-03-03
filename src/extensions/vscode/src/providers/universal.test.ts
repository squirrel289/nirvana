import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UniversalProvider } from './universal';
import type { ProviderConfig } from './interface';

type Uri = { fsPath: string; scheme: string };

let onDidCreateHandler: ((uri: Uri) => void) | undefined;
let onDidChangeHandler: ((uri: Uri) => void) | undefined;
let onDidDeleteHandler: ((uri: Uri) => void) | undefined;
let onDidChangeTextDocumentHandler:
  | ((event: {
      document: { uri: Uri; languageId: string; getText: () => string };
      contentChanges: unknown[];
    }) => void)
  | undefined;
let onDidChangeDiagnosticsHandler:
  | ((event: {
      uris: Uri[];
    }) => void)
  | undefined;
let onDidCloseTerminalHandler:
  | ((terminal: { name: string; exitStatus?: { code?: number } }) => void)
  | undefined;

const fileWatcherDispose = vi.fn();
const textDocumentDispose = vi.fn();
const diagnosticsDispose = vi.fn();
const terminalDispose = vi.fn();

const diagnosticsByPath = new Map<string, Array<{ severity: number }>>();

vi.mock('vscode', () => ({
  workspace: {
    createFileSystemWatcher: vi.fn(() => ({
      onDidCreate: vi.fn((handler: (uri: Uri) => void) => {
        onDidCreateHandler = handler;
      }),
      onDidChange: vi.fn((handler: (uri: Uri) => void) => {
        onDidChangeHandler = handler;
      }),
      onDidDelete: vi.fn((handler: (uri: Uri) => void) => {
        onDidDeleteHandler = handler;
      }),
      dispose: fileWatcherDispose,
    })),
    onDidChangeTextDocument: vi.fn(
      (
        handler: (event: {
          document: { uri: Uri; languageId: string; getText: () => string };
          contentChanges: unknown[];
        }) => void
      ) => {
        onDidChangeTextDocumentHandler = handler;
        return { dispose: textDocumentDispose };
      }
    ),
  },
  languages: {
    onDidChangeDiagnostics: vi.fn((handler: (event: { uris: Uri[] }) => void) => {
      onDidChangeDiagnosticsHandler = handler;
      return { dispose: diagnosticsDispose };
    }),
    getDiagnostics: vi.fn((uri: Uri) => diagnosticsByPath.get(uri.fsPath) ?? []),
  },
  window: {
    onDidCloseTerminal: vi.fn(
      (handler: (terminal: { name: string; exitStatus?: { code?: number } }) => void) => {
        onDidCloseTerminalHandler = handler;
        return { dispose: terminalDispose };
      }
    ),
  },
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
  },
}));

describe('UniversalProvider', () => {
  const config: ProviderConfig = {
    enabled: true,
    captureInterval: 1000,
    storagePath: '.vscode/pax-memory',
  };

  beforeEach(() => {
    onDidCreateHandler = undefined;
    onDidChangeHandler = undefined;
    onDidDeleteHandler = undefined;
    onDidChangeTextDocumentHandler = undefined;
    onDidChangeDiagnosticsHandler = undefined;
    onDidCloseTerminalHandler = undefined;
    diagnosticsByPath.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('captures file, document, diagnostics, and terminal events', async () => {
    const provider = new UniversalProvider(config, {} as never);
    const uri: Uri = { fsPath: '/repo/file.ts', scheme: 'file' };

    await provider.activate();
    expect(await provider.isAvailable()).toBe(true);

    onDidCreateHandler?.(uri);
    onDidChangeHandler?.(uri);
    onDidDeleteHandler?.(uri);

    onDidChangeTextDocumentHandler?.({
      document: {
        uri,
        languageId: 'typescript',
        getText: () => 'const x = 1;',
      },
      contentChanges: [{ text: 'x' }],
    });

    diagnosticsByPath.set(uri.fsPath, [{ severity: 0 }, { severity: 1 }, { severity: 1 }]);
    onDidChangeDiagnosticsHandler?.({ uris: [uri] });

    onDidCloseTerminalHandler?.({ name: 'zsh', exitStatus: { code: 0 } });

    const events = provider.getEvents();
    expect(events.map((event) => event.event_type)).toEqual([
      'file.created',
      'file.modified',
      'file.deleted',
      'document.changed',
      'diagnostics.changed',
      'terminal.closed',
    ]);

    const diagnosticsEvent = events.find(
      (event) => event.event_type === 'diagnostics.changed'
    );
    expect(diagnosticsEvent?.metadata.errorCount).toBe(1);
    expect(diagnosticsEvent?.metadata.warningCount).toBe(2);

    expect(provider.getEvents()).toEqual([]);
  });

  it('emits work_item.completed on non-terminal to completion status transitions', async () => {
    const provider = new UniversalProvider(config, {} as never);
    const backlogUri: Uri = {
      fsPath: '/repo/backlog/006_cfl_phase3_work_item_finalization_triggers.md',
      scheme: 'file',
    };

    await provider.activate();

    onDidChangeTextDocumentHandler?.({
      document: {
        uri: backlogUri,
        languageId: 'markdown',
        getText: () => `---
id: wi-006
status: in-progress
---
`,
      },
      contentChanges: [{ text: 'status: in-progress' }],
    });

    onDidChangeTextDocumentHandler?.({
      document: {
        uri: backlogUri,
        languageId: 'markdown',
        getText: () => `---
id: wi-006
status: closed
---
`,
      },
      contentChanges: [{ text: 'status: closed' }],
    });

    const events = provider.getEvents();
    const completionEvent = events.find(
      (event) => event.event_type === 'work_item.completed'
    );

    expect(completionEvent).toBeDefined();
    expect(completionEvent?.metadata.workItemId).toBe('wi-006');
    expect(completionEvent?.metadata.previousStatus).toBe('in-progress');
    expect(completionEvent?.metadata.currentStatus).toBe('closed');
    expect(completionEvent?.metadata.path).toBe(backlogUri.fsPath);
    expect(typeof completionEvent?.metadata.detectedAt).toBe('string');
  });

  it('starts and stops periodic capture idempotently', () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const provider = new UniversalProvider(config, {} as never);

    provider.startCapture();
    provider.startCapture();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    provider.stopCapture();
    provider.stopCapture();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('disposes registered handlers during deactivation', async () => {
    const provider = new UniversalProvider(config, {} as never);
    await provider.activate();

    await provider.deactivate();

    expect(fileWatcherDispose).toHaveBeenCalledTimes(1);
    expect(textDocumentDispose).toHaveBeenCalledTimes(1);
    expect(diagnosticsDispose).toHaveBeenCalledTimes(1);
    expect(terminalDispose).toHaveBeenCalledTimes(1);
  });
});
