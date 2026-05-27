---
agent: hcc-frontend-jira-issue-creator
description: Dry run test cases for label, assignee, activity type, security level, and response format behavior.
---

# Test Cases

Run all tests as dry runs using `subagent_type: hcc-frontend-ai-toolkit:hcc-frontend-jira-issue-creator` from the root of this repository.

## Testing Unreleased Changes

When testing agent changes before publishing to the plugin marketplace:

1. **Copy agent to marketplace cache:**
   ```bash
   cp claude/agents/hcc-frontend-jira-issue-creator.md \
      ~/.claude/plugins/marketplaces/hcc-frontend-toolkit/claude/agents/hcc-frontend-jira-issue-creator.md
   ```

2. **Restart Claude Code session** — plugins are cached in memory at startup; file updates don't take effect until restart.

3. **Run tests** using instructions below.

**Why needed:** Claude Code loads plugin agents into memory at session start. Updating files on disk won't affect running agents until the session restarts.

## How to Run

Paste this prompt into a Claude Code session from the root of this repository:

```text
Run the agent test suite for hcc-frontend-jira-issue-creator. Test cases are in tests/agents/hcc-frontend-jira-issue-creator.test.md in this repository.

Run all 8 tests in parallel using subagent_type: hcc-frontend-ai-toolkit:hcc-frontend-jira-issue-creator. Report pass/fail per expected field for each test.
```

---

## T1 — Framework team, bot assigned

**Prompt:**
> Dry run: Create a framework team ticket for insights-chrome to fix stale Tekton task bundle digests in .tekton/ files (security vulnerability). Assign to the bot. Show all fields.

**Expected:**

| Field | Value |
|-------|-------|
| Labels | `hcc-ai-framework`, `repo:insights-chrome` |
| Must NOT contain | `platform-experience-services`, `platform-experience-ui` |
| Assignee | fetched email via `jira_get_user_profile` (not hardcoded) |
| Activity Type | Security & Compliance |
| Team | Console - Framework |
| Security Level | `Red Hat Employee` (auto-set — activity type is Security & Compliance) |
| Warning shown | yes — agent should note that creation response will be restricted to ticket number + URL |

---

## T2 — UI team, bot assigned

**Prompt:**
> Dry run: Create a UI team ticket for insights-chrome to fix stale Tekton task bundle digests in .tekton/ files (security vulnerability). Assign to the bot. Show all fields.

**Expected:**

| Field | Value |
|-------|-------|
| Labels | `hcc-ai-framework`, `repo:insights-chrome` |
| Must NOT contain | `platform-experience-services`, `platform-experience-ui` |
| Assignee | fetched email via `jira_get_user_profile` |
| Activity Type | Security & Compliance |
| Team | Console - UI |
| Security Level | `Red Hat Employee` (auto-set — activity type is Security & Compliance) |
| Warning shown | yes — agent should note that creation response will be restricted to ticket number + URL |

---

## T3 — Framework team, unassigned

**Prompt:**
> Dry run: Create an unassigned framework team ticket for insights-chrome — update PatternFly to latest major version. Show all fields.

**Expected:**

| Field | Value |
|-------|-------|
| Labels | none (must be empty array) |
| Assignee | none |
| Activity Type | Future Sustainability |
| Team | Console - Framework |
| Security Level | not set |

---

## T4 — UI team, unassigned

**Prompt:**
> Dry run: Create an unassigned UI team bug ticket for insights-chrome — navigation sidebar collapses unexpectedly on mobile viewports. Show all fields.

**Expected:**

| Field | Value |
|-------|-------|
| Labels | none (must be empty array) |
| Assignee | none |
| Activity Type | Quality / Stability / Reliability |
| Team | Console - UI |
| Security Level | not set |

---

## T5 — Security level set via explicit phrase

**Prompt:**
> Dry run: Create a Red Hat Employee only framework team ticket for insights-chrome — update PatternFly to latest major version. Unassigned.

**Expected:**

| Field | Value |
|-------|-------|
| Activity Type | Future Sustainability (upgrade keyword — not Security & Compliance) |
| Security Level | `Red Hat Employee` (set via explicit phrase — not auto from activity type) |
| Response format | full dry run preview (restriction applies to post-creation response only) |

---

## T6 — Security level not set (full response)

**Prompt:**
> Dry run: Create a framework team ticket for insights-chrome — update PatternFly to latest major version. Unassigned.

**Expected:**

| Field | Value |
|-------|-------|
| Security Level | not set |
| Response format | full field preview |

---

## T7 — Prompt with technology names that are not labels

**Prompt:**
> Dry run: Create a framework ticket to migrate React Router to TanStack Router and upgrade PatternFly. Unassigned. Show all fields.

**Expected:**

| Field | Value |
|-------|-------|
| Labels | none (must be empty array) |
| Assignee | none |
| Activity Type | Future Sustainability |
| Team | Console - Framework |
| Security Level | not set |

---

## T8 — Project RHCLOUD used without asking

**Prompt:**
> Dry run: Create an unassigned framework bug ticket — Chrome sidebar crashes on page reload. Show all fields.

**Expected:**

| Field | Value |
|-------|-------|
| Project | `RHCLOUD` |
| Agent behavior | does NOT ask which project to use |
| Labels | none (must be empty array) |
| Activity Type | Quality / Stability / Reliability |
| Team | Console - Framework |
| Security Level | not set |
