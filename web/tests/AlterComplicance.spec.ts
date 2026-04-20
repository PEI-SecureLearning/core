import { test, expect, type Page } from '@playwright/test';

const Q1 = {
  id: 'e2e-q1',
  prompt: 'What is the primary purpose of the compliance policy?',
  options: ['To protect company data', 'To slow down work', 'To increase costs'],
  answerIndex: 0,
  feedback: 'The policy exists to protect company data and assets.',
};

const Q2 = {
  id: 'e2e-q2',
  prompt: 'What should you do if you suspect a security breach?',
  options: ['Ignore it', 'Report it immediately to the security team'],
  answerIndex: 1,
  feedback: 'Always report suspected breaches immediately.',
};

async function fillQuestionCard(page: Page, idx: number, q: typeof Q1) {
  const baseId = `question-${idx}`;

  const idInput = page.locator(`#${baseId}-id`);
  await idInput.waitFor({ state: 'visible', timeout: 15_000 });
  await idInput.scrollIntoViewIfNeeded();
  await idInput.fill(q.id);

  await page.locator(`#${baseId}-prompt`).fill(q.prompt);

  const cardLocator = page
    .locator(`[data-testid="remove-question-${idx}"]`)
    .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');

  const optionInputs = cardLocator.locator('input.flex-1');
  await optionInputs.nth(0).fill(q.options[0]);
  await optionInputs.nth(1).fill(q.options[1]);

  for (let i = 2; i < q.options.length; i++) {
    await cardLocator.getByRole('button', { name: 'Add option' }).click();
    await page.waitForTimeout(150);
    await optionInputs.nth(i).fill(q.options[i]);
  }

  await page.locator(`#${baseId}-answer`).selectOption({ index: q.answerIndex });

  await page.locator(`#${baseId}-feedback`).fill(q.feedback);
}

test('createCompliance – builds quiz from zero and persists to server', async ({ page }) => {

  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'name@company.com' }).click();
  await page.getByRole('textbox', { name: 'name@company.com' }).fill('user@ua.pt');
  await page.getByRole('button').click();
  await page.getByRole('textbox', { name: 'Username or email' }).fill('org_manager');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('1234');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL('**/dashboard**', { timeout: 30_000 });
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('link', { name: 'Compliance' }).click();
  await page.waitForURL('**/compliance-org-manager**', { timeout: 15_000 });
  await page.waitForLoadState('domcontentloaded');

  // Expand the Quiz section (starts collapsed)
  await page.getByText('Quiz Question Bank').click();
  await page.waitForTimeout(300);

  const removeFirstBtn = page.locator('[data-testid="remove-question-0"]');

  await page.waitForTimeout(500);
  await page.waitForTimeout(500);

  let questionCount = await page.locator('[data-testid^="remove-question-"]').count();
  while (questionCount > 0) {
    await removeFirstBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await removeFirstBtn.click();
    await page.waitForFunction(
      (prevCount) => document.querySelectorAll('[data-testid^="remove-question-"]').length < prevCount,
      questionCount,
      { timeout: 5_000 },
    );
    questionCount = await page.locator('[data-testid^="remove-question-"]').count();
  }

  await expect(page.locator('[data-testid^="remove-question-"]')).toHaveCount(0);

  await page.locator('[data-testid="add-question-btn"]').click();


  const newCardLocator = page
    .locator('[data-testid="remove-question-0"]')
    .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');

  const expandBtn = newCardLocator.getByRole('button', { name: 'Expand' });
  if (await expandBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await expandBtn.click();
  }

  await fillQuestionCard(page, 0, Q1);

  const decreaseCountBtn = page.getByRole('button', { name: 'Decrease question count' });
  while (!(await decreaseCountBtn.isDisabled())) {
    await decreaseCountBtn.click();
    await page.waitForTimeout(100);
  }
  await expect(page.locator('#question-count')).toContainText('1');

  const decreaseScoreBtn = page.locator('[data-testid="decrease-passing-score-btn"]');
  await decreaseScoreBtn.waitFor({ state: 'visible' });
  while (!(await decreaseScoreBtn.isDisabled())) {
    await decreaseScoreBtn.click();
    await page.waitForTimeout(100);
  }
  await expect(page.locator('[data-testid="passing-score-display"]')).toContainText('0%');

  const [saveResponse] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes('/compliance/quiz') && resp.request().method() === 'PUT',
      { timeout: 15_000 },
    ),
    page.locator('[data-testid="save-quiz-btn"]').click(),
  ]);
  expect(saveResponse.status()).toBe(200);

  await expect(page.getByText('Quiz updated successfully.')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Templates' }).click();
  await page.waitForURL('**/templates**', { timeout: 15_000 });
  await page.getByRole('link', { name: 'Compliance' }).click();
  await page.waitForURL('**/compliance-org-manager**', { timeout: 15_000 });
  await page.waitForLoadState('domcontentloaded');

  // Expand the Quiz section again (starts collapsed after navigation)
  await page.getByText('Quiz Question Bank').click();
  await page.waitForTimeout(300);

  await expect(page.locator('[data-testid^="remove-question-"]')).toHaveCount(1);
  await expect(page.locator('#question-count')).toContainText('1');
  await expect(page.locator('[data-testid="passing-score-display"]')).toContainText('0%');

  await page.locator('[data-testid="add-question-btn"]').click();
  await page.locator('[data-testid="remove-question-1"]').waitFor({ state: 'visible', timeout: 5_000 });

  const card2Locator = page
    .locator('[data-testid="remove-question-1"]')
    .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');

  const expandBtn2 = card2Locator.getByRole('button', { name: 'Expand' });
  if (await expandBtn2.isVisible({ timeout: 500 }).catch(() => false)) {
    await expandBtn2.click();
  }

  await fillQuestionCard(page, 1, Q2);

  const increaseCountBtn = page.getByRole('button', { name: 'Increase question count' });
  await increaseCountBtn.click();
  await page.waitForTimeout(100);
  await expect(page.locator('#question-count')).toContainText('2');

  const [save2Response] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes('/compliance/quiz') && resp.request().method() === 'PUT',
      { timeout: 15_000 },
    ),
    page.locator('[data-testid="save-quiz-btn"]').click(),
  ]);
  expect(save2Response.status()).toBe(200);

  await expect(page.getByText('Quiz updated successfully.')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: 'Templates' }).click();
  await page.waitForURL('**/templates**', { timeout: 15_000 });
  await page.getByRole('link', { name: 'Compliance' }).click();
  await page.waitForURL('**/compliance-org-manager**', { timeout: 15_000 });
  await page.waitForLoadState('domcontentloaded');

  // Expand the Quiz section again
  await page.getByText('Quiz Question Bank').click();
  await page.waitForTimeout(300);

  await expect(page.locator('[data-testid^="remove-question-"]')).toHaveCount(2);
  await expect(page.locator('#question-count')).toContainText('2');
});
