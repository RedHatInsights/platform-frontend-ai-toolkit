# IQE to Playwright Migration - Quick Start Guide

This guide will help you quickly migrate IQE tests to Playwright using the `hcc-frontend-iqe-to-playwright-migration` agent.

## Prerequisites

Before starting, ensure you have:

- [ ] IQE test repository accessible locally (`iqe-platform-ui-plugin`)
- [ ] Claude Code installed with the `hcc-frontend-ai-toolkit` plugin
- [ ] Target frontend repository cloned (e.g., `insights-chrome`)
- [ ] Basic understanding of the tests you're migrating
- [ ] **Tests use only one set of user credentials** (see limitations below)

## ⚠️ Important Limitation: Single User Only

**This migration agent only supports tests that use a single user account.**

The authentication setup uses global authentication with one set of credentials. All tests in the suite run with the same authenticated user.

### ✅ Supported Tests
- Tests using a single user account throughout
- Tests verifying functionality for one user role
- Tests that don't switch between different users

### ❌ NOT Supported Tests
- Tests requiring multiple users (admin + regular user)
- Tests verifying role-based access control with different accounts
- Tests checking collaboration between multiple users
- Tests that switch user accounts during execution

### What If My Tests Use Multiple Users?

If your IQE tests require multiple users, you have these options:

1. **Split the test** - Separate into single-user tests (if possible)
2. **Manual conversion** - Handle multi-user setup manually after migration
3. **Skip migration** - Keep in IQE until multi-user Playwright patterns are established

The agent will warn you if it detects multi-user patterns and ask how to proceed.

## Step 1: Install the Plugin (First Time Only)

If you haven't already, install the plugin:

```bash
# Add the marketplace
/plugin marketplace add RedHatInsights/platform-frontend-ai-toolkit

# Install the plugin
/plugin install hcc-frontend-ai-toolkit@hcc-frontend-toolkit

# Restart Claude Code to load the plugin
```

## Step 2: Start a Migration

In Claude Code, use the Task tool to invoke the migration agent:

```
Migrate test_login.py from /Users/btweed/repos/iqe/iqe-platform-ui-plugin/iqe_platform_ui/tests/
to Playwright for the insights-chrome repository.
```

Or use the Task tool directly:

```
Task with subagent_type='hcc-frontend-ai-toolkit:hcc-frontend-iqe-to-playwright-migration'
to migrate test_login.py from the IQE plugin to Playwright for insights-chrome
```

## Step 3: Review the Migration Plan

The agent will:

1. **Analyze the test file** and identify:
   - All tests to convert
   - Page objects/views needed
   - Fixtures to adapt or remove
   - Target repository assignment

2. **Ask clarifying questions** like:
   - Which repository should own this test?
   - Should I use role-based or CSS selectors?
   - Should I split multi-app tests?

3. **Present a migration plan** showing:
   - Tests organized by target repository
   - Page objects to create
   - Fixtures to convert/remove
   - Any ambiguities needing decisions

**Example Plan:**
```
Migration Plan for test_login.py:

TARGET REPO: insights-chrome (3 tests)
1. test_login() - Basic login verification
2. test_org_id_visible() - Org ID in dropdown (skipped)
3. test_logout() - Logout via API and dropdown

Page Objects Needed: None (inline locators)
Fixtures to Remove: logout (auth handled globally)

Questions:
1. Should I preserve XPath selectors or convert to role-based?
```

## Step 4: Approve the Plan

Review the plan and respond:
- Answer any questions
- Approve the approach
- Request changes if needed

Example response:
```
Looks good! Please use role-based selectors where possible,
but keep OUIA selectors as-is since they're stable.
```

## Step 5: Review Generated Files

The agent will create:

### 1. Configuration Files
```
playwright.config.ts          # Playwright config with auth setup
```

### 2. Test Files
```
playwright/tests/
  ├── login.spec.ts           # Converted tests
  └── ...
```

### 3. Documentation
```
docs/
  ├── migration-summary.md    # Overall migration summary
  └── login-test-steps.md     # QE verification steps
```

