const { test, expect } = require('@playwright/test');

test.describe('Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/src/pages/shopping-welcome.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should navigate from welcome page to shopping lists page after form submission', async ({ page }) => {
    await page.goto('/src/pages/shopping-welcome.html');
    
    // Fill the form
    await page.fill('#userName', 'Test User');
    await page.fill('#userPhone', '(11) 98765-4321');
    await page.selectOption('#preferredMarket', 'carrefour');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/shopping-lists.html', { timeout: 5000 });
    
    // Verify we're on the shopping lists page
    expect(page.url()).toContain('shopping-lists.html');
    
    // Verify user data was saved to localStorage
    const userData = await page.evaluate(() => {
      const data = localStorage.getItem('bargainly_user');
      return data ? JSON.parse(data) : null;
    });
    
    expect(userData).not.toBeNull();
    expect(userData.name).toBe('Test User');
    expect(userData.phone).toBe('(11) 98765-4321');
    expect(userData.market).toBe('carrefour');
    expect(userData.skipped).toBe(false);
  });

  test('should navigate from welcome page to shopping lists page when skipping', async ({ page }) => {
    await page.goto('/src/pages/shopping-welcome.html');
    
    // Click skip button
    await page.click('#skipBtn');
    
    // Wait for navigation
    await page.waitForURL('**/shopping-lists.html', { timeout: 5000 });
    
    // Verify we're on the shopping lists page
    expect(page.url()).toContain('shopping-lists.html');
    
    // Verify user data was saved to localStorage
    const userData = await page.evaluate(() => {
      const data = localStorage.getItem('bargainly_user');
      return data ? JSON.parse(data) : null;
    });
    
    expect(userData).not.toBeNull();
    expect(userData.name).toBeTruthy(); // Random name generated
    expect(userData.phone).toBeTruthy(); // Random phone generated
    expect(userData.skipped).toBe(true);
  });

  test('should stay on shopping lists page after loading with user data', async ({ page }) => {
    // Set user data in localStorage
    await page.goto('/src/pages/shopping-welcome.html');
    await page.evaluate(() => {
      localStorage.setItem('bargainly_user', JSON.stringify({
        name: 'Existing User',
        phone: '(11) 99999-9999',
        market: 'pao-de-acucar',
        skipped: false,
        timestamp: new Date().toISOString()
      }));
    });
    
    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait a bit to ensure no redirect happens
    await page.waitForTimeout(1000);
    
    // Verify we're still on the shopping lists page
    expect(page.url()).toContain('shopping-lists.html');
    
    // Verify user name is displayed
    const userName = await page.textContent('#userName');
    expect(userName).toBe('Existing User');
  });

  test('should redirect to welcome page if no user data exists', async ({ page }) => {
    // Navigate to shopping lists page without user data
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait for redirect
    await page.waitForURL('**/shopping-welcome.html', { timeout: 5000 });
    
    // Verify we're on the welcome page
    expect(page.url()).toContain('shopping-welcome.html');
  });

  test('should navigate to create shopping list page from shopping lists page', async ({ page }) => {
    // Set user data in localStorage
    await page.goto('/src/pages/shopping-welcome.html');
    await page.evaluate(() => {
      localStorage.setItem('bargainly_user', JSON.stringify({
        name: 'Test User',
        phone: '(11) 99999-9999',
        market: 'carrefour',
        skipped: false,
        timestamp: new Date().toISOString()
      }));
    });
    
    // Navigate to shopping lists page
    await page.goto('/src/pages/shopping-lists.html');
    
    // Wait for page to load
    await page.waitForSelector('.hero-title');
    
    // Click on create list button (if exists)
    const createButton = page.locator('a[href="create-shopping-list.html"]').first();
    if (await createButton.count() > 0) {
      await createButton.click();
      
      // Wait for navigation
      await page.waitForURL('**/create-shopping-list.html', { timeout: 5000 });
      
      // Verify we're on the create shopping list page
      expect(page.url()).toContain('create-shopping-list.html');
    }
  });

  test('should redirect from create shopping list page to welcome if no user data', async ({ page }) => {
    // Clear localStorage and navigate to create shopping list page
    await page.goto('/src/pages/create-shopping-list.html');
    
    // Wait for redirect
    await page.waitForURL('**/shopping-welcome.html', { timeout: 5000 });
    
    // Verify we're on the welcome page
    expect(page.url()).toContain('shopping-welcome.html');
  });
});
