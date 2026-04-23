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
│   └── marketplace.json          # Marketplace config (plugin discovery)
├── .github/workflows/
│   ├── ci.yml                    # Build, lint, test, cursor-sync check
│   ├── cursor-sync-check.yml     # PR check: Claude agents ↔ Cursor rules sync
│   └── release.yml               # Nx Release → npm publish on master push
├── .mcp.json                     # Local MCP config (nx-mcp for dev)
├── claude/
│   ├── .claude-plugin/
│   │   └── plugin.json           # Plugin manifest (name, version, MCP servers)
│   └── agents/                   # Claude sub-agent definitions (.md)
│       ├── hcc-frontend-*.md     # Frontend + DB upgrade agents (30 files)
│       └── hcc-infra-*.md        # Infrastructure agents (supported by converter)
├── cursor/
│   ├── rules/                    # Auto-generated Cursor rules (.mdc)
│   └── mcp-template.json         # MCP server config template for Cursor
├── packages/
│   ├── hcc-pf-mcp/               # @redhat-cloud-services/hcc-pf-mcp
│   │   ├── src/lib/tools/        # MCP tool implementations
│   │   ├── src/lib/examples/     # PatternFly usage examples
│   │   ├── src/lib/utils/        # Shared utilities
│   │   └── src/lib/__tests__/    # Jest tests
│   ├── hcc-feo-mcp/              # @redhat-cloud-services/hcc-feo-mcp
│   │   └── src/lib/tools/        # FEO schema/validation tools
│   └── hcc-kessel-mcp/           # @redhat-cloud-services/hcc-kessel-mcp
│       └── src/lib/              # Kessel permission mapping tools
├── scripts/
│   ├── convert-to-cursor.js      # Claude agent → Cursor rule converter
│   └── check-cursor-sync.js      # Validates Claude ↔ Cursor sync
├── tests/
│   ├── agents/                   # Agent test definitions (.test.md)
│   └── migration-demo/           # IQE→Playwright migration example
├── AGENT_GUIDELINES.md           # Agent design philosophy and best practices
├── DB_UPGRADE_AGENTS.md          # Database upgrade agent documentation
├── OUTSTANDING_WORK.md           # Roadmap and planned features
├── nx.json                       # Nx workspace config
├── package.json                  # Root workspace package
└── tsconfig.base.json            # Shared TypeScript config
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

# Agent development
npm run convert-cursor     # Regenerate Cursor rules from Claude agents
npm run check-cursor-sync  # Verify Claude ↔ Cursor sync

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

### Agent ↔ Cursor Sync

Claude agents in `claude/agents/` are the source of truth. Cursor rules in `cursor/rules/` are auto-generated:

1. Edit `.md` files in `claude/agents/`
2. Run `npm run convert-cursor` to regenerate `.mdc` files
3. Run `npm run check-cursor-sync` to validate
4. Commit both Claude and Cursor files together

The Husky pre-push hook and CI both enforce sync. Pushes fail if rules are out of sync.

### MCP Server Architecture

Each MCP server package follows the same pattern:

- Entry point: `src/index.ts` — registers tools with the MCP SDK
- Tools: `src/lib/tools/` — individual tool implementations
- Each tool returns a `[name, schema, handler]` tuple
- Schemas **must** use Zod (not JSON Schema) — the MCP SDK calls `safeParseAsync()` on schemas

### Nx Release

Packages are independently versioned using conventional commits:
- `feat:` → minor bump
- `fix:` → patch bump
- `feat!:` or `BREAKING CHANGE:` → major bump
- Release runs on master push via GitHub Actions

### Plugin Distribution

- Marketplace: `.claude-plugin/marketplace.json` (root) points to `claude/` subdirectory
- Plugin: `claude/.claude-plugin/plugin.json` defines agents + MCP servers
- Users install via: `/plugin marketplace add RedHatInsights/platform-frontend-ai-toolkit`

## Coding Conventions

1. **Agent naming**: All agents use `hcc-frontend-` or `hcc-infra-` prefix
2. **Agent scope**: Single responsibility — one clear job per agent (see AGENT_GUIDELINES.md)
3. **Agent frontmatter**: YAML with `description` and `capabilities` fields
4. **MCP tool schemas**: Always use Zod constructors, never JSON Schema objects
5. **MCP tool signatures**: Return `[name, { description, inputSchema }, handler]` tuple
6. **TypeScript strict mode**: `strict: true` in tsconfig, `noUnusedLocals`, `noImplicitReturns`
7. **Conventional commits**: `type(scope): description` — scopes: agent names, package names, `scripts`, `ci`
8. **Version bumps**: Bump `claude/.claude-plugin/plugin.json` version when adding/modifying agents
9. **Test colocation**: Tests live in `src/lib/__tests__/` within each package
10. **Dependencies**: MCP servers must include `zod` as a dependency (MCP SDK requirement)

## Common Pitfalls

1. **Forgetting cursor sync**: Modifying Claude agents without running `npm run convert-cursor` will fail CI and the pre-push hook
2. **JSON Schema in MCP tools**: Using `{ type: 'object', properties: {...} }` instead of Zod schemas causes `safeParseAsync is not a function` errors at runtime
3. **Missing Zod dependency**: New MCP packages must include `zod` in their `package.json` dependencies
4. **Plugin version not bumped**: Users won't receive agent updates if `plugin.json` version isn't incremented
5. **Agent too broad**: Agents should be focused on specific tasks, not general-purpose (see AGENT_GUIDELINES.md for examples)
6. **Nx cache stale**: After major changes, run `npx nx reset` to clear the Nx daemon cache
7. **System dep for builds**: CI requires `libsecret-1-dev` for builds — documented in CI workflow

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
