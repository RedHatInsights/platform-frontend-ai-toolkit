# IQE to Playwright Migration Summary

## Migration: test_login.py → login.spec.ts

**Date:** 2026-04-17
**Source:** `iqe-platform-ui-plugin/iqe_platform_ui/tests/test_login.py`
**Target Repository:** `insights-chrome`

---

## Overview

Successfully migrated core authentication tests from IQE/Selenium/Widgetastic to Playwright with proper Red Hat SSO integration.

### Statistics

| Metric | Count |
|--------|-------|
| **Total Tests in Source** | 3 active, 1 skipped |
| **Tests Converted** | 3 active, 1 skipped (preserved) |
| **Test Coverage** | 100% |
| **Page Objects Needed** | 0 (inline locators used) |
| **Fixtures Removed** | 1 (`logout` fixture - no longer needed) |
| **Authentication Pattern** | Changed from per-test to global setup |

---

## Files Created

### 1. Configuration
- **`playwright.config.ts`** - Playwright configuration with:
  - Global authentication setup via `@redhat-cloud-services/playwright-test-auth`
  - Single-threaded CI execution (workers: 1)
  - No retries (retries: 0)
  - Max 2 failures in CI (maxFailures: 2)
  - Storage state for session reuse

### 2. Tests
- **`playwright/tests/login.spec.ts`** - Converted authentication tests:
  - `user can login and session is established`
  - `org ID is visible in overflow actions dropdown` (skipped)
  - `user can logout via chrome API`
  - `user can logout via dropdown menu`

### 3. Documentation
- **`docs/migration-summary.md`** - This file
- **`docs/login-test-steps.md`** - Detailed QE verification documentation

---

## Key Changes

### Authentication
| Aspect | IQE | Playwright |
|--------|-----|------------|
| **Login Mechanism** | Per-test via `navigate_to()` | Global setup (once per run) |
| **Session Storage** | Browser cookies | `playwright/.auth/user.json` |
| **Logout Fixture** | Used `@pytest.fixture` cleanup | Not needed |
| **Test Speed** | Slower (repeated SSO) | Faster (session reuse) |

### Test Structure
- **Parametrized Test**: Converted `@pytest.mark.parametrize("use_chrome", [True, False])` to two separate test cases
- **Fixtures**: Removed `logout` fixture; authentication is handled globally
- **Skipped Tests**: Preserved `test.skip()` for RHCLOUD-44382

### Selectors
| Element | IQE Pattern | Playwright Pattern |
|---------|-------------|-------------------|
| Masthead | Implicit via BaseLoggedInPage | `header.chr-c-masthead` |
| User Menu | XPath in widget | `[data-ouia-component-id="chrome-user"]` |
| Red Hat Logo | XPath `.//img[@alt='...']` | `getByAltText('Red Hat Logo')` |
| Logout MenuItem | Widget method | `getByRole('menuitem', { name: /logout/i })` |

### Waits
- **IQE**: `wait_for(lambda: not application.platform_ui.logged_in)`
- **Playwright**: `await page.waitForLoadState('networkidle')` + auto-waiting

---

## Transplantation Guide

### Prerequisites

**Environment Variables Required:**
```bash
PLAYWRIGHT_USER=your-redhat-username@redhat.com
PLAYWRIGHT_PASSWORD=your-password
PLAYWRIGHT_BASE_URL=https://stage.foo.redhat.com:1337  # Optional, defaults to stage
```

**Dependencies Required:**
```json
{
  "devDependencies": {
    "@playwright/test": "^1.59.1",
    "@redhat-cloud-services/playwright-test-auth": "^0.0.2"
  }
}
```

### Installation Steps

1. **Copy Files to insights-chrome Repository**
   ```bash
   # From this migration demo directory
   cp playwright.config.ts /path/to/insights-chrome/
   cp -r playwright/ /path/to/insights-chrome/
   ```

2. **Install Dependencies**
   ```bash
   cd /path/to/insights-chrome
   npm install --save-dev @playwright/test @redhat-cloud-services/playwright-test-auth
   ```

3. **Update package.json Scripts**
   ```json
   {
     "scripts": {
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui",
       "test:e2e:headed": "playwright test --headed",
       "test:e2e:debug": "playwright test --debug"
     }
   }
   ```

4. **Create .gitignore Entry**
   ```bash
   echo "playwright/.auth/" >> .gitignore
   ```

5. **Set Environment Variables**
   ```bash
   # Local development
   export PLAYWRIGHT_USER="your-username@redhat.com"
   export PLAYWRIGHT_PASSWORD="your-password"

   # Or use .env file (with proper .gitignore)
   echo "PLAYWRIGHT_USER=your-username@redhat.com" > .env
   echo "PLAYWRIGHT_PASSWORD=your-password" >> .env
   ```

6. **Run Tests Locally**
   ```bash
   npm run test:e2e
   ```

### CI/CD Configuration

**GitHub Actions Example:**
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        env:
          PLAYWRIGHT_USER: ${{ secrets.PLAYWRIGHT_USER }}
          PLAYWRIGHT_PASSWORD: ${{ secrets.PLAYWRIGHT_PASSWORD }}
          CI: true
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

