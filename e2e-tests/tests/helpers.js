import { expect } from '@playwright/test';

/**
 * Helper utilities for Planning Poker E2E tests
 */

/**
 * Creates a new planning poker session
 * @param {Page} page - Playwright page object
 * @param {Object} options - Session options
 * @param {string} options.sessionName - Name of the session
 * @param {string} options.facilitatorName - Name of the facilitator
 * @returns {Promise<string>} Session ID
 */
export async function createSession(page, { sessionName = 'Test Session', facilitatorName = 'Test Facilitator' } = {}) {
  await page.goto('/', { waitUntil: 'networkidle' });
  // Wait for the landing page to load and click the "Create Session" button
  await page.waitForSelector('[data-testid="btn-create-session"]', { state: 'visible' });
  await page.click('[data-testid="btn-create-session"]');
  await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
  await page.fill('[name="sessionName"]', sessionName);
  await page.fill('[name="facilitatorName"]', facilitatorName);
  
  // Enable moderator voting
  await page.check('#moderatorCanVote');
  await page.waitForTimeout(200);
  
  // Submit form directly — bypasses click event propagation that stalls under CPU load
  await expect(async () => {
    await page.locator('[data-testid="btn-submit-create-session"]').evaluate(btn => btn.closest('form').requestSubmit());
    await expect(page).toHaveURL(/\/session\//);
  }).toPass({ timeout: 45000 });

  // Extract session code directly from the URL (reliable with React Router)
  return page.url().split('/session/')[1];
}

/**
 * Joins an existing planning poker session
 * @param {Page} page - Playwright page object
 * @param {string} sessionId - Session ID to join
 * @param {string} userName - Name of the user joining
 */
export async function joinSession(page, sessionId, userName) {
  await page.goto('/', { waitUntil: 'networkidle' });
  // Wait for the landing page to load and click the "Join Session" button
  await page.waitForSelector('[data-testid="btn-join-session"]', { state: 'visible' });
  await page.click('[data-testid="btn-join-session"]');
  await page.waitForSelector('[name="sessionId"]', { state: 'visible' });
  await page.fill('[name="sessionId"]', sessionId);
  await page.fill('[name="userName"]', userName);
  await page.click('[data-testid="btn-submit-join-session"]');
  
  // Wait for session view to load (app uses state-based routing, not URL routing)
  await page.waitForSelector('[data-testid="btn-leave-session"]', { state: 'visible', timeout: 20000 });
}

/**
 * Adds a new story to the current session
 * @param {Page} page - Playwright page object
 * @param {Object} story - Story details
 * @param {string} story.title - Story title
 * @param {string} story.description - Story description
 */
export async function addStory(page, { title, description = '' }) {
  // Navigate to Stories tab if not already there
  await page.click('[data-testid="tab-stories"]');
  await page.waitForTimeout(500); // Wait for tab transition
  
  await page.click('[data-testid="btn-add-story"]');
  // Wait for the create form to appear
  await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
  
  await page.fill('[name="storyTitle"]', title);
  if (description) {
    await page.fill('[name="storyDescription"]', description);
  }
  await page.click('[data-testid="btn-create-story"]');
  await page.waitForTimeout(500); // Wait for story to be created
  await expect(page.locator(`text=${title}`)).toBeVisible();
  
  // Activate the story for voting
  await page.click('button:has-text("Activate for Voting")');
  await page.waitForTimeout(1000); // Wait for activation + WebSocket STORY_ACTIVATED
  
  // Navigate back to Estimate tab for voting
  await page.click('[data-testid="tab-estimate"]');
  // Wait for voting cards to actually appear — confirms currentStory is set and
  // EstimationCards has rendered. This is more reliable than a fixed timeout.
  await page.waitForSelector('[aria-label$="points"]', { state: 'visible', timeout: 15000 });
}

/**
 * Casts a vote for the current story
 * Waits for the vote API response to ensure the vote is persisted before continuing.
 * @param {Page} page - Playwright page object
 * @param {string|number} value - Estimation value (e.g., 1, 2, 3, 5, 8, 13, 21)
 */
export async function castVote(page, value) {
  // Set up response watcher BEFORE click to capture the POST /votes response
  const voteResponsePromise = page.waitForResponse(
    resp => resp.url().includes('/votes') && resp.request().method() === 'POST',
    { timeout: 10000 }
  );
  await page.click(`[aria-label="Vote ${value} points"]`, { timeout: 10000 });
  // Wait for the API call to complete — ensures vote is saved before proceeding
  await voteResponsePromise;
  await page.waitForTimeout(200); // Brief buffer for React state update
}

/**
 * Reveals votes for the current story (facilitator action)
 * The actual Reveal Votes button is btn-reveal-votes-{id} in StoryList on the Stories tab.
 * It only appears when the story is active and has at least one vote.
 * @param {Page} page - Playwright page object
 */
export async function revealVotes(page) {
  // Navigate to Stories tab where btn-reveal-votes-{id} lives
  await page.click('[data-testid="tab-stories"]');
  // Wait for the reveal button to appear — it only shows when storyVotes.length > 0
  await page.waitForSelector('[data-testid^="btn-reveal-votes-"]', { state: 'visible', timeout: 15000 });
  // Wait for the reveal API response to confirm the backend processed it
  const revealResponsePromise = page.waitForResponse(
    resp => resp.url().includes('/reveal') && resp.request().method() === 'POST',
    { timeout: 10000 }
  );
  await page.click('[data-testid^="btn-reveal-votes-"]');
  await revealResponsePromise; // Ensures backend confirmed reveal before checking WebSocket updates
  await page.waitForTimeout(300); // Brief buffer for WebSocket VOTES_REVEALED to propagate
}

/**
 * Waits for a WebSocket message/update
 * @param {Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds (default: 2000)
 */
export async function waitForWebSocketUpdate(page, timeout = 2000) {
  await page.waitForTimeout(timeout);
}

/**
 * Gets the list of participants in the session
 * @param {Page} page - Playwright page object
 * @returns {Promise<string[]>} Array of participant names
 */
export async function getParticipants(page) {
  const participantElements = await page.locator('[data-testid="participant-list"] [data-testid^="participant-"]').all();
  const participants = await Promise.all(
    participantElements.map(el => el.textContent())
  );
  return participants;
}

/**
 * Validates that a session is active and displays expected elements
 * @param {Page} page - Playwright page object
 * @param {string} sessionName - Expected session name
 */
export async function validateSessionActive(page, sessionName) {
  await expect(page).toHaveURL(/\/session\/.+/);
  await expect(page.locator(`text=${sessionName}`)).toBeVisible();
  await expect(page.locator('[data-testid="participant-list"]')).toBeVisible();
}

/**
 * Navigates to analytics dashboard
 * @param {Page} page - Playwright page object
 */
export async function navigateToAnalytics(page) {
  await page.click('button:has-text("Analytics")');
  await page.waitForTimeout(500);
}

/**
 * Common estimation values (Fibonacci sequence)
 */
export const FIBONACCI_VALUES = [1, 2, 3, 5, 8, 13, 21];

/**
 * Common estimation values (T-shirt sizing)
 */
export const TSHIRT_VALUES = ['XS', 'S', 'M', 'L', 'XL'];
