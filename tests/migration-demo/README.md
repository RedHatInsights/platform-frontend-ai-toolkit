# IQE to Playwright Migration Demo

This directory contains a complete demonstration of the **IQE to Playwright Migration Agent** output.

## What's Inside

### 1. Quick Start Guide
**[QUICKSTART.md](./QUICKSTART.md)** - Complete guide for using the migration agent

Covers:
- Prerequisites and installation
- Step-by-step migration workflow
- Common patterns and examples
- Troubleshooting guide
- Best practices

### 2. Migration Output Example

This demo shows the complete output from migrating `test_login.py`:

#### Configuration
- **[playwright.config.ts](./playwright.config.ts)** - Playwright configuration with:
  - Red Hat SSO authentication via `@redhat-cloud-services/playwright-test-auth`
  - Single-threaded CI execution (workers: 1)
  - No retries (retries: 0)
  - Max 2 failures in CI
  - Optimized artifact collection

#### Converted Tests
- **[playwright/tests/login.spec.ts](./playwright/tests/login.spec.ts)** - Converted authentication tests:
  - Login verification
  - Org ID display (preserved skip)
  - Logout via Chrome API
  - Logout via dropdown menu

#### Documentation
- **[docs/migration-summary.md](./docs/migration-summary.md)** - Complete migration documentation:
  - Migration statistics
  - Transplantation guide
  - CI/CD configuration examples
  - Performance comparison (3-5x faster!)
  - Troubleshooting guide

## ⚠️ Important Limitation

**This agent only supports tests that use a single user account.**

The authentication setup uses global authentication with one set of credentials (`PLAYWRIGHT_USER` and `PLAYWRIGHT_PASSWORD`). All tests run with the same authenticated session.

**Not supported:**
- Tests requiring multiple users with different permissions
- Tests that switch between user accounts
- Role-based access control tests with different user types
- Multi-user collaboration tests

If your tests require multiple users, the agent will warn you and suggest alternatives (split tests, manual conversion, or skip migration).

## What the Agent Does

The `hcc-frontend-iqe-to-playwright-migration` agent:

### 1. Analysis Phase
- Reads IQE test files
- Identifies target frontend repositories
- Maps page objects and dependencies
- Creates comprehensive migration plan

### 2. Conversion Phase
- Converts tests to Playwright TypeScript
- Sets up proper Red Hat SSO authentication
- Adapts or removes fixtures
- Modernizes selectors (XPath → role-based/CSS)
- Converts wait patterns to Playwright auto-waiting

### 3. Documentation Phase
- Generates QE verification documentation
- Creates test step guides
- Provides transplantation instructions
- Documents selector changes with rationale

## Key Features

### ✅ Proper Authentication
- Uses `@redhat-cloud-services/playwright-test-auth` package
- Global setup (auth happens once, not per test)
- Session stored in `playwright/.auth/user.json`
- `disableCookiePrompt()` in every test
- **NO manual login logic**

### ✅ CI-Optimized Configuration
```typescript
workers: process.env.CI ? 1 : undefined,        // Single-threaded in CI
retries: 0,                                      // No retries
maxFailures: process.env.CI ? 2 : undefined,    // Stop after 2 failures
fullyParallel: !process.env.CI,                 // Parallel locally, serial in CI
```

### ✅ Repository Organization
- Identifies which frontend repo should own each test
- Asks clarifying questions for unclear ownership
- Organizes output by target repository
- Provides transplantation instructions per repo

### ✅ Comprehensive Documentation
- Test step documentation for QE verification
- Before/after code comparisons
- Selector conversion rationale
- Manual verification checklists
- Troubleshooting guides

## How to Use This Demo

### 1. Review the Migration Output
Explore the files in this directory to understand what the agent produces:

```bash
# Configuration
cat playwright.config.ts

# Converted tests
cat playwright/tests/login.spec.ts

# Documentation
cat docs/migration-summary.md
```

### 2. Use the Quick Start Guide
Follow **[QUICKSTART.md](./QUICKSTART.md)** to migrate your own tests:

```
# In Claude Code
Migrate test_navigation.py from /path/to/iqe-plugin to Playwright for insights-chrome
```

### 3. Transplant to Your Repository

Follow the transplantation instructions in `docs/migration-summary.md`:

```bash
# Copy files
cp playwright.config.ts /path/to/insights-chrome/
cp -r playwright/ /path/to/insights-chrome/

# Install dependencies
cd /path/to/insights-chrome
npm install --save-dev @playwright/test @redhat-cloud-services/playwright-test-auth

# Configure and run
export PLAYWRIGHT_USER="username@redhat.com"
export PLAYWRIGHT_PASSWORD="password"
npm run test:e2e
```

