import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  const smtpHost = process.env.KC_SMTP_HOST || 'smtp.gmail.com';
  const smtpUser = process.env.KC_SMTP_USER || '3@gmail.com';
  const smtpPass = (process.env.KC_SMTP_PASSWORD || '').replace(/^'|'$/g, '');
  const smtpFrom = process.env.KC_SMTP_FROM || '3@gmail.com';

  // Now create sending profile
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'name@company.com' }).fill('user@ua.pt');
  await page.getByRole('button').click();
  
  await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager');
  await page.getByRole('textbox', { name: 'Password' }).fill('1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  await page.getByRole('link', { name: 'Sending Profiles' }).click();
  await page.getByRole('link', { name: 'New Profile' }).click();
  
  await page.getByRole('textbox', { name: 'e.g., IT Support - Phishing' }).fill('Test');
  await page.getByRole('textbox', { name: 'John' }).fill('TestT');
  await page.getByRole('textbox', { name: 'Doe' }).fill('Test');
  
  await page.getByRole('textbox', { name: 'smtp.provider.com' }).fill(smtpHost);
  await page.getByRole('textbox', { name: 'security@updates.com' }).fill(smtpFrom);
  await page.getByRole('textbox').nth(5).fill(smtpUser);
  
  await page.locator('input[type="password"]').fill(smtpPass);
  await page.getByRole('button', { name: 'Create Profile' }).click();
  
  // Test connection
  await page.getByRole('button', { name: 'Test' }).click();
  await page.waitForTimeout(2000);
  
  await page.getByRole('button', { name: 'Create Profile' }).click();
  await page.getByRole('complementary').getByRole('link', { name: 'Sending Profiles' }).click();
  
  await page.getByRole('link', { name: `Test ${smtpFrom}` }).click();
  await expect(page).toHaveURL(/sending-profiles/);
});