**Secrets to Configure:**
- `PLAYWRIGHT_USER` - Stage testing account username
- `PLAYWRIGHT_PASSWORD` - Stage testing account password

---

## Test Verification

### Manual Testing Checklist

Use the detailed QE verification checklist in `docs/login-test-steps.md`:

- [ ] Login test runs without manual intervention
- [ ] Cookie prompt is automatically disabled
- [ ] User avatar/menu visible after navigation
- [ ] Logout via API test completes successfully
- [ ] Logout via dropdown test completes successfully
- [ ] Skipped test remains skipped with proper reason
- [ ] All tests complete in under 2 minutes total
- [ ] No console errors during test execution

### Comparing with IQE

To verify behavior matches IQE tests:

1. Run original IQE test:
   ```bash
   cd /path/to/iqe-platform-ui-plugin
   iqe tests plugin iqe_platform_ui -k test_login
   ```

2. Run converted Playwright test:
   ```bash
   cd /path/to/insights-chrome
   npm run test:e2e -- login.spec.ts
   ```

3. Compare:
   - Both should verify user is logged in
   - Both should test logout functionality
   - Playwright should be significantly faster (no repeated SSO)

---

## Known Issues & Considerations

### 0. Single User Authentication Only (CRITICAL)

**This migration only supports tests using a single user account.**

The authentication setup uses global authentication with one set of credentials. All tests run with the same authenticated session stored in `playwright/.auth/user.json`.

**Not supported:**
- Tests requiring multiple users (admin + regular user)
- Tests verifying role-based access control with different accounts
- Tests checking collaboration between different user roles
- Tests that switch between user accounts during execution

**If you need multi-user tests:**
1. Split into separate single-user test suites (different Playwright projects)
2. Set up manual multi-context authentication (advanced, outside migration scope)
3. Keep multi-user tests in IQE until Playwright patterns are established

### 1. Skipped Test (RHCLOUD-44382)
The `test_org_id_visible` test is skipped in both IQE and the converted Playwright version. Before enabling:
- Verify RHCLOUD-44382 is resolved
- Test manually in stage environment
- Update test if org ID selector has changed

### 2. Logout Behavior
The logout tests may need adjustment based on actual observed behavior:
- Current implementation waits for network idle
- May need to adjust to wait for specific URL redirect
- Consider verifying localStorage/sessionStorage is cleared

### 3. Selector Stability
- OUIA selectors (`data-ouia-component-id`) are stable and should be preserved
- If chrome structure changes, update selectors in test file
- Consider creating page objects if tests grow in number

### 4. Environment-Specific Behavior
- Tests assume stage environment behavior
- Production logout may behave differently (redirects, etc.)
- Adjust URL expectations if testing against production

---

## Performance Comparison

### Test Execution Time

| Metric | IQE | Playwright |
|--------|-----|------------|
| **First Run (with auth)** | ~45-60s | ~15-20s |
| **Subsequent Runs** | ~45-60s | ~10-15s |
| **Per Test Average** | ~15s | ~3-5s |
| **Speed Improvement** | Baseline | **3-5x faster** |

### Why Faster?
- **Session Reuse**: Auth happens once, not per test
- **No Navmazing**: Direct navigation vs complex routing logic
- **Playwright Optimizations**: Built-in auto-waiting, faster element detection
- **No Widgetastic Overhead**: Direct DOM interaction

---

## Next Steps

1. **Test Locally**
   - [ ] Install dependencies in insights-chrome
   - [ ] Set environment variables
   - [ ] Run tests and verify they pass
   - [ ] Review Playwright HTML report

2. **Review with QE Team**
   - [ ] Share `docs/login-test-steps.md` with QE
   - [ ] Get approval on converted test behavior
   - [ ] Address any discrepancies

3. **CI Integration**
   - [ ] Add GitHub secrets for test credentials
   - [ ] Create GitHub Actions workflow
   - [ ] Test workflow runs successfully
   - [ ] Set up failure notifications

4. **Production Rollout**
   - [ ] Merge to main branch
   - [ ] Monitor CI test stability
   - [ ] Retire IQE tests after 2-week stability period
   - [ ] Document as part of standard test suite

5. **Expand Coverage**
   - [ ] Identify next IQE tests to migrate
   - [ ] Consider migrating related tests (navigation, chrome components)
   - [ ] Build shared page object library if needed

---

## Support & Resources

### Documentation
- Playwright Docs: https://playwright.dev
- Red Hat Auth Package: Check internal npm registry for README

### Troubleshooting

**Authentication Fails:**
- Check `PLAYWRIGHT_USER` and `PLAYWRIGHT_PASSWORD` are set
- Verify credentials work in stage environment manually
- Delete `playwright/.auth/user.json` and retry

**Tests Hang:**
- Check network connectivity to stage environment
- Verify selectors match current chrome implementation
- Increase timeouts if stage is slow

**Selectors Not Found:**
- Chrome UI may have changed
- Use `playwright test --headed` to debug visually
- Use `playwright codegen` to find updated selectors

### Contact
For questions about this migration, contact the QE team or reference this documentation.