## Performance Improvements

### Test Execution Time

| Metric | IQE | Playwright | Improvement |
|--------|-----|------------|-------------|
| First run with auth | 45-60s | 15-20s | **3x faster** |
| Subsequent runs | 45-60s | 10-15s | **4-5x faster** |
| Per test average | ~15s | ~3-5s | **3-4x faster** |

### Why Faster?
- ✅ **Session reuse**: Auth happens once, not per test
- ✅ **No Navmazing overhead**: Direct navigation
- ✅ **Playwright optimizations**: Built-in auto-waiting
- ✅ **No Widgetastic**: Direct DOM interaction

## What Gets Converted

### ✅ Automatically Converted
- Tests (pytest → Playwright)
- Page Objects (Widgetastic → Playwright)
- Selectors (XPath/CSS → role-based/CSS)
- Waits (`wait_for()` → auto-waiting)
- Assertions (`assert` → `expect()`)
- Parametrization (`@pytest.mark.parametrize` → for loops or multiple tests)

**Parametrized Test Handling:**
- 2-3 values → Separate test() calls with descriptive names (clearer output)
- 4+ values → For loop with test data array (scalable, less duplication)
- Dynamic/runtime data → Load from JSON or generate programmatically
- Agent asks for user preference when encountering parametrized tests

### ⚠️ Removed (No Longer Needed)
- `logout` fixture (auth is global)
- Manual login logic
- `application.platform_ui.logged_in` checks
- Navmazing navigation

### 🔧 Requires Additional Work: Environment State & Idempotency

**IQE tests often assume pre-existing data or configuration exists without setting it up.**

When the agent detects state assumptions, it will warn you and suggest idempotency approaches:

**Common Assumptions:**
- Tests expecting inventory systems/hosts to exist
- Tests assuming policies, alerts, or rules are present
- Tests relying on specific user permissions
- Tests depending on pre-configured settings

**Idempotency Approaches:**
- **API Setup** (recommended): Create/delete test data via REST APIs
- **UI Setup**: Create data through UI before test logic
- **Fixtures**: Shared setup/teardown logic
- **Hooks**: beforeEach/afterEach for data management

The agent detects these patterns and provides specific recommendations with code examples.

### 📝 Documented Changes
- Authentication pattern changes
- Selector conversions with rationale
- Wait strategy updates
- Environment variable requirements
- Environment state assumptions and idempotency requirements

## Example: Login Test Conversion

### Before (IQE)
```python
@pytest.fixture
def logout(application):
    if application.platform_ui.logged_in:
        application.platform_ui.logout()
    yield
    application.platform_ui.logout()

@pytest.mark.core
@pytest.mark.usefixtures("logout")
def test_login(application):
    view = navigate_to(application.platform_ui, "LoggedIn")
    view.wait_displayed(10)
    assert application.platform_ui.logged_in
```

### After (Playwright)
```typescript
test.beforeEach(async ({ page }) => {
    await disableCookiePrompt(page);
});

test('user can login and session is established', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await expect(page.locator('header.chr-c-masthead')).toBeVisible();
    await expect(page.locator('[data-ouia-component-id="chrome-user"]')).toBeVisible();
});
```

### Key Changes
- ❌ No `logout` fixture (global auth handles cleanup)
- ❌ No manual login (handled by global-setup)
- ✅ Uses `disableCookiePrompt()` helper
- ✅ Direct navigation with `page.goto()`
- ✅ Modern selectors (CSS/OUIA)
- ✅ Playwright auto-waiting

## Next Steps

1. **Try the agent** - Migrate a simple test file to get familiar
2. **Review the output** - Understand what gets generated
3. **Test locally** - Run converted tests in your repo
4. **Set up CI** - Configure GitHub Actions with secrets
5. **Expand coverage** - Migrate more complex tests
6. **Retire IQE tests** - After stability period

## Getting Help

- **Quick Start Guide**: [QUICKSTART.md](./QUICKSTART.md)
- **Migration Summary**: [docs/migration-summary.md](./docs/migration-summary.md)
- **Agent Spec**: [../../claude/agents/hcc-frontend-iqe-to-playwright-migration.md](../../claude/agents/hcc-frontend-iqe-to-playwright-migration.md)
- **Playwright Docs**: https://playwright.dev
- **Issue Tracker**: [GitHub Issues](https://github.com/RedHatInsights/platform-frontend-ai-toolkit/issues)

---

**Ready to migrate?** Start with the [Quick Start Guide](./QUICKSTART.md)! 🚀
