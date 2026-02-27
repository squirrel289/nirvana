/**
 * Provider facade for selecting and delegating to appropriate provider
 */

import * as vscode from 'vscode';
import { Provider, ProviderConfig } from './interface';
import { UniversalProvider } from './universal';

export class ProviderFacade {
  private provider: Provider | null = null;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Auto-detect and activate the appropriate provider
   */
  async activate(context: vscode.ExtensionContext): Promise<void> {
    const configuredProvider = vscode.workspace
      .getConfiguration('pax.feedback')
      .get<string>('provider', 'auto');

    if (configuredProvider !== 'auto') {
      // User explicitly selected provider
      this.provider = await this.createProvider(configuredProvider, context);
    } else {
      // Auto-detection priority: Copilot > Cursor > Codex > Universal
      this.provider = await this.detectProvider(context);
    }

    if (this.provider) {
      await this.provider.activate();
      console.log(`PAX Feedback: Activated provider: ${this.provider.name}`);
    } else {
      throw new Error('No provider available');
    }
  }

  /**
   * Deactivate the current provider
   */
  async deactivate(): Promise<void> {
    if (this.provider) {
      await this.provider.deactivate();
      this.provider = null;
    }
  }

  /**
   * Get the active provider
   */
  getProvider(): Provider | null {
    return this.provider;
  }

  /**
   * Auto-detect available provider
   */
  private async detectProvider(
    context: vscode.ExtensionContext
  ): Promise<Provider> {
    // Check for Copilot extension
    const copilotProvider = await this.createProvider('copilot', context);
    if (await copilotProvider.isAvailable()) {
      return copilotProvider;
    }

    // Check for Cursor extension
    const cursorProvider = await this.createProvider('cursor', context);
    if (await cursorProvider.isAvailable()) {
      return cursorProvider;
    }

    // Check for Codex API
    const codexProvider = await this.createProvider('codex', context);
    if (await codexProvider.isAvailable()) {
      return codexProvider;
    }

    // Default to universal provider
    return this.createProvider('universal', context);
  }

  /**
   * Create provider instance by name
   */
  private async createProvider(
    name: string,
    context: vscode.ExtensionContext
  ): Promise<Provider> {
    switch (name) {
      case 'copilot':
        // TODO: Implement CopilotProvider (Phase 6)
        throw new Error('Copilot provider not yet implemented');

      case 'codex':
        // TODO: Implement CodexProvider (Phase 6)
        throw new Error('Codex provider not yet implemented');

      case 'cursor':
        // TODO: Implement CursorProvider (Phase 6)
        throw new Error('Cursor provider not yet implemented');

      case 'universal':
      default:
        return new UniversalProvider(this.config, context);
    }
  }
}