## Step 6: Transplant to Target Repository

Follow the transplantation guide in `docs/migration-summary.md`:

```bash
# 1. Copy files to target repo
cp playwright.config.ts /path/to/insights-chrome/
cp -r playwright/ /path/to/insights-chrome/

# 2. Install dependencies
cd /path/to/insights-chrome
npm install --save-dev @playwright/test @redhat-cloud-services/playwright-test-auth

# 3. Add npm scripts
# (Edit package.json - see migration summary)

# 4. Set environment variables
export PLAYWRIGHT_USER="your-username@redhat.com"
export PLAYWRIGHT_PASSWORD="your-password"

# 5. Run tests
npm run test:e2e
```

## Step 7: Verify with QE Team

Use the generated test step documentation for manual verification:

1. Share `docs/login-test-steps.md` with QE
2. QE manually tests each step
3. Check off items in the verification checklist
4. Report any discrepancies

## Common Patterns

### Simple Test Migration
```
Migrate test_navigation.py from the IQE plugin to Playwright for insights-chrome
```

### Multiple Files
```
Migrate all tests in /path/to/iqe-plugin/tests/ to Playwright.
Organize by target repository.
```

### With Specific Instructions
```
Migrate test_search.py to Playwright for insights-chrome.
Use CSS selectors instead of XPath where possible.
Create page objects for reusable components.
```

### Parametrized Tests
```
Migrate test_navigation.py (which has parametrized tests) to Playwright.
For parametrized tests with 2-3 values, create separate test() calls.
For 4+ values, use for loops with test data arrays.
```

## What Gets Converted

### ✅ Automatically Converted

- **Tests**: All pytest tests → Playwright tests
- **Fixtures**: Adapted to Playwright patterns (except auth)
- **Page Objects**: Widgetastic Views → Playwright Page Objects
- **Selectors**: XPath/CSS → Playwright locators
- **Waits**: `wait_for()` → Playwright auto-waiting
- **Navigation**: `navigate_to()` → `page.goto()`
- **Assertions**: `assert` → `expect()`
- **Parametrization**: `@pytest.mark.parametrize` → for loops or multiple tests (agent asks for preference)

### ⚠️ Manual Review Needed

- **Authentication**: Uses global setup (review auth flow)
- **Logout Tests**: May need URL redirect adjustments
- **Custom Widgets**: Complex widgets need manual verification
- **Environment-specific Logic**: May need env variable updates
- **Environment State Assumptions**: Tests assuming pre-existing data or config require setup/teardown code

### ❌ Not Converted (Removed)

- **`logout` Fixture**: Not needed (global auth)
- **`application.platform_ui.logged_in` checks**: Replaced with element visibility
- **Navmazing navigation**: Replaced with direct `goto()`

### ⚠️ Requires Additional Work

- **Environment State Assumptions**: Tests that assume data exists need setup/teardown:
  - Tests expecting inventory systems to exist → Add API/UI setup to create systems
  - Tests expecting policies/rules → Add setup to create test data
  - Tests expecting specific user permissions → Document or add permission checks
  - Tests expecting configuration → Add setup to configure environment

**The agent will warn you when it detects state assumptions and suggest idempotency approaches.**

## Configuration Details

### Authentication Setup

The agent configures authentication automatically:

**playwright.config.ts:**
```typescript
globalSetup: require.resolve('@redhat-cloud-services/playwright-test-auth/global-setup'),
use: {
  storageState: 'playwright/.auth/user.json',
}
```

**In tests:**
```typescript
test.beforeEach(async ({ page }) => {
  await disableCookiePrompt(page);
  await page.goto('/');
});
```

### CI Configuration

Generated config includes:
- `workers: process.env.CI ? 1 : undefined` - Single-threaded in CI
- `retries: 0` - No retries
- `maxFailures: process.env.CI ? 2 : undefined` - Stop after 2 failures
- `fullyParallel: !process.env.CI` - Parallel locally, serial in CI

## Troubleshooting

### Agent Not Found

