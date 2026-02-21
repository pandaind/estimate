import { test, expect } from '@playwright/test';

test.describe('Voting and Estimation', () => {
  test.beforeEach(async ({ page }) => {
    // Create a session and add a story
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Voting Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    
    // Enable moderator voting
    await page.check('#moderatorCanVote');
    await page.waitForTimeout(200);
    
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    
    // Navigate to Stories tab to add a story
    await page.click('button:has-text("Stories")');
    await page.waitForTimeout(500); // Wait for tab transition
    
    // Add a story to vote on
    await page.click('button:has-text("Add Story")');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    await page.fill('[name="storyTitle"]', 'Story for Voting');
    await page.fill('[name="storyDescription"]', 'Test voting on this story');
    await page.click('button:has-text("Create Story")');
    await page.waitForTimeout(500); // Wait for story to be created
    
    // Activate the story for voting
    await page.click('button:has-text("Activate for Voting")');
    await page.waitForTimeout(500); // Wait for activation
    
    // Navigate back to Estimate tab for voting
    await page.click('button:has-text("Estimate")');
    await page.waitForTimeout(1000); // Wait for tab transition and state update
  });

  test('should cast a vote using estimation cards', async ({ page }) => {
    // Click on an estimation card (e.g., 5 points)
    await page.click('[aria-label="Vote 5 points"]');
    await page.waitForTimeout(500);
    
    // Verify vote was cast - check for selected state on the button
    await expect(page.locator('[aria-label="Vote 5 points"]')).toHaveClass(/scale-105/);
  });

  test('should change vote before reveal', async ({ page }) => {
    // Cast initial vote
    await page.click('[aria-label="Vote 3 points"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[aria-label="Vote 3 points"]')).toHaveClass(/scale-105/);
    
    // Change vote
    await page.click('[aria-label="Vote 8 points"]');
    await page.waitForTimeout(500);
    
    // Verify vote was updated
    await expect(page.locator('[aria-label="Vote 8 points"]')).toHaveClass(/scale-105/);
    await expect(page.locator('[aria-label="Vote 3 points"]')).not.toHaveClass(/scale-105/);
  });

  test('should reveal votes when all participants have voted', async ({ page, browser }) => {
    // Get session code
    const sessionCodeButton = page.locator('span:has-text("Code:")').locator('..').locator('button').locator('span').first();
    const sessionCode = await sessionCodeButton.textContent();
    
    // Get facilitator to vote
    await page.click('[aria-label="Vote 5 points"]');
    await page.waitForTimeout(500);
    
    // Create separate context for participant to avoid localStorage sharing
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { waitUntil: 'networkidle' });
    await page2.waitForSelector('button:has-text("Join Session")', { state: 'visible' });
    await page2.click('button:has-text("Join Session")');
    await page2.waitForSelector('[name="sessionId"]', { state: 'visible' });
    await page2.fill('[name="sessionId"]', sessionCode.trim());
    await page2.fill('[name="userName"]', 'Participant 1');
    await page2.click('button:has-text("Join Session")');
    
    // Wait for participant to fully load the session
    await page2.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    
    // Participant votes
    await page2.click('[aria-label="Vote 8 points"]');
    await page2.waitForTimeout(500);
    
    // Navigate facilitator to Results tab and reveal votes directly from VotingResults.
    // Using VotingResults' own Reveal button calls setShowVotes(true) synchronously
    // after the API, so Summary appears without waiting for a WebSocket event.
    await page.click('button:has-text("Results")');
    await page.waitForTimeout(500);
    
    // Wait for Reveal button to be available in VotingResults (moderator + not yet revealed)
    await expect(page.locator('button:has-text("Reveal")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Reveal")');
    
    // Verify votes are revealed - check for Summary section
    await expect(page.locator('text=Summary')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Total Votes')).toBeVisible({ timeout: 5000 });
    
    // Cleanup
    await context2.close();
  });

  test('should show voting statistics after reveal', async ({ page }) => {
    // Cast vote
    await page.click('[aria-label="Vote 5 points"]');
    await page.waitForTimeout(500);
    
    // Navigate directly to Results tab and reveal votes from VotingResults.
    // VotingResults.handleRevealToggle calls setShowVotes(true) synchronously after the
    // API response, so no WebSocket round-trip is needed to show Summary / Distribution.
    await page.click('button:has-text("Results")');
    await page.waitForTimeout(500);
    
    // Reveal via the Results tab's own Reveal button
    await expect(page.locator('button:has-text("Reveal")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Reveal")');
    
    // Verify statistics are displayed
    await expect(page.locator('text=Summary')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Distribution')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Total Votes')).toBeVisible({ timeout: 5000 });
  });

  test.skip('should reset voting for next round', async ({ page }) => {
    // TODO: "New Round" button not implemented - use "Revote" on finalized stories instead
    // Cast and reveal vote
    await page.click('[aria-label="Vote 5 points"]');
    await page.waitForTimeout(500);
    
    // Navigate to Stories tab to reveal votes
    await page.click('button:has-text("Stories")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Reveal Votes")');
    await page.waitForTimeout(500);
    
    // Reset voting
    await page.click('button:has-text("New Round")');
    await page.waitForTimeout(500);
    
    // Verify vote buttons are no longer selected
    await expect(page.locator('[aria-label="Vote 5 points"]')).not.toHaveClass(/scale-105/);
  });

  test('should support different estimation scales', async ({ page }) => {
    // Verify Fibonacci scale is available by default
    const fibonacciCards = ['1', '2', '3', '5', '8', '13', '21'];
    
    for (const value of fibonacciCards) {
      await expect(page.locator(`[aria-label="Vote ${value} points"]`)).toBeVisible();
    }
  });
});
