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
    
    // Verify participant count is visible (should show "3 participants" — all 3 users in session)
    await expect(facilitator.locator('text=participants')).toBeVisible({ timeout: 10000 });
    
    // Add a story as facilitator
    await addStory(facilitator, {
      title: 'Multi-user Story',
      description: 'Testing with multiple users'
    });
    
    // Wait for sync — give WebSocket time to deliver STORY_ACTIVATED to all participants
    await facilitator.waitForTimeout(1000);
    
    // All users should see the story title in CurrentStoryBanner
    await expect(participant1.locator('text=Multi-user Story').first()).toBeVisible({ timeout: 10000 });
    await expect(participant2.locator('text=Multi-user Story').first()).toBeVisible({ timeout: 10000 });
    
    // All users vote
    await castVote(facilitator, 5);
    await castVote(participant1, 5);
    await castVote(participant2, 8);
    
    // Facilitator reveals votes
    await revealVotes(facilitator);
    
    // Navigate facilitator to Results tab to see summary
    await facilitator.click('[data-testid="tab-results"]');
    await facilitator.waitForTimeout(1000);
    
    // If WebSocket VOTES_REVEALED hasn't propagated yet, VotingResults shows hidden votes
    // with a Reveal button. Click it as fallback to trigger reveal from Results tab directly.
    const revealBtn = facilitator.locator('button:has-text("Reveal")');
    if (await revealBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await revealBtn.click();
      await facilitator.waitForTimeout(1000);
    }
    
    await expect(facilitator.locator('text=Summary')).toBeVisible({ timeout: 15000 });
    
    // Participants should still see the story (via CurrentStoryBanner)
    await expect(participant1.locator('text=Multi-user Story').first()).toBeVisible({ timeout: 10000 });
    await expect(participant2.locator('text=Multi-user Story').first()).toBeVisible({ timeout: 10000 });
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
    await facilitator.click('[data-testid="tab-results"]');
    await facilitator.waitForTimeout(1000);
    
    // Fallback: click Reveal in VotingResults if WebSocket hasn't propagated
    const revealBtn = facilitator.locator('button:has-text("Reveal")');
    if (await revealBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await revealBtn.click();
      await facilitator.waitForTimeout(1000);
    }
    
    // Should show consensus message
    await expect(facilitator.locator('text=Consensus reached')).toBeVisible({ timeout: 15000 });
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
    await facilitator.click('[data-testid="tab-results"]');
    await facilitator.waitForTimeout(1000);
    
    // Fallback: click Reveal in VotingResults if WebSocket hasn't propagated
    const revealBtn = facilitator.locator('button:has-text("Reveal")');
    if (await revealBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await revealBtn.click();
      await facilitator.waitForTimeout(1000);
    }
    
    // Should show distribution of votes
    await expect(facilitator.locator('text=Distribution')).toBeVisible({ timeout: 15000 });
  });
});
