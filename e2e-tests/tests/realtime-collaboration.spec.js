import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
  test('should update participant list in real-time when users join', async ({ page, context }) => {
    // Create session
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Collaboration Test');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/.+/);
    
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split('/').pop();
    
    // Verify facilitator is in the list
    await expect(page.locator('[data-testid="participant-list"]')).toContainText('Facilitator');
    
    // Join with another user
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('[name="sessionId"]', sessionId);
    await page2.fill('[name="userName"]', 'Developer 1');
    await page2.click('button:has-text("Join Session")');
    
    // Wait a bit for WebSocket update
    await page.waitForTimeout(1000);
    
    // Verify new participant appears on facilitator's page
    await expect(page.locator('[data-testid="participant-list"]')).toContainText('Developer 1');
  });

  test('should show voting status in real-time', async ({ page, context }) => {
    // Setup session with story
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Voting Status Test');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/.+/);
    
    await page.click('button:has-text("Add Story")');
    await page.fill('[name="storyTitle"]', 'Test Story');
    await page.click('button:has-text("Save Story")');
    
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split('/').pop();
    
    // Add participant
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('[name="sessionId"]', sessionId);
    await page2.fill('[name="userName"]', 'Developer 1');
    await page2.click('button:has-text("Join Session")');
    
    // Participant votes
    await page2.click('[data-testid="estimation-card-5"]');
    
    // Wait for WebSocket update
    await page.waitForTimeout(1000);
    
    // Facilitator should see that participant has voted (without seeing the value)
    await expect(page.locator('[data-testid="participant-Developer 1"]')).toContainText('✓');
  });

  test('should sync story changes across all participants', async ({ page, context }) => {
    // Create session
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Story Sync Test');
    await page.fill('[name="facilitatorName"]', 'Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/.+/);
    
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split('/').pop();
    
    // Add participant
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('[name="sessionId"]', sessionId);
    await page2.fill('[name="userName"]', 'Developer 1');
    await page2.click('button:has-text("Join Session")');
    
    // Facilitator adds a story
    await page.click('button:has-text("Add Story")');
    await page.fill('[name="storyTitle"]', 'New Feature Story');
    await page.fill('[name="storyDescription"]', 'Implement new feature');
    await page.click('button:has-text("Save Story")');
    
    // Wait for sync
    await page2.waitForTimeout(1000);
    
    // Participant should see the new story
    await expect(page2.locator('text=New Feature Story')).toBeVisible();
  });
});
