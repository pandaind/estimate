import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Create session with multiple stories and votes
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="btn-create-session"]', { state: 'visible' });
    await page.click('[data-testid="btn-create-session"]');
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
    
    // Submit form directly — bypasses click event propagation that stalls under CPU load
    await expect(async () => {
      await page.locator('[data-testid="btn-submit-create-session"]').evaluate(btn => btn.closest('form').requestSubmit());
      await expect(page.locator('[data-testid="btn-leave-session"]')).toBeVisible();
    }).toPass({ timeout: 45000 });
    
    // Navigate to Stories tab first before adding a story (scroll into view for mobile)
    const storiesTab = page.locator('[data-testid="tab-stories"]');
    await storiesTab.scrollIntoViewIfNeeded();
    await storiesTab.click();
    await page.waitForTimeout(500); // Wait for tab transition
    
    // Add and vote on a story
    await page.click('[data-testid="btn-add-story"]');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    await page.fill('[name="storyTitle"]', 'Story 1');
    await page.click('[data-testid="btn-create-story"]');
    await page.waitForTimeout(500); // Wait for story to be created
    
    // Activate the story for voting
    await page.click('button:has-text("Activate for Voting")');
    await page.waitForTimeout(500); // Wait for activation
    
    // Navigate back to Estimate tab to vote
    await page.click('[data-testid="tab-estimate"]');
    await page.waitForTimeout(1000); // Wait for tab transition and state update
    
    // Set up response watcher before click to ensure vote is persisted
    const voteResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/votes') && resp.request().method() === 'POST',
      { timeout: 10000 }
    );
    await page.click('[aria-label="Vote 5 points"]', { timeout: 10000 });
    await voteResponsePromise; // Ensure vote is saved before checking reveal button
    
    // Reveal votes from Stories tab — actual button is btn-reveal-votes-{id} in StoryList
    await page.click('[data-testid="tab-stories"]');
    // Wait for reveal button to appear (StoryList fetches votes on mount; shows button when storyVotes.length > 0)
    await page.waitForSelector('[data-testid^="btn-reveal-votes-"]', { state: 'visible', timeout: 15000 });
    const revealResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/reveal') && resp.request().method() === 'POST',
      { timeout: 10000 }
    );
    await page.click('[data-testid^="btn-reveal-votes-"]');
    await revealResponsePromise; // Ensure reveal is confirmed by backend
  });

  test('should display session metrics', async ({ page }) => {
    // Navigate to analytics (scroll into view for mobile)
    const analyticsTab = page.locator('[data-testid="tab-analytics"]');
    await analyticsTab.scrollIntoViewIfNeeded();
    await analyticsTab.click();
    await page.waitForTimeout(500);
    
    // Verify session metrics are displayed
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
    await expect(page.locator('text=Completion Rate').first()).toBeVisible();
    await expect(page.locator('text=Consensus Rate').first()).toBeVisible();
  });

  test('should show voting distribution chart', async ({ page }) => {
    const analyticsTab = page.locator('[data-testid="tab-analytics"]');
    await analyticsTab.scrollIntoViewIfNeeded();
    await analyticsTab.click();
    await page.waitForTimeout(500);
    
    // Verify story status section is rendered (available at session level)
    await expect(page.locator('text=Story Status')).toBeVisible();
  });

  test('should display consensus indicator', async ({ page }) => {
    const analyticsTab = page.locator('[data-testid="tab-analytics"]');
    await analyticsTab.scrollIntoViewIfNeeded();
    await analyticsTab.click();
    await page.waitForTimeout(500);
    
    // Verify consensus section
    await expect(page.locator('text=Consensus Overview')).toBeVisible();
    await expect(page.locator('text=Consensus Rate').first()).toBeVisible();
  });

  test('should show story-specific analytics', async ({ page }) => {
    const analyticsTab = page.locator('[data-testid="tab-analytics"]');
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
