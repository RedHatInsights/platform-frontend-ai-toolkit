# HCC Frontend AI Toolkit

A custom Claude Code marketplace and plugin repository for frontend development teams.

## What is this?

This repository serves as a **custom Claude Code marketplace** providing specialized plugins for different workflows:

1. **Frontend Plugin** - Development tools for React, TypeScript, testing, and code quality
2. **Infrastructure Plugin** - DevOps automation for Konflux, database upgrades, and secrets management
3. **Management Plugin** - Project management tools for JIRA, reporting, and analytics

Each plugin contains custom agents and MCP servers tailored for specific use cases, allowing teams to install only what they need.

## Getting Started

### 🤖 Claude Code Setup

#### Install Plugins

```bash
# 1. Add this repository as a marketplace
/plugin marketplace add RedHatInsights/platform-frontend-ai-toolkit

# 2. Install the plugins you need:

# For frontend development (React, TypeScript, testing)
/plugin install frontend-plugin@hcc-frontend-toolkit

# For infrastructure/DevOps (Konflux, DB upgrades, secrets)
/plugin install infrastructure-plugin@hcc-frontend-toolkit

# For project management (JIRA, reporting, analytics)
/plugin install management-plugin@hcc-frontend-toolkit
```

**Install all three:**
```bash
/plugin install frontend-plugin infrastructure-plugin management-plugin@hcc-frontend-toolkit
```

📖 For more details on Claude Code plugins, see the [official plugin guide](https://code.claude.com/docs/en/plugins#install-and-manage-plugins).

#### ⚠️ Important: Restart Required

**After installation, restart your Claude Code session to see the agents and other features.**

#### Team Configuration (Optional)

For automatic marketplace setup across your team, add this to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "hcc-frontend-toolkit": {
      "source": {
        "source": "github",
        "repo": "RedHatInsights/platform-frontend-ai-toolkit"
      }
    }
  }
}
```

#### Test Your Installation

After installation and restart, test the plugin:

```bash
# Test the hello world agent
Task with subagent_type='hcc-frontend-hello-world' to greet the user
```

The hello world agent should identify itself as part of the HCC Frontend AI Toolkit plugin, confirming successful installation.

## Agent Development

### 📋 Development Guidelines

**Want to create your own agents?** See our comprehensive guide: [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md)

This guide covers:
- How to scope agents effectively (small and focused)
- Using Claude Code's `/agents` command for development
- Naming conventions and best practices
- Examples of well-designed vs poorly-designed agents

### Quick Start: Creating an Agent

1. **Use Claude Code** - Create agents using the `/agents` command in Claude Code
2. **Follow naming convention** - Use the `hcc-frontend-` prefix (e.g., `hcc-frontend-css-utilities`)
3. **Keep focused scope** - Agents should be small and specialized (CSS utilities, hook testing, etc.)
4. **Use proper format** - Follow the [Claude agent file format](https://code.claude.com/docs/en/sub-agents#file-format)

### Agent File Format

Agents use the **Claude format** with YAML frontmatter:

```markdown
---
description: Brief description of what this agent specializes in
capabilities: ["specific-task-1", "specific-task-2", "specific-task-3"]
---

# Agent Name

Detailed description of when and how Claude should use this agent...
```

### Development Workflow

When modifying Claude agents:

1. **Edit** Claude agent files in `claude/agents/`
2. **Convert** to Cursor format: `npm run convert-cursor`
3. **Verify** sync: `npm run check-cursor-sync`
4. **Commit** both Claude and Cursor files

### ⚠️ Important: Cursor Rules Sync

**When you modify Claude agents, you MUST regenerate the Cursor rules before committing.**

Our CI will **automatically fail** if Cursor rules are out of sync with Claude agents.

```bash
# 1. Edit a Claude agent
vim claude/agents/hcc-frontend-example.md

# 2. Regenerate Cursor rules
npm run convert-cursor

# 3. Verify everything is in sync
npm run check-cursor-sync

