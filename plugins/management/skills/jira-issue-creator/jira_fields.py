#!/usr/bin/env python3
"""Jira issue field validation and enforcement for RHCLOUD project.

Validates fields, applies defaults, enforces business rules.
Outputs JSON for jira_create_issue MCP call (without description).

Description field used for activity type/security detection only.
Claude enriches description separately and updates ticket after creation.

Usage:
    python3 jira_fields.py --summary "..." --team "Console - Framework" [options]
"""

import argparse
import json
import logging
import sys
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

# Team name → UUID mapping
TEAMS = {
    "Console - Framework": "ae9633ff-0523-49b5-b99b-16342fc5a327",
    "Console - UI": "cc1c0d99-0567-45c8-bf77-8e6149d7ed83",
}

# Bot-specific label
BOT_LABEL = "hcc-ai-bot"

# Activity type mapping
ACTIVITY_TYPES = {
    "bug": "Quality / Stability / Reliability",
    "security": "Security & Compliance",
    "incident": "Incidents & Support",
    "future": "Future Sustainability",
    "wellness": "Associate Wellness & Development",
    "product": "Product / Portfolio Work",
}

# Keywords for activity type detection
ACTIVITY_KEYWORDS = {
    "security": ["security", "cve", "vulnerability", "compliance"],
    "incident": ["incident", "escalation", "support", "production", "hotfix"],
    "future": ["upgrade", "migration", "architecture", "dx", "documentation"],
    "wellness": ["training", "learning", "workshop", "team building"],
}

# Cache file for repo labels
CACHE_DIR = Path.home() / ".cache/claude/jira-creator"
CACHE_FILE = CACHE_DIR / "repo-labels.json"
REPOS_URL = "https://raw.githubusercontent.com/RedHatInsights/platform-frontend-ai-dev/refs/heads/master/rehor-config/agent/project-repos.json"


def load_repo_labels() -> Set[str]:
    """Load allowed repo labels from GitHub, with session caching.

    Returns set of 'repo:name' strings.
    """
    # Try cache first
    if CACHE_FILE.exists():
        try:
            cached = json.loads(CACHE_FILE.read_text())
            return set(cached)
        except Exception as e:
            logger.warning(f"Cache read failed, fetching fresh: {e}")

    # Fetch from GitHub
    try:
        with urllib.request.urlopen(REPOS_URL, timeout=10) as response:
            repos = json.loads(response.read().decode())
            labels = {f"repo:{name}" for name in repos.keys()}

            # Cache for session
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            CACHE_FILE.write_text(json.dumps(sorted(labels), indent=2))

            return labels
    except Exception as e:
        raise RuntimeError(
            f"Failed to fetch repo labels from {REPOS_URL}: {e}"
        ) from e


def determine_activity_type(issue_type: str, summary: str, description: str) -> str:
    """Auto-generate activity type from issue type and keywords."""
    text = (summary + " " + description).lower()

    # Check for security keywords first (overrides issue type)
    for category, keywords in ACTIVITY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return ACTIVITY_TYPES[category]

    # Then check issue type
    if issue_type.lower() == "bug":
        return ACTIVITY_TYPES["bug"]

    if issue_type.lower() in ("story", "epic"):
        return ACTIVITY_TYPES["product"]

    return "None"


def should_set_security_level(activity_type: str, summary: str, description: str) -> bool:
    """Check if Red Hat Employee security level should be set."""
    if activity_type == ACTIVITY_TYPES["security"]:
        return True

    text = (summary + " " + description).lower()
    security_phrases = [
        "security level",
        "red hat only",
        "internal only",
        "confidential",
        "red hat employee",
    ]
    return any(phrase in text for phrase in security_phrases)


def validate_labels(
    labels: List[str], assignee_type: Optional[str], allowed_repos: Set[str]
) -> Tuple[bool, List[str]]:
    """Validate labels against rules.

    - Bot tickets: repo: labels validated against allowlist
    - User/unassigned tickets: no labels (we accept and ignore them)

    Returns (valid, errors).
    """
    errors = []

    if assignee_type != "bot":
        # User and unassigned tickets have no labels
        return True, []

    # Bot tickets: validate repo labels
    for label in labels:
        if label == BOT_LABEL:
            continue  # Will be added automatically
        if label.startswith("repo:"):
            if label not in allowed_repos:
                errors.append(f"Unknown repo label: {label}")
        else:
            errors.append(
                f"Invalid label: {label} (only repo:* labels allowed for bot tickets)"
            )

    return len(errors) == 0, errors


