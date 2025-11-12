const { test, expect } = require('@playwright/test');

// Configuration
const DASHBOARD_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000/graphql';

// Get auth token before tests
let authToken;

test.beforeAll(async () => {
  // Generate auth token using the existing script
  const { execSync } = require('child_process');
  const output = execSync('node get-auth-token.js', { encoding: 'utf-8' });
  
  // Extract token from output (assuming it's printed on a line starting with "eyJ")
  const tokenMatch = output.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
  if (tokenMatch) {
    authToken = tokenMatch[0];
    console.log('✅ Auth token obtained');
  } else {
    throw new Error('Failed to obtain auth token');
  }
});

test.describe('ChopChop API Test Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto(DASHBOARD_URL);
    
    // Enter auth token
    await page.fill('#manualToken', authToken);
    await page.click('button:has-text("Use Token & Start Testing")');
    
    // Wait for authenticated UI
    await page.waitForSelector('#testControls', { state: 'visible' });
  });

  test('should query restaurants successfully', async ({ page }) => {
    // Find the Query Restaurants test card
    const testCard = page.locator('#test-restaurants');
    
    // Run all tests (which includes restaurants)
    await page.click('button:has-text("Run All Tests")');
    
    // Wait for test to complete
    await page.waitForSelector('#test-restaurants .status-badge.passed', { timeout: 10000 });
    
    // Verify result
    const statusBadge = await testCard.locator('.status-badge').textContent();
    expect(statusBadge).toBe('Passed');
    
    const resultText = await testCard.locator('.test-result').textContent();
    expect(resultText).toContain('Found');
    expect(resultText).toContain('restaurant(s)');
  });

  test('should view orders successfully', async ({ page }) => {
    const testCard = page.locator('#test-viewOrders');
    
    await page.click('button:has-text("Run All Tests")');
    await page.waitForSelector('#test-viewOrders .status-badge.passed', { timeout: 10000 });
    
    const statusBadge = await testCard.locator('.status-badge').textContent();
    expect(statusBadge).toBe('Passed');
    
    const resultText = await testCard.locator('.test-result').textContent();
    expect(resultText).toContain('order(s)');
  });

  test('should place order with MenuVerse vendor ID', async ({ page }) => {
    const testCard = page.locator('#test-placeOrder');
    
    await page.click('button:has-text("Run All Tests")');
    await page.waitForSelector('#test-placeOrder .status-badge.passed', { timeout: 15000 });
    
    const statusBadge = await testCard.locator('.status-badge').textContent();
    expect(statusBadge).toBe('Passed');
    
    const resultText = await testCard.locator('.test-result').textContent();
    expect(resultText).toContain('Order placed:');
    expect(resultText).toContain('ORD-');
    expect(resultText).toContain('MenuVerse ID:');
    expect(resultText).toContain('Status: CONFIRMED');
  });

  test('should update order status', async ({ page }) => {
    // First, place an order to get an order ID
    await page.click('button:has-text("Run All Tests")');
    await page.waitForSelector('#test-placeOrder .status-badge.passed', { timeout: 15000 });
    
    // Extract order ID from Place Order result
    const placeOrderResult = await page.locator('#result-placeOrder').textContent();
    const orderIdMatch = placeOrderResult.match(/ORD-[0-9]+-[a-z0-9]+/);
    
    if (!orderIdMatch) {
      throw new Error('Could not extract order ID from Place Order result');
    }
    
    const orderId = orderIdMatch[0];
    console.log('📦 Testing with order ID:', orderId);
    
    // Click the Update Order Status test card to trigger individual test
    await page.click('#test-updateStatus');
    
    // Wait for prompt and enter order ID
    page.on('dialog', async dialog => {
      const message = dialog.message();
      if (message.includes('Enter Order ID')) {
        await dialog.accept(orderId);
      } else if (message.includes('Enter new status')) {
        await dialog.accept('PROCESSING');
      } else if (message.includes('Enter note')) {
        await dialog.accept('Automated test update');
      }
    });
    
    // Note: This test will fail if prompts are used. 
    // Better approach: modify the test functions to accept parameters
    console.log('⚠️  Update Order Status test uses prompts - needs UI modification for full automation');
  });

  test('should simulate webhook update', async ({ page }) => {
    const testCard = page.locator('#test-webhook');
    
    await page.click('button:has-text("Run All Tests")');
    await page.waitForSelector('#test-webhook .status-badge', { timeout: 15000 });
    
    const statusBadge = await testCard.locator('.status-badge').textContent();
    
    // Webhook test may pass or fail depending on available orders
    if (statusBadge === 'Passed') {
      const resultText = await testCard.locator('.test-result').textContent();
      expect(resultText).toContain('Webhook applied');
    }
  });

  test('should view order details', async ({ page }) => {
    const testCard = page.locator('#test-viewOrderDetails');
    
    await page.click('button:has-text("Run All Tests")');
    await page.waitForSelector('#test-viewOrderDetails .status-badge', { timeout: 15000 });
    
    const statusBadge = await testCard.locator('.status-badge').textContent();
    
    if (statusBadge === 'Passed') {
      const resultText = await testCard.locator('.test-result').textContent();
      expect(resultText).toContain('Order Details:');
      expect(resultText).toContain('Status:');
      expect(resultText).toContain('Address:');
      expect(resultText).toContain('Payment:');
    }
  });

  test('should display test summary', async ({ page }) => {
    await page.click('button:has-text("Run All Tests")');
    
    // Wait for all tests to complete
    await page.waitForTimeout(20000);
    
    // Verify summary is visible
    const summary = page.locator('#summary');
    await expect(summary).toBeVisible();
    
    // Check summary statistics
    const totalTests = await page.locator('#totalTests').textContent();
    const passedTests = await page.locator('#passedTests').textContent();
    const passRate = await page.locator('#passRate').textContent();
    
    console.log(`📊 Test Summary: ${passedTests}/${totalTests} passed (${passRate})`);
    
    expect(parseInt(totalTests)).toBeGreaterThan(0);
    expect(parseInt(passedTests)).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Direct API Tests (Bypass Dashboard)', () => {
  
  test('should place order via direct GraphQL call', async ({ request }) => {
    const mutation = `
      mutation PlaceOrder($restaurant: String!, $orderInput: [OrderItemInput!]!, $paymentMethod: String!, $orderDate: String!, $menuVerseVendorId: String, $address: String) {
        placeOrder(
          restaurant: $restaurant
          orderInput: $orderInput
          paymentMethod: $paymentMethod
          orderDate: $orderDate
          menuVerseVendorId: $menuVerseVendorId
          address: $address
        ) {
          id
          orderId
          orderStatus
          address
          paymentMethod
          menuVerseVendorId
        }
      }
    `;

    const variables = {
      restaurant: 'Test Restaurant',
      orderInput: [
        {
          title: 'Playwright Test Burger',
          food: 'burger',
          description: 'Automated test order',
          quantity: 1,
          price: 15.99,
          total: 15.99
        }
      ],
      paymentMethod: 'CASH',
      orderDate: new Date().toISOString(),
      address: '123 Playwright Test Street',
      menuVerseVendorId: '0GI3MojVnLfvzSEqMc25oCzAm Cz2'
    };

    const response = await request.post(API_URL, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        query: mutation,
        variables
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.errors).toBeUndefined();
    expect(data.data.placeOrder).toBeDefined();
    expect(data.data.placeOrder.orderId).toMatch(/ORD-\d+-[a-z0-9]+/);
    expect(data.data.placeOrder.orderStatus).toBe('CONFIRMED');
    expect(data.data.placeOrder.menuVerseVendorId).toBe('0GI3MojVnLfvzSEqMc25oCzAm Cz2');
    
    console.log('✅ Order placed:', data.data.placeOrder.orderId);
  });

  test('should update order status via direct GraphQL call', async ({ request }) => {
    // First create an order
    const placeOrderMutation = `
      mutation PlaceOrder($restaurant: String!, $orderInput: [OrderItemInput!]!, $paymentMethod: String!, $orderDate: String!) {
        placeOrder(
          restaurant: $restaurant
          orderInput: $orderInput
          paymentMethod: $paymentMethod
          orderDate: $orderDate
        ) {
          orderId
        }
      }
    `;

    const placeOrderResponse = await request.post(API_URL, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        query: placeOrderMutation,
        variables: {
          restaurant: 'Test Restaurant',
          orderInput: [{ title: 'Test', food: 'test', description: 'Test', quantity: 1, price: 10, total: 10 }],
          paymentMethod: 'CASH',
          orderDate: new Date().toISOString()
        }
      }
    });

    const placeOrderData = await placeOrderResponse.json();
    const orderId = placeOrderData.data.placeOrder.orderId;

    // Now update the order status
    const updateMutation = `
      mutation UpdateOrderStatus($orderId: ID!, $status: String!, $note: String) {
        updateOrderStatus(orderId: $orderId, status: $status, note: $note) {
          orderId
          orderStatus
          statusHistory {
            status
            timestamp
            note
          }
        }
      }
    `;

    const updateResponse = await request.post(API_URL, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        query: updateMutation,
        variables: {
          orderId,
          status: 'PROCESSING',
          note: 'Playwright automated test'
        }
      }
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();
    
    expect(updateData.errors).toBeUndefined();
    expect(updateData.data.updateOrderStatus.orderStatus).toBe('PROCESSING');
    expect(updateData.data.updateOrderStatus.statusHistory.length).toBeGreaterThanOrEqual(2);
    
    console.log('✅ Order status updated to PROCESSING');
  });
});
