"""Tests for jira_fields.py validation logic."""

import json
import sys
from pathlib import Path

import pytest

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from jira_fields import (
    ACTIVITY_TYPES,
    BOT_LABEL,
    TEAMS,
    determine_activity_type,
    should_set_security_level,
    validate_and_build,
    validate_labels,
)


@pytest.fixture
def allowed_repos():
    """Mock allowed repo labels."""
    return {
        "repo:insights-chrome",
        "repo:quickstarts",
        "repo:frontend-operator",
    }


class TestActivityTypeDetection:
    """Test activity type auto-generation."""

    def test_bug_issue_type(self):
        result = determine_activity_type("Bug", "fix crash", "")
        assert result == ACTIVITY_TYPES["bug"]

    def test_bug_with_cve_keywords(self):
        """Bug tickets with CVE keywords should be Security & Compliance, not Quality."""
        result = determine_activity_type("Bug", "Fix CVE-2024-1234", "")
        assert result == ACTIVITY_TYPES["security"]

    def test_bug_with_security_description(self):
        """Bug tickets with security in description should be Security & Compliance."""
        result = determine_activity_type("Bug", "Fix crash", "security vulnerability")
        assert result == ACTIVITY_TYPES["security"]

    def test_security_keywords(self):
        result = determine_activity_type("Story", "Fix CVE-2024-1234", "security vulnerability")
        assert result == ACTIVITY_TYPES["security"]

    def test_incident_keywords(self):
        result = determine_activity_type("Story", "production hotfix", "")
        assert result == ACTIVITY_TYPES["incident"]

    def test_future_keywords(self):
        result = determine_activity_type("Story", "upgrade to React 19", "")
        assert result == ACTIVITY_TYPES["future"]

    def test_wellness_keywords(self):
        result = determine_activity_type("Story", "team building workshop", "")
        assert result == ACTIVITY_TYPES["wellness"]

    def test_story_default(self):
        result = determine_activity_type("Story", "add new feature", "")
        assert result == ACTIVITY_TYPES["product"]

    def test_epic_default(self):
        result = determine_activity_type("Epic", "Q1 roadmap", "")
        assert result == ACTIVITY_TYPES["product"]

    def test_unknown_type_fallback(self):
        result = determine_activity_type("Task", "generic task", "")
        assert result == "None"


class TestSecurityLevel:
    """Test security level enforcement."""

    def test_security_compliance_activity(self):
        assert should_set_security_level(ACTIVITY_TYPES["security"], "", "")

    def test_security_keywords(self):
        assert should_set_security_level("", "red hat only", "")
        assert should_set_security_level("", "", "internal only docs")
        assert should_set_security_level("", "confidential", "")

    def test_no_security_level(self):
        assert not should_set_security_level(ACTIVITY_TYPES["product"], "normal ticket", "")


class TestLabelValidation:
    """Test label validation rules."""

    def test_unassigned_no_labels(self, allowed_repos):
        valid, errors = validate_labels([], None, allowed_repos)
        assert valid
        assert not errors

    def test_unassigned_ignores_labels(self, allowed_repos):
        valid, errors = validate_labels(["repo:foo"], None, allowed_repos)
        assert valid
        assert not errors

    def test_bot_valid_repo_label(self, allowed_repos):
        valid, errors = validate_labels(["repo:insights-chrome"], "bot", allowed_repos)
        assert valid
        assert not errors

    def test_bot_invalid_repo_label(self, allowed_repos):
        valid, errors = validate_labels(["repo:unknown"], "bot", allowed_repos)
        assert not valid
        assert "Unknown repo label: repo:unknown" in errors

    def test_bot_invalid_non_repo_label(self, allowed_repos):
        valid, errors = validate_labels(["frontend"], "bot", allowed_repos)
        assert not valid
        assert "Invalid label: frontend" in errors[0]

    def test_bot_label_auto_added(self, allowed_repos):
        # BOT_LABEL should be ignored in validation (will be added automatically)
        valid, errors = validate_labels([BOT_LABEL], "bot", allowed_repos)
        assert valid
        assert not errors


