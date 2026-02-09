# Playwright Quick Reference

Quick reference guide for common Playwright operations in Planning Poker E2E tests.

## Basic Navigation

```javascript
// Go to URL
await page.goto('/');
await page.goto('http://localhost:5173/session/abc123');

// Wait for URL pattern
await page.waitForURL(/\/session\/.+/);
```

## Locators and Interactions

```javascript
// Click elements
await page.click('button:has-text("Create Session")');
await page.click('[data-testid="create-button"]');
await page.click('.my-class');

// Fill inputs
await page.fill('[name="sessionName"]', 'My Session');
await page.fill('input[type="text"]', 'value');

// Get text content
const text = await page.locator('[data-testid="session-code"]').textContent();

// Check visibility
await expect(page.locator('text=Welcome')).toBeVisible();
await expect(page.locator('[data-testid="error"]')).not.toBeVisible();
```

## Assertions

```javascript
// URL assertions
await expect(page).toHaveURL(/\/session\/.+/);
await expect(page).toHaveURL('http://localhost:5173/');

// Element visibility
await expect(page.locator('text=Session Created')).toBeVisible();
await expect(page.locator('[data-testid="loading"]')).not.toBeVisible();

// Text content
await expect(page.locator('h1')).toContainText('Planning Poker');
await expect(page.locator('[data-testid="count"]')).toHaveText('5');

// CSS classes
await expect(page.locator('[data-testid="card"]')).toHaveClass(/selected/);
await expect(page.locator('.button')).not.toHaveClass('disabled');

// Attributes
await expect(page.locator('input')).toHaveAttribute('disabled');
await expect(page.locator('button')).toHaveAttribute('type', 'submit');
```

## Working with Multiple Elements

```javascript
// Get all matching elements
const cards = await page.locator('[data-testid^="estimation-card-"]').all();

// Count elements
const count = await page.locator('.participant').count();
expect(count).toBe(3);

// Loop through elements
const participants = await page.locator('[data-testid="participant"]').all();
for (const participant of participants) {
  const name = await participant.textContent();
  console.log(name);
}
```

## Multi-Page/Multi-User Testing

```javascript
// Create new page in same context (shares cookies/storage)
const page2 = await context.newPage();
await page2.goto('/');

// Close page
await page2.close();
```

## Waiting Strategies

```javascript
// Wait for element
await page.waitForSelector('[data-testid="results"]');
await page.waitForSelector('.loading', { state: 'hidden' });

// Wait for timeout (use sparingly!)
await page.waitForTimeout(1000);

// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for function to return truthy
await page.waitForFunction(() => document.querySelector('.ready'));
```

## Data Test IDs

Always prefer `data-testid` attributes for stable selectors:

```jsx
// In component
<button data-testid="create-session-button">Create</button>

// In test
await page.click('[data-testid="create-session-button"]');
```

## Common Patterns

### Create and verify session
```javascript
await page.goto('/');
await page.fill('[name="sessionName"]', 'Test');
await page.fill('[name="facilitatorName"]', 'Facilitator');
await page.click('button:has-text("Create Session")');
await page.waitForURL(/\/session\/.+/);
const sessionId = page.url().split('/').pop();
```

### Join session from another user
```javascript
const page2 = await context.newPage();
await page2.goto('/');
await page2.fill('[name="sessionId"]', sessionId);
await page2.fill('[name="userName"]', 'Participant');
await page2.click('button:has-text("Join Session")');
```

### Vote and reveal
```javascript
await page.click('[data-testid="estimation-card-5"]');
await page.click('button:has-text("Reveal Votes")');
await expect(page.locator('[data-testid="voting-results"]')).toBeVisible();
```

## Debugging

```javascript
// Pause test execution
await page.pause();

// Screenshot
await page.screenshot({ path: 'screenshot.png' });

// Console log
page.on('console', msg => console.log('Browser:', msg.text()));

// Show browser during test
// Run with: npx playwright test --headed

// Debug mode
// Run with: npx playwright test --debug
```

## Test Organization

```javascript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test code
  });

  test('should do something else', async ({ page }) => {
    // Test code
  });
});
```

## Custom Fixtures

```javascript
import { test } from './fixtures.js';

test('my test', async ({ session, page }) => {
  // session fixture provides sessionId and sessionUrl
  console.log(session.sessionId);
});
```

## Useful CLI Commands

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test session.spec.js

# Run in headed mode
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run in UI mode
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium

# Show report
npx playwright show-report

# Generate tests (record actions)
npx playwright codegen http://localhost:5173
```

## Best Practices

1. **Use data-testid**: More stable than CSS classes or text
2. **Avoid hardcoded waits**: Use Playwright's auto-waiting
3. **Keep tests independent**: Each test should work standalone
4. **Use fixtures**: Reduce code duplication
5. **Page Object Model**: For complex pages, consider page objects
6. **Descriptive names**: Test names should describe behavior
7. **Clean assertions**: One logical assertion per test
8. **Handle flakiness**: Use proper waits, not timeouts

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
