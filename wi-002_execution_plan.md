# wi-002 Execution Plan: Implement capture-events Skill

**Work Item**: wi-002 - CFL Phase 1 - Implement capture-events Skill  
**Branch**: feature/wi-002-capture-events-skill  
**Estimated**: 40 hours  
**Status**: Planning Complete → Ready for Implementation

---

## Scope Boundaries

### In Scope

- ✅ Executable capture-events skill with provider facade pattern
- ✅ Event schema definition and validation logic
- ✅ Universal provider implementation (file watchers, terminal, diagnostics, skill invocations)
- ✅ JSONL storage handler with append-only semantics
- ✅ 7-day TTL cleanup mechanism for episodic memory
- ✅ Background mode (continuous capture) and on-demand mode
- ✅ Provider auto-detection logic (Universal as default)
- ✅ Unit tests for event capture, storage, and TTL cleanup (≥80% coverage)

### Out of Scope

- ❌ Copilot/Codex/Cursor provider implementations (deferred to wi-004)
- ❌ Memory layer aggregation (deferred to wi-003)
- ❌ Signal evolution and pattern extraction (deferred to wi-005)
- ❌ VS Code extension integration (already completed in wi-001)
- ❌ creating-skill workflow implementation (deferred to wi-006)
- ❌ User-facing UI/commands (minimal CLI for testing only)

### Critical Dependencies

- **wi-001**: SATISFIED ✅ (VS Code extension infrastructure complete)
- **VS Code Extension API**: Available in vscode-pax-feedback/
- **Local Storage**: .vscode/pax-memory/ already configured (git-ignored)

---

## File Change Plan

### New Files (7 files)

1. **skills/tools/capture-events/implementation.py**
   - Purpose: Main entry point for capture-events skill execution
   - Size estimate: ~300 lines
   - Key functions: main(), parse_args(), run_background(), run_on_demand()

2. **skills/tools/capture-events/event_schema.py**
   - Purpose: Event schema definition, validation, serialization
   - Size estimate: ~150 lines
   - Key classes: Event, EventType (enum), EventValidator

3. **skills/tools/capture-events/providers/universal.py**
   - Purpose: Universal provider implementation (workspace-only mode)
   - Size estimate: ~400 lines
   - Key classes: UniversalProvider, FileWatcher, TerminalListener, DiagnosticCollector, SkillTracker

4. **skills/tools/capture-events/providers/facade.py**
   - Purpose: Provider auto-detection and delegation
   - Size estimate: ~150 lines
   - Key classes: ProviderFacade, ProviderDetector

5. **skills/tools/capture-events/storage/jsonl_handler.py**
   - Purpose: JSONL append-only storage with TTL cleanup
   - Size estimate: ~200 lines
   - Key classes: JSONLStorage, TTLCleaner

6. **skills/tools/capture-events/tests/test_event_capture.py**
   - Purpose: Unit tests for event capture logic
   - Size estimate: ~300 lines
   - Coverage: Event schema, provider logic, background mode

7. **skills/tools/capture-events/tests/test_storage.py**
   - Purpose: Unit tests for JSONL storage and TTL cleanup
   - Size estimate: ~200 lines
   - Coverage: JSONL append, read, TTL cleanup, concurrency

### Modified Files (2 files)

1. **skills/tools/capture-events/SKILL.md**
   - Change: Add implementation status section, link to execution plan
   - Impact: Documentation update only

2. **backlog/002_cfl_phase1_capture_events_skill.md**
   - Change: Update status to in-progress, check off completed tasks
   - Impact: Work item tracking only

### Directory Structure

```bash tree
skills/tools/capture-events/
├── SKILL.md                          # Already exists (created in Phase 0)
├── implementation.py                 # NEW - Main entry point
├── event_schema.py                   # NEW - Schema & validation
├── providers/
│   ├── __init__.py                   # NEW - Package init
│   ├── facade.py                     # NEW - Provider facade
│   └── universal.py                  # NEW - Universal provider
├── storage/
│   ├── __init__.py                   # NEW - Package init
│   └── jsonl_handler.py              # NEW - Storage handler
└── tests/
    ├── __init__.py                   # NEW - Package init
    ├── test_event_capture.py         # NEW - Event tests
    └── test_storage.py               # NEW - Storage tests
```

---

## Validation Signals

### Functional Validation

1. **Event Capture**:
   - Signal: Create test file → event captured in episodes.jsonl with type="file_create"
   - Signal: Run terminal command → event captured with type="terminal_execute"
   - Signal: Trigger diagnostic → event captured with type="diagnostic"
   - Command: `python implementation.py --capture file_create --input test.txt`

2. **Storage Integrity**:
   - Signal: Each event is valid JSON line (newline-delimited)
   - Signal: Events persist across skill invocations
   - Signal: No data corruption after concurrent writes
   - Command: `python -c "import json; [json.loads(line) for line in open('.vscode/pax-memory/episodes.jsonl')]"`

3. **TTL Cleanup**:
   - Signal: Events older than 7 days are removed
   - Signal: Recent events preserved after cleanup
   - Command: `python implementation.py --cleanup --dry-run`

### Test Validation

- Signal: `pytest tests/ --cov=. --cov-report=term` shows ≥80% coverage
- Signal: All tests pass (no failures, no warnings)
- Signal: Test execution time <5 seconds (unit tests should be fast)

