import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

    // Create user
    await page.goto('http://localhost:5173/');
    await page.getByRole('textbox', { name: 'name@company.com' }).click();
    await page.getByRole('textbox', { name: 'name@company.com' }).fill('user@ua.pt');
    await page.getByRole('button').click();
    await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('link', { name: 'User Management' }).click();
    await page.getByRole('button', { name: 'New User' }).click();
    await page.getByRole('textbox', { name: 'John Doe' }).fill('user');
    await page.getByRole('textbox', { name: 'john.doe@example.com' }).fill('user@ua.pt');
    await page.getByRole('textbox', { name: 'Username' }).fill('user');
    await page.getByRole('button', { name: 'User', exact: true }).click();
    await page.getByRole('button', { name: 'Create User' }).click();
});