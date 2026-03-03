---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: WI-003 Memory A/B Benchmark Report
lifecycle: active
created: 2026-03-03
audience: PAX contributors
---

A/B benchmark report for `wi-003` comparing the two local MVP memory adapters:

- `sqlite-counterpart`
- `lance-counterpart`

## Benchmark Scope

The benchmark harness in `src/packages/core/src/memory/benchmark.ts` and
`src/packages/core/src/memory/benchmark-report.ts` measures:

1. Recall@k and ranking quality (MRR)
2. Query latency (p50/p95)
3. Ingest throughput
4. Update throughput
5. Local disk/storage footprint

Execution command:

```bash
pnpm exec tsx src/packages/core/src/memory/benchmark-report.ts
```

Execution timestamp:

- `generatedAt`: `2026-03-03T03:28:23.268Z`

## Results

| Metric | sqlite-counterpart | lance-counterpart |
| --- | ---: | ---: |
| inserted | 6 | 6 |
| updated | 6 | 6 |
| queryCount | 2 | 2 |
| ingestMs | 2.454333 | 1.364958 |
| ingestThroughputPerSecond | 2444.6560 | 4395.7396 |
| updateMs | 2.658834 | 0.785708 |
| updateThroughputPerSecond | 2256.6283 | 7636.4247 |
| queryP50Ms | 0.090083 | 0.013875 |
| queryP95Ms | 0.307458 | 0.074917 |
| recallAtK | 1.0 | 1.0 |
| rankingQualityMrr | 1.0 | 1.0 |
| storageFootprintBytes | 12288 | 3442 |

## Selection Decision

Benchmark selection output:

- primaryProvider: `lance-counterpart`
- fallbackProvider: `sqlite-counterpart`

## MVP Runtime Behavior

For `wi-003` runtime defaults:

1. Use `lance-counterpart` as primary read/search path for semantic retrieval.
2. Keep `sqlite-counterpart` as fallback read path and durable counterpart.
3. Use explicit routing control in the memory kernel:
   - `primary-first` (default)
   - `fallback-first` (operator/manual fallback mode)

## Notes

- This benchmark is local-only and deterministic over seeded scenarios.
- Broader production-like benchmarking, external provider benchmarking, and migration depth remain deferred to `wi-027`.
