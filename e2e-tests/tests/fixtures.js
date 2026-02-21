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
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for the landing page to load and click the "Create Session" button
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Fixture Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    
    // Enable moderator voting
    await page.check('#moderatorCanVote');
    await page.waitForTimeout(200);
    
    await page.click('button:has-text("Create Session")');
    
    // Wait for React Router to navigate to /session/:code
    await page.waitForURL(/\/session\//, { timeout: 10000 });

    // Extract session code from URL
    const sessionCode = page.url().split('/session/')[1];

    // Provide the session info to the test
    await use({ sessionCode });
    
    // Teardown: Could add cleanup logic here if needed
  },

  /**
   * Multi-user fixture - creates a session with multiple participants
   */
  multiUser: async ({ browser }, use) => {
    // Create separate context for facilitator
    const facilitatorContext = await browser.newContext();
    const page = await facilitatorContext.newPage();
    
    // Create main session
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for the landing page to load and click the "Create Session" button
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Multi User Session');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    
    // Enable moderator voting
    await page.check('#moderatorCanVote');
    await page.waitForTimeout(200);
    
    await page.click('button:has-text("Create Session")');
    
    // Wait for React Router to navigate to /session/:code
    await page.waitForURL(/\/session\//, { timeout: 10000 });
    // Wait for the session view to fully mount — ensures PlanningPokerSession is rendered
    // and the WebSocket has had time to connect before participants start joining.
    // Without this, USER_JOINED events may fire before subscriptions are active.
    await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500); // Extra time for WebSocket subscription to establish

    // Extract session code from URL
    const sessionCode = page.url().split('/session/')[1];
    
    // Create separate contexts for participants to isolate localStorage
    const participant1Context = await browser.newContext();
    const participant1 = await participant1Context.newPage();
    await participant1.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await participant1.waitForTimeout(500); // Wait for page to settle
    // Wait for the landing page to load and click the "Join Session" button
    await participant1.waitForSelector('button:has-text("Join Session")', { state: 'visible', timeout: 15000 });
    await participant1.click('button:has-text("Join Session")');
    await participant1.waitForSelector('[name="sessionId"]', { state: 'visible' });
    await participant1.fill('[name="sessionId"]', sessionCode.trim());
    await participant1.fill('[name="userName"]', 'Developer 1');
    await participant1.click('button:has-text("Join Session")');
    await participant1.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    
    const participant2Context = await browser.newContext();
    const participant2 = await participant2Context.newPage();
    await participant2.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await participant2.waitForTimeout(500); // Wait for page to settle
    // Wait for the landing page to load and click the "Join Session" button
    await participant2.waitForSelector('button:has-text("Join Session")', { state: 'visible', timeout: 15000 });
    await participant2.click('button:has-text("Join Session")');
    await participant2.waitForSelector('[name="sessionId"]', { state: 'visible' });
    await participant2.fill('[name="sessionId"]', sessionCode.trim());
    await participant2.fill('[name="userName"]', 'Developer 2');
    await participant2.click('button:has-text("Join Session")');
    await participant2.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    
    // Provide all pages to the test
    await use({
      facilitator: page,
      participant1,
      participant2,
      sessionCode: sessionCode.trim()
    });
    
    // Cleanup - close contexts which will also close their pages
    await facilitatorContext.close();
    await participant1Context.close();
    await participant2Context.close();
  },
});

export { expect } from '@playwright/test';
