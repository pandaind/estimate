import { test, expect } from './fixtures.js';
import { addStory, castVote, revealVotes } from './helpers.js';

/**
 * Example tests using custom fixtures
 * These tests demonstrate how to use the session and multiUser fixtures
 */

test.describe('Fixture Examples', () => {
  test('should use session fixture for quick setup', async ({ session, page }) => {
    // Session is already created by the fixture
    expect(session.sessionCode).toBeTruthy();
    
    // Add a story using helper
    await addStory(page, {
      title: 'Test Story',
      description: 'Story created with fixture'
    });
    
    // Verify story is visible
    await expect(page.locator('text=Test Story').first()).toBeVisible();
  });

  test('should use multiUser fixture for collaboration tests', async ({ multiUser }) => {
    const { facilitator, participant1, participant2, sessionCode } = multiUser;
    
    // Verify participant count is visible (should show "3 participants")
    await expect(facilitator.locator('text=participants')).toBeVisible();
    
    // Add a story as facilitator
    await addStory(facilitator, {
      title: 'Multi-user Story',
      description: 'Testing with multiple users'
    });
    
    // Wait for sync
    await facilitator.waitForTimeout(1000);
    
    // All users should see the story
    await expect(participant1.locator('text=Multi-user Story').first()).toBeVisible();
    await expect(participant2.locator('text=Multi-user Story').first()).toBeVisible();
    
    // All users vote
    await castVote(facilitator, 5);
    await castVote(participant1, 5);
    await castVote(participant2, 8);
    
    // Facilitator reveals votes
    await revealVotes(facilitator);
    
    // Navigate facilitator to Results tab to see summary
    await facilitator.click('button:has-text("Results")');
    await facilitator.waitForTimeout(500);
    
    // Facilitator should see results summary
    await expect(facilitator.locator('text=Summary')).toBeVisible();
    
    // Participants should still see the story (votes revealed state depends on session settings)
    await expect(participant1.locator('text=Multi-user Story').first()).toBeVisible();
    await expect(participant2.locator('text=Multi-user Story').first()).toBeVisible();
  });

  test('should handle voting consensus with fixtures', async ({ multiUser }) => {
    const { facilitator, participant1, participant2 } = multiUser;
    
    // Add story
    await addStory(facilitator, { title: 'Consensus Test' });
    await facilitator.waitForTimeout(500);
    
    // Everyone votes the same
    await castVote(facilitator, 8);
    await castVote(participant1, 8);
    await castVote(participant2, 8);
    
    // Reveal and check consensus
    await revealVotes(facilitator);
    
    // Navigate to Results tab to see consensus message
    await facilitator.click('button:has-text("Results")');
    await facilitator.waitForTimeout(500);
    
    // Should show consensus message
    await expect(facilitator.locator('text=Consensus reached')).toBeVisible();
  });

  test('should handle voting divergence', async ({ multiUser }) => {
    const { facilitator, participant1, participant2 } = multiUser;
    
    // Add story
    await addStory(facilitator, { title: 'Divergence Test' });
    await facilitator.waitForTimeout(500);
    
    // Everyone votes differently
    await castVote(facilitator, 3);
    await castVote(participant1, 8);
    await castVote(participant2, 13);
    
    // Reveal and check for re-discussion indicator
    await revealVotes(facilitator);
    
    // Navigate to Results tab to see distribution
    await facilitator.click('button:has-text("Results")');
    await facilitator.waitForTimeout(500);
    
    // Should show distribution of votes
    await expect(facilitator.locator('text=Distribution')).toBeVisible();
  });
});