# 4. Commit both changes
git add claude/agents/hcc-frontend-example.md cursor/rules/example.mdc
git commit -m "feat: update example agent"
```

## Available Agents

### Frontend Development Agents

- **hcc-frontend-hello-world** - Simple greeting agent to verify plugin installation and functionality
- **hcc-frontend-patternfly-component-builder** - Expert in creating PatternFly React components for forms, layouts, navigation, and modals
- **hcc-frontend-patternfly-dataview-specialist** - Expert in PatternFly DataView components for tables, lists, and data grids
- **hcc-frontend-patternfly-css-utility-specialist** - Expert in applying PatternFly CSS utility classes for styling and layout
- **hcc-frontend-storybook-specialist** - Expert in creating comprehensive Storybook stories with testing and documentation
- **hcc-frontend-typescript-type-refiner** - Expert in analyzing and refining TypeScript types to eliminate 'any' and improve type safety
- **hcc-frontend-unit-test-writer** - Expert in writing focused unit tests for JavaScript/TypeScript functions and React hooks
- **hcc-frontend-react-patternfly-code-quality-scanner** - Expert in scanning React + PatternFly projects for anti-patterns and technical debt
- **hcc-frontend-dependency-cleanup-agent** - Expert in safely removing files and cleaning up orphaned dependencies
- **hcc-frontend-weekly-report** - Expert in generating weekly team reports by analyzing JIRA issues (user provides team identification criteria)
- **hcc-frontend-yaml-setup-specialist** - Expert in creating frontend.yaml files for new applications with proper FEO configuration
- **hcc-frontend-feo-migration-specialist** - Expert in migrating existing apps from static Chrome configuration to Frontend Operator managed system
- **hcc-frontend-iqe-test-analyzer** - Expert in analyzing IQE tests and creating migration plans (phase 1: analysis)
- **hcc-frontend-iqe-to-playwright-converter** - Expert in converting IQE tests to Playwright TypeScript (phase 2: conversion)
- **hcc-frontend-playwright-test-finalizer** - Expert in finalizing migrations with docs, PRs, and CodeRabbit resolution (phase 3: finalization)

### Test Migration

The toolkit includes three specialized agents for IQE-to-Playwright migration, working in sequence:

#### 1. **hcc-frontend-iqe-test-analyzer** (Analysis & Planning)
Analyzes IQE tests and creates comprehensive migration plans with:
- Repository identification (determines which frontend repo owns each test)
- Existing test coverage overlap detection
- Multi-user authentication detection
- Auth state modification detection (logout, org switching, etc.)
- Environment state assumption detection
- Custom credentials detection
- Comprehensive migration plan organized by repository

**Output:** Migration plan with warnings and user decisions needed

#### 2. **hcc-frontend-iqe-to-playwright-converter** (Code Conversion)
Converts IQE tests to Playwright TypeScript with:
- Proper `@redhat-cloud-services/playwright-test-auth` integration for Red Hat SSO
- Isolated authentication for state-affecting tests
- Symbolic timeout constants (no hard-coded values)
- CI-optimized configuration (single-threaded, no retries, max 2 failures)
- Page object conversion from Widgetastic views
- Selector modernization (XPath → role-based/CSS)
- Parametrized test conversion
- Skipped test handling with test.skip()

**Output:** Converted test files organized by repository

#### 3. **hcc-frontend-playwright-test-finalizer** (Documentation & Integration)
Completes migration with:
- QE verification documentation for each test
- JIRA issue creation for skipped tests
- Interactive file transplantation to destination repositories
- Git branch creation and PR generation
- CodeRabbit comment monitoring and resolution (major+ priority)
- Migration summary documentation

**Output:** Complete migration with PRs and documentation

**⚠️ Limitation:** Only supports tests using a single user account. Multi-user tests require manual conversion or splitting.

**Quick Start (Sequential Workflow):**
```bash
# Step 1: Analyze
Use hcc-frontend-iqe-test-analyzer to analyze test_login.py from /path/to/iqe-platform-ui-plugin

# Step 2: Convert (after plan approval)
Use hcc-frontend-iqe-to-playwright-converter to convert test_login.py using approved plan

