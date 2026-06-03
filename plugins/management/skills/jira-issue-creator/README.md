# Jira Issue Creator Skill

Python-based skill for creating validated RHCLOUD Jira issues with automatic field enforcement.

## How It Works

1. User invokes skill: `/jira-issue-creator Fix CVE in chrome. Assign to me`
2. Claude parses invocation message for summary, description, assignee hint
3. Claude resolves assignee hint if present ("me" → git user.email, "bot" → bot email, name → lookup)
4. Claude shows assignee question (confirm resolved assignee, or select unassigned/bot/other)
5. Claude shows 4 dropdowns with recommended defaults: team, activity type, issue type, prefix
6. Python validates confirmed selections (team UUIDs, labels, security level, assignee)
7. Claude creates ticket without description
8. Claude generates enriched description from shorthand + codebase context
9. Claude shows enriched description for approval
10. After approval, Claude updates ticket with full description

**Interactive selection:**
- Assignee asked separately (Step 4) with resolved value pre-filled
- Team, activity, type, prefix asked together (Step 5)
- Recommended options inferred from context (CI → Quality, CVE → Security, cwd → prefix)
- User confirms/changes all selections before creation

**Prefix behavior:**
- Auto-detected from cwd basename (e.g., `/path/to/javascript-clients` → `[javascript-clients]`)
- Can be overridden with `[custom]` in prompt or "No prefix" dropdown option
- Shows in ticket summary: `[javascript-clients] Fix auth bug`
- Helps organize backlog by repo/component/feature

**Activity type determination:**
- User selects from dropdown with recommended option
- CI/CD, refactoring, tooling → Quality / Stability / Reliability
- CVE, security, vulnerability → Security & Compliance
- Upgrades, migrations, architecture, docs → Future Sustainability
- New features, product work → Product / Portfolio Work

## Quick Start

Test the validation script:

```bash
python3 jira_fields.py \
  --summary "Fix bug in chrome" \
  --team "Console - Framework" \
  --issue-type "Bug"
```

## Development Setup

### Create Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate     # Windows
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Tests

```bash
pytest tests/test_jira_fields.py -v
```

Or with the venv directly (without activation):

```bash
.venv/bin/pytest tests/test_jira_fields.py -v
```

## Testing in Claude Code

Two methods for testing locally:

### Method 1: Plugin Cache (Fast Iteration)

Direct injection into installed plugin cache — no reinstall needed.

```bash
# Find your plugin version
ls ~/.claude/plugins/cache/hcc-frontend-toolkit/hcc-frontend-ai-toolkit/

# Copy skill (replace 1.10.3 with your version)
cp -r . ~/.claude/plugins/cache/hcc-frontend-toolkit/hcc-frontend-ai-toolkit/1.10.3/skills/jira-issue-creator/

# Ensure SKILL.md is uppercase
cd ~/.claude/plugins/cache/hcc-frontend-toolkit/hcc-frontend-ai-toolkit/1.10.3/skills/jira-issue-creator/
rm skill.md 2>/dev/null || true
```

Restart Claude Code. Test with `/jira-issue-creator`.

**Use for:** Rapid testing during development.

### Method 2: Marketplace Source (Full Install Flow)

Updates marketplace source, requires plugin reinstall.

```bash
# Copy to marketplace source
cp -r . ~/.claude/plugins/marketplaces/hcc-frontend-toolkit/claude/skills/jira-issue-creator/

# Ensure SKILL.md is uppercase
cd ~/.claude/plugins/marketplaces/hcc-frontend-toolkit/claude/skills/jira-issue-creator/
rm skill.md 2>/dev/null || true
```

Restart Claude Code, reinstall plugin:
```bash
/plugin uninstall hcc-frontend-ai-toolkit
/plugin install hcc-frontend-toolkit
```

**Use for:** Testing full plugin installation, verifying marketplace config.

**Note:** Skills require `SKILL.md` (uppercase) to load properly.

## Usage from Skill

The skill invokes the script for validation. Example for user-assigned ticket:

