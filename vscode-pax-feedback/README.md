# PAX Continuous Feedback Extension

VS Code extension for capturing workspace events to support PAX's continuous feedback loop and skills evolution.

## Architecture

This extension implements an assistant-agnostic event capture system using a provider facade pattern:

- **Universal Provider**: Default workspace-only capture using VS Code APIs
- **Copilot Provider**: GitHub Copilot extension integration
- **Codex Provider**: OpenAI Codex API integration
- **Cursor Provider**: Cursor extension integration

## Local Storage

Events are stored locally in `.vscode/pax-memory/` (git-ignored):

- `episodes.jsonl` - Append-only event log
- `patterns.json` - Detected patterns
- `signals.json` - Signal catalog

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Package extension
npm run package
```

## Configuration

See VS Code settings under "PAX Feedback" for:

- Enable/disable event capture
- Provider selection
- Capture interval
- Storage path

## Related Documentation

- [Continuous Feedback Loop Architecture](../docs/architecture/continuous-feedback-loop.md)
- [Capture Events Skill](../skills/tools/capture-events/SKILL.md)
