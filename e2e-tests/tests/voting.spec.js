import { test, expect } from '@playwright/test';

test.describe('Voting and Estimation', () => {
  test.beforeEach(async ({ page }) => {
    // Create a session and add a story
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Voting Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/.+/);
    
    // Add a story to vote on
    await page.click('button:has-text("Add Story")');
    await page.fill('[name="storyTitle"]', 'Story for Voting');
    await page.fill('[name="storyDescription"]', 'Test voting on this story');
    await page.click('button:has-text("Save Story")');
  });

  test('should cast a vote using estimation cards', async ({ page }) => {
    // Click on an estimation card (e.g., 5 points)
    await page.click('[data-testid="estimation-card-5"]');
    
    // Verify vote was cast
    await expect(page.locator('[data-testid="your-vote"]')).toContainText('5');
    await expect(page.locator('[data-testid="estimation-card-5"]')).toHaveClass(/selected/);
  });

  test('should change vote before reveal', async ({ page }) => {
    // Cast initial vote
    await page.click('[data-testid="estimation-card-3"]');
    await expect(page.locator('[data-testid="your-vote"]')).toContainText('3');
    
    // Change vote
    await page.click('[data-testid="estimation-card-8"]');
    
    // Verify vote was updated
    await expect(page.locator('[data-testid="your-vote"]')).toContainText('8');
    await expect(page.locator('[data-testid="estimation-card-8"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-testid="estimation-card-3"]')).not.toHaveClass(/selected/);
  });

  test('should reveal votes when all participants have voted', async ({ page, context }) => {
    const sessionUrl = page.url();
    
    // Get facilitator to vote
    await page.click('[data-testid="estimation-card-5"]');
    
    // Add a participant in another browser context
    const page2 = await context.newPage();
    const sessionId = sessionUrl.split('/').pop();
    await page2.goto('/');
    await page2.fill('[name="sessionId"]', sessionId);
    await page2.fill('[name="userName"]', 'Participant 1');
    await page2.click('button:has-text("Join Session")');
    
    // Participant votes
    await page2.click('[data-testid="estimation-card-8"]');
    
    // Reveal votes (facilitator action)
    await page.click('button:has-text("Reveal Votes")');
    
    // Verify votes are revealed
    await expect(page.locator('[data-testid="voting-results"]')).toBeVisible();
    await expect(page.locator('text=5')).toBeVisible();
    await expect(page.locator('text=8')).toBeVisible();
  });

  test('should show voting statistics after reveal', async ({ page }) => {
    // Cast vote
    await page.click('[data-testid="estimation-card-5"]');
    
    // Reveal votes
    await page.click('button:has-text("Reveal Votes")');
    
    // Verify statistics are displayed
    await expect(page.locator('[data-testid="voting-average"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-distribution"]')).toBeVisible();
  });

  test('should reset voting for next round', async ({ page }) => {
    // Cast and reveal vote
    await page.click('[data-testid="estimation-card-5"]');
    await page.click('button:has-text("Reveal Votes")');
    
    // Reset voting
    await page.click('button:has-text("New Round")');
    
    // Verify votes are cleared
    await expect(page.locator('[data-testid="your-vote"]')).toBeEmpty();
    await expect(page.locator('[data-testid="estimation-card-5"]')).not.toHaveClass(/selected/);
  });

  test('should support different estimation scales', async ({ page }) => {
    // Verify Fibonacci scale is available by default
    const fibonacciCards = ['1', '2', '3', '5', '8', '13', '21'];
    
    for (const value of fibonacciCards) {
      await expect(page.locator(`[data-testid="estimation-card-${value}"]`)).toBeVisible();
    }
  });
});
