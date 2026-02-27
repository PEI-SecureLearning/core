import { test, expect } from '@playwright/test';

/**
 * E2E test: Create a User Group
 *
 * Flow:
 *  1. Navigate to the app root – Keycloak redirects to the `ua` realm login page.
 *  2. Log in as `org_manager`.
 *  3. Navigate to /usergroups via the sidebar.
 *  4. Click "Create New Group" (id="create-new-group-link").
 *  5. Fill in the group name (id="groupName").
 *  6. Wait for the users API response so the member list is populated.
 *  7. Search for a user (id="member-search-input") and pick the result.
 *  8. Submit the form (id="create-group-btn").
 *  9. Assert the new group card is visible (data-testid="group-card-<name>").
 */

const GROUP_NAME = 'e2e_user_group';

test('createUserGroup – org_manager can create a group with a member', async ({ page }) => {

    await page.goto('http://localhost:5173/');
    await page.locator('#username').waitFor({ state: 'visible' });
    await page.locator('#username').fill('org_manager');
    await page.locator('#password').fill('1234');
    await page.locator('#kc-login').click();

    const sidebar = page.getByRole('complementary');
    await sidebar.getByRole('link', { name: 'User groups' }).click();
    await page.waitForURL('**/usergroups');

    await page.locator('#create-new-group-link').click();
    await page.waitForURL('**/usergroups/new-group');

    await page.locator('#groupName').fill(GROUP_NAME);

    const memberSearchInput = page.locator('#member-search-input');
    await memberSearchInput.waitFor({ state: 'visible' });

    await page.waitForResponse(
        (resp) => resp.url().includes('/users') && resp.status() === 200,
        { timeout: 30_000 },
    );

    await memberSearchInput.fill('user');

    const userResult = page.locator('[data-testid="user-result-user@ua.pt"]');
    await userResult.waitFor({ state: 'visible' });
    await userResult.click();

    await page.locator('#create-group-btn').click();
    await page.waitForURL('**/usergroups');

    const groupCard = page.locator(`[data-testid="group-card-${GROUP_NAME}"]`);
    await expect(groupCard).toBeVisible();
});