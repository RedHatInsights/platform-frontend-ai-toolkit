/**
 * Login and Authentication Tests
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/tests/test_login.py
 * Target Repository: insights-chrome
 *
 * Original Requirements:
 *   - PLATFORM_UI-LOGIN
 *
 * Original Markers:
 *   - @pytest.mark.core
 *   - @pytest.mark.outage
 *   - @pytest.mark.smoke
 */

import { test, expect } from '@playwright/test';
import { disableCookiePrompt } from '@redhat-cloud-services/playwright-test-auth';

test.describe('Platform Authentication', () => {
    test.beforeEach(async ({ page }): Promise<void> => {
        // Disable cookie consent prompt
        await disableCookiePrompt(page);
    });

    test('user can login and session is established', async ({ page }) => {
        /**
         * Verifies that Red Hat SSO authentication works and the user session
         * is properly established in the console.
         *
         * Original: test_login()
         * IQE File: test_login.py:32
         */

        // Navigate to the application (authentication already handled by global-setup)
        await page.goto('/', { waitUntil: 'load', timeout: 60000 });

        // Wait for the main masthead/chrome to be visible
        await expect(page.locator('header.chr-c-masthead')).toBeVisible({ timeout: 10000 });

        // Verify user is logged in by checking for user menu/avatar
        await expect(page.locator('[data-ouia-component-id="chrome-user"]')).toBeVisible();

        // Verify the Red Hat logo is displayed
        await expect(page.getByAltText('Red Hat Logo')).toBeVisible();
    });

    test.skip('org ID is visible in overflow actions dropdown', async ({ page }) => {
        /**
         * Confirms that Organization ID is visible in the user menu dropdown.
         *
         * Original: test_org_id_visible()
         * IQE File: test_login.py:45
         *
         * NOTE: This test was skipped in IQE due to RHCLOUD-44382
         * Skipped here as well until the issue is resolved.
         */

        // Navigate to the application
        await page.goto('/', { waitUntil: 'load', timeout: 60000 });

        // Wait for topbar to be ready
        await expect(page.locator('header.chr-c-masthead')).toBeVisible();

        // Open the user overflow actions dropdown
        const userMenuButton = page.locator('header button[id="UserMenu"]').or(
            page.locator('header button.data-hj-suppress')
        );
        await userMenuButton.click();

        // Get the org ID element
        const orgIdElement = page.locator('[data-ouia-component-id="chrome-user-org-id"]');
        await expect(orgIdElement).toBeVisible();

        // Get the org ID text
        const orgIdText = await orgIdElement.textContent();
        expect(orgIdText).toBeTruthy();
        expect(orgIdText?.trim().length).toBeGreaterThan(0);
    });
});

test.describe('Logout Functionality', () => {
    test.beforeEach(async ({ page }): Promise<void> => {
        await disableCookiePrompt(page);
        await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    });

    /**
     * Original test was parametrized: use_chrome=[True, False]
     * Testing both logout via chrome API and via dropdown
     */

    test('user can logout via chrome API', async ({ page }) => {
        /**
         * Logout via the insights-chrome command: insights.chrome.auth.logout()
         *
         * Original: test_logout(use_chrome=True)
         * IQE File: test_login.py:61
         */

        // Verify logged in first
        await expect(page.locator('[data-ouia-component-id="chrome-user"]')).toBeVisible();

        // Execute logout via chrome API
        await page.evaluate(() => {
            // @ts-ignore - insights global object
            if (window.insights?.chrome?.auth?.logout) {
                // @ts-ignore
                window.insights.chrome.auth.logout();
            }
        });

        // Wait for logout to complete
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        // Verify user is logged out by checking the user menu is gone
        await expect(page.locator('[data-ouia-component-id="chrome-user"]'))
            .not.toBeVisible({ timeout: 5000 });
    });

    test('user can logout via dropdown menu', async ({ page }) => {
        /**
         * Logout via the user dropdown menu
         *
         * Original: test_logout(use_chrome=False)
         * IQE File: test_login.py:61
         */

        // Verify logged in first
        await expect(page.locator('[data-ouia-component-id="chrome-user"]')).toBeVisible();

        // Open the user menu dropdown
        const userMenuButton = page.locator('header button[id="UserMenu"]').or(
            page.locator('header button.data-hj-suppress')
        );
        await userMenuButton.click();

        // Click the logout option in the dropdown
        const logoutButton = page.getByRole('menuitem', { name: /log out|logout/i });
        await logoutButton.click();

        // Wait for logout redirect
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        // Verify logged out
        await expect(page.locator('[data-ouia-component-id="chrome-user"]'))
            .not.toBeVisible({ timeout: 5000 });
    });
});
