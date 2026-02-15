import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
  test('should update participant list in real-time when users join', async ({ page, browser }) => {
    // Create session
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Collaboration Test');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    
    // Enable moderator voting so facilitator counts as participant
    await page.check('#moderatorCanVote');
    await page.waitForTimeout(200);
    
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    
    // Get session code
    const sessionCodeButton = page.locator('span:has-text("Code:")').locator('..').locator('button').locator('span').first();
    const sessionCode = await sessionCodeButton.textContent();
    
    // Verify participant count shows 1 participant
    await expect(page.locator('text=participant')).toBeVisible();
    
    // Create separate context for second user to avoid localStorage sharing
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { waitUntil: 'networkidle' });
    await page2.waitForSelector('button:has-text("Join Session")', { state: 'visible' });
    await page2.click('button:has-text("Join Session")');
    await page2.waitForSelector('[name="sessionId"]', { state: 'visible' });
    await page2.fill('[name="sessionId"]', sessionCode.trim());
    await page2.fill('[name="userName"]', 'Developer 1');
    await page2.click('button:has-text("Join Session")');
    
    // Wait a bit for WebSocket update
    await page.waitForTimeout(1000);
    
    // Verify participant count increased to 2
    await expect(page.locator('text=participants')).toBeVisible();
    
    // Cleanup
    await context2.close();
  });

  test('should show voting status in real-time', async ({ page, browser }) => {
    // Setup session with story
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Voting Status Test');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    
    // Enable moderator voting
    await page.check('#moderatorCanVote');
    await page.waitForTimeout(200);
    
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    
    // Navigate to Stories tab to add a story
    await page.click('button:has-text("Stories")');
    await page.waitForTimeout(500); // Wait for tab transition
    
    await page.click('button:has-text("Add Story")');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    await page.fill('[name="storyTitle"]', 'Test Story');
    await page.click('button:has-text("Create Story")');
    await page.waitForTimeout(500); // Wait for story to be created
    
    // Activate the story for voting
    await page.click('button:has-text("Activate for Voting")');
    await page.waitForTimeout(500); // Wait for activation
    
    // Navigate back to Estimate tab for voting
    await page.click('button:has-text("Estimate")');
    await page.waitForTimeout(1000); // Wait for tab transition and state update
    
    // Get session code
    const sessionCodeButton = page.locator('span:has-text("Code:")').locator('..').locator('button').locator('span').first();
    const sessionCode = await sessionCodeButton.textContent();
    
    // Create separate context for participant to avoid localStorage sharing
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { waitUntil: 'networkidle' });
    await page2.waitForSelector('button:has-text("Join Session")', { state: 'visible' });
    await page2.click('button:has-text("Join Session")');
    await page2.waitForSelector('[name="sessionId"]', { state: 'visible' });
    await page2.fill('[name="sessionId"]', sessionCode.trim());
    await page2.fill('[name="userName"]', 'Developer 1');
    await page2.click('button:has-text("Join Session")');
    
    // Participant votes
    await page2.click('[aria-label="Vote 5 points"]');
    await page2.waitForTimeout(500);
    
    // Wait for WebSocket update
    await page.waitForTimeout(1000);
    
    // Verify voting happened - navigate to Stories tab and check for Reveal Votes button enabled
    await page.click('button:has-text("Stories")');
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("Reveal Votes")')).toBeVisible();
    
    // Cleanup
    await context2.close();
  });

  test('should sync story changes across all participants', async ({ page, browser }) => {
    // Create session
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Story Sync Test');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    
    // Get session code
    const sessionCodeButton = page.locator('span:has-text("Code:")').locator('..').locator('button').locator('span').first();
    const sessionCode = await sessionCodeButton.textContent();
    
    // Create separate context for participant to avoid localStorage sharing
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { waitUntil: 'networkidle' });
    await page2.waitForSelector('button:has-text("Join Session")', { state: 'visible' });
    await page2.click('button:has-text("Join Session")');
    await page2.waitForSelector('[name="sessionId"]', { state: 'visible' });
    await page2.fill('[name="sessionId"]', sessionCode.trim());
    await page2.fill('[name="userName"]', 'Developer 1');
    await page2.click('button:has-text("Join Session")');
    
    // Facilitator navigates to Stories tab and adds a story
    await page.click('button:has-text("Stories")');
    await page.waitForTimeout(500); // Wait for tab transition
    
    await page.click('button:has-text("Add Story")');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    await page.fill('[name="storyTitle"]', 'New Feature Story');
    await page.fill('[name="storyDescription"]', 'Implement new feature');
    await page.click('button:has-text("Create Story")');
    await page.waitForTimeout(500); // Wait for story to be created
    
    // Activate the story for voting so participants can see it
    await page.click('button:has-text("Activate for Voting")');
    await page.waitForTimeout(500);
    
    // Wait for sync
    await page2.waitForTimeout(1000);
    
    // Participant should see the new story
    await expect(page2.locator('text=New Feature Story').first()).toBeVisible();
    
    // Cleanup
    await context2.close();
  });
});
