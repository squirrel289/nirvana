import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { runMemoryProviderConformanceSuite } from './conformance';
import { SqliteMemoryProvider } from './adapters/sqlite-memory-provider';
import { LanceMemoryProvider } from './adapters/lance-memory-provider';

runMemoryProviderConformanceSuite({
  providerName: 'sqlite-counterpart',
  createProvider: () => new SqliteMemoryProvider({ databasePath: ':memory:' }),
});

runMemoryProviderConformanceSuite({
  providerName: 'lance-counterpart',
  createProvider: () => {
    const storagePath = path.join(
      os.tmpdir(),
      `pax-lance-provider-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
    );

    const provider = new LanceMemoryProvider({ storagePath });

    const originalClose = provider.close.bind(provider);
    provider.close = async () => {
      await originalClose();
      await fs.rm(storagePath, { force: true });
    };

    return provider;
  },
});