```bash
python3 claude/skills/jira-issue-creator/jira_fields.py \
  --summary "Fix auth bug" \
  --team "Console - Framework" \
  --issue-type "Story" \
  --description "..." \
  --assignee-type "user" \
  --assignee "chmulder@redhat.com" \
  --prefix "chrome"
```

For bot tickets, use `--assignee-type bot` and `--labels "repo:chrome"` (no --assignee).
For unassigned, use `--assignee-type unassigned` (no --assignee, no --labels).

**Note:** Description used for activity type/security detection only. NOT included in output JSON.

Output is validated JSON for `jira_create_issue` MCP call (assignee included, description omitted).

## Validation Rules

- **Team**: name → UUID lookup (Console - Framework, Console - UI)
- **Activity Type**: Claude determines from context OR auto-detected from keywords
- **Security Level**: auto-set for Security & Compliance activity type
- **Labels**: 
  - Bot tickets: `hcc-ai-bot` + validated repo:* labels
  - User assignments: NO labels
  - Unassigned tickets: NO labels
- **Repo labels**: fetched from GitHub, cached in `~/.cache/claude/jira-creator/`
- **Description**: Used for keyword detection, NOT included in create payload (Claude updates separately)
- **Prefix**: Auto-detected from cwd basename OR extracted from `[prefix]` in prompt

## Activity Types

Claude analyzes the request and chooses the most appropriate type:

| Activity Type | Use For | Examples |
|---------------|---------|----------|
| **Quality / Stability / Reliability** | Bug fixes, refactoring, CI/CD improvements, tooling, testing | "Refactor CI workflow", "Fix flaky test", "Add linting" |
| **Security & Compliance** | CVEs, vulnerabilities, compliance, security fixes | "Fix CVE-2024-1234", "Add security headers" |
| **Incidents & Support** | Production issues, hotfixes, escalations, support tickets | "Production hotfix", "Customer escalation" |
| **Future Sustainability** | Upgrades, migrations, architecture changes, documentation, DX improvements | "Upgrade React 19", "Migrate to Vite", "Add architecture docs" |
| **Associate Wellness & Development** | Training, learning, workshops, team building | "React training", "Team workshop" |
| **Product / Portfolio Work** | New features, product work | "Add user dashboard", "New feature X" |

Falls back to keyword detection if Claude doesn't provide type.

## Assignment Types

| Assignee Selection | assignee_type | Label Behavior | MCP Calls |
|-------------------|---------------|----------------|-----------|
| Bot | bot | Add hcc-ai-bot + repo:* labels | `jira_get_user_profile` (bot), `jira_create_issue` |
| Specific user (from hint or Other field) | user | NO labels | `jira_get_user_profile` (if needed), `jira_create_issue` |
| Unassigned | unassigned | NO labels | `jira_create_issue` only |

**Assignee resolution:**
- Invocation hint: "assign to me" → git user.email, "assign to bot" → bot lookup, "assign to <name>" → user lookup
- User identifiers: email, username, display name, account ID, "me"
- Resolved value shown in Step 4 for confirmation

## Validation Errors

| Error | Fix |
|-------|-----|
| Missing required field: summary | Ask user for issue title |
| Missing required field: team | Ask user to choose team (show suggestions) |
| Unknown team: X | Show available teams from suggestions |
| Unknown repo label: repo:foo | Show first 10 allowed repo labels from suggestions |
| Invalid label: foo | Only repo:* labels allowed for bot tickets |

## Response Format

After creating and updating:
```text
Created RHCLOUD-XXXX
- Type: Story
- Summary: [scalprum] Refactor CI workflow
- Team: Console - Framework
- Assignee: chmulder@redhat.com
- Activity Type: Quality / Stability / Reliability
- Description: Updated with enriched context
- View: https://redhat.atlassian.net/browse/RHCLOUD-XXXX
```

If security level set (condensed):
```text
Created RHCLOUD-XXXX (updated with enriched description)
View: https://redhat.atlassian.net/browse/RHCLOUD-XXXX
```

## Files

- `SKILL.md` — Skill definition and workflow (uppercase required)
- `jira_fields.py` — Validation script
- `requirements.txt` — Test dependencies
- `tests/test_jira_fields.py` — 35 tests (all passing, runs in CI)
- `README.md` — Documentation, activity types, validation rules
