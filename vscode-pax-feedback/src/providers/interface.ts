/**
 * Provider interface for capturing workspace events
 * All providers must implement this interface for the facade pattern
 */

export interface WorkspaceEvent {
  timestamp: string;
  provider: string;
  event_type: string;
  metadata: Record<string, any>;
}

export interface Provider {
  /**
   * Provider name (universal, copilot, codex, cursor)
   */
  readonly name: string;

  /**
   * Initialize the provider
   */
  activate(): Promise<void>;

  /**
   * Cleanup provider resources
   */
  deactivate(): Promise<void>;

  /**
   * Check if this provider is available in the current environment
   */
  isAvailable(): Promise<boolean>;

  /**
   * Start capturing events
   */
  startCapture(): void;

  /**
   * Stop capturing events
   */
  stopCapture(): void;

  /**
   * Get captured events since last retrieval
   */
  getEvents(): WorkspaceEvent[];
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  enabled: boolean;
  captureInterval: number;
  storagePath: string;
}
