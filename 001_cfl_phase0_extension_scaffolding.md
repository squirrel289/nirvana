---
id: wi-001
title: CFL Phase 0 - Extension Scaffolding and Provider Infrastructure
status: completed
priority: high
complexity: medium
estimated_hours: 32
dependencies: []
created: 2026-02-26
---

## Goal

Establish foundational VS Code extension infrastructure for the Continuous Feedback Loop, including provider facade pattern and universal (workspace-only) provider implementation.

## Background

The CFL requires a VS Code extension to capture workspace events in the background. Following PAX's assistant-agnostic philosophy, the extension must support multiple AI assistant providers (Copilot, Codex, Cursor, Universal) through a facade pattern similar to the pull-request-tool architecture.

Phase 0 delivers the minimal infrastructure needed for subsequent phases to build upon.

## Tasks

- [x] Create `vscode-pax-feedback/` extension directory structure
- [x] Configure TypeScript build (esbuild/webpack) with VS Code extension template
- [x] Implement provider interface and facade pattern
- [x] Implement universal provider (file watchers, terminal listeners, diagnostics)
- [x] Set up `.vscode/pax-memory/` local storage with git-ignore
- [x] Create extension activation and background worker lifecycle

## Deliverables

1. `vscode-pax-feedback/` directory with:
   - `package.json` with extension metadata and activation events
   - `tsconfig.json` for TypeScript compilation
   - `src/extension.ts` - Extension activation and lifecycle
   - `src/providers/interface.ts` - Provider contract
   - `src/providers/facade.ts` - Provider selection logic
   - `src/providers/universal.ts` - Universal provider implementation
   - `src/storage/memory.ts` - Local storage abstraction
2. `.vscode/pax-memory/` directory structure (git-ignored)
3. Build configuration producing `.vsix` package

## Acceptance Criteria

- [x] Extension activates without errors in VS Code
- [x] Universal provider captures file modification events
- [x] Universal provider captures terminal output
- [x] Universal provider captures diagnostic events
- [x] Events stored to `.vscode/pax-memory/episodes.jsonl`
- [x] Storage directory ignored by git
- [x] Extension can be packaged with `vsce package`
- [ ] Basic test suite validates provider facade and universal provider

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Architecture overview
- See: [[skills/tools/capture-events/SKILL.md]] - Event capture specification
- Reference: PAX pull-request-tool for facade pattern examples
