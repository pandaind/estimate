import { test, expect } from '@playwright/test';

test.describe('Story Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create a session before each test
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="btn-create-session"]', { state: 'visible' });
    await page.click('[data-testid="btn-create-session"]');
    await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
    await page.fill('[name="sessionName"]', 'Story Test Session');
    await page.fill('[name="facilitatorName"]', 'Test Facilitator');
    
    // Submit form directly — bypasses click event propagation that stalls under CPU load
    await expect(async () => {
      await page.locator('[data-testid="btn-submit-create-session"]').evaluate(btn => btn.closest('form').requestSubmit());
      await expect(page).toHaveURL(/\/session\//);
    }).toPass({ timeout: 45000 });
    await page.waitForSelector('[data-testid="btn-leave-session"]', { state: 'visible', timeout: 15000 });
    
    // Navigate to Stories tab
    await page.click('[data-testid="tab-stories"]');
    await page.waitForTimeout(500); // Wait for tab transition
  });

  test('should add a new story to the session', async ({ page }) => {
    // Click add story button
    await page.click('[data-testid="btn-add-story"]');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    
    // Fill in story details
    await page.fill('[name="storyTitle"]', 'User Authentication');
    await page.fill('[name="storyDescription"]', 'Implement user login and registration');
    
    // Submit story
    await page.click('[data-testid="btn-create-story"]');
    
    // Verify story appears in the list
    await expect(page.locator('text=User Authentication').first()).toBeVisible();
  });

  test('should edit an existing story', async ({ page }) => {
    // Add a story first
    await page.click('[data-testid="btn-add-story"]');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    await page.fill('[name="storyTitle"]', 'Original Title');
    await page.fill('[name="storyDescription"]', 'Original description');
    await page.click('[data-testid="btn-create-story"]');
    await expect(page.locator('text=Original Title').first()).toBeVisible({ timeout: 10000 });
    
    // Get the story's edit button (first one in the list)
    const editButton = page.locator('[data-testid^="btn-edit-story-"]').first();
    await editButton.click();
    
    // Wait for the StoryEditor modal to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Clear and update title
    const titleInput = page.locator('[role="dialog"] input[type="text"]').first();
    await titleInput.clear();
    await titleInput.fill('Updated Title');
    
    // Submit the edit form
    await page.locator('[role="dialog"] button[type="submit"]').click();
    
    // Verify update — modal closes and new title is visible
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Updated Title').first()).toBeVisible({ timeout: 10000 });
  });

  test('should delete a story', async ({ page }) => {
    // Add a story first
    await page.click('[data-testid="btn-add-story"]');
    await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
    await page.fill('[name="storyTitle"]', 'Story to Delete');
    await page.fill('[name="storyDescription"]', 'This will be deleted');
    await page.click('[data-testid="btn-create-story"]');
    await expect(page.locator('text=Story to Delete').first()).toBeVisible({ timeout: 10000 });
    
    // Click delete button on the story
    const deleteButton = page.locator('[data-testid^="btn-delete-story-"]').first();
    await deleteButton.click();
    
    // Confirm deletion in the dialog
    await page.waitForSelector('[data-testid="btn-confirm-delete"]', { state: 'visible' });
    await page.click('[data-testid="btn-confirm-delete"]');
    
    // Verify story is removed
    await expect(page.locator('text=Story to Delete')).not.toBeVisible({ timeout: 10000 });
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
