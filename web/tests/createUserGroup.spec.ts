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
    await page.getByRole('link', { name: 'Create New Group' }).click();

    // The component fetches users via useEffect once Keycloak token is parsed.
    // On CI the token can take longer to parse, so the fetch fires later than expected.
    // Wait for the search box to be visible (component mounted) then wait for the
    // users API response before typing — giving up to 30 s for the fetch to start + finish.
    const searchBox = page.getByRole('textbox', { name: 'Search by name, email, or' });
    await searchBox.waitFor({ state: 'visible' });

    await page.waitForResponse(
        resp => resp.url().includes('/users') && resp.status() === 200,
        { timeout: 30_000 },
    );

    await page.getByRole('textbox', { name: 'Group Name *' }).click();
    await page.getByRole('textbox', { name: 'Group Name *' }).fill('teste2');

    // Search is purely client-side from here — users are already loaded
    await searchBox.click();
    await searchBox.fill('user');
    await page.locator('button', { hasText: 'user@ua.pt' }).click();

    await page.getByRole('button', { name: 'Create Group' }).click();

    await expect(page.getByRole('heading', { name: 'teste2' })).toBeVisible();
});