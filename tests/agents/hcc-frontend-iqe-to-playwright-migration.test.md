---
agent: hcc-frontend-iqe-to-playwright-migration
description: Test cases for IQE to Playwright migration agent - validates repository identification, authentication setup, conversion patterns, and documentation generation.
---

# Test Cases

Run all tests using `subagent_type: hcc-frontend-ai-toolkit:hcc-frontend-iqe-to-playwright-migration` from any directory with access to the IQE plugin repository.

## How to Run

Paste this prompt into a Claude Code session:

```text
Run the agent test suite for hcc-frontend-iqe-to-playwright-migration. Test cases are in tests/agents/hcc-frontend-iqe-to-playwright-migration.test.md in this repository.

Run all 4 tests sequentially using subagent_type: hcc-frontend-ai-toolkit:hcc-frontend-iqe-to-playwright-migration. Report pass/fail per expected field for each test.
```

---

## T1 — Simple Authentication Test Conversion

**Prompt:**
> Migrate the test_login.py file from /Users/btweed/repos/iqe/iqe-platform-ui-plugin/iqe_platform_ui/tests/ to Playwright. This test should target the insights-chrome repository.

**Expected:**

| Field | Value |
|-------|-------|
| Repository Assignment | insights-chrome (explicitly stated or confirmed) |
| Authentication Setup | Uses `@redhat-cloud-services/playwright-test-auth/global-setup` in config |
| Storage State | References `playwright/.auth/user.json` |
| disableCookiePrompt | Used in test beforeEach hook |
| Manual Login Logic | NONE (should not create login functions) |
| Logout Fixture | NOT converted (should note it's unnecessary) |
| playwright.config.ts | Created with proper global-setup configuration |
| Documentation | Includes authentication setup changes section |
| Environment Variables | Documents PLAYWRIGHT_USER, PLAYWRIGHT_PASSWORD, PLAYWRIGHT_BASE_URL |

---

## T2 — Multi-Repository Test Identification

**Prompt:**
> Analyze the test_navigation.py file from /Users/btweed/repos/iqe/iqe-platform-ui-plugin/iqe_platform_ui/tests/ and create a migration plan. Do NOT convert yet - just identify which frontend repositories should own each test.

**Expected:**

| Field | Value |
|-------|-------|
| Repository Analysis | Performs analysis of each test's target app |
| Questions Asked | Asks for clarification on unclear repository assignments |
| Plan Format | Groups tests by target repository |
| Shared Components | Identifies components used by multiple repos |
| Migration Plan | Shows test count per repository |
| User Approval | Waits for approval before conversion |

---

## T3 — Page Object Conversion with Components

**Prompt:**
> Convert the test_chrome_components.py file from /Users/btweed/repos/iqe/iqe-platform-ui-plugin/iqe_platform_ui/tests/ to Playwright. Target repository: insights-chrome.

**Expected:**

| Field | Value |
|-------|-------|
| Page Objects Created | Converts Widgetastic views to Playwright page objects |
| Component Structure | Creates separate component files (e.g., TopbarComponent) |
| Selector Strategy | Prefers role-based > data-ouia > CSS > XPath |
| OUIA Selectors | Preserves data-ouia-component-id selectors as-is |
| Authentication | No manual login in tests |
| disableCookiePrompt | Present in beforeEach |
| Documentation | Includes selector conversion rationale table |
| File Organization | Creates playwright/page-objects/components/ structure |

---

## T4 — Complete Migration with Documentation

**Prompt:**
> Fully migrate test_search.py from /Users/btweed/repos/iqe/iqe-platform-ui-plugin/iqe_platform_ui/tests/ to Playwright for the insights-chrome repository. Include all documentation and transplantation instructions.

**Expected:**

| Field | Value |
|-------|-------|
| Test Conversion | All tests converted with proper syntax |
| Authentication | Uses global-setup, no manual login |
| disableCookiePrompt | In beforeEach of all tests |
| Test Documentation | Markdown doc created for each test |
| Test Steps | Each step documented with before/after code |
| Manual Checklist | QE verification checklist included |
| Selector Table | Shows IQE → Playwright selector conversions |
| Transplantation Guide | Instructions for copying to insights-chrome repo |
| Migration Summary | Overall summary document created |
| Environment Setup | Documents required env vars |
| Shared Components | Notes if components are reusable |
| Next Steps | Provides actionable next steps |

---

## T5 — Parametrized Test Conversion

**Prompt:**
> Convert the test_browser_titles.py file (which uses @pytest.mark.parametrize) from /Users/btweed/repos/iqe/iqe-platform-ui-plugin/iqe_platform_ui/tests/ to Playwright.

**Expected:**

| Field | Value |
|-------|-------|
| Parametrization | Converts @pytest.mark.parametrize to test.describe with for loop |
| Test Organization | Each parametrized case becomes a separate test() |
| Test Names | Descriptive test names using parameter values |
| Authentication | Global setup, no per-test login |
| Documentation | Explains parametrization conversion approach |

---

## T6 — Fixture Conversion

**Prompt:**
> Migrate test_feedback.py from /Users/btweed/repos/iqe/iqe-platform-ui-plugin/iqe_platform_ui/tests/ which uses multiple fixtures including request.addfinalizer. Show how fixtures are converted.

**Expected:**

| Field | Value |
|-------|-------|
| Auth Fixtures | logout/login fixtures NOT converted (explains why) |
| Cleanup Fixtures | request.addfinalizer converted to test.afterEach |
| Skip Fixtures | skip_non_stage converted to test.skip() |
| Fixture Documentation | Explains which fixtures are needed vs removed |
| Authentication | No auth-related fixtures in converted code |

---

## Success Criteria

All tests should:
1. ✅ Use `@redhat-cloud-services/playwright-test-auth/global-setup`
2. ✅ Include `disableCookiePrompt()` in beforeEach
3. ✅ Have NO manual login/logout logic
4. ✅ Reference storage state in playwright.config.ts
5. ✅ Be organized by target frontend repository
6. ✅ Include comprehensive documentation
7. ✅ Provide transplantation instructions
8. ✅ Document required environment variables
9. ✅ Use Playwright best practices (auto-waiting, role-based selectors)
10. ✅ Preserve original test intent and coverage
