import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderFacade } from './facade';
import type { ProviderConfig } from './interface';

let configuredProvider = 'universal';

vi.mock('vscode', () => {
  const createDisposable = () => ({ dispose: vi.fn() });

  return {
    workspace: {
      getConfiguration: vi.fn(() => ({
        get: vi.fn((_key: string, fallback: string) => configuredProvider ?? fallback),
      })),
      createFileSystemWatcher: vi.fn(() => ({
        onDidCreate: vi.fn(),
        onDidChange: vi.fn(),
        onDidDelete: vi.fn(),
        dispose: vi.fn(),
      })),
      onDidChangeTextDocument: vi.fn(() => createDisposable()),
    },
    languages: {
      onDidChangeDiagnostics: vi.fn(() => createDisposable()),
      getDiagnostics: vi.fn(() => []),
    },
    window: {
      onDidCloseTerminal: vi.fn(() => createDisposable()),
    },
    DiagnosticSeverity: {
      Error: 0,
      Warning: 1,
    },
  };
});

describe('ProviderFacade', () => {
  const config: ProviderConfig = {
    enabled: true,
    captureInterval: 1000,
    storagePath: '.vscode/pax-memory',
  };

  beforeEach(() => {
    configuredProvider = 'universal';
    vi.clearAllMocks();
  });

  it('activates universal provider when configured explicitly', async () => {
    const facade = new ProviderFacade(config);

    await facade.activate({} as never);

    expect(facade.getProvider()?.name).toBe('universal');

    await facade.deactivate();
    expect(facade.getProvider()).toBeNull();
  });

  it('throws when configured provider is not implemented', async () => {
    configuredProvider = 'copilot';
    const facade = new ProviderFacade(config);

    await expect(facade.activate({} as never)).rejects.toThrow(
      'Copilot provider not yet implemented'
    );
  });
});
