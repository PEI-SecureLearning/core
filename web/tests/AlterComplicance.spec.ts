import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'name@company.com' }).click();
  await page.getByRole('textbox', { name: 'name@company.com' }).fill('user@ua.pt');
  await page.getByRole('button').click();
  await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager1');
  await page.getByRole('textbox', { name: 'Password' }).fill('234');
  await page.getByRole('textbox', { name: 'Username or email' }).click();
  await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('link', { name: 'Compliance' }).click();
  await page.getByRole('button', { name: 'Remove' }).nth(1).click();
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await page.getByRole('button', { name: 'Save Quiz' }).click();
  await page.getByRole('link', { name: 'Templates' }).click();
  await page.getByRole('link', { name: 'Compliance' }).click();
  await page.getByRole('button', { name: 'Question 1 What should be' }).click();
  await page.getByText('5', { exact: true }).click();
  await page.getByRole('button', { name: 'Decrease passing score' }).dblclick();
  await page.getByRole('button', { name: 'Save Quiz' }).click();
  await page.getByRole('link', { name: 'Templates' }).click();
  await page.getByRole('link', { name: 'Compliance' }).click();
  await expect(page.getByText('20%')).toBeVisible();
});