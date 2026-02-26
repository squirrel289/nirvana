/**
 * PAX Continuous Feedback Extension
 * Main extension entry point
 */

import * as vscode from 'vscode';
import { ProviderFacade } from './providers/facade';
import { ProviderConfig } from './providers/interface';
import { MemoryStorage } from './storage/memory';

let providerFacade: ProviderFacade | null = null;
let memoryStorage: MemoryStorage | null = null;
let eventFlushTimer: NodeJS.Timeout | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('PAX Feedback extension activating...');

  // Load configuration
  const config = vscode.workspace.getConfiguration('pax.feedback');
  const enabled = config.get<boolean>('enabled', true);

  if (!enabled) {
    console.log('PAX Feedback is disabled in configuration');
    return;
  }

  const providerConfig: ProviderConfig = {
    enabled: enabled,
    captureInterval: config.get<number>('captureInterval', 5000),
    storagePath: config.get<string>('storagePath', '.vscode/pax-memory'),
  };

  try {
    // Initialize memory storage
    memoryStorage = new MemoryStorage(providerConfig.storagePath);
    await memoryStorage.initialize();

    // Initialize provider facade
    providerFacade = new ProviderFacade(providerConfig);
    await providerFacade.activate(context);

    // Start capturing events
    const provider = providerFacade.getProvider();
    if (provider) {
      provider.startCapture();

      // Periodic event flush to storage
      eventFlushTimer = setInterval(async () => {
        await flushEvents();
      }, providerConfig.captureInterval);
    }

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('pax.feedback.showInsights', () => {
        vscode.window.showInformationMessage(
          'PAX Feedback: Insights dashboard coming in Phase 7!'
        );
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('pax.feedback.cleanupMemory', async () => {
        if (memoryStorage) {
          const removed = await memoryStorage.cleanupEpisodes();
          vscode.window.showInformationMessage(
            `PAX Feedback: Cleaned up ${removed} old episodes`
          );
        }
      })
    );

    // Schedule daily cleanup
    const dailyCleanup = setInterval(
      async () => {
        if (memoryStorage) {
          await memoryStorage.cleanupEpisodes();
        }
      },
      24 * 60 * 60 * 1000
    ); // 24 hours

    context.subscriptions.push(
      new vscode.Disposable(() => clearInterval(dailyCleanup))
    );

    console.log('PAX Feedback extension activated successfully');
  } catch (error) {
    console.error('Failed to activate PAX Feedback extension:', error);
    vscode.window.showErrorMessage(
      `PAX Feedback failed to activate: ${error}`
    );
  }
}

export async function deactivate() {
  console.log('PAX Feedback extension deactivating...');

  // Flush any remaining events
  await flushEvents();

  // Stop event flush timer
  if (eventFlushTimer) {
    clearInterval(eventFlushTimer);
    eventFlushTimer = null;
  }

  // Deactivate provider
  if (providerFacade) {
    await providerFacade.deactivate();
    providerFacade = null;
  }

  memoryStorage = null;

  console.log('PAX Feedback extension deactivated');
}

/**
 * Flush captured events to storage
 */
async function flushEvents(): Promise<void> {
  if (!providerFacade || !memoryStorage) {
    return;
  }

  try {
    const provider = providerFacade.getProvider();
    if (!provider) {
      return;
    }

    const events = provider.getEvents();
    if (events.length > 0) {
      await memoryStorage.appendEvents(events);
      console.log(`Flushed ${events.length} events to storage`);
    }
  } catch (error) {
    console.error('Failed to flush events:', error);
  }
}
