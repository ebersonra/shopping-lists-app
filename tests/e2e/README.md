# E2E Tests

This directory contains end-to-end tests for the Shopping Lists application using Playwright.

## Setup

Tests are already configured. Playwright was installed as a dev dependency:

```bash
npm install
```

## Running Tests

```bash
# Run all e2e tests (headless)
npm run test:e2e

# Run tests and see the browser
npm run test:e2e:headed

# Run tests in UI mode (interactive)
npm run test:e2e:ui
```

## Test Files

### `navigation.spec.js`

Tests all navigation flows in the application:

- Welcome page to Shopping Lists (form submission)
- Welcome page to Shopping Lists (skip button)
- Page persistence with valid user data
- Redirect to welcome when no user data exists
- Navigation between different pages
- Protection of authenticated routes

## Writing New Tests

Create new test files in this directory with the `.spec.js` extension:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/src/pages/my-page.html');
  });

  test('should do something', async ({ page }) => {
    // Your test code
    await page.click('#myButton');
    expect(page.url()).toContain('expected-page.html');
  });
});
```

## Best Practices

1. **Clear localStorage** before each test to ensure clean state
2. **Use descriptive test names** that explain what is being tested
3. **Test user flows** not implementation details
4. **Wait for navigation** with `waitForURL()` instead of timeouts
5. **Use data-testid** attributes for more stable selectors (future improvement)

## Configuration

Test configuration is in `playwright.config.js` at the root level.

Key settings:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Reporter**: HTML (generates visual report)
- **Web Server**: Automatically starts `npm start` before tests

## Debugging Tests

Use UI mode for the best debugging experience:

```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:

- Step through tests
- See page screenshots at each step
- Replay failed tests
- Debug with browser DevTools

## CI/CD

Tests are configured to run in CI with:

- 2 retries on failure
- Single worker to avoid race conditions
- Traces captured on first retry for debugging

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Best Practices](https://playwright.dev/docs/best-practices)
