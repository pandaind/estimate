import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test('should create a new planning poker session', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for the landing page to load and click the "Create Session" button
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    
    // Wait for form to appear and fill in session creation form
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Sprint Planning - Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    
    // Click create session button
    await page.click('button:has-text("Create Session")');
    
    // Verify session was created (app uses state-based routing, not URL routing)
    await expect(page.locator('h1:has-text("Sprint Planning - Test Session")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Leave")')).toBeVisible();
  });

  test('should join an existing session', async ({ page, browser }) => {
    // First, create a session
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for the landing page to load and click the "Create Session" button
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Join Test Session');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    await page.click('button:has-text("Create Session")');
    
    // Wait for session to load and get session code
    await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    const sessionCodeButton = page.locator('span:has-text("Code:")').locator('..').locator('button').locator('span').first();
    const sessionCode = await sessionCodeButton.textContent();
    
    // Create separate context for second user to avoid localStorage sharing
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { waitUntil: 'networkidle' });
    // Wait for the landing page to load and click the "Join Session" button
    await page2.waitForSelector('button:has-text("Join Session")', { state: 'visible' });
    await page2.click('button:has-text("Join Session")');
    
    // Join the session
    await page2.waitForSelector('[name="sessionId"]', { state: 'visible' });
    await page2.fill('[name="sessionId"]', sessionCode.trim());
    await page2.fill('[name="userName"]', 'Participant 1');
    await page2.click('button:has-text("Join Session")');
    
    // Verify joined successfully (check for session elements, not URL)
    await expect(page2.locator('button:has-text("Leave")')).toBeVisible({ timeout: 10000 });
    
    // Cleanup
    await context2.close();
  });

  test('should display session code for sharing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for the landing page to load and click the "Create Session" button
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Shareable Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    await page.click('button:has-text("Create Session")');
    
    // Wait for session to load and check session code is visible
    await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    const sessionCodeButton = page.locator('span:has-text("Code:")').locator('..').locator('button').locator('span').first();
    await expect(sessionCodeButton).toBeVisible();
    const sessionCode = await sessionCodeButton.textContent();
    expect(sessionCode.trim()).toBeTruthy();
    expect(sessionCode.trim().length).toBeGreaterThan(0);
  });
});
