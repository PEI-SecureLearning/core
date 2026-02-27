import { test, expect } from '@playwright/test';


const GROUP_NAME = 'e2e_user_group';

test('createUserGroup – org_manager can create a group with a member', async ({ page }) => {

    // ── Login ─────────────────────────────────────────────────────────────────
    await page.goto('http://localhost:5173/');

    // Handle both: custom realm-discovery page (name@company.com input) OR
    // direct Keycloak redirect (Username or email input).
    const emailInputLocator = page.getByRole('textbox', { name: 'name@company.com' });
    const usernameLocator = page.getByRole('textbox', { name: 'Username or email' });

    await Promise.race([
        emailInputLocator.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => null),
        usernameLocator.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => null),
    ]);

    if (await emailInputLocator.isVisible()) {
        await emailInputLocator.fill('user@ua.pt');
        await page.getByRole('button').first().click();
        await usernameLocator.waitFor({ state: 'visible', timeout: 20_000 });
    }

    await usernameLocator.fill('org_manager');
    await page.getByRole('textbox', { name: 'Password' }).fill('1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');

    // ── Navigate to User Groups ───────────────────────────────────────────────
    const sidebar = page.getByRole('complementary');
    await sidebar.getByRole('link', { name: 'User groups' }).click();
    await page.waitForURL('**/usergroups');

    // ── Create New Group ──────────────────────────────────────────────────────
    await page.locator('#create-new-group-link').click();
    await page.waitForURL('**/usergroups/new-group');

    await page.locator('#groupName').fill(GROUP_NAME);

    // Wait for member search input to be ready, then wait for users API response.
    const memberSearchInput = page.locator('#member-search-input');
    await memberSearchInput.waitFor({ state: 'visible' });

    await page.waitForResponse(
        (resp) => resp.url().includes('/users') && resp.status() === 200,
        { timeout: 30_000 },
    );

    // Search and select a user.
    await memberSearchInput.fill('user');
    const userResult = page.locator('[data-testid="user-result-user@ua.pt"]');
    await userResult.waitFor({ state: 'visible' });
    await userResult.click();

    // Submit and verify.
    await page.locator('#create-group-btn').click();
    await page.waitForURL('**/usergroups');

    const groupCard = page.locator(`[data-testid="group-card-${GROUP_NAME}"]`);
    await expect(groupCard).toBeVisible();
});