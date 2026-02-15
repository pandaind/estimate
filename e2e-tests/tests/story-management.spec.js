import { test, expect } from '@playwright/test';

test.describe('Story Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create a session before each test
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Story Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
    
    // Navigate to Stories tab
    await page.click('button:has-text("Stories")');
    await page.waitForTimeout(500); // Wait for tab transition
  });

  test('should add a new story to the session', async ({ page }) => {
    // Click add story button
    await page.click('button:has-text("Add Story")');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    
    // Fill in story details
    await page.fill('[name="storyTitle"]', 'User Authentication');
    await page.fill('[name="storyDescription"]', 'Implement user login and registration');
    
    // Submit story
    await page.click('button:has-text("Create Story")');
    
    // Verify story appears in the list
    await expect(page.locator('text=User Authentication').first()).toBeVisible();
  });

  test.skip('should edit an existing story', async ({ page }) => {
    // TODO: Edit functionality not yet implemented in UI
    // Add a story first
    await page.click('button:has-text("Add Story")');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    await page.fill('[name="storyTitle"]', 'Original Title');
    await page.fill('[name="storyDescription"]', 'Original description');
    await page.click('button:has-text("Create Story")');
    await page.waitForTimeout(500);
    
    // Click edit button
    await page.click('[data-testid="edit-story-button"]');
    
    // Update story
    await page.fill('[name="storyTitle"]', 'Updated Title');
    await page.click('button:has-text("Save Changes")');
    
    // Verify update
    await expect(page.locator('text=Updated Title').first()).toBeVisible();
    await expect(page.locator('text=Original Title')).not.toBeVisible();
  });

  test.skip('should delete a story', async ({ page }) => {
    // TODO: Delete functionality not yet implemented in UI
    // Add a story first
    await page.click('button:has-text("Add Story")');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    await page.fill('[name="storyTitle"]', 'Story to Delete');
    await page.fill('[name="storyDescription"]', 'This will be deleted');
    await page.click('button:has-text("Create Story")');
    await page.waitForTimeout(500);
    
    // Delete the story
    await page.click('[data-testid="delete-story-button"]');
    await page.click('button:has-text("Confirm")');
    
    // Verify story is removed
    await expect(page.locator('text=Story to Delete')).not.toBeVisible();
  });

  test.skip('should navigate between stories', async ({ page }) => {
    // TODO: Story navigation buttons not yet implemented in UI
    // Add multiple stories
    const stories = ['Story 1', 'Story 2', 'Story 3'];
    
    for (const story of stories) {
      await page.click('button:has-text("Add Story")');
      await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
      await page.fill('[name="storyTitle"]', story);
      await page.click('button:has-text("Create Story")');
      await page.waitForTimeout(500);
    }
    
    // Navigate to next story
    await page.click('[data-testid="next-story-button"]');
    
    // Verify navigation works
    await expect(page.locator('[data-testid="current-story"]')).toContainText('Story');
  });
});
