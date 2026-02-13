# HCC Frontend AI Toolkit

A custom Claude Code marketplace and plugin repository for frontend development teams.

## What is this?

This repository serves as both:
1. A **Claude Code plugin** containing custom agents and MCP servers for frontend development
2. A **custom plugin marketplace** for your team's agent distribution

This approach allows your team to have a centralized location for all frontend development agents, MCP servers, and easily distribute them across the team.

## Getting Started

### 🤖 Claude Code Setup

#### Install the Plugin

```bash
# 1. Add this repository as a marketplace
/plugin marketplace add RedHatInsights/platform-frontend-ai-toolkit

# 2. Install the plugin from the marketplace
/plugin install hcc-frontend-ai-toolkit@hcc-frontend-toolkit
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

### 🖱️ Cursor Setup

This repository contains **Agents** (Rules) and **Tools** (MCPs) configured specifically for our team's workflows.

#### Option A: Install Script (Recommended)

Download and run the install script in the root of **your** project:

```bash
curl -sSL https://raw.githubusercontent.com/RedHatInsights/platform-frontend-ai-toolkit/master/install-cursor.sh | bash
```

#### Option B: Manual One-Liner

Run this command in the root of **your** project (the app you are working on, not this repo) to download the latest agents:

```bash
# Creates .cursor/rules and downloads our team agents
mkdir -p .cursor/rules && \
curl -o .cursor/rules/hello-world.mdc https://raw.githubusercontent.com/RedHatInsights/platform-frontend-ai-toolkit/master/cursor/rules/hello-world.mdc && \
curl -o .cursor/rules/patternfly-component-builder.mdc https://raw.githubusercontent.com/RedHatInsights/platform-frontend-ai-toolkit/master/cursor/rules/patternfly-component-builder.mdc && \
curl -o .cursor/rules/patternfly-dataview-specialist.mdc https://raw.githubusercontent.com/RedHatInsights/platform-frontend-ai-toolkit/master/cursor/rules/patternfly-dataview-specialist.mdc && \
curl -o .cursor/rules/storybook-specialist.mdc https://raw.githubusercontent.com/RedHatInsights/platform-frontend-ai-toolkit/master/cursor/rules/storybook-specialist.mdc && \
curl -o .cursor/rules/typescript-type-refiner.mdc https://raw.githubusercontent.com/RedHatInsights/platform-frontend-ai-toolkit/master/cursor/rules/typescript-type-refiner.mdc && \
curl -o .cursor/rules/unit-test-writer.mdc https://raw.githubusercontent.com/RedHatInsights/platform-frontend-ai-toolkit/master/cursor/rules/unit-test-writer.mdc && \
curl -o .cursor/rules/weekly-report.mdc https://raw.githubusercontent.com/RedHatInsights/platform-frontend-ai-toolkit/master/cursor/rules/weekly-report.mdc
```

*Restart Cursor after running this.*

#### Option C: Manual Setup

**1. Installing Agents (Rules)**

1.  Navigate to your project's root folder.
2.  Create a folder named `.cursor/rules/`.
3.  Copy the `.mdc` files from `cursor/rules/` in this repo into that folder.
4.  **Verify:** Open Cursor, type `Cmd+K` (or `Ctrl+K`), and you should see the agents appear in the context menu.

**2. Connecting Tools (MCPs)**

1.  Open Cursor Settings (`Cmd/Ctrl + ,`).
2.  Navigate to **General \> MCP**.
3.  Locate `cursor/mcp-template.json` in this repo.
4.  Copy the configuration for the tools you need and click **"Add new MCP server"** in Cursor.
5.  **Note:** The MCP server will automatically use the published NPM package `@redhat-cloud-services/hcc-pf-mcp`.

#### How to Use Cursor

  * **Chat:** Tag an agent by typing `@patternfly-component-builder` or `@typescript-type-refiner` in the chat window.
  * **Composer:** In Composer (`Cmd+I`), the agents will automatically activate based on the file types you are editing (e.g., TypeScript files will auto-activate the type refiner).

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

```
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

This repository is organized to support multiple agenic configurations:

```
platform-frontend-ai-toolkit/           # Repository root
├── .claude-plugin/
│   └── marketplace.json                 # Marketplace configuration (root level)
├── claude/                              # Claude Code plugin subdirectory
│   ├── .claude-plugin/
│   │   └── plugin.json                  # Plugin manifest
│   └── agents/                          # Agent definitions
│       └── hcc-frontend-hello-world.md
├── cursor/                              # Cursor editor support
│   ├── rules/                           # Converted .mdc files
│   └── mcp-template.json               # MCP server configuration template
├── packages/
│   └── hcc-pf-mcp/                     # MCP server package
├── scripts/                             # Automation scripts
│   ├── convert-to-cursor.js            # Claude -> Cursor conversion
│   └── check-cursor-sync.js            # Sync validation
├── AGENT_GUIDELINES.md                  # Agent development guidelines
├── LICENSE
└── README.md                           # This file
```

This structure allows you to:
- Add other agenic configurations in separate subdirectories (e.g., `openai/`, `anthropic/`, etc.)
- Keep the marketplace configuration at the root level
- Organize different AI toolkits by subdirectory

## Updating the Plugin

### Check for Updates

```bash
# List installed plugins and their versions
claude plugins list

# Check if updates are available
claude plugins status
```

### Update the Plugin

```bash
# Update the marketplace to get latest plugin versions
/plugin marketplace update hcc-frontend-toolkit

# Then update the plugin (via CLI interface or manually)
/plugin install hcc-frontend-ai-toolkit@hcc-frontend-toolkit

# Or update all plugins
claude plugins update
```

### Manual Update Process

If automatic updates don't work:

```bash
# Uninstall current version
claude plugins uninstall hcc-frontend-ai-toolkit

# Reinstall latest version
claude plugins install github:your-org/platform-frontend-ai-toolkit
```

## Contributing

### Adding or Updating Agents

1. **Follow naming convention** with `hcc-frontend-` prefix
2. **Place agent files** in the `claude/agents/` directory
3. **Include proper frontmatter** with description and capabilities
4. **Regenerate Cursor rules** after making changes:
   ```bash
   npm run convert-cursor
   ```
5. **Verify sync** before committing:
   ```bash
   npm run check-cursor-sync
   ```
6. **Test agents** before submitting pull requests
7. **Update plugin version** in `plugin.json` for releases

### CI Integration

#### CI Check:
- **Triggers on:** PRs that modify `claude/agents/`, `cursor/rules/`, or conversion scripts
- **Validates:** Cursor rules match Claude agents exactly
- **Fails if:** Rules are out of sync or conversion script produces different output

#### Local Development:
```bash
# Check if rules are in sync
npm run check-cursor-sync

# Fix sync issues
npm run convert-cursor

# Pre-commit hook runs automatically via Husky
git commit -m "feat: update agent" # Will run sync check
```

#### Pre-commit Protection:
- **Husky pre-commit hook** automatically runs `npm run check-cursor-sync`
- **Commits will fail** if Cursor rules are out of sync
- **Fix by running** `npm run convert-cursor` before committing

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

# Verify plugin is loaded
claude plugins status hcc-frontend-ai-toolkit
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
