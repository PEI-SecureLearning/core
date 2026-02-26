import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

    // Login
    await page.goto('http://localhost:5173/');
    await page.getByRole('textbox', { name: 'name@company.com' }).click();
    await page.getByRole('textbox', { name: 'name@company.com' }).fill('user@ua.pt');
    await page.getByRole('button').click();
    await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('1234');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.getByRole('complementary').getByRole('link', { name: 'User groups' }).click();

    // The Create New Group page fetches the user list once on load.
    // Register the waiter BEFORE clicking so we never miss the response.
    const usersLoaded = page.waitForResponse(
        resp => /\/api\/realms\/.+\/users/.test(resp.url()) && resp.status() === 200,
        { timeout: 30_000 },
    );
    await page.getByRole('link', { name: 'Create New Group' }).click();
    await usersLoaded; // users list is now in memory — search is client-side from here

    await page.getByRole('textbox', { name: 'Group Name *' }).click();
    await page.getByRole('textbox', { name: 'Group Name *' }).fill('teste2');

    // Typing filters client-side; result appears immediately after usersLoaded resolves
    await page.getByRole('textbox', { name: 'Search by name, email, or' }).click();
    await page.getByRole('textbox', { name: 'Search by name, email, or' }).fill('user');
    await page.locator('button', { hasText: 'user@ua.pt' }).click();

    await page.getByRole('button', { name: 'Create Group' }).click();

    await expect(page.getByRole('heading', { name: 'teste2' })).toBeVisible();
});