import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Create session with multiple stories and votes
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Analytics Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/.+/);
    
    // Add and vote on a story
    await page.click('button:has-text("Add Story")');
    await page.fill('[name="storyTitle"]', 'Story 1');
    await page.click('button:has-text("Save Story")');
    await page.click('[data-testid="estimation-card-5"]');
    await page.click('button:has-text("Reveal Votes")');
  });

  test('should display session metrics', async ({ page }) => {
    // Navigate to analytics
    await page.click('[data-testid="analytics-tab"]');
    
    // Verify session metrics are displayed
    await expect(page.locator('[data-testid="total-stories"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimated-stories"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-estimation-time"]')).toBeVisible();
  });

  test('should show voting distribution chart', async ({ page }) => {
    await page.click('[data-testid="analytics-tab"]');
    
    // Verify voting distribution is rendered
    await expect(page.locator('[data-testid="voting-distribution-chart"]')).toBeVisible();
  });

  test('should display consensus indicator', async ({ page }) => {
    await page.click('[data-testid="analytics-tab"]');
    
    // Verify consensus metrics
    await expect(page.locator('[data-testid="consensus-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="consensus-indicator"]')).toBeVisible();
  });

  test('should show story-specific analytics', async ({ page }) => {
    await page.click('[data-testid="analytics-tab"]');
    
    // View story analytics
    await page.click('[data-testid="story-analytics-Story 1"]');
    
    // Verify story-specific data
    await expect(page.locator('[data-testid="story-estimation-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="story-vote-count"]')).toBeVisible();
  });
});
