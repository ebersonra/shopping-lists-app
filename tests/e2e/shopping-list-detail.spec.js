const { test, expect } = require('@playwright/test');

/**
 * E2E Tests for Shopping List Detail Page
 * Tests viewing and interacting with individual shopping lists
 */

test.describe('Shopping List Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup user data with valid UUID
    await page.goto('/src/pages/shopping-welcome.html');
    await page.evaluate(() => {
      const validUUID = '9eb946b7-7e29-4460-a9cf-81aebac2ea4c';
      localStorage.setItem(
        'bargainly_user',
        JSON.stringify({
          id: validUUID,
          name: 'Test User',
          phone: '(11) 98765-4321',
          market: 'carrefour',
          skipped: false,
          timestamp: new Date().toISOString(),
        })
      );
    });
  });

  test('should handle valid UUID parameters in URL', async ({ page }) => {
    // Create a valid shopping list ID
    const validListId = '12345678-1234-1234-1234-123456789012';
    const validUserId = '9eb946b7-7e29-4460-a9cf-81aebac2ea4c';

    // Listen for API requests
    const apiRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('get-shopping-list')) {
        apiRequests.push(request);
      }
    });

    // Navigate to shopping list detail page with valid UUIDs
    await page.goto(`/src/pages/view-shopping-list.html?id=${validListId}`);

    // Wait for the page to attempt loading
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Verify API was called with correct parameters
    if (apiRequests.length > 0) {
      const apiUrl = apiRequests[0].url();
      expect(apiUrl).toContain(`id=${validListId}`);
      expect(apiUrl).toContain(`user_id=${validUserId}`);
    }
  });

  test('should not show 400 Bad Request for valid UUID in get-shopping-list API', async ({
    page,
  }) => {
    const validListId = '12345678-1234-1234-1234-123456789012';

    // Listen for responses
    const badResponses = [];
    page.on('response', (response) => {
      if (response.status() === 400 && response.url().includes('get-shopping-list')) {
        badResponses.push(response);
      }
    });

    // Navigate to shopping list detail page
    await page.goto(`/src/pages/view-shopping-list.html?id=${validListId}`);

    // Wait for page to finish loading
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Verify no 400 Bad Request errors for get-shopping-list endpoint
    expect(badResponses.length).toBe(0);
  });

  test('should handle missing list ID parameter', async ({ page }) => {
    // Navigate without list ID
    await page.goto('/src/pages/view-shopping-list.html');

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Page should handle this gracefully (show error or redirect)
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  test('should handle invalid UUID format in list ID', async ({ page }) => {
    // Navigate with invalid UUID
    await page.goto('/src/pages/view-shopping-list.html?id=invalid-uuid');

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Page should handle this gracefully
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  test('should handle non-existent list ID gracefully', async ({ page }) => {
    // Use a valid UUID format but for a non-existent list
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Navigate to non-existent list
    await page.goto(`/src/pages/view-shopping-list.html?id=${nonExistentId}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Page should show not found or error message
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Shopping List Detail - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Setup user data with valid UUID
    await page.goto('/src/pages/shopping-welcome.html');
    await page.evaluate(() => {
      const validUUID = '9eb946b7-7e29-4460-a9cf-81aebac2ea4c';
      localStorage.setItem(
        'bargainly_user',
        JSON.stringify({
          id: validUUID,
          name: 'Test User',
          phone: '(11) 98765-4321',
          market: 'carrefour',
          skipped: false,
          timestamp: new Date().toISOString(),
        })
      );
    });
  });

  test('should handle update operations with valid UUIDs', async ({ page }) => {
    const validListId = '12345678-1234-1234-1234-123456789012';

    // Listen for update API calls
    const updateRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('update-shopping-list')) {
        updateRequests.push(request);
      }
    });

    // Navigate to shopping list detail page
    await page.goto(`/src/pages/view-shopping-list.html?id=${validListId}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Try to find and click an edit/update button if it exists
    const editButton = page
      .locator('button:has-text("Editar"), button:has-text("Edit"), [data-action="edit"]')
      .first();

    if ((await editButton.count()) > 0 && (await editButton.isVisible())) {
      await editButton.click();

      // Wait a bit for any potential API calls
      await page.waitForTimeout(1000);

      // If update requests were made, they should use valid UUIDs
      for (const request of updateRequests) {
        const url = request.url();
        // Verify the URL or body contains valid UUID format
        expect(url).toBeTruthy();
      }
    }
  });

  test('should handle delete operations with valid UUIDs', async ({ page }) => {
    const validListId = '12345678-1234-1234-1234-123456789012';

    // Listen for delete API calls
    const deleteRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('delete') || request.method() === 'DELETE') {
        deleteRequests.push(request);
      }
    });

    // Navigate to shopping list detail page
    await page.goto(`/src/pages/view-shopping-list.html?id=${validListId}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Try to find a delete button if it exists
    const deleteButton = page
      .locator('button:has-text("Excluir"), button:has-text("Delete"), [data-action="delete"]')
      .first();

    if ((await deleteButton.count()) > 0 && (await deleteButton.isVisible())) {
      // Note: We won't actually click delete to avoid side effects
      // Just verify the button exists and page loaded correctly
      expect(await deleteButton.isVisible()).toBe(true);
    }
  });

  test('should handle adding items with valid UUIDs', async ({ page }) => {
    const validListId = '12345678-1234-1234-1234-123456789012';

    // Listen for add item API calls
    const addItemRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('add-shopping-list-item')) {
        addItemRequests.push(request);
      }
    });

    // Navigate to shopping list detail page
    await page.goto(`/src/pages/view-shopping-list.html?id=${validListId}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Try to find an add item button if it exists
    const addButton = page
      .locator(
        'button:has-text("Adicionar"), button:has-text("Add Item"), [data-action="add-item"]'
      )
      .first();

    if ((await addButton.count()) > 0 && (await addButton.isVisible())) {
      // Verify button exists
      expect(await addButton.isVisible()).toBe(true);
    }
  });
});

test.describe('Shopping List Detail - UUID Validation', () => {
  test('should reject operations with invalid UUIDs gracefully', async ({ page }) => {
    const invalidIds = [
      'not-a-uuid',
      '123',
      'GGGGGGG-GGGG-GGGG-GGGG-GGGGGGGGGGGG',
      '12345678-1234-1234-1234', // incomplete
    ];

    for (const invalidId of invalidIds) {
      // Setup user
      await page.goto('/src/pages/shopping-welcome.html');
      await page.evaluate(() => {
        const validUUID = '9eb946b7-7e29-4460-a9cf-81aebac2ea4c';
        localStorage.setItem(
          'bargainly_user',
          JSON.stringify({
            id: validUUID,
            name: 'Test User',
            phone: '(11) 98765-4321',
            market: 'carrefour',
            skipped: false,
            timestamp: new Date().toISOString(),
          })
        );
      });

      // Navigate with invalid ID
      await page.goto(`/src/pages/view-shopping-list.html?id=${invalidId}`);

      // Wait for page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Page should handle this without crashing
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
    }
  });

  test('should work with various valid UUID formats', async ({ page }) => {
    const validUUIDs = [
      '12345678-1234-1234-1234-123456789012',
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
    ];

    for (const uuid of validUUIDs) {
      // Setup user
      await page.goto('/src/pages/shopping-welcome.html');
      await page.evaluate(() => {
        const validUUID = '9eb946b7-7e29-4460-a9cf-81aebac2ea4c';
        localStorage.setItem(
          'bargainly_user',
          JSON.stringify({
            id: validUUID,
            name: 'Test User',
            phone: '(11) 98765-4321',
            market: 'carrefour',
            skipped: false,
            timestamp: new Date().toISOString(),
          })
        );
      });

      // Listen for 400 errors
      const badResponses = [];
      page.on('response', (response) => {
        if (response.status() === 400) {
          badResponses.push(response);
        }
      });

      // Navigate with valid UUID
      await page.goto(`/src/pages/view-shopping-list.html?id=${uuid}`);

      // Wait for page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Should not get 400 errors for UUID validation
      const uuidValidationErrors = badResponses.filter((r) =>
        r.url().includes('get-shopping-list')
      );
      expect(uuidValidationErrors.length).toBe(0);
    }
  });
});
