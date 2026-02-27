import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  // Now create sending profile
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'name@company.com' }).click();
  await page.getByRole('textbox', { name: 'name@company.com' }).fill('user@ua.pt');
  await page.getByRole('button').click();
  await page.getByRole('textbox', { name: 'Username or email' }).click();
  await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('link', { name: 'Sending Profiles' }).click();
  await page.getByRole('link', { name: 'New Profile' }).click();
  await page.getByRole('textbox', { name: 'e.g., IT Support - Phishing' }).click();
  await page.getByRole('textbox', { name: 'e.g., IT Support - Phishing' }).fill('Test');
  await page.getByRole('textbox', { name: 'John' }).click();
  await page.getByRole('textbox', { name: 'John' }).fill('TestT');
  await page.getByRole('textbox', { name: 'Doe' }).click();
  await page.getByRole('textbox', { name: 'Doe' }).fill('Test');
  await page.getByRole('textbox').nth(5).click();
  await page.getByRole('textbox', { name: 'smtp.provider.com' }).click();
  await page.getByRole('textbox', { name: 'smtp.provider.com' }).fill('smtp.gmail.com');
  await page.getByRole('textbox').nth(5).click();
  await page.getByRole('textbox', { name: 'security@updates.com' }).click();
  await page.getByRole('textbox', { name: 'security@updates.com' }).fill('gabfacgon3@gmail.com');
  await page.getByRole('textbox', { name: 'security@updates.com' }).dblclick();
  await page.getByRole('textbox', { name: 'security@updates.com' }).click();
  await page.getByRole('textbox', { name: 'security@updates.com' }).click();
  await page.getByRole('textbox', { name: 'security@updates.com' }).dblclick();
  await page.getByRole('textbox', { name: 'security@updates.com' }).click();
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('ControlOrMeta+Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('ControlOrMeta+Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('ControlOrMeta+Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('ControlOrMeta+Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('ControlOrMeta+Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'security@updates.com' }).press('ControlOrMeta+c');
  await page.getByRole('textbox').nth(5).click();
  await page.getByRole('textbox').nth(5).fill('gabfacgon3@gmail.com');
  await page.locator('input[type="password"]').click();
  await page.locator('input[type="password"]').fill('slog wuxe rpwr okov');
  await page.getByRole('button', { name: 'Create Profile' }).click();
  await page.getByRole('button', { name: 'Test' }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Create Profile' }).click();
  await page.getByRole('complementary').getByRole('link', { name: 'Sending Profiles' }).click();
  await page.getByRole('link', { name: 'Test gabfacgon3@gmail.com' }).click();
  await expect(page).toHaveURL(/sending-profiles/);


});