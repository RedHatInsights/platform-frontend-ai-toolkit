---
name: jira-issue-creator
description: >
  Create RHCLOUD Jira issues with validated fields. Python script enforces
  team UUIDs, activity types, security levels, and label rules.
user-invocable: true
allowed-tools:
  - "Bash(python3 *jira_fields.py *)"
  - AskUserQuestion
  - mcp__mcp-atlassian__jira_create_issue
  - mcp__mcp-atlassian__jira_update_issue
  - mcp__mcp-atlassian__jira_get_user_profile
---

# Workflow

## 1. Parse Skill Invocation Message

Extract from message (text after skill invocation):
- **summary**: issue title (first sentence or main phrase)
- **description**: additional details for enrichment
- **assignee hint**: "assign to <user>" if present

## 2. Resolve Assignee Hint (if present)

**If "assign to bot":**
```python
user = jira_get_user_profile("712020:c6b31fa1-eaf5-4921-af5b-cb625f24bb1a")
assignee = user["email"]
assignee_type = "bot"
```

**If "assign to me":**
```bash
assignee = git config user.email
assignee_type = "user"
```

**If "assign to <identifier>":**
```python
# Skip lookup if already email (contains '@')
if '@' in identifier:
    assignee = identifier
else:
    user = jira_get_user_profile(identifier)  # username, display name, or account ID
    assignee = user["email"]

assignee_type = "user"
```

**If no assignee hint:**
```python
assignee = None
assignee_type = "unassigned"
```

## 3. Ask Assignee Question

Use AskUserQuestion with single question:

**Question: Assignee**
- header: "Assignee"
- question: "Who should this ticket be assigned to?"
- Options based on Step 2 resolution:
  - If assignee resolved → "Confirm: {assignee}" (Recommended), "Unassigned", "Bot"
  - If no assignee hint → "Unassigned (Recommended)", "Bot", "Assign to me"
- Other field: always available for entering username/email/display name

## 4. Process Assignee Answer

**If "Confirm: {assignee}":** Use assignee from Step 2.

**If "Unassigned":**
```python
assignee = None
assignee_type = "unassigned"
```

**If "Bot":**
```python
user = jira_get_user_profile("712020:c6b31fa1-eaf5-4921-af5b-cb625f24bb1a")
assignee = user["email"]
assignee_type = "bot"
```

**If "Assign to me":**
```bash
assignee = git config user.email
assignee_type = "user"
```

**If Other field used (user typed custom value):**
```python
user_identifier = answers["Assignee"]  # From Other field

# Resolve "me"
if user_identifier.lower() == "me":
    assignee = run("git config user.email")
    assignee_type = "user"
# Email (has '@')
elif '@' in user_identifier:
    assignee = user_identifier
    assignee_type = "user"
# Lookup
else:
    user = jira_get_user_profile(user_identifier)
    assignee = user["email"]
    assignee_type = "user"
```

## 5. Show Ticket Details Dropdowns

**IMPORTANT:** Ask ALL 4 questions below in ONE AskUserQuestion call.

Infer recommended option for each:

**Question 1: Team**
- Options: "Console - Framework (Recommended)", "Console - UI"
- Infer from: prompt keywords, memory, or default to Framework

**Question 2: Activity Type**
- Options:
  - "Quality / Stability / Reliability (Recommended)"
  - "Security & Compliance"
  - "Incidents & Support"
  - "Future Sustainability"
  - "Associate Wellness & Development"
  - "Product / Portfolio Work"
- Infer from:
  - CI/CD, refactoring, tooling, testing → Quality
  - CVE, security, vulnerability → Security
  - Production issues, escalations, hotfixes → Incidents
  - Upgrades, migrations, architecture → Future
  - Training, learning, team building → Wellness
  - New features, product work → Product

**Question 3: Issue Type**
- Options: "Story (Recommended)", "Bug", "Epic"
- Infer from: "bug" in prompt → Bug, default Story

