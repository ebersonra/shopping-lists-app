/**
 * Tests for update-shopping-list-item API function
 * Tests the ability to update shopping list item properties including is_checked status
 */
const test = require('node:test');
const assert = require('node:assert');
const { buildHandler } = require('../src/api/update-shopping-list-item');

// Mock repository for testing
const mockRepository = {
  updateShoppingListItem: async (itemId, updates) => {
    // Simulate successful update
    return {
      id: itemId,
      product_name: 'Test Product',
      category: 'Test Category',
      quantity: 1,
      unit: 'un',
      unit_price: 10.0,
      total_price: 10.0,
      is_checked: updates.is_checked !== undefined ? updates.is_checked : false,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...updates,
    };
  },
};

// Mock repository that throws error
const mockRepositoryError = {
  updateShoppingListItem: async () => {
    throw new Error('Database error');
  },
};

test('update-shopping-list-item API - should return 405 for non-PUT/PATCH methods', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'GET',
    queryStringParameters: {},
    body: '',
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 405);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.error, 'Method not allowed');
});

test('update-shopping-list-item API - should return 400 when itemId is missing', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: {},
    body: JSON.stringify({ is_checked: true }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 400);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.error, 'Missing item ID parameter');
});

test('update-shopping-list-item API - should return 400 when no valid updates provided', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({}),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 400);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.error, 'No valid updates provided');
});

test('update-shopping-list-item API - should return 400 for invalid quantity', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ quantity: -1 }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 400);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.error, 'Quantity must be greater than zero');
});

test('update-shopping-list-item API - should return 400 for negative price', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ unit_price: -10 }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 400);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.error, 'Price cannot be negative');
});

test('update-shopping-list-item API - should successfully update is_checked to true', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ is_checked: true }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 200);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.is_checked, true);
  assert.ok(body.id);
});

test('update-shopping-list-item API - should successfully update is_checked to false', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ is_checked: false }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 200);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.is_checked, false);
});

test('update-shopping-list-item API - should successfully update quantity', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ quantity: 5 }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 200);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.quantity, 5);
});

test('update-shopping-list-item API - should successfully update unit_price', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ unit_price: 25.50 }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 200);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.unit_price, 25.50);
});

test('update-shopping-list-item API - should successfully update notes', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ notes: 'Test note' }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 200);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.notes, 'Test note');
});

test('update-shopping-list-item API - should successfully update multiple fields', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({
      is_checked: true,
      quantity: 3,
      unit_price: 15.0,
      notes: 'Updated item',
    }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 200);

  const body = JSON.parse(response.body);
  assert.strictEqual(body.is_checked, true);
  assert.strictEqual(body.quantity, 3);
  assert.strictEqual(body.unit_price, 15.0);
  assert.strictEqual(body.notes, 'Updated item');
});

test('update-shopping-list-item API - should accept PATCH method', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PATCH',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ is_checked: true }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 200);
});

test('update-shopping-list-item API - should return 500 on repository error', async () => {
  const handler = buildHandler(mockRepositoryError);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ is_checked: true }),
  };

  const response = await handler(event);
  assert.strictEqual(response.statusCode, 500);

  const body = JSON.parse(response.body);
  assert.ok(body.error);
});

test('update-shopping-list-item API - should have proper CORS headers', async () => {
  const handler = buildHandler(mockRepository);
  const event = {
    httpMethod: 'PUT',
    queryStringParameters: { itemId: 'test-item-id' },
    body: JSON.stringify({ is_checked: true }),
  };

  const response = await handler(event);
  assert.strictEqual(response.headers['Access-Control-Allow-Origin'], '*');
  assert.strictEqual(response.headers['Content-Type'], 'application/json');
});
