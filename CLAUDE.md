@AGENTS.md

# Commands

```bash
# Install
npm ci

# Build all packages
npm run build

# Test all packages
npm test

# Test specific MCP package
npm run test:mcp
npm run test:watch
npm run test:coverage

# Agent development — ALWAYS run after editing claude/agents/*.md
npm run convert-cursor
npm run check-cursor-sync

# Lint
npx nx run-many -t lint

# Test MCP server with inspector
npx @modelcontextprotocol/inspector node packages/hcc-pf-mcp/dist/index.js

# Clean Nx cache
npx nx reset
```

# Git Conventions

- Conventional commits: `type(scope): description`
- Scopes: agent name (e.g. `patternfly-component-builder`), package name (e.g. `hcc-pf-mcp`), `scripts`, `ci`, `docs`
- Default branch: `master`
- After modifying agents: commit both `claude/agents/*.md` and `cursor/rules/*.mdc` together

# Key Files

- `claude/agents/` — Claude sub-agent definitions (source of truth)
- `cursor/rules/` — Auto-generated Cursor rules (never edit directly)
- `claude/.claude-plugin/plugin.json` — Plugin manifest (bump version for releases)
- `.claude-plugin/marketplace.json` — Marketplace discovery config
- `packages/*/src/lib/tools/` — MCP tool implementations
- `scripts/convert-to-cursor.js` — Agent → Cursor conversion script
- `nx.json` — Nx workspace and release config
