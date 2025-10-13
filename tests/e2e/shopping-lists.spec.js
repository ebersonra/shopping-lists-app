const { test, expect } = require('@playwright/test');

/**
 * E2E Tests for Shopping Lists Page
 * Tests the main shopping lists page functionality including:
 * - Loading lists from the API
 * - Error handling
 * - Display and interaction
 */

test.describe('Shopping Lists Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup user data with valid UUID
    await page.goto('/src/pages/shopping-welcome.html');
    await page.evaluate(() => {
      const validUUID = '9eb946b7-7e29-4460-a9cf-81aebac2ea4c';
      localStorage.setItem('bargainly_user', JSON.stringify({
        id: validUUID,
        name: 'Test User',
        phone: '(11) 98765-4321',
        market: 'carrefour',
        skipped: false,
        timestamp: new Date().toISOString()
      }));
    });
  });

  test('should load shopping lists page without errors', async ({ page }) => {
    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait for the page to load
    await page.waitForSelector('.hero-title', { timeout: 10000 });
    
    // Verify we're on the shopping lists page
    expect(page.url()).toContain('shopping-lists.html');
    
    // Verify no error messages are displayed
    const errorElement = page.locator('.error-message');
    if (await errorElement.count() > 0) {
      expect(await errorElement.isVisible()).toBe(false);
    }
    
    // Verify user name is displayed
    const userName = await page.locator('#userName').textContent();
    expect(userName).toBe('Test User');
  });

  test('should handle API calls with valid UUID user_id parameter', async ({ page }) => {
    // Listen for API requests
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('get-shopping-lists')) {
        apiRequests.push(request);
      }
    });

    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait for the page to finish loading
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify API was called
    expect(apiRequests.length).toBeGreaterThan(0);
    
    // Verify the API request contains valid UUID
    const apiUrl = apiRequests[0].url();
    expect(apiUrl).toContain('user_id=9eb946b7-7e29-4460-a9cf-81aebac2ea4c');
  });

  test('should not show 400 Bad Request error for valid UUID', async ({ page }) => {
    // Listen for failed requests
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push(request);
    });
    
    const badResponses = [];
    page.on('response', response => {
      if (response.status() === 400) {
        badResponses.push(response);
      }
    });

    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait for the page to finish loading
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify no 400 errors occurred
    const badRequestsForShoppingLists = badResponses.filter(r => 
      r.url().includes('get-shopping-lists')
    );
    expect(badRequestsForShoppingLists.length).toBe(0);
  });

  test('should display empty state when no lists exist', async ({ page }) => {
    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if either lists are displayed or empty state is shown
    const hasLists = await page.locator('.list-card').count() > 0;
    const hasEmptyState = await page.locator('.empty-state, .no-lists-message').count() > 0;
    
    // One of them should be visible
    expect(hasLists || hasEmptyState).toBe(true);
  });

  test('should handle navigation to create shopping list', async ({ page }) => {
    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait for page to load
    await page.waitForSelector('.hero-title', { timeout: 10000 });
    
    // Look for create list button/link
    const createButton = page.locator('a[href*="create-shopping-list"], button:has-text("Nova Lista"), button:has-text("Criar Lista")').first();
    
    if (await createButton.count() > 0) {
      await createButton.click();
      
      // Wait for navigation
      await page.waitForURL('**/create-shopping-list.html', { timeout: 5000 });
      
      // Verify we're on the create page
      expect(page.url()).toContain('create-shopping-list.html');
    }
  });

  test('should maintain user session across page reloads', async ({ page }) => {
    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait for initial load
    await page.waitForSelector('.hero-title', { timeout: 10000 });
    
    // Get initial user data
    const initialUserId = await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('bargainly_user'));
      return user.id;
    });
    
    // Reload the page
    await page.reload();
    
    // Wait for reload to complete
    await page.waitForSelector('.hero-title', { timeout: 10000 });
    
    // Verify user data is still present
    const reloadedUserId = await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('bargainly_user'));
      return user.id;
    });
    
    expect(reloadedUserId).toBe(initialUserId);
  });
});

test.describe('Shopping Lists Page - Error Scenarios', () => {
  test('should handle missing user data gracefully', async ({ page }) => {
    // Clear localStorage
    await page.goto('/src/pages/shopping-welcome.html');
    await page.evaluate(() => localStorage.clear());
    
    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Should redirect to welcome page
    await page.waitForURL('**/shopping-welcome.html', { timeout: 5000 });
    
    expect(page.url()).toContain('shopping-welcome.html');
  });

  test('should handle invalid UUID format', async ({ page }) => {
    // Setup user data with INVALID UUID
    await page.goto('/src/pages/shopping-welcome.html');
    await page.evaluate(() => {
      localStorage.setItem('bargainly_user', JSON.stringify({
        id: 'invalid-uuid-format',
        name: 'Test User',
        phone: '(11) 98765-4321',
        market: 'carrefour',
        skipped: false,
        timestamp: new Date().toISOString()
      }));
    });
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait for the page to finish loading
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // The page should handle this gracefully (might show error or redirect)
    // At minimum, it shouldn't crash the page
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });
});

test.describe('Shopping Lists Page - UUID Validation Integration', () => {
  test('should work with various valid UUID formats', async ({ page }) => {
    const validUUIDs = [
      '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
      '608bdcef-56f8-44cd-8991-bb5e1a6dfac4',
      '00000000-0000-0000-0000-000000000001',
      'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
    ];
    
    for (const uuid of validUUIDs) {
      // Setup user with this UUID
      await page.goto('/src/pages/shopping-welcome.html');
      await page.evaluate((id) => {
        localStorage.setItem('bargainly_user', JSON.stringify({
          id: id,
          name: 'Test User',
          phone: '(11) 98765-4321',
          market: 'carrefour',
          skipped: false,
          timestamp: new Date().toISOString()
        }));
      }, uuid);
      
      // Navigate to shopping lists page
      await page.goto('/src/pages/shopping-lists.html');
      
      // Wait for page to load
      await page.waitForSelector('.hero-title', { timeout: 10000 });
      
      // Verify no errors
      expect(page.url()).toContain('shopping-lists.html');
      
      // Clean up for next iteration
      await page.evaluate(() => localStorage.clear());
    }
  });
});