### Integration Validation

- Signal: Background mode runs without errors for 5 minutes
- Signal: Provider facade detects "universal" as default
- Signal: Event schema validates all required fields (timestamp, provider, event_type, metadata)

---

## Completion Steps

### Phase 2: Implementation (32 hours)

1. Create directory structure and **init**.py files (0.5h)
2. Implement event_schema.py with Event class and validation (4h)
3. Implement universal.py provider (12h):
   - FileWatcher for file create/modify/delete
   - TerminalListener for command execution
   - DiagnosticCollector for errors/warnings
   - SkillTracker for skill invocations
4. Implement facade.py with auto-detection (4h)
5. Implement jsonl_handler.py with TTL cleanup (6h)
6. Implement implementation.py CLI entry point (3h)
7. Write unit tests (test_event_capture.py, test_storage.py) (8h)

### Phase 3: Testing & Validation (4 hours)

1. Run pytest with coverage report (0.5h)
2. Test background mode manually (1h)
3. Test TTL cleanup with synthetic old events (1h)
4. Validate all acceptance criteria from wi-002 (1h)
5. Fix any bugs discovered during validation (0.5h)

### Phase 4: Documentation & PR (4 hours)

1. Update SKILL.md with implementation notes (1h)
2. Add inline documentation and docstrings (1h)
3. Create PR with detailed description (0.5h)
4. Address code review feedback (1h)
5. Update wi-002 work item with final metrics (0.5h)

---

## Test Strategy

### Unit Tests (≥80% coverage required)

- **Event Schema Tests** (test_event_capture.py):
  - Valid event creation with all required fields
  - Invalid event rejection (missing fields, wrong types)
  - Event serialization to JSON
  - EventType enum validation

- **Provider Tests** (test_event_capture.py):
  - Universal provider file watcher (mock filesystem events)
  - Terminal listener (mock terminal output)
  - Diagnostic collector (mock VS Code diagnostics)
  - Skill tracker (mock skill invocations)

- **Storage Tests** (test_storage.py):
  - JSONL append without corruption
  - Concurrent write handling (threading test)
  - TTL cleanup (synthetic old events)
  - Read operations (all events, filter by type, date range)

### Manual Integration Tests

- Background mode: Start capture, perform 10+ workspace actions, verify all captured
- Provider detection: Run on different assistants, verify correct provider selected
- Storage persistence: Capture events, restart extension, verify events still exist

### Performance Benchmarks

- Event capture latency: <10ms per event
- JSONL write throughput: ≥100 events/second
- TTL cleanup: <1 second for 1000 events
- Background mode CPU: <1% average usage

---

## Dependencies Verification

### External Dependencies

- **Python 3.8+**: Standard library only (no external packages for Phase 1)
- **VS Code Extension**: Already implemented in wi-001 ✅
- **Local Storage**: .vscode/pax-memory/ created and git-ignored ✅

### Internal Dependencies

- **wi-001 (Extension Scaffolding)**: SATISFIED ✅
  - vscode-pax-feedback/ extension exists
  - TypeScript compiled successfully
  - Extension ready for integration

### Dependency Conflicts

- None identified - this is net-new skill implementation

---

## Workspace State Recording

### Pre-Implementation State

- **Branch**: main
- **Workspace**: Clean (no uncommitted changes)
- **Last Commit**: f5b9319 - "docs(rfcs): add decision-making skills consolidation RFC"
- **Python Environment**: System Python 3.x (no virtualenv needed for Phase 1)
- **VS Code Extension**: Compiled in vscode-pax-feedback/dist/

### Feature Branch State

- **Branch**: feature/wi-002-capture-events-skill (created from main)
- **Workspace**: Clean (ready for implementation)
- **Isolation**: Feature branch for atomic PR

### Out-of-Scope Work Protection

- No pending changes in other work items
- No conflicts with ongoing development
- All documentation updates isolated to wi-002 context

---

## Risk Assessment

### Technical Risks

1. **File Watcher Performance**: Watching large workspaces may cause high CPU
   - Mitigation: Debounce events, filter by file extension, exclude node_modules
2. **JSONL Corruption**: Concurrent writes may corrupt file
   - Mitigation: Use file locking, atomic writes, validation on read
3. **TTL Cleanup Race Condition**: Cleanup during write may lose events
   - Mitigation: Read-modify-write with lock, mark-and-sweep approach

### Process Risks

1. **Scope Creep**: Temptation to add Copilot/Codex providers
   - Mitigation: Strict adherence to scope boundaries, defer to wi-004
2. **Test Coverage**: May not reach 80% threshold
   - Mitigation: TDD approach, write tests before implementation
3. **Integration Complexity**: VS Code extension integration untested
   - Mitigation: Manual integration testing in Phase 3

---

## Success Criteria Summary

✅ All 8 tasks in wi-002 completed  
✅ All 8 acceptance criteria validated  
✅ Test coverage ≥80%  
✅ Background mode stable for 5+ minutes  
✅ JSONL storage integrity verified  
✅ TTL cleanup functional  
✅ Provider facade auto-detects universal  
✅ PR approved and merged

---

**Planning Status**: COMPLETE ✅  
**Ready for Phase 2**: YES  
**Estimated Total Time**: 40 hours  
**Blockers**: None