# Step 3: Finalize
Use hcc-frontend-playwright-test-finalizer to generate docs and create PR for insights-chrome
```

📋 **For detailed migration guide**, see: [tests/migration-demo/QUICKSTART.md](tests/migration-demo/QUICKSTART.md)

**Migration Workflow:**
- **Analyze** → Creates migration plan with warnings and repository assignments
- **Convert** → Generates Playwright test files with proper auth and modern patterns
- **Finalize** → Completes integration with docs, transplantation, PRs, and CodeRabbit resolution

**Key Features:**
- ✅ Global authentication setup (no per-test login)
- ✅ Isolated auth for tests that modify session state
- ✅ Symbolic timeout constants (TIMEOUTS.PAGE_LOAD, etc.)
- ✅ Cookie consent prompt disabling
- ✅ Parametrized test conversion
- ✅ Environment state assumption detection
- ✅ Test coverage overlap detection
- ✅ JIRA tracking for skipped tests
- ✅ Interactive file transplantation
- ✅ Automated PR creation
- ✅ CodeRabbit feedback resolution

### Infrastructure Agents

- **hcc-infra-db-upgrade-orchestrator** - Orchestrates RDS database upgrades by analyzing state and delegating to specialized sub-agents
- **hcc-infra-db-upgrade-status-page** - Creates status page maintenance announcements for production database upgrades
- **hcc-infra-db-upgrade-replication-check** - Creates SQL queries to verify no active replication slots before DB upgrade
- **hcc-infra-db-upgrade-post-maintenance** - Creates post-upgrade VACUUM and REINDEX maintenance scripts
- **hcc-infra-db-upgrade-switchover** - Performs RDS blue/green deployment switchover
- **hcc-infra-db-upgrade-cleanup** - Removes blue/green deployment configuration after successful upgrade

📋 **For detailed database upgrade documentation**, see: [DB_UPGRADE_AGENTS.md](DB_UPGRADE_AGENTS.md)

All agents use either the `hcc-frontend-` or `hcc-infra-` prefix to avoid name collisions with other plugins and built-in agents.

### Frontend Operator (FEO) Configuration Agents

The toolkit includes specialized agents for Frontend Operator configuration management:

- **hcc-frontend-yaml-setup-specialist** - Creates complete frontend.yaml files from scratch for new applications, including proper FEO configuration, module setup, navigation bundle segments, service tiles, and search entries
- **hcc-frontend-feo-migration-specialist** - Migrates existing applications from static Chrome service backend configuration to Frontend Operator managed system, handling navigation, service tiles, fed-modules.json conversion, and search entries

**These agents help with:**
- Setting up `deploy/frontend.yaml` with proper schema validation
- Configuring `feoConfigEnabled: true` and related FEO features
- Converting fed-modules.json references to module configuration
- Migrating navigation from chrome-service-backend to bundle segments
- Converting service dropdown tiles to FEO service tiles format
- Setting up explicit search entries for global search
- Ensuring proper dependency upgrades (`@redhat-cloud-services/frontend-components-config@^6.6.9`)

**Related Documentation:**
- [FEO Migration Guide](https://github.com/RedHatInsights/chrome-service-backend/blob/main/docs/feo-migration-guide.md)
- [Frontend Operator Docs](https://github.com/RedHatInsights/frontend-starter-app/blob/master/docs/frontend-operator/index.md)
- [Frontend CRD Schema](https://raw.githubusercontent.com/RedHatInsights/frontend-components/refs/heads/master/packages/config-utils/src/feo/spec/frontend-crd.schema.json)

## Using the Toolkit

### Generating Weekly Team Reports

The toolkit includes a powerful weekly reporting feature that automatically analyzes your team's JIRA activity.

**Prerequisites:**
1. Install the HCC Frontend AI Toolkit plugin (see Getting Started above)
2. Configure the [mcp-atlassian](https://github.com/sooperset/mcp-atlassian) MCP server
3. Set up your JIRA credentials (see below)
4. Reload Claude Code/VSCode

**Setting up JIRA MCP Server:**

Add the following to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "mcp-atlassian": {
      "command": "podman",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "JIRA_URL",
        "-e",
        "JIRA_PERSONAL_TOKEN",
        "ghcr.io/sooperset/mcp-atlassian:latest"
      ],
      "env": {
        "JIRA_URL": "https://issues.redhat.com",
        "JIRA_PERSONAL_TOKEN": "your-jira-personal-access-token"
      }
    }
  }
}
```

