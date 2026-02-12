import { test as base } from '@playwright/test';

/**
 * Custom fixtures for Planning Poker tests
 * Extend the base test with custom setup and teardown
 */

export const test = base.extend({
  /**
   * Session fixture - automatically creates and cleans up a session
   */
  session: async ({ page }, use) => {
    // Setup: Create a session
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Fixture Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/.+/);
    
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split('/').pop();
    
    // Provide the session info to the test
    await use({ sessionId, sessionUrl });
    
    // Teardown: Could add cleanup logic here if needed
  },

  /**
   * Multi-user fixture - creates a session with multiple participants
   */
  multiUser: async ({ context, page }, use) => {
    // Create main session
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Multi User Session');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/.+/);
    
    const sessionId = page.url().split('/').pop();
    
    // Create participant pages
    const participant1 = await context.newPage();
    await participant1.goto('/');
    await participant1.fill('[name="sessionId"]', sessionId);
    await participant1.fill('[name="userName"]', 'Developer 1');
    await participant1.click('button:has-text("Join Session")');
    await participant1.waitForURL(/\/session\/.+/);
    
    const participant2 = await context.newPage();
    await participant2.goto('/');
    await participant2.fill('[name="sessionId"]', sessionId);
    await participant2.fill('[name="userName"]', 'Developer 2');
    await participant2.click('button:has-text("Join Session")');
    await participant2.waitForURL(/\/session\/.+/);
    
    // Provide all pages to the test
    await use({
      facilitator: page,
      participant1,
      participant2,
      sessionId
    });
    
    // Cleanup
    await participant1.close();
    await participant2.close();
  },
});

export { expect } from '@playwright/test';
