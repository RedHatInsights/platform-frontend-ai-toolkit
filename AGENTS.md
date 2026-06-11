# Platform Frontend AI Toolkit

## Project Overview

An Nx monorepo serving as a centralized hub for AI-assisted development tools used by the HCC (Hybrid Cloud Console) frontend and infrastructure teams. The repository provides:

1. **Claude Code plugin** — custom sub-agents distributed via a custom marketplace
2. **Cursor editor rules** — auto-generated from Claude agents via conversion scripts
3. **MCP servers** — Model Context Protocol servers published to npm as standalone packages

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| TypeScript ~5.9 | Primary language for MCP servers |
| Nx 22.1 | Monorepo build orchestration, task caching, release management |
| Node.js 20 | Runtime for MCP servers and scripts |
| Jest 30 | Unit testing for MCP server packages |
| MCP SDK ^1.22 | Model Context Protocol server framework |
| Zod ^3.25 | Schema validation (required by MCP SDK for tool definitions) |
| Husky | Pre-push hooks (cursor-sync check) |
| Prettier | Code formatting |

## Project Structure

```text
platform-frontend-ai-toolkit/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace config (lists all plugins)
├── .github/workflows/
│   ├── ci.yml                    # Build, lint, test
│   └── release.yml               # NX Release → versions + publishes packages/plugins
├── .mcp.json                     # Local MCP config (nx-mcp for dev)
├── plugins/
│   ├── frontend/                 # Frontend development plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json       # Plugin manifest
│   │   ├── agents/               # 14 frontend agents
│   │   ├── package.json          # For NX versioning (private)
│   │   └── project.json          # NX project config
│   ├── infrastructure/           # Infrastructure & DevOps plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── agents/               # 13 infrastructure agents
│   │   ├── skills/               # Utility skills (db-upgrader)
│   │   ├── package.json
│   │   └── project.json
│   └── management/               # Project management plugin
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── agents/               # 3 management agents
│       ├── package.json
│       └── project.json
├── packages/
│   ├── hcc-pf-mcp/               # @redhat-cloud-services/hcc-pf-mcp
│   ├── hcc-feo-mcp/              # @redhat-cloud-services/hcc-feo-mcp
│   └── hcc-kessel-mcp/           # @redhat-cloud-services/hcc-kessel-mcp
├── scripts/
│   └── sync-plugin-versions.js  # Syncs package.json version → plugin.json
├── docs/                         # Documentation
├── nx.json                       # NX workspace config
└── package.json                  # Root workspace package
```

## Published npm Packages

| Package | Description | Version |
|---------|-------------|---------|
| `@redhat-cloud-services/hcc-pf-mcp` | PatternFly component docs, source code, CSS utilities, DataView examples | 0.5.x |
| `@redhat-cloud-services/hcc-feo-mcp` | Frontend Operator schema, validation, templates, migration guidance | 0.2.x |
| `@redhat-cloud-services/hcc-kessel-mcp` | HCC service permission mapping and Kessel v2 migration | 0.2.x |

## Development Commands

```bash
# Install dependencies
npm ci

# Build all packages
npm run build              # or: npx nx run-many -t build

# Run all tests
npm test                   # or: npx nx run-many -t test

# Test specific package
npm run test:mcp           # hcc-pf-mcp only
npm run test:watch         # hcc-pf-mcp in watch mode
npm run test:coverage      # hcc-pf-mcp with coverage

# Agent development — test agents locally in Claude Code before commit

# Nx utilities
npx nx reset               # Clean Nx cache
npx nx graph               # Visualize project dependency graph
npx nx run-many -t lint    # Lint all packages

# Test MCP server locally
npx @modelcontextprotocol/inspector node packages/hcc-pf-mcp/dist/index.js

# Release (CI only, runs on master push)
npx nx release -y          # Versioning + npm publish + GitHub releases
```

## Key Concepts

### Plugin Organization

Agents are organized into 3 specialized plugins:

- **Frontend** (`plugins/frontend/agents/`) - Development tools (14 agents)
- **Infrastructure** (`plugins/infrastructure/agents/`) - DevOps automation (13 agents)
- **Management** (`plugins/management/agents/`) - Project management (3 agents)

Each plugin has its own package.json for NX versioning and plugin.json for Claude Code metadata.

### MCP Server Architecture

Each MCP server package follows the same pattern:

- Entry point: `src/index.ts` — registers tools with the MCP SDK
- Tools: `src/lib/tools/` — individual tool implementations
- Each tool returns a `[name, schema, handler]` tuple
- Schemas **must** use Zod (not JSON Schema) — the MCP SDK calls `safeParseAsync()` on schemas

