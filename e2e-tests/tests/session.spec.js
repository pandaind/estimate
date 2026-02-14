import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test('should create a new planning poker session', async ({ page }) => {
    await page.goto('/');
    
    // Fill in session creation form
    await page.fill('[name="sessionName"]', 'Sprint Planning - Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    
    // Click create session button
    await page.click('button:has-text("Create Session")');
    
    // Verify session was created and we're redirected to session page
    await expect(page).toHaveURL(/\/session\/.+/);
    await expect(page.locator('text=Sprint Planning - Test Session')).toBeVisible();
  });

  test('should join an existing session', async ({ page, context }) => {
    // First, create a session
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Join Test Session');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    await page.click('button:has-text("Create Session")');
    
    // Get session URL
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split('/').pop();
    
    // Open new page to simulate another user
    const page2 = await context.newPage();
    await page2.goto('/');
    
    // Join the session
    await page2.fill('[name="sessionId"]', sessionId);
    await page2.fill('[name="userName"]', 'Participant 1');
    await page2.click('button:has-text("Join Session")');
    
    // Verify joined successfully
    await expect(page2).toHaveURL(/\/session\/.+/);
    await expect(page2.locator('text=Participant 1')).toBeVisible();
  });

  test('should display session code for sharing', async ({ page }) => {
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Shareable Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    await page.click('button:has-text("Create Session")');
    
    // Session code should be visible
    const sessionCode = await page.locator('[data-testid="session-code"]').textContent();
    expect(sessionCode).toBeTruthy();
    expect(sessionCode.length).toBeGreaterThan(0);
  });
});