class TestValidateAndBuild:
    """Test full validation and payload building."""

    def test_valid_unassigned_ticket(self, allowed_repos):
        result = validate_and_build(
            summary="Fix bug in chrome",
            team="Console - Framework",
            issue_type="Bug",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert result["project_key"] == "RHCLOUD"
        assert result["summary"] == "Fix bug in chrome"
        assert result["issue_type"] == "Bug"
        assert result["additional_fields"]["customfield_10001"] == TEAMS["Console - Framework"]
        assert result["additional_fields"]["customfield_10464"]["value"] == ACTIVITY_TYPES["bug"]
        assert "labels" not in result["additional_fields"]  # Unassigned = no labels
        assert "description" not in result  # Description NOT in create payload

    def test_valid_bot_ticket(self, allowed_repos):
        result = validate_and_build(
            summary="Add feature",
            team="Console - UI",
            issue_type="Story",
            description="",
            labels=["repo:insights-chrome", "repo:quickstarts"],
            assignee_type="bot",
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert result["additional_fields"]["labels"] == [
            BOT_LABEL,
            "repo:insights-chrome",
            "repo:quickstarts",
        ]

    def test_security_level_enforcement(self, allowed_repos):
        result = validate_and_build(
            summary="Fix CVE-2024-1234",
            team="Console - Framework",
            issue_type="Story",
            description="security vulnerability",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert result["additional_fields"]["security"]["name"] == "Red Hat Employee"
        assert "Security level set" in result["warnings"][0]

    def test_missing_summary(self, allowed_repos):
        result = validate_and_build(
            summary=None,
            team="Console - Framework",
            issue_type="Story",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert not result["valid"]
        assert "Missing required field: summary" in result["errors"]

    def test_missing_team(self, allowed_repos):
        result = validate_and_build(
            summary="test",
            team=None,
            issue_type="Story",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert not result["valid"]
        assert "Missing required field: team" in result["errors"]
        assert "team" in result["suggestions"]
        assert set(result["suggestions"]["team"]) == set(TEAMS.keys())

    def test_unknown_team(self, allowed_repos):
        result = validate_and_build(
            summary="test",
            team="Unknown Team",
            issue_type="Story",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert not result["valid"]
        assert "Unknown team: Unknown Team" in result["errors"]
        assert "team" in result["suggestions"]

    def test_invalid_repo_label(self, allowed_repos):
        result = validate_and_build(
            summary="test",
            team="Console - Framework",
            issue_type="Story",
            description="",
            labels=["repo:unknown"],
            assignee_type="bot",
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert not result["valid"]
        assert "Unknown repo label: repo:unknown" in result["errors"]
        assert "repo_labels" in result["suggestions"]

    def test_team_uuid_format(self, allowed_repos):
        """Verify team UUID is plain string, not object."""
        result = validate_and_build(
            summary="test",
            team="Console - Framework",
            issue_type="Story",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        team_uuid = result["additional_fields"]["customfield_10001"]
        assert isinstance(team_uuid, str)
        assert team_uuid == "ae9633ff-0523-49b5-b99b-16342fc5a327"

    def test_activity_type_warnings(self, allowed_repos):
        result = validate_and_build(
            summary="Fix CVE",
            team="Console - Framework",
            issue_type="Story",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert any("Activity type" in w for w in result["warnings"])

    def test_description_used_for_detection_not_payload(self, allowed_repos):
        """Description should affect activity type detection but NOT appear in create payload."""
        result = validate_and_build(
            summary="Update dependencies",
            team="Console - Framework",
            issue_type="Story",
            description="Upgrade React to latest version for security compliance",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        # Description triggered security keyword detection
        assert result["additional_fields"]["customfield_10464"]["value"] == ACTIVITY_TYPES["security"]
        # But description NOT in payload
        assert "description" not in result

    def test_prefix_added_to_summary(self, allowed_repos):
        """Prefix should be added to summary if provided."""
        result = validate_and_build(
            summary="Fix auth bug",
            team="Console - Framework",
            issue_type="Bug",
            description="",
            labels=[],
            assignee_type="bot",
            assignee=None,
            prefix="javascript-clients",
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert result["summary"] == "[javascript-clients] Fix auth bug"

    def test_prefix_not_duplicated(self, allowed_repos):
        """Don't add prefix if summary already has bracket prefix."""
        result = validate_and_build(
            summary="[chrome] Fix bug",
            team="Console - Framework",
            issue_type="Bug",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix="javascript-clients",
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert result["summary"] == "[chrome] Fix bug"

    def test_no_prefix_when_none_provided(self, allowed_repos):
        """Summary unchanged when no prefix provided."""
        result = validate_and_build(
            summary="Fix bug",
            team="Console - Framework",
            issue_type="Bug",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert result["summary"] == "Fix bug"

    def test_prefix_strips_brackets(self, allowed_repos):
        """Prefix with brackets should be stripped before adding to summary."""
        result = validate_and_build(
            summary="Fix bug",
            team="Console - Framework",
            issue_type="Bug",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix="[scalprum]",  # Brackets in prefix
            activity_type=None,
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert result["summary"] == "[scalprum] Fix bug"  # Not [[scalprum]]

    def test_activity_type_override(self, allowed_repos):
        """Claude-provided activity type should override keyword detection."""
        result = validate_and_build(
            summary="Refactor CI workflow",
            team="Console - Framework",
            issue_type="Story",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=ACTIVITY_TYPES["future"],
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert result["additional_fields"]["customfield_10464"]["value"] == ACTIVITY_TYPES["future"]

    def test_activity_type_keyword_fallback(self, allowed_repos):
        """Should fall back to keyword detection when activity_type omitted."""
        result = validate_and_build(
            summary="Fix CVE-2024-1234",
            team="Console - Framework",
            issue_type="Story",
            description="",
            labels=[],
            assignee_type=None,
            assignee=None,
            prefix=None,
            activity_type=None,  # Omitted - should detect from keywords
            allowed_repos=allowed_repos,
        )

        assert result["valid"]
        assert result["additional_fields"]["customfield_10464"]["value"] == ACTIVITY_TYPES["security"]
