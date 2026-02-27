import { test, expect } from '@playwright/test';


const GROUP_NAME = 'e2e_user_group';

test('createUserGroup – org_manager can create a group with a member', async ({ page }) => {

    await page.goto('http://localhost:5173/');
    await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('1234');
    await page.getByRole('button', { name: 'Sign In' }).click();

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