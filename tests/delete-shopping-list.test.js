// tests/delete-shopping-list.test.js
const test = require('node:test');
const assert = require('node:assert');
const { buildHandler } = require('../src/api/delete-shopping-list');

/**
 * Tests for delete shopping list API endpoint
 */

test('delete-shopping-list should reject non-DELETE methods', async () => {
  const handler = buildHandler();

  const event = {
    httpMethod: 'GET',
    body: '{}',
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 405);
  const body = JSON.parse(result.body);
  assert.strictEqual(body.error, 'Method not allowed');
});

test('delete-shopping-list should require shopping list ID', async () => {
  const handler = buildHandler();

  const event = {
    httpMethod: 'DELETE',
    body: JSON.stringify({
      user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    }),
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 400);
  const body = JSON.parse(result.body);
  assert.strictEqual(body.error, 'Shopping list ID is required');
});

test('delete-shopping-list should require user ID', async () => {
  const handler = buildHandler();

  const event = {
    httpMethod: 'DELETE',
    body: JSON.stringify({
      id: '123e4567-e89b-12d3-a456-426614174000',
    }),
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 400);
  const body = JSON.parse(result.body);
  assert.strictEqual(body.error, 'User ID is required');
});

test('delete-shopping-list should call controller with correct params', async () => {
  const mockController = {
    deleteShoppingList: async (params) => {
      assert.strictEqual(params.id, '123e4567-e89b-12d3-a456-426614174000');
      assert.strictEqual(params.user_id, '9eb946b7-7e29-4460-a9cf-81aebac2ea4c');

      return {
        id: params.id,
        user_id: params.user_id,
        deleted_at: new Date().toISOString(),
      };
    },
  };

  const handler = buildHandler(mockController);

  const event = {
    httpMethod: 'DELETE',
    body: JSON.stringify({
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    }),
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 200);
  const body = JSON.parse(result.body);
  assert.ok(body.message, 'Response should have a message');
  assert.ok(body.list, 'Response should include deleted list');
  assert.strictEqual(body.list.id, '123e4567-e89b-12d3-a456-426614174000');
});

test('delete-shopping-list should return 400 on controller error', async () => {
  const mockController = {
    deleteShoppingList: async () => {
      throw new Error('List not found');
    },
  };

  const handler = buildHandler(mockController);

  const event = {
    httpMethod: 'DELETE',
    body: JSON.stringify({
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    }),
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 400);
  const body = JSON.parse(result.body);
  assert.strictEqual(body.error, 'List not found');
});

test('delete-shopping-list should include CORS headers', async () => {
  const mockController = {
    deleteShoppingList: async (params) => {
      return {
        id: params.id,
        deleted_at: new Date().toISOString(),
      };
    },
  };

  const handler = buildHandler(mockController);

  const event = {
    httpMethod: 'DELETE',
    body: JSON.stringify({
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    }),
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 200);
  assert.ok(result.headers, 'Response should have headers');
  assert.strictEqual(result.headers['Access-Control-Allow-Origin'], '*');
  assert.strictEqual(result.headers['Content-Type'], 'application/json');
  assert.ok(result.headers['Access-Control-Allow-Methods'].includes('DELETE'));
});

test('Controller deleteShoppingList should validate parameters', async () => {
  const controller = require('../src/controllers/shoppingListController');

  // Test with missing id
  await assert.rejects(
    async () => {
      await controller.deleteShoppingList({ user_id: '123' });
    },
    { message: 'Shopping list ID is required' },
    'Should reject when id is missing'
  );

  // Test with missing user_id
  await assert.rejects(
    async () => {
      await controller.deleteShoppingList({ id: '123' });
    },
    { message: 'User ID is required' },
    'Should reject when user_id is missing'
  );
});

test('Controller deleteShoppingList should call service correctly', async () => {
  const controller = require('../src/controllers/shoppingListController');

  const mockService = {
    deleteShoppingList: async (id, user_id) => {
      assert.strictEqual(id, '123e4567-e89b-12d3-a456-426614174000');
      assert.strictEqual(user_id, '9eb946b7-7e29-4460-a9cf-81aebac2ea4c');

      return {
        id,
        user_id,
        deleted_at: new Date().toISOString(),
      };
    },
  };

  const result = await controller.deleteShoppingList(
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    },
    mockService
  );

  assert.ok(result, 'Result should be returned');
  assert.strictEqual(result.id, '123e4567-e89b-12d3-a456-426614174000');
  assert.ok(result.deleted_at, 'Result should have deleted_at timestamp');
});
