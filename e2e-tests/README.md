# Planning Poker E2E Tests

End-to-end tests for the Planning Poker application using Playwright.

## Prerequisites

- Node.js (v16 or higher)
- Running Planning Poker application (frontend and backend)

## Installation

```bash
npm install
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run tests with UI mode (interactive)
```bash
npm run test:ui
```

### Run specific test file
```bash
npx playwright test tests/session.spec.js
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## View Test Reports

After running tests, view the HTML report:
```bash
npm run test:report
```

## Test Structure

- `tests/session.spec.js` - Session creation and joining tests
- `tests/story-management.spec.js` - Story CRUD operations
- `tests/voting.spec.js` - Voting and estimation functionality
- `tests/realtime-collaboration.spec.js` - WebSocket real-time updates
- `tests/analytics.spec.js` - Analytics dashboard tests

## Configuration

Test configuration is in `playwright.config.js`. Key settings:

- **Base URL**: `http://localhost:5173` (frontend dev server)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Reporters**: HTML, JSON, List
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Traces**: Collected on first retry

## Writing Tests

Playwright uses data-testid attributes for reliable element selection. When adding new features, make sure to add appropriate data-testid attributes to your components.

Example:
```jsx
<button data-testid="create-session-button">Create Session</button>
```

Then in tests:
```javascript
await page.click('[data-testid="create-session-button"]');
```

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```bash
# Run tests in CI mode
CI=true npm test
```

CI mode features:
- No parallel test execution
- 2 retries on failure
- Prevents accidentally committed test.only

## Debugging Tips

1. **Use headed mode** to see what's happening:
   ```bash
   npm run test:headed
   ```

2. **Use debug mode** to step through tests:
   ```bash
   npm run test:debug
   ```

3. **Generate tests** using Playwright codegen:
   ```bash
   npm run test:codegen
   ```

4. **View traces** in Playwright Trace Viewer when tests fail

## Environment Variables

- `BASE_URL` - Override base URL (default: http://localhost:5173)
- `CI` - Set to true for CI mode

Example:
```bash
BASE_URL=http://staging.example.com npm test
```

## Best Practices

1. Use `data-testid` attributes for element selection
2. Keep tests independent and isolated
3. Use `beforeEach` for common setup
4. Avoid hardcoded waits, use Playwright's auto-waiting
5. Take advantage of parallel execution
6. Use descriptive test names
7. Group related tests with `test.describe`

## Troubleshooting

### Tests timing out
- Ensure frontend and backend are running
- Check if BASE_URL is correct
- Increase timeout in playwright.config.js if needed

### WebSocket tests failing
- Verify WebSocket connection is working
- Check backend WebSocket endpoint is accessible
- Add appropriate wait times for real-time updates

### Element not found errors
- Verify data-testid attributes are present
- Check if element is visible/enabled
- Use Playwright Inspector to debug selectors
