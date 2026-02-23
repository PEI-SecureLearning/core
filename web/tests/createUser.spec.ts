import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
    // Setup: Create tenant first
    await page.goto('http://localhost:5173/admin');
    await page.getByRole('textbox', { name: 'Username or email' }).click();
    await page.getByRole('textbox', { name: 'Username or email' }).fill('platform_admin');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('link', { name: 'Tenants', exact: true }).click();
    await page.getByRole('button', { name: 'New Tenant' }).click();
    await page.getByRole('textbox', { name: 'Organization name*' }).fill('ua');
    await page.getByRole('textbox', { name: 'Tenant domain/email pattern*' }).fill('ua.pt');
    await page.getByRole('textbox', { name: 'Admin email*' }).fill('admin@ua.pt');
    await page.locator('.absolute').first().click();
    await page.locator('.lucide.lucide-check.w-3.h-3.text-white').click();
    await page.locator('.lucide.lucide-check').first().click();
    await page.getByText('Learning ManagementDeliver').click();
    await page.getByRole('button', { name: 'Upload tenant logo' }).click();
    await page.getByRole('button', { name: 'Create Tenant' }).click();
    await page.waitForNavigation();
    
    // Now create user
    await page.goto('http://localhost:5173/');
    await page.getByRole('textbox', { name: 'name@company.com' }).click();
    await page.getByRole('textbox', { name: 'name@company.com' }).fill('user@ua.pt');
    await page.getByRole('textbox', { name: 'name@company.com' }).press('Enter');
    await page.getByRole('button').click();
    await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('link', { name: 'User Management' }).click();
    await page.getByRole('button', { name: 'New User' }).click();
    await page.getByRole('textbox', { name: 'John Doe' }).click();
    await page.getByRole('textbox', { name: 'John Doe' }).fill('user');
    await page.getByRole('textbox', { name: 'john.doe@example.com' }).click();
    await page.getByRole('textbox', { name: 'john.doe@example.com' }).fill('user@ua.pt');
    await page.getByRole('textbox', { name: 'Username' }).click();
    await page.getByRole('textbox', { name: 'Username' }).fill('user');
    await page.getByRole('button', { name: 'User', exact: true }).click();
    await page.getByRole('button', { name: 'Create User' }).click();
    await page.getByText('user@ua.pt').click();
});