def validate_and_build(
    summary: Optional[str],
    team: Optional[str],
    issue_type: str,
    description: str,
    labels: List[str],
    assignee_type: Optional[str],
    assignee: Optional[str],
    prefix: Optional[str],
    activity_type: Optional[str],
    allowed_repos: Set[str],
) -> Dict[str, Any]:
    """Validate fields and build MCP payload.

    Description used for activity type/security detection only (if activity_type not provided).
    NOT included in create payload — Claude enriches and updates separately.

    Prefix used to add [context] to summary for backlog organization.
    Activity type provided by Claude (preferred) or auto-detected from keywords (fallback).

    Returns dict with 'valid', 'errors', 'suggestions', or full MCP payload.
    """
    errors = []
    suggestions: Dict[str, List[str]] = {}

    # Required: summary
    if not summary or not summary.strip():
        errors.append("Missing required field: summary")

    # Required: team
    if not team or not team.strip():
        errors.append("Missing required field: team")
        suggestions["team"] = list(TEAMS.keys())
    elif team not in TEAMS:
        errors.append(f"Unknown team: {team}")
        suggestions["team"] = list(TEAMS.keys())

    # Validate labels
    _, label_errors = validate_labels(labels, assignee_type, allowed_repos)
    errors.extend(label_errors)
    if label_errors and assignee_type == "bot":
        suggestions["repo_labels"] = sorted(allowed_repos)[:10]  # Show first 10

    # Validate assignee contract
    if assignee_type in {"bot", "user"} and (not assignee or not assignee.strip()):
        errors.append(f"Missing assignee for assignee_type: {assignee_type}")
        suggestions["assignee"] = ["Provide email address or change assignee_type to 'unassigned'"]
    if assignee_type == "unassigned" and assignee and assignee.strip():
        errors.append(f"Assignee provided but assignee_type is 'unassigned'")
        suggestions["assignee_type"] = ["Change to 'bot' or 'user', or remove assignee"]

    # If validation failed, return errors
    if errors:
        return {
            "valid": False,
            "errors": errors,
            "suggestions": suggestions,
        }

    # Build validated payload
    team_uuid = TEAMS[team]

    # Use provided activity type or auto-detect from keywords
    if activity_type:
        final_activity_type = activity_type
    else:
        final_activity_type = determine_activity_type(issue_type, summary, description)

    set_security = should_set_security_level(final_activity_type, summary, description)

    # Build labels based on assignee type
    final_labels = []
    if assignee_type == "bot":
        final_labels.append(BOT_LABEL)
        final_labels.extend([label for label in labels if label.startswith("repo:")])
    # Unassigned tickets have NO labels

    # Prefix summary with context if provided
    final_summary = summary.strip()
    if prefix:
        # Strip brackets if present in prefix (e.g., "[scalprum]" → "scalprum")
        clean_prefix = prefix.strip("[]")
        if not final_summary.startswith("["):
            final_summary = f"[{clean_prefix}] {final_summary}"

    # Build additional_fields
    additional_fields: Dict[str, Any] = {
        "customfield_10001": team_uuid,  # Team field (plain string)
    }

    if final_labels:
        additional_fields["labels"] = final_labels

    if final_activity_type != "None":
        additional_fields["customfield_10464"] = {"value": final_activity_type}

    if set_security:
        additional_fields["security"] = {"name": "Red Hat Employee"}

    # Build result (description NOT included — Claude updates separately)
    result = {
        "valid": True,
        "project_key": "RHCLOUD",
        "summary": final_summary,
        "issue_type": issue_type,
        "assignee": assignee,
        "additional_fields": additional_fields,
        "warnings": [],
    }

    # Add warnings
    if set_security:
        result["warnings"].append(
            f"Security level set: activity type is {final_activity_type}"
            if final_activity_type == ACTIVITY_TYPES["security"]
            else "Security level set: keywords detected"
        )

    if final_activity_type != "None":
        result["warnings"].append(f"Activity type: {final_activity_type}")

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Validate Jira issue fields for RHCLOUD project"
    )
    parser.add_argument("--summary", help="Issue summary/title")
    parser.add_argument("--team", help="Team name (e.g., 'Console - Framework')")
    parser.add_argument(
        "--issue-type",
        choices=["Story", "Bug", "Epic"],
        default="Story",
        help="Issue type (default: Story)"
    )
    parser.add_argument("--description", default="", help="Issue description")
    parser.add_argument(
        "--labels",
        default="",
        help="Comma-separated repo labels (e.g., 'repo:insights-chrome,repo:quickstarts'). Only used for bot tickets.",
    )
    parser.add_argument(
        "--assignee-type",
        choices=["bot", "user", "unassigned"],
        default="unassigned",
        help="Assignee type: bot (AI bot), user (specific person), unassigned (team triage)",
    )
    parser.add_argument(
        "--assignee",
        help="Assignee email address (e.g., 'user@redhat.com'). Resolved by Claude from Question 5.",
    )
    parser.add_argument(
        "--prefix",
        help="Context prefix for summary (e.g., 'chrome', 'dashboard'). Auto-detected from cwd or extracted from prompt.",
    )
    parser.add_argument(
        "--activity-type",
        choices=list(ACTIVITY_TYPES.values()),
        help="Activity type (Claude infers from context). Falls back to keyword detection if omitted.",
    )
    parser.add_argument(
        "--refresh-cache",
        action="store_true",
        help="Force refresh repo labels cache from GitHub",
    )

    args = parser.parse_args()

    # Clear cache if requested
    if args.refresh_cache and CACHE_FILE.exists():
        CACHE_FILE.unlink()

    labels = [label.strip() for label in args.labels.split(",") if label.strip()]

    # Only load repo labels for bot tickets (non-bot tickets don't use labels)
    if args.assignee_type == "bot":
        allowed_repos = load_repo_labels()
    else:
        allowed_repos = set()  # Not used for non-bot tickets

    result = validate_and_build(
        summary=args.summary,
        team=args.team,
        issue_type=args.issue_type,
        description=args.description,
        labels=labels,
        assignee_type=args.assignee_type,
        assignee=args.assignee,
        prefix=args.prefix,
        activity_type=args.activity_type,
        allowed_repos=allowed_repos,
    )

    print(json.dumps(result, indent=2))

    sys.exit(0 if result["valid"] else 1)


if __name__ == "__main__":
    main()