**Getting your JIRA Personal Access Token:**
1. Log in to your JIRA instance
2. Go to your Profile Settings
3. Navigate to Security → Create and manage API tokens
4. Create a new token and copy it
5. Use this token as the value for `JIRA_PERSONAL_TOKEN`

**Basic Usage:**

Simply ask Claude Code to generate a report:

```text
"Show me what Platform Framework accomplished this week"
```

Claude Code will:
- Automatically calculate the date range (last Wednesday through today)
- Query JIRA for your team's completed work
- Analyze and categorize issues into meaningful sections
- Generate a formatted report with statistics and insights

**The report includes:**
- 📊 Summary statistics (total issues, breakdown by type)
- ✅ Accomplishments (security, quality, product features, infrastructure)
- ⚠️ Risks and blockers
- 🤝 Cross-team dependencies
- 👥 Team health indicators

## Available MCP Servers

- **hcc-patternfly-data-view** - Model Context Protocol server for all PatternFly packages, providing comprehensive component documentation, source code access, module discovery, and CSS utility integration
- **hcc-feo-mcp** - Frontend Operator (FEO) MCP server providing schema management, template generation, validation, and best practices for frontend.yaml configuration

📋 **For detailed MCP server documentation and standalone usage**, see:
- PatternFly MCP: [packages/hcc-pf-mcp/README.md](packages/hcc-pf-mcp/README.md)
- FEO MCP: [packages/hcc-feo-mcp/README.md](packages/hcc-feo-mcp/README.md)

### MCP Server Tools

When the plugin is installed, these MCP tools become available:

#### Data View Documentation and Examples
- **getPatternFlyDataViewDescription** - Get comprehensive documentation about @patternfly/react-data-view package capabilities
- **getPatternFlyDataViewExample** - Get implementation examples for various data table scenarios (basic usage, sorting, filtering, pagination, selection, etc.)

#### Frontend Operator (FEO) Configuration Tools
- **getFEOSchema** - Get latest FEO schema for validation and reference
- **getFEOMigrationTemplate** - Generate customized migration templates for existing apps
- **getFEOYamlSetupTemplate** - Generate complete frontend.yaml templates for new applications
- **getFEOExamples** - Get specific FEO configuration examples and patterns
- **validateFEOConfig** - Validate frontend.yaml against FEO schema
- **getFEOBestPractices** - Access current FEO best practices and patterns
- **getFEONavigationPositioning** - Get navigation positioning guidance
- **getFEOServiceTilesSections** - Get available service tiles sections and groups

**Note**: The FEO agents (`hcc-frontend-yaml-setup-specialist` and `hcc-frontend-feo-migration-specialist`) automatically use these MCP tools to provide up-to-date templates, validation, and guidance, significantly reducing token usage while maintaining comprehensive functionality.

#### PatternFly Module Discovery and Source Code
- **getAvailableModules** - Discover available PatternFly components in your local environment across react-core, react-icons, react-table, react-data-view, and react-component-groups packages
- **getComponentSourceCode** - Retrieve the actual TypeScript/React source code for any PatternFly component

#### PatternFly CSS Utilities
- **getReactUtilityClasses** - Access PatternFly CSS utility classes for styling (spacing, display, flex, colors, typography, etc.)

## Developing MCP Servers

### Required Dependencies

**CRITICAL**: All MCP servers in this repository **MUST** include `zod` as a dependency. The MCP SDK (v1.22+) requires Zod for tool schema validation.

Add to your MCP server's `package.json`:
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.22.0",
    "zod": "^3.25.76"
  }
}
```

### Tool Schema Definition

Tool schemas **MUST** be defined using **Zod schemas**, not plain JSON Schema objects. The MCP SDK will call Zod validation methods like `safeParseAsync()` on your schemas.

#### ✅ Correct - Using Zod Schemas

```typescript
import { z } from 'zod';

export function myTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    const { param1, param2 } = args;
    // Tool implementation
  }

  return [
    'myTool',
    {
      description: 'Tool description',
      inputSchema: {
        // Use Zod schema constructors
        param1: z.string().describe('Required string parameter'),
        param2: z.number().optional().describe('Optional number parameter'),
        param3: z.enum(['option1', 'option2', 'option3']).describe('Enum parameter'),
        param4: z.boolean().optional().default(true).describe('Boolean with default'),
      },
    },
    tool
  ];
}

