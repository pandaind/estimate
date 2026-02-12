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
  await page.goto('/');
  await page.fill('[name="sessionName"]', sessionName);
  await page.fill('[name="facilitatorName"]', facilitatorName);
  await page.click('button:has-text("Create Session")');
  await page.waitForURL(/\/session\/.+/);
  
  const url = page.url();
  const sessionId = url.split('/').pop();
  return sessionId;
}

/**
 * Joins an existing planning poker session
 * @param {Page} page - Playwright page object
 * @param {string} sessionId - Session ID to join
 * @param {string} userName - Name of the user joining
 */
export async function joinSession(page, sessionId, userName) {
  await page.goto('/');
  await page.fill('[name="sessionId"]', sessionId);
  await page.fill('[name="userName"]', userName);
  await page.click('button:has-text("Join Session")');
  await page.waitForURL(/\/session\/.+/);
}

/**
 * Adds a new story to the current session
 * @param {Page} page - Playwright page object
 * @param {Object} story - Story details
 * @param {string} story.title - Story title
 * @param {string} story.description - Story description
 */
export async function addStory(page, { title, description = '' }) {
  await page.click('button:has-text("Add Story")');
  await page.fill('[name="storyTitle"]', title);
  if (description) {
    await page.fill('[name="storyDescription"]', description);
  }
  await page.click('button:has-text("Save Story")');
  await expect(page.locator(`text=${title}`)).toBeVisible();
}

/**
 * Casts a vote for the current story
 * @param {Page} page - Playwright page object
 * @param {string|number} value - Estimation value (e.g., 1, 2, 3, 5, 8, 13, 21)
 */
export async function castVote(page, value) {
  await page.click(`[data-testid="estimation-card-${value}"]`);
  await expect(page.locator('[data-testid="your-vote"]')).toContainText(String(value));
}

/**
 * Reveals votes for the current story (facilitator action)
 * @param {Page} page - Playwright page object
 */
export async function revealVotes(page) {
  await page.click('button:has-text("Reveal Votes")');
  await expect(page.locator('[data-testid="voting-results"]')).toBeVisible();
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
  await page.click('[data-testid="analytics-tab"]');
  await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
}

/**
 * Common estimation values (Fibonacci sequence)
 */
export const FIBONACCI_VALUES = [1, 2, 3, 5, 8, 13, 21];

/**
 * Common estimation values (T-shirt sizing)
 */
export const TSHIRT_VALUES = ['XS', 'S', 'M', 'L', 'XL'];