**Question 4: Prefix**
- Options: "[{cwd_basename}] (Recommended)", "No prefix"
- Infer from: cwd basename (e.g., /path/to/scalprum → [scalprum])
- Extract `[custom]` from prompt if present

## 6. Validate

Pass confirmed selections AND resolved assignee to Python.

**Bot tickets (assignee-type=bot):**
```bash
python3 claude/skills/jira-issue-creator/jira_fields.py \
  --summary "<user summary>" \
  --team "<selected team>" \
  --issue-type "<selected type>" \
  --description "<shorthand notes>" \
  --assignee-type "bot" \
  --labels "repo:scalprum,repo:chrome" \
  --prefix "<selected prefix>" \
  --activity-type "<selected activity type>"
```

**User-assigned tickets (assignee-type=user):**
```bash
python3 claude/skills/jira-issue-creator/jira_fields.py \
  --summary "<user summary>" \
  --team "<selected team>" \
  --issue-type "<selected type>" \
  --description "<shorthand notes>" \
  --assignee-type "user" \
  --assignee "user@redhat.com" \
  --prefix "<selected prefix>" \
  --activity-type "<selected activity type>"
```

**Unassigned tickets (assignee-type=unassigned):**
```bash
python3 claude/skills/jira-issue-creator/jira_fields.py \
  --summary "<user summary>" \
  --team "<selected team>" \
  --issue-type "<selected type>" \
  --description "<shorthand notes>" \
  --assignee-type "unassigned" \
  --prefix "<selected prefix>" \
  --activity-type "<selected activity type>"
```

If `valid: false` → show errors, exit.

## 7. Create Ticket

Use `result` dict verbatim (includes assignee from Step 3):

```python
issue = jira_create_issue(
    project_key=result["project_key"],
    summary=result["summary"],
    issue_type=result["issue_type"],
    assignee=result["assignee"],
    additional_fields=json.dumps(result["additional_fields"])
)
```

Show:
```text
Created RHCLOUD-XXXX
View: https://redhat.atlassian.net/browse/RHCLOUD-XXXX
```

## 8. Enrich Description

Transform shorthand into full Markdown:
- Expand technical context from codebase
- Add file paths, functions, components
- Include links to PRs, commits, docs
- Format with headers, code blocks, lists

## 9. Approve Description

**Show full description as text output:**

```markdown
Proposed description for RHCLOUD-XXXX:

[Full enriched description in markdown - no truncation]
```

**Then show approval dialog:**

```python
AskUserQuestion(
    question="Approve this description for RHCLOUD-XXXX?",
    header="Description",
    options=[
        {
            "label": "Approve and update ticket",
            "description": "Add the description shown above to Jira"
        },
        {
            "label": "Request changes",
            "description": "Provide feedback to regenerate"
        },
        {
            "label": "Cancel",
            "description": "Don't update ticket description"
        }
    ]
)
```

**If "Approve"** → proceed to Step 10.

**If "Request changes"** → user provides feedback via "Other" text input → regenerate description with feedback → repeat Step 9.

**If "Cancel"** → stop, show ticket link only.

## 10. Update Ticket

```python
jira_update_issue(
    issue_key=issue["key"],
    fields=json.dumps({"description": enriched_description})
)
```

# Key Rules

- **Labels**: Only pass `--labels` when `assignee_type == "bot"`. Never for user/unassigned.
- **Assignee**: Asked separately in Step 3 (single question). Resolved before main dropdowns.
- **Display values**: Source from Python `result` dict only. Never reconstruct from input.
- **AskUserQuestion calls**: Three calls — Step 3 (assignee), Step 5 (team, activity, type, prefix), Step 9 (description approval).
- **Description**: NOT in create payload. Enriched separately, approved in Step 9, then updated in Step 10.
- **Security level**: Auto-set by Python for Security & Compliance activity type.