**Error:** `Agent type 'hcc-frontend-ai-toolkit:hcc-frontend-iqe-to-playwright-migration' not found`

**Solution:**
1. Verify plugin is installed: `/plugin list`
2. Restart Claude Code
3. Re-install plugin if needed

### Authentication Fails

**Error:** Tests fail with authentication errors

**Solution:**
1. Check environment variables are set:
   ```bash
   echo $PLAYWRIGHT_USER
   echo $PLAYWRIGHT_PASSWORD
   ```
2. Delete auth storage and retry:
   ```bash
   rm -rf playwright/.auth/
   npm run test:e2e
   ```
3. Verify credentials work manually in stage

### Selectors Not Found

**Error:** `Error: Locator.click: Target closed`

**Solution:**
1. Run with headed mode to debug:
   ```bash
   npm run test:e2e -- --headed
   ```
2. Use Playwright Inspector:
   ```bash
   npm run test:e2e -- --debug
   ```
3. Generate new selectors:
   ```bash
   npx playwright codegen https://stage.foo.redhat.com:1337
   ```

## Best Practices

### 1. Migrate in Batches
- Start with 1-2 simple test files
- Verify they work in target repo
- Then migrate more complex tests
- Build confidence incrementally

### 2. Preserve Test Intent
- Don't add new functionality
- Keep original test coverage
- Document any deviations
- Get QE approval for changes

### 3. Use Stable Selectors
- Prefer OUIA attributes (`data-ouia-component-id`)
- Use role-based selectors (`getByRole`)
- Avoid brittle CSS/XPath chains
- Test selector stability

### 4. Test in CI Early
- Set up CI immediately
- Don't wait for all tests to migrate
- Catch CI-specific issues early
- Iterate on CI config

### 5. Document Everything
- Keep migration summaries
- Update as you learn
- Share with team
- Create runbooks

## Example Workflow

Here's a complete example of migrating a test file:

```bash
# 1. Start migration in Claude Code
> Migrate test_chrome_components.py from /Users/btweed/repos/iqe/iqe-platform-ui-plugin
  to Playwright for insights-chrome

# 2. Agent analyzes and asks questions
Agent: "This test uses the AllServicesPage view. Should I create a page object
        or use inline locators?"
You: "Create a page object for reusability"

# 3. Agent presents plan
Agent: [Shows migration plan with 5 tests, 2 page objects]
You: "Approved, proceed"

# 4. Agent generates files
Agent: "Created:
  - playwright.config.ts
  - playwright/tests/chrome-components.spec.ts
  - playwright/page-objects/pages/all-services.page.ts
  - docs/chrome-components-test-steps.md
  - docs/migration-summary.md"

# 5. Transplant to repo
cd /path/to/insights-chrome
cp <files>
npm install --save-dev @playwright/test @redhat-cloud-services/playwright-test-auth

# 6. Configure env
export PLAYWRIGHT_USER="username@redhat.com"
export PLAYWRIGHT_PASSWORD="password"

# 7. Run tests
npm run test:e2e

# 8. Review and commit
git add playwright/
git commit -m "feat: add playwright e2e tests for chrome components"
git push
```

## Next Steps

After your first successful migration:

1. **Migrate Related Tests**: Group related tests for efficiency
2. **Build Page Object Library**: Create shared components
3. **Set Up CI**: Integrate with your CI/CD pipeline
4. **Train Team**: Share knowledge with QE and developers
5. **Retire IQE Tests**: After stability period, archive IQE tests
6. **Expand Coverage**: Add new Playwright tests for new features

## Getting Help

- **Agent Documentation**: See the full agent spec in `claude/agents/hcc-frontend-iqe-to-playwright-migration.md`
- **Playwright Docs**: https://playwright.dev
- **Red Hat Auth Package**: Check internal npm registry
- **Team Support**: Reach out to QE team or platform frontend team

## Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Migration Demo](./tests/migration-demo/) - Example migration output
- [Test Step Documentation Template](./docs/login-test-steps.md) - QE verification format

---

**Ready to migrate?** Start with a simple test file and work your way up! 🚀
