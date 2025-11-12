# Playwright Test Automation for ChopChop API Dashboard

This directory contains automated end-to-end tests for the ChopChop API test dashboard using Playwright.

## Setup

1. **Install Playwright**:
```powershell
npm install --save-dev @playwright/test
npx playwright install
```

2. **Install dependencies**:
```powershell
npm install
```

## Running Tests

### Run all tests:
```powershell
npx playwright test
```

### Run tests with UI mode (recommended for debugging):
```powershell
npx playwright test --ui
```

### Run tests in headed mode (see browser):
```powershell
npx playwright test --headed
```

### Run specific test file:
```powershell
npx playwright test tests/dashboard.spec.js
```

### Debug tests:
```powershell
npx playwright test --debug
```

### View test report:
```powershell
npx playwright show-report
```

## Test Structure

### `tests/dashboard.spec.js`

Contains two test suites:

#### 1. **Dashboard UI Tests**
- Tests the test dashboard interface
- Authenticates using Firebase ID token
- Runs tests through the UI
- Validates test results

Tests include:
- Query Restaurants
- View Orders
- Place Order
- Update Order Status
- Webhook Update
- View Order Details
- Test Summary Display

#### 2. **Direct API Tests**
- Bypasses the dashboard
- Makes direct GraphQL API calls
- Validates responses programmatically

Tests include:
- Place Order via GraphQL
- Update Order Status via GraphQL

## Prerequisites

Before running tests:

1. **API server must be running** on `localhost:4000`
2. **Test dashboard server must be running** on `localhost:3000`
3. **Firebase authentication must be configured**
4. **Auth token must be obtainable** via `get-auth-token.js`

The Playwright config will automatically start these servers if they're not running.

## Configuration

Edit `playwright-config.js` to customize:
- Test directory
- Number of workers
- Retry strategy
- Browsers to test
- Screenshots/video recording
- Server startup commands

## Notes

### Limitations

1. **Prompt-based tests**: Some dashboard tests use browser `prompt()` dialogs which are harder to automate. Consider modifying the dashboard to accept test parameters via URL or localStorage.

2. **Token expiry**: Firebase ID tokens expire after 1 hour. Tests may fail if tokens expire during execution.

3. **Test data**: Tests create real data in Firebase. Consider using a test database or implementing cleanup.

### Improvements

For better automation:

1. **Modify dashboard tests** to accept parameters instead of prompts:
```javascript
// Instead of:
const orderId = prompt('Enter Order ID');

// Use:
const orderId = sessionStorage.getItem('testOrderId') || prompt('Enter Order ID');
```

2. **Add cleanup**:
```javascript
test.afterAll(async () => {
  // Delete test orders
});
```

3. **Use test-specific vendor IDs** to isolate test data

## Example Test Run

```powershell
PS C:\...\enatega\api> npx playwright test

Running 8 tests using 1 worker

  ✓  1 should query restaurants successfully (2.5s)
  ✓  2 should view orders successfully (1.8s)
  ✓  3 should place order with MenuVerse vendor ID (3.2s)
  ✓  4 should simulate webhook update (2.1s)
  ✓  5 should view order details (1.9s)
  ✓  6 should display test summary (20.5s)
  ✓  7 should place order via direct GraphQL call (1.2s)
  ✓  8 should update order status via direct GraphQL call (1.5s)

  8 passed (35s)

To open last HTML report run:
  npx playwright show-report
```

## Troubleshooting

### "Auth token not obtained"
- Ensure `get-auth-token.js` is working
- Check Firebase configuration
- Verify test user exists

### "Timeout waiting for..."
- Increase timeout in test config
- Check if servers are running
- Verify network connectivity

### "Element not found"
- Dashboard HTML might have changed
- Update selectors in test file
- Run in headed mode to debug

## CI/CD Integration

For GitHub Actions or similar:

```yaml
- name: Run Playwright tests
  run: |
    npm install
    npx playwright install --with-deps
    npx playwright test
```

Set `CI=true` environment variable to enable:
- Stricter test execution
- Automatic retries
- No server reuse
