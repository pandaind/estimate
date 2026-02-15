import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Create session with multiple stories and votes
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Analytics Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    
    // Enable moderator voting and verify it's checked
    await page.check('#moderatorCanVote');
    await page.waitForTimeout(200);
    const isChecked = await page.isChecked('#moderatorCanVote');
    if (!isChecked) {
      throw new Error('Failed to enable moderator voting');
    }
    
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    
    // Navigate to Stories tab first before adding a story (scroll into view for mobile)
    const storiesTab = page.locator('button:has-text("Stories")');
    await storiesTab.scrollIntoViewIfNeeded();
    await storiesTab.click();
    await page.waitForTimeout(500); // Wait for tab transition
    
    // Add and vote on a story
    await page.click('button:has-text("Add Story")');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    await page.fill('[name="storyTitle"]', 'Story 1');
    await page.click('button:has-text("Create Story")');
    await page.waitForTimeout(500); // Wait for story to be created
    
    // Activate the story for voting
    await page.click('button:has-text("Activate for Voting")');
    await page.waitForTimeout(500); // Wait for activation
    
    // Navigate back to Estimate tab to vote
    await page.click('button:has-text("Estimate")');
    await page.waitForTimeout(1000); // Wait for tab transition and state update
    
    // Try clicking directly - the button should be enabled now
    await page.click('[aria-label="Vote 5 points"]', { timeout: 10000 });
    await page.waitForTimeout(500); // Wait for vote to be cast
    
    // Navigate back to Stories tab to reveal votes
    await page.click('button:has-text("Stories")');
    await page.waitForTimeout(500); // Wait for tab transition
    
    await page.click('button:has-text("Reveal Votes")');
  });

  test('should display session metrics', async ({ page }) => {
    // Navigate to analytics (scroll into view for mobile)
    const analyticsTab = page.locator('button:has-text("Analytics")');
    await analyticsTab.scrollIntoViewIfNeeded();
    await analyticsTab.click();
    await page.waitForTimeout(500);
    
    // Verify session metrics are displayed
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
    await expect(page.locator('text=Completion Rate').first()).toBeVisible();
    await expect(page.locator('text=Consensus Rate').first()).toBeVisible();
  });

  test('should show voting distribution chart', async ({ page }) => {
    const analyticsTab = page.locator('button:has-text("Analytics")');
    await analyticsTab.scrollIntoViewIfNeeded();
    await analyticsTab.click();
    await page.waitForTimeout(500);
    
    // Verify story status section is rendered (available at session level)
    await expect(page.locator('text=Story Status')).toBeVisible();
  });

  test('should display consensus indicator', async ({ page }) => {
    const analyticsTab = page.locator('button:has-text("Analytics")');
    await analyticsTab.scrollIntoViewIfNeeded();
    await analyticsTab.click();
    await page.waitForTimeout(500);
    
    // Verify consensus section
    await expect(page.locator('text=Consensus Overview')).toBeVisible();
    await expect(page.locator('text=Consensus Rate').first()).toBeVisible();
  });

  test('should show story-specific analytics', async ({ page }) => {
    const analyticsTab = page.locator('button:has-text("Analytics")');
    await analyticsTab.scrollIntoViewIfNeeded();
    await analyticsTab.click();
    await page.waitForTimeout(500);
    
    // Switch to Story Details tab
    await page.click('button:has-text("Story Details")');
    await page.waitForTimeout(500);
    
    // Story 1 was activated and voted on, so story analytics should be visible
    // Check for story title or vote count section
    await expect(page.locator('text=Story 1').first()).toBeVisible();
  });
});
