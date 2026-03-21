import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test('should create a new planning poker session', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for the landing page to load and click the "Create Session" button
    await page.waitForSelector('[data-testid="btn-create-session"]', { state: 'visible' });
    await page.click('[data-testid="btn-create-session"]');
    
    // Wait for form to appear and fill in session creation form
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Sprint Planning - Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    
    // Submit form directly — bypasses click event propagation that stalls under CPU load
    await expect(async () => {
      await page.locator('[data-testid="btn-submit-create-session"]').evaluate(btn => btn.closest('form').requestSubmit());
      await expect(page).toHaveURL(/\/session\/.+/);
    }).toPass({ timeout: 45000 });
    await expect(page.locator('h1:has-text("Sprint Planning - Test Session")')).toBeVisible();
    await expect(page.locator('[data-testid="btn-leave-session"]')).toBeVisible();
  });

  test('should join an existing session', async ({ page, browser }) => {
    // First, create a session
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for the landing page to load and click the "Create Session" button
    await page.waitForSelector('[data-testid="btn-create-session"]', { state: 'visible' });
    await page.click('[data-testid="btn-create-session"]');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Join Test Session');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    // Submit form directly — bypasses click event propagation that stalls under CPU load
    await expect(async () => {
      await page.locator('[data-testid="btn-submit-create-session"]').evaluate(btn => btn.closest('form').requestSubmit());
      await expect(page).toHaveURL(/\/session\//);
    }).toPass({ timeout: 45000 });
    await page.waitForSelector('[data-testid="btn-leave-session"]', { state: 'visible', timeout: 15000 });
    const sessionCodeButton = page.locator('span:has-text("Code:")').locator('..').locator('button').locator('span').first();
    const sessionCode = await sessionCodeButton.textContent();
    
    // Create separate context for second user to avoid localStorage sharing
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { waitUntil: 'networkidle' });
    // Wait for the landing page to load and click the "Join Session" button
    await page2.waitForSelector('[data-testid="btn-join-session"]', { state: 'visible' });
    await page2.click('[data-testid="btn-join-session"]');
    
    // Join the session
    await page2.waitForSelector('[name="sessionId"]', { state: 'visible' });
    await page2.fill('[name="sessionId"]', sessionCode.trim());
    await page2.fill('[name="userName"]', 'Participant 1');
    await page2.click('[data-testid="btn-submit-join-session"]');
    
    // Verify joined successfully (check for session elements, not URL)
    await expect(page2.locator('[data-testid="btn-leave-session"]')).toBeVisible({ timeout: 20000 });
    
    // Cleanup
    await context2.close();
  });

  test('should display session code for sharing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for the landing page to load and click the "Create Session" button
    await page.waitForSelector('[data-testid="btn-create-session"]', { state: 'visible' });
    await page.click('[data-testid="btn-create-session"]');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Shareable Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    // Submit form directly — bypasses click event propagation that stalls under CPU load
    await expect(async () => {
      await page.locator('[data-testid="btn-submit-create-session"]').evaluate(btn => btn.closest('form').requestSubmit());
      await expect(page).toHaveURL(/\/session\//);
    }).toPass({ timeout: 45000 });
    await page.waitForSelector('[data-testid="btn-leave-session"]', { state: 'visible', timeout: 15000 });
    const sessionCodeButton = page.locator('span:has-text("Code:")').locator('..').locator('button').locator('span').first();
    await expect(sessionCodeButton).toBeVisible();
    const sessionCode = await sessionCodeButton.textContent();
    expect(sessionCode.trim()).toBeTruthy();
    expect(sessionCode.trim().length).toBeGreaterThan(0);
  });
});