### Automated Release

The repository uses **automated versioning** for both plugins and packages:

**Plugin Releases** (when `plugins/*/agents/` changes):
- NX detects changes in plugin projects
- Analyzes conventional commits to determine bump type
- Versions `package.json` files (private, not published to npm)
- Post-version hook syncs to `plugin.json` and `marketplace.json`
- Creates `{plugin-name}@{version}` git tags and GitHub releases
- Runs on every master push via GitHub Actions

**Package Releases** (when `packages/` changes):
- Uses Nx Release with independent versioning
- Conventional commits control version bumps:
  - `feat:` → minor bump
  - `fix:` → patch bump
  - `feat!:` or `BREAKING CHANGE:` → major bump
- Publishes to npm with provenance
- Creates GitHub releases per package

### Plugin Distribution

- Marketplace: `.claude-plugin/marketplace.json` (root) lists all 3 plugins
- Each plugin: `plugins/{name}/.claude-plugin/plugin.json` defines agents
- Versions are auto-managed by NX Release via CI
- Users install specific plugins: `/plugin install frontend-plugin@hcc-frontend-toolkit`

## Coding Conventions

1. **Agent naming**: All agents use `hcc-frontend-` or `hcc-infra-` prefix
2. **Agent scope**: Single responsibility — one clear job per agent (see AGENT_GUIDELINES.md)
3. **Agent frontmatter**: YAML with `description` and `capabilities` fields
4. **MCP tool schemas**: Always use Zod constructors, never JSON Schema objects
5. **MCP tool signatures**: Return `[name, { description, inputSchema }, handler]` tuple
6. **TypeScript strict mode**: `strict: true` in tsconfig, `noUnusedLocals`, `noImplicitReturns`
7. **Conventional commits**: `type(scope): description` — scopes: agent names, package names, `scripts`, `ci`. This controls automated version bumping!
8. **Version bumps**: **AUTOMATED** - plugin versions auto-increment on master merge based on conventional commits. No manual bumping required.
9. **Test colocation**: Tests live in `src/lib/__tests__/` within each package
10. **Dependencies**: MCP servers must include `zod` as a dependency (MCP SDK requirement)
11. **Package publishing**: All MCP packages use `.npmignore` files to exclude development artifacts. Only `dist/`, `README.md`, and `LICENSE` are published to npm (controlled via `files` field in package.json)

## Common Pitfalls

1. **Wrong plugin directory**: Frontend agents go in `plugins/frontend/agents/`, not `plugins/infrastructure/agents/`
2. **JSON Schema in MCP tools**: Using `{ type: 'object', properties: {...} }` instead of Zod schemas causes `safeParseAsync is not a function` errors at runtime
3. **Missing Zod dependency**: New MCP packages must include `zod` in their `package.json` dependencies
4. **Wrong commit format**: Not using conventional commits (`feat:`, `fix:`, etc.) means version won't bump correctly or release will be skipped
5. **Agent too broad**: Agents should be focused on specific tasks, not general-purpose (see AGENT_GUIDELINES.md for examples)
6. **NX cache stale**: After major changes, run `npx nx reset` to clear the NX daemon cache
7. **System dep for builds**: CI requires `libsecret-1-dev` for builds — documented in CI workflow
8. **Modifying .npmignore**: `.npmignore` files are protected in CODEOWNERS and require `@RedHatInsights/experience-services-admins` approval to prevent accidental inclusion of development files in published packages

## Documentation Index

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Getting started, installation, agent catalog, MCP tools reference |
| [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md) | Agent design philosophy, scope, naming, examples |
| [DB_UPGRADE_AGENTS.md](DB_UPGRADE_AGENTS.md) | Database upgrade orchestration agents |
| [OUTSTANDING_WORK.md](OUTSTANDING_WORK.md) | Roadmap, planned integrations, future work |
| [scripts/README.md](scripts/README.md) | Conversion scripts documentation |
| [packages/hcc-pf-mcp/README.md](packages/hcc-pf-mcp/README.md) | PatternFly MCP server docs |
| [packages/hcc-feo-mcp/README.md](packages/hcc-feo-mcp/README.md) | FEO MCP server docs |
| [packages/hcc-kessel-mcp/README.md](packages/hcc-kessel-mcp/README.md) | Kessel MCP server docs |
| [tests/migration-demo/QUICKSTART.md](tests/migration-demo/QUICKSTART.md) | IQE→Playwright migration guide |
| [docs/plugin-development-guidelines.md](docs/plugin-development-guidelines.md) | Creating agents and MCP servers |
| [docs/architecture-guidelines.md](docs/architecture-guidelines.md) | Monorepo architecture, CI/CD, release |
