/**
 * Local memory storage for PAX feedback events
 * Stores events in .vscode/pax-memory/ with TTL management
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkspaceEvent } from '../providers/interface';

export class MemoryStorage {
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
  }

  /**
   * Initialize storage directory
   */
  async initialize(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder found');
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const fullPath = path.join(workspaceRoot, this.storagePath);

    try {
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`Memory storage initialized at: ${fullPath}`);
    } catch (error) {
      console.error('Failed to initialize memory storage:', error);
      throw error;
    }
  }

  /**
   * Append events to episodes.jsonl
   */
  async appendEvents(events: WorkspaceEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const episodesPath = await this.getEpisodesPath();
    const lines = events.map((event) => JSON.stringify(event)).join('\n') + '\n';

    try {
      await fs.appendFile(episodesPath, lines, 'utf-8');
    } catch (error) {
      console.error('Failed to append events:', error);
      throw error;
    }
  }

  /**
   * Read all episodes
   */
  async readEpisodes(): Promise<WorkspaceEvent[]> {
    const episodesPath = await this.getEpisodesPath();

    try {
      const content = await fs.readFile(episodesPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.map((line) => JSON.parse(line));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []; // File doesn't exist yet
      }
      console.error('Failed to read episodes:', error);
      throw error;
    }
  }

  /**
   * Clean up episodes older than TTL (7 days)
   */
  async cleanupEpisodes(ttlDays: number = 7): Promise<number> {
    const episodes = await this.readEpisodes();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ttlDays);

    const validEpisodes = episodes.filter((event) => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= cutoffDate;
    });

    const removedCount = episodes.length - validEpisodes.length;

    if (removedCount > 0) {
      // Rewrite file with valid episodes only
      const episodesPath = await this.getEpisodesPath();
      const lines = validEpisodes.map((event) => JSON.stringify(event)).join('\n');
      await fs.writeFile(episodesPath, lines + '\n', 'utf-8');
      console.log(`Cleaned up ${removedCount} old episodes`);
    }

    return removedCount;
  }

  /**
   * Load patterns from patterns.json
   */
  async loadPatterns(): Promise<any[]> {
    const patternsPath = await this.getPatternsPath();

    try {
      const content = await fs.readFile(patternsPath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []; // File doesn't exist yet
      }
      console.error('Failed to load patterns:', error);
      throw error;
    }
  }

  /**
   * Save patterns to patterns.json
   */
  async savePatterns(patterns: any[]): Promise<void> {
    const patternsPath = await this.getPatternsPath();
    const content = JSON.stringify(patterns, null, 2);

    try {
      await fs.writeFile(patternsPath, content, 'utf-8');
    } catch (error) {
      console.error('Failed to save patterns:', error);
      throw error;
    }
  }

  /**
   * Get full path to episodes.jsonl
   */
  private async getEpisodesPath(): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder found');
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    return path.join(workspaceRoot, this.storagePath, 'episodes.jsonl');
  }

  /**
   * Get full path to patterns.json
   */
  private async getPatternsPath(): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder found');
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    return path.join(workspaceRoot, this.storagePath, 'patterns.json');
  }
}
