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
  await page.waitForSelector('button:has-text("Create Session")', { state: 'visible' });
  await page.click('button:has-text("Create Session")');
  await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
  await page.fill('[name="sessionName"]', sessionName);
  await page.fill('[name="facilitatorName"]', facilitatorName);
  
  // Enable moderator voting
  await page.check('#moderatorCanVote');
  await page.waitForTimeout(200);
  
  await page.click('button:has-text("Create Session")');
  
  // Wait for session view to load (app uses state-based routing, not URL routing)
  await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
  
  // Get session code from the displayed button (format: button contains only the code)
  const sessionCodeButton = page.locator('button:has-text("Code:")').locator('..').locator('button').nth(0);
  const sessionCode = await sessionCodeButton.textContent();
  // Remove any non-alphanumeric characters (like icons)
  return sessionCode.trim().replace(/[^A-Z0-9]/g, '');
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
  await page.waitForSelector('button:has-text("Join Session")', { state: 'visible' });
  await page.click('button:has-text("Join Session")');
  await page.waitForSelector('[name="sessionId"]', { state: 'visible' });
  await page.fill('[name="sessionId"]', sessionId);
  await page.fill('[name="userName"]', userName);
  await page.click('button:has-text("Join Session")');
  
  // Wait for session view to load (app uses state-based routing, not URL routing)
  await page.waitForSelector('button:has-text("Leave")', { state: 'visible', timeout: 10000 });
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
  await page.click('button:has-text("Stories")');
  await page.waitForTimeout(500); // Wait for tab transition
  
  await page.click('button:has-text("Add Story")');
  // Wait for the create form to appear
  await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
  
  await page.fill('[name="storyTitle"]', title);
  if (description) {
    await page.fill('[name="storyDescription"]', description);
  }
  await page.click('button:has-text("Create Story")');
  await page.waitForTimeout(500); // Wait for story to be created
  await expect(page.locator(`text=${title}`)).toBeVisible();
  
  // Activate the story for voting
  await page.click('button:has-text("Activate for Voting")');
  await page.waitForTimeout(500); // Wait for activation
  
  // Navigate back to Estimate tab for voting
  await page.click('button:has-text("Estimate")');
  await page.waitForTimeout(500); // Wait for tab transition
}

/**
 * Casts a vote for the current story
 * @param {Page} page - Playwright page object
 * @param {string|number} value - Estimation value (e.g., 1, 2, 3, 5, 8, 13, 21)
 */
export async function castVote(page, value) {
  // Click the estimation card - should be enabled if moderator can vote
  await page.click(`[aria-label="Vote ${value} points"]`, { timeout: 10000 });
  await page.waitForTimeout(500);
}

/**
 * Reveals votes for the current story (facilitator action)
 * Must be called from Stories tab where the Reveal Votes button is located
 * @param {Page} page - Playwright page object
 */
export async function revealVotes(page) {
  // Navigate to Stories tab where Reveal Votes button is
  await page.click('button:has-text("Stories")');
  await page.waitForTimeout(500);
  
  await page.click('button:has-text("Reveal Votes")');
  await page.waitForTimeout(500); // Wait for votes to be revealed
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
