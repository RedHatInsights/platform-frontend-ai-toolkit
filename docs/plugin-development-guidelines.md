# Plugin Development Guidelines

Guide for creating and maintaining Claude sub-agents and MCP servers in the HCC Frontend AI Toolkit.

## Creating a Claude Agent

### 1. Create the Agent File

Add a new Markdown file in `claude/agents/` with the `hcc-frontend-` or `hcc-infra-` prefix:

```bash
# Example: creating a new CSS utilities agent
touch claude/agents/hcc-frontend-css-utilities.md
```

### 2. Agent File Format

Use YAML frontmatter followed by the agent prompt:

```markdown
---
description: Brief description of what this agent specializes in
capabilities: ["specific-task-1", "specific-task-2", "specific-task-3"]
---

# Agent Name

Detailed prompt describing when and how Claude should use this agent.

## When to Use This Agent

- Specific scenario 1
- Specific scenario 2

## Examples

[Concrete usage examples with code snippets]
```

### 3. Agent Design Principles

- **Single responsibility** — one clear job per agent
- **Narrow scope** — avoid "general helper" agents
- **Clear boundaries** — state what the agent does NOT do
- **Composability** — agents should work well alongside others
- **Actionable capabilities** — list specific tasks, not vague descriptions

See [AGENT_GUIDELINES.md](../AGENT_GUIDELINES.md) for detailed examples of well-scoped vs poorly-scoped agents.

### 4. Generate Cursor Rules

After creating or modifying an agent, regenerate the Cursor rules:

```bash
# Regenerate all Cursor rules from Claude agents
npm run convert-cursor

# Verify sync
npm run check-cursor-sync
```

The conversion script (`scripts/convert-to-cursor.js`) transforms Claude Markdown agents into Cursor `.mdc` rule files. The sync check validates that all agents have corresponding Cursor rules.

### 5. Bump Plugin Version

Update the version in **both** plugin manifests so users receive the update:

1. `claude/.claude-plugin/plugin.json` — the plugin manifest
2. `.claude-plugin/marketplace.json` — the marketplace metadata

Both must stay in sync:

```json
{
  "version": "1.10.3"  // Increment appropriately — same value in both files
}
```

Use semantic versioning:
- **Patch** (1.10.2 → 1.10.3): Bug fixes to existing agents
- **Minor** (1.10.2 → 1.11.0): New agents or features
- **Major** (1.10.2 → 2.0.0): Breaking changes to agent behavior

### 6. Commit Both Formats

Always commit Claude agents and Cursor rules together:

```bash
git add claude/agents/hcc-frontend-css-utilities.md cursor/rules/css-utilities.mdc
git commit -m "feat(css-utilities): add CSS utility specialist agent"
```

## Creating an MCP Server

### 1. Scaffold the Package

Create a new package in `packages/`:

```bash
mkdir -p packages/hcc-new-mcp/src/lib/tools
mkdir -p packages/hcc-new-mcp/src/lib/__tests__
```

### 2. Required Dependencies

Every MCP server must include `zod` — the MCP SDK uses Zod for schema validation:

```json
{
  "name": "@redhat-cloud-services/hcc-new-mcp",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.22.0",
    "tslib": "^2.3.0",
    "zod": "^3.25.76"
  }
}
```

### 3. Tool Implementation Pattern

Each tool follows the `[name, schema, handler]` tuple pattern:

```typescript
import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Type alias for tool registration
type McpTool = [string, { description: string; inputSchema: Record<string, any> }, (args: any) => Promise<CallToolResult>];

export function myTool(): McpTool {
  async function handler(args: any): Promise<CallToolResult> {
    const { query, includeExamples } = args;
    // Implementation here
    return {
      content: [{ type: 'text', text: 'result' }],
    };
  }

  return [
    'myToolName',
    {
      description: 'What this tool does',
      inputSchema: {
        query: z.string().describe('Search query'),
        includeExamples: z.boolean().optional().default(false).describe('Include examples'),
      },
    },
    handler,
  ];
}
```

### 4. Common Schema Patterns

```typescript
// Required string
z.string().describe('Description')

// Optional with default
z.string().optional().default('value').describe('Description')

// Enum
z.enum(['option1', 'option2']).describe('Description')

// Boolean
z.boolean().optional().default(true).describe('Description')

// Number
z.number().describe('Description')

// No parameters — use empty object
inputSchema: {}
```

**Never use JSON Schema syntax** (`{ type: 'object', properties: {...} }`). The MCP SDK calls `safeParseAsync()` on schemas, which requires Zod objects.

### 5. Register Tools in Entry Point

In `src/index.ts`, register all tools with the MCP server:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { myTool } from './lib/tools/myTool.js';

const server = new McpServer({
  name: 'hcc-new-mcp',
  version: '0.1.0',
});

server.tool(...myTool());

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 6. Add to Nx Release

Register the package in `nx.json` for automated releases:

```json
{
  "release": {
    "projects": [
      "@redhat-cloud-services/hcc-pf-mcp",
      "@redhat-cloud-services/hcc-feo-mcp",
      "@redhat-cloud-services/hcc-kessel-mcp",
      "@redhat-cloud-services/hcc-new-mcp"
    ]
  }
}
```

### 7. Testing

Write tests in `src/lib/__tests__/` using Jest:

```typescript
import { myTool } from '../tools/myTool';

describe('myTool', () => {
  const [name, schema, handler] = myTool();

  it('should return expected result', async () => {
    const result = await handler({ query: 'test' });
    expect(result.content[0].text).toContain('expected');
  });
});
```

Run tests:

```bash
npx nx test @redhat-cloud-services/hcc-new-mcp
```

### 8. Local Testing with MCP Inspector

Build and test interactively:

```bash
npm run build
npx @modelcontextprotocol/inspector node packages/hcc-new-mcp/dist/index.js
```

## CI Enforcement

### CI Pipeline (`ci.yml`)

Runs on all PRs and master pushes:
1. `npm ci` — install dependencies
2. `npx nx run-many -t build` — build all packages
3. `npx nx run-many -t lint` — lint all packages
4. `npx nx run-many -t test` — run all tests
5. `npm run check-cursor-sync` — verify agent ↔ cursor sync

### Cursor Sync Check (`cursor-sync-check.yml`)

Triggered on PRs modifying `claude/agents/`, `cursor/rules/`, or conversion scripts:
1. Regenerates all Cursor rules from scratch
2. Compares against committed rules
3. Fails if any differences exist

### Pre-push Hook

Husky runs `npm run check-cursor-sync` before every push. Fix sync issues with `npm run convert-cursor`.

## Checklist for New Agents

- [ ] File created in `claude/agents/` with proper prefix
- [ ] YAML frontmatter with `description` and `capabilities`
- [ ] Focused scope with clear boundaries
- [ ] Usage examples included
- [ ] `npm run convert-cursor` executed
- [ ] `npm run check-cursor-sync` passes
- [ ] Plugin version bumped in `claude/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
- [ ] Both `.md` and `.mdc` files committed together

## Checklist for New MCP Servers

- [ ] Package created in `packages/` with proper structure
- [ ] `zod` included as dependency
- [ ] Tool schemas use Zod constructors (not JSON Schema)
- [ ] Entry point registers tools and starts stdio transport
- [ ] Tests written in `src/lib/__tests__/`
- [ ] Package added to `nx.json` release config
- [ ] Package added to `plugin.json` mcpServers (if distributed via plugin)
- [ ] README.md documenting available tools
