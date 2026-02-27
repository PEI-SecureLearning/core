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
    await page.getByRole('textbox', { name: 'name@company.com' }).click();
    await page.getByRole('textbox', { name: 'name@company.com' }).fill('user@ua.pt');
    await page.getByRole('button').click();
    await page.locator('#username').waitFor({ state: 'visible' });
    await page.locator('#username').fill('org_manager');
    await page.locator('#password').fill('1234');
    await page.locator('#kc-login').click();

    // ── 3. Navigate to User Groups via sidebar ────────────────────────────────
    // The sidebar is rendered inside an <aside> (role="complementary").
    const sidebar = page.getByRole('complementary');
    await sidebar.getByRole('link', { name: 'User groups' }).click();
    await page.waitForURL('**/usergroups');

    // ── 4. Click "Create New Group" ───────────────────────────────────────────
    await page.locator('#create-new-group-link').click();
    await page.waitForURL('**/usergroups/new-group');

    // ── 5. Fill in the group name ─────────────────────────────────────────────
    await page.locator('#groupName').fill(GROUP_NAME);

    // ── 6. Wait for the /users API fetch to complete before searching ─────────
    // The component fires the fetch once the Keycloak token is parsed, which
    // can take several seconds on slow CI runners.
    const memberSearchInput = page.locator('#member-search-input');
    await memberSearchInput.waitFor({ state: 'visible' });

    await page.waitForResponse(
        (resp) => resp.url().includes('/users') && resp.status() === 200,
        { timeout: 30_000 },
    );

    // ── 7. Search for a member and select them ────────────────────────────────
    await memberSearchInput.fill('user');

    // The search result button has data-testid="user-result-<email>"
    const userResult = page.locator('[data-testid="user-result-user@ua.pt"]');
    await userResult.waitFor({ state: 'visible' });
    await userResult.click();

    // ── 8. Submit the form ────────────────────────────────────────────────────
    await page.locator('#create-group-btn').click();

    // ── 9. Assert the new group appears in the list ───────────────────────────
    // After creation, the app navigates back to /usergroups.
    await page.waitForURL('**/usergroups');

    const groupCard = page.locator(`[data-testid="group-card-${GROUP_NAME}"]`);
    await expect(groupCard).toBeVisible();
});