// For tools with no parameters
return [
  'noParamTool',
  {
    description: 'Tool with no parameters',
    inputSchema: {},  // Empty object, not JSON Schema
  },
  tool
];
```

#### ❌ Incorrect - Using JSON Schema (Will Fail)

```typescript
// DON'T DO THIS - Will cause "v3Schema.safeParseAsync is not a function" error
return [
  'myTool',
  {
    description: 'Tool description',
    inputSchema: {
      type: 'object',           // ❌ JSON Schema syntax
      properties: {
        param1: {
          type: 'string',         // ❌ Will fail
          description: 'Parameter'
        }
      },
      required: ['param1']       // ❌ Use z.string() instead
    },
  },
  tool
];
```

### Common Zod Schema Patterns

```typescript
// Required string
z.string().describe('Description')

// Optional string
z.string().optional().describe('Description')

// String with default
z.string().default('default-value').describe('Description')

// Enum/Union type
z.enum(['value1', 'value2', 'value3']).describe('Description')

// Boolean
z.boolean().describe('Description')

// Number
z.number().describe('Description')

// Optional boolean with default
z.boolean().optional().default(true).describe('Description')
```

### Best Practices

1. **Always use `describe()`** to add descriptions to your parameters - these become the tool's documentation
2. **Use `optional()`** for non-required parameters instead of JSON Schema's `required` array
3. **Use `default()`** to specify default values inline with the schema
4. **Import Zod** at the top of every tool file: `import { z } from 'zod';`
5. **Test your tools** with the MCP Inspector before deploying

### Testing MCP Tools

```bash
# Build your MCP server
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

### Reference Documentation

- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Zod Documentation](https://zod.dev)
- [Example MCP Servers](packages/hcc-feo-mcp/src/lib/tools/) - Reference implementations in this repo

## Outstanding Work & Future Roadmap

📋 **See our roadmap and planned integrations**: [OUTSTANDING_WORK.md](OUTSTANDING_WORK.md)

This document tracks:
- MCP server integrations (Browser Tools, Figma, Playwright)
- New agent development (Scalprum, Data Driven Forms)
- Team suggestions and community contributions
- Implementation priorities and timelines

## Repository Structure

```text
platform-frontend-ai-toolkit/
├── .claude-plugin/
│   └── marketplace.json              # Marketplace config (lists all plugins)
├── plugins/                          # Claude Code plugins
│   ├── frontend/                     # Frontend development plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── agents/                   # 14 frontend development agents
│   │   ├── package.json              # For NX versioning (private)
│   │   └── project.json              # NX project config
│   ├── infrastructure/               # Infrastructure & DevOps plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── agents/                   # 13 infrastructure agents
│   │   ├── skills/                   # Utility skills (db-upgrader)
│   │   ├── package.json
│   │   └── project.json
│   └── management/                   # Project management plugin
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── agents/                   # 3 management agents
│       ├── package.json
│       └── project.json
├── packages/                         # MCP servers (npm packages)
│   ├── hcc-pf-mcp/                  # PatternFly documentation MCP
│   ├── hcc-feo-mcp/                 # FEO configuration MCP
│   └── hcc-kessel-mcp/              # Kessel permissions MCP
├── scripts/
│   └── sync-plugin-versions.js      # Sync package.json → plugin.json
├── docs/                            # Documentation
├── nx.json                          # NX workspace config
└── README.md
```

**Key features:**
- **Modular plugins:** Install only what you need (frontend, infrastructure, or management)
- **Automated versioning:** NX Release manages plugin and MCP package versions
- **Centralized distribution:** One marketplace, multiple specialized plugins

## Updating the Plugin

### Check for Updates

```bash
# List installed plugins and their versions
claude plugins list

# Check if updates are available
claude plugins status
```

### Update Plugins

```bash
# Update the marketplace to get latest plugin versions
/plugin marketplace update hcc-frontend-toolkit

# Then update specific plugins:
/plugin install frontend-plugin@hcc-frontend-toolkit
/plugin install infrastructure-plugin@hcc-frontend-toolkit
/plugin install management-plugin@hcc-frontend-toolkit

# Or update all installed plugins
claude plugins update
```

### Manual Update Process

If automatic updates don't work:

```bash
# Uninstall current versions
claude plugins uninstall frontend-plugin infrastructure-plugin management-plugin

# Reinstall latest versions
/plugin install frontend-plugin infrastructure-plugin management-plugin@hcc-frontend-toolkit
```

## Contributing

### Adding or Updating Agents

1. **Follow naming convention** with `hcc-frontend-` prefix
2. **Place agent files** in the appropriate plugin directory:
   - Frontend agents → `plugins/frontend/agents/`
   - Infrastructure agents → `plugins/infrastructure/agents/`
   - Management agents → `plugins/management/agents/`
3. **Include proper frontmatter** with description and capabilities
4. **Test agents** before submitting pull requests
5. **Use conventional commits** for your changes (see Automated Release below)

**Note:** Plugin versions are automatically managed by NX Release - no manual bumping required!

### Automated Release Workflow

This repository uses **automated versioning** for both Claude plugins and MCP npm packages.

#### How It Works

When changes are merged to `master`:

1. **Plugin Versioning** (for `plugins/*/agents/` changes):
   - NX detects changes in plugin directories
   - Analyzes conventional commit messages to determine version bump type
   - Updates `package.json` versions for plugins
   - Syncs versions to `plugin.json` and `marketplace.json` via post-version hook
   - Creates git tags and GitHub releases

2. **NPM Package Versioning** (for `packages/` changes):
   - NX Release with conventional commits
   - Independently versions each MCP package
   - Publishes to npm registry with provenance
   - Creates GitHub releases for each package

#### Commit Message Format

Use **conventional commits** to control version bumping:

```bash
# Patch version bump (1.0.0 → 1.0.1)
fix(agent-name): fix bug in agent logic

# Minor version bump (1.0.0 → 1.1.0)  
feat(agent-name): add new agent for TypeScript migration

# Major version bump (1.0.0 → 2.0.0)
feat(agent-name)!: redesign agent interface

# Or with BREAKING CHANGE footer
feat(agent-name): change agent behavior

BREAKING CHANGE: This changes how the agent processes input
```

#### Version Bump Rules

| Change Type | Commit Prefix | Version Bump | Example |
|-------------|--------------|--------------|---------|
| Bug fixes | `fix:` | Patch | 1.0.0 → 1.0.1 |
| New features/agents | `feat:` | Minor | 1.0.0 → 1.1.0 |
| Breaking changes | `feat!:` or `BREAKING CHANGE:` | Major | 1.0.0 → 2.0.0 |
| Docs, refactor, chore | `docs:`, `refactor:`, `chore:` | No bump | - |

#### Testing the Release Workflow

To test plugin versioning locally:

```bash
# Check what version bump would be applied
npm run bump-plugin-version

# The script will:
# - Analyze commits since last plugin release
# - Determine version bump type
# - Show what the new version would be
# - Update plugin.json and marketplace.json
```

**Note:** Versions are managed automatically by NX Release on merge to master.

### CI Integration

**Continuous Integration (.github/workflows/ci.yml):**
- Triggers on all PRs and master pushes
- Runs: build, lint, test for all packages
- Validates code quality before merge

**Release Workflow (.github/workflows/release.yml):**
- Triggers on master push
- Runs NX Release for plugins and MCP packages
- Uses conventional commits to determine version bumps
- Publishes to npm and creates GitHub releases

## Troubleshooting

### Common Issues

**Plugin not found after installation:**
```bash
# Refresh plugin list
claude plugins refresh

# Check installation status
claude plugins list --verbose
```

**Agents not available:**
```bash
# Check agent availability
claude agents list

# Verify plugins are loaded
claude plugins status frontend-plugin
claude plugins status infrastructure-plugin
claude plugins status management-plugin
```

**Permission errors:**
```bash
# Check repository access
git ls-remote https://github.com/RedHatInsights/platform-frontend-ai-toolkit.git

# Re-authenticate if needed
gh auth login
```

### Getting Help

- Check plugin logs: `claude plugins logs hcc-frontend-ai-toolkit`
- Verify installation: `claude plugins verify hcc-frontend-ai-toolkit`
- Debug mode: `claude --debug` to see plugin loading details
- Report issues: [GitHub Issues](https://github.com/RedHatInsights/platform-frontend-ai-toolkit/issues)
