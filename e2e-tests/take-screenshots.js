const { chromium } = require('@playwright/test');

const SCREENSHOT_DIR = '../screenshots';
const VIEWPORT = { width: 1440, height: 900 };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: 'dark',
  });

  // Set dark mode preference in localStorage before navigating
  await context.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
  });

  const page = await context.newPage();

  // Helper to take a screenshot
  const screenshot = async (name) => {
    await page.waitForTimeout(500); // let animations settle
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}`, fullPage: false });
    console.log(`✅ ${name}`);
  };

  // ─── 1. Home / Landing Page ───────────────────────────────────────────
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  // Ensure dark class is applied
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await screenshot('01-home-dark.png');

  // ─── 2. Create Session Page ───────────────────────────────────────────
  await page.click('[data-testid="btn-create-session"]');
  await page.waitForSelector('[name="sessionName"]', { state: 'visible' });
  // Fill in sample data for a realistic screenshot
  await page.fill('[name="sessionName"]', 'Sprint 24 Planning');
  await page.fill('[name="facilitatorName"]', 'Sarah Chen');
  await screenshot('02-create-session-dark.png');

  // ─── 3. Actually create the session ───────────────────────────────────
  await page.locator('[data-testid="btn-submit-create-session"]').evaluate(btn =>
    btn.closest('form').requestSubmit()
  );
  await page.waitForURL(/\/session\//, { timeout: 30000 });
  await page.waitForSelector('[data-testid="btn-leave-session"]', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Ensure dark mode is still active in session
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });

  // ─── 4. Session Dashboard (empty) ─────────────────────────────────────
  await screenshot('03-session-dashboard-dark.png');

  // ─── 5. Navigate to Stories tab and add stories ───────────────────────
  await page.click('[data-testid="tab-stories"]');
  await page.waitForTimeout(500);
  
  // Create Story 1
  await page.click('[data-testid="btn-add-story"]');
  await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
  await page.fill('[name="storyTitle"]', 'User Authentication & SSO Integration');
  await page.fill('[name="storyDescription"]', 'Implement OAuth2 login with Google and GitHub providers');
  await page.click('[data-testid="btn-create-story"]');
  await page.waitForTimeout(1000);

  // Create Story 2
  await page.click('[data-testid="btn-add-story"]');
  await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
  await page.fill('[name="storyTitle"]', 'Dashboard Performance Optimization');
  await page.fill('[name="storyDescription"]', 'Reduce initial load time from 3.2s to under 1s');
  await page.click('[data-testid="btn-create-story"]');
  await page.waitForTimeout(1000);

  // Create Story 3
  await page.click('[data-testid="btn-add-story"]');
  await page.waitForSelector('[name="storyTitle"]', { state: 'visible' });
  await page.fill('[name="storyTitle"]', 'Real-time Notification System');
  await page.fill('[name="storyDescription"]', 'Push notifications for mentions, assignments, and deadlines');
  await page.click('[data-testid="btn-create-story"]');
  await page.waitForTimeout(1000);

  await screenshot('04-story-backlog-dark.png');

  // ─── 6. Edit Story Modal ──────────────────────────────────────────────
  const editBtn = page.locator('[data-testid^="btn-edit-story-"]').first();
  await editBtn.click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  await page.waitForTimeout(500);
  await screenshot('05-edit-story-dark.png');
  
  // Close the modal
  await page.locator('[role="dialog"] button[aria-label="Close"]').click();
  await page.waitForTimeout(300);

  // ─── 7. Activate a story for voting ───────────────────────────────────
  const activateBtn = page.locator('[data-testid^="btn-activate-story-"]').first();
  await activateBtn.click();
  await page.waitForTimeout(1000);

  // ─── 8. Estimate tab — Estimation Cards ─────────────────────────────
  await page.click('[data-testid="tab-estimate"]');
  await page.waitForTimeout(1000);
  await screenshot('06-voting-cards-dark.png');

  // ─── 9. Cast a vote (if moderator can vote) ───────────────────────────
  // Moderator's cards may be disabled if moderatorCanVote=false
  const card5 = page.locator('button:has-text("5")').first();
  const isEnabled = await card5.isEnabled().catch(() => false);
  if (isEnabled) {
    await card5.click();
    await page.waitForTimeout(500);
    await screenshot('07-vote-cast-dark.png');
  } else {
    console.log('⏭️  Skipping vote-cast (moderator cannot vote)');
  }

  // ─── 10. Results tab ──────────────────────────────────────────────
  await page.click('[data-testid="tab-results"]');
  await page.waitForTimeout(500);
  await screenshot('08-results-dark.png');

  // ─── 11. Back to stories, try to reveal votes ────────────────────
  await page.click('[data-testid="tab-stories"]');
  await page.waitForTimeout(500);
  
  // Try reveal button if available
  const revealBtn = page.locator('[data-testid^="btn-reveal-votes"]').first();
  if (await revealBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await revealBtn.click();
    await page.waitForTimeout(1000);
    await screenshot('09-votes-revealed-dark.png');
  }

  // ─── 12. Analytics tab ────────────────────────────────────────────────
  await page.click('[data-testid="tab-analytics"]');
  await page.waitForTimeout(1500);
  await screenshot('10-analytics-dark.png');

  // ─── 13. Join Session page (separate flow) ────────────────────────────
  const page2 = await context.newPage();
  await page2.goto('http://localhost:5173/join', { waitUntil: 'networkidle' });
  await page2.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await page2.waitForTimeout(500);
  await page2.screenshot({ path: `${SCREENSHOT_DIR}/11-join-session-dark.png`, fullPage: false });
  console.log('✅ 11-join-session-dark.png');
  await page2.close();

  // ─── 14. Delete Story confirmation dialog ─────────────────────────────
  await page.click('[data-testid="tab-stories"]');
  await page.waitForTimeout(500);
  const deleteBtn = page.locator('[data-testid^="btn-delete-story-"]').first();
  if (await deleteBtn.isVisible()) {
    await deleteBtn.click();
    await page.waitForSelector('[data-testid="btn-confirm-delete"]', { state: 'visible' });
    await page.waitForTimeout(300);
    await screenshot('12-delete-confirm-dark.png');
    // Cancel — don't actually delete
    await page.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(300);
  }

  await browser.close();
  console.log('\n🎉 All screenshots captured!');
})();
