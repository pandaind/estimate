import { test, expect } from '@playwright/test';

test.describe('Story Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create a session before each test
    await page.goto('/');
    await page.fill('[name="sessionName"]', 'Story Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    await page.click('button:has-text("Create Session")');
    await page.waitForURL(/\/session\/.+/);
  });

  test('should add a new story to the session', async ({ page }) => {
    // Click add story button
    await page.click('button:has-text("Add Story")');
    
    // Fill in story details
    await page.fill('[name="storyTitle"]', 'User Authentication');
    await page.fill('[name="storyDescription"]', 'Implement user login and registration');
    
    // Submit story
    await page.click('button:has-text("Save Story")');
    
    // Verify story appears in the list
    await expect(page.locator('text=User Authentication')).toBeVisible();
  });

  test('should edit an existing story', async ({ page }) => {
    // Add a story first
    await page.click('button:has-text("Add Story")');
    await page.fill('[name="storyTitle"]', 'Original Title');
    await page.fill('[name="storyDescription"]', 'Original description');
    await page.click('button:has-text("Save Story")');
    
    // Click edit button
    await page.click('[data-testid="edit-story-button"]');
    
    // Update story
    await page.fill('[name="storyTitle"]', 'Updated Title');
    await page.click('button:has-text("Save Changes")');
    
    // Verify update
    await expect(page.locator('text=Updated Title')).toBeVisible();
    await expect(page.locator('text=Original Title')).not.toBeVisible();
  });

  test('should delete a story', async ({ page }) => {
    // Add a story first
    await page.click('button:has-text("Add Story")');
    await page.fill('[name="storyTitle"]', 'Story to Delete');
    await page.fill('[name="storyDescription"]', 'This will be deleted');
    await page.click('button:has-text("Save Story")');
    
    // Delete the story
    await page.click('[data-testid="delete-story-button"]');
    await page.click('button:has-text("Confirm")');
    
    // Verify story is removed
    await expect(page.locator('text=Story to Delete')).not.toBeVisible();
  });

  test('should navigate between stories', async ({ page }) => {
    // Add multiple stories
    const stories = ['Story 1', 'Story 2', 'Story 3'];
    
    for (const story of stories) {
      await page.click('button:has-text("Add Story")');
      await page.fill('[name="storyTitle"]', story);
      await page.click('button:has-text("Save Story")');
    }
    
    // Navigate to next story
    await page.click('[data-testid="next-story-button"]');
    
    // Verify navigation works
    await expect(page.locator('[data-testid="current-story"]')).toContainText('Story');
  });
});
