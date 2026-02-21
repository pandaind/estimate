# Screenshots

These screenshots are automatically extracted from Playwright E2E test executions.

## How to Regenerate

1. **Enable screenshots in Playwright config:**
   ```javascript
   // e2e-tests/playwright.config.js
   screenshot: 'on'  // Change from 'only-on-failure'
   ```

2. **Run specific tests:**
   ```bash
   cd e2e-tests
   rm -rf test-results/
   npx playwright test session.spec.js voting.spec.js analytics.spec.js --project=chromium --workers=1
   ```

3. **Extract screenshots:**
   ```bash
   # Copy desired screenshots from test-results/ to screenshots/
   find test-results -name "*.png" -type f
   ```

4. **Restore config:**
   ```javascript
   screenshot: 'only-on-failure'  // Restore default
   ```

## Current Screenshots

| File | Description | Source Test |
|------|-------------|-------------|
| `01-create-session.png` | Session creation page | session.spec.js |
| `02-session-dashboard.png` | Main dashboard view | session.spec.js |
| `03-voting-cards.png` | Estimation cards | voting.spec.js |
| `04-voting-results.png` | Vote reveal results | voting.spec.js |
| `05-analytics-dashboard.png` | Analytics overview | analytics.spec.js |
| `06-voting-distribution.png` | Voting distribution chart | analytics.spec.js |

---

*Last updated: February 21, 2026*
