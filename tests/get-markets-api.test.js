// tests/get-markets-api.test.js
const test = require('node:test');
const assert = require('node:assert');
const { buildHandler } = require('../src/api/get-markets');

// Mock controller
const mockController = {
  getMarkets: async (params) => {
    if (params.user_id === 'valid-user-id') {
      return [
        {
          id: '650e8400-e29b-41d4-a716-446655440001',
          name: 'Supermercado Central',
          address: 'Av. Principal, 1000',
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440002',
          name: 'Mercado do Bairro',
          address: 'Rua das Flores, 123',
        },
      ];
    }
    return [];
  },
};

test('get-markets handler should return 400 when user_id is missing', async () => {
  const handler = buildHandler(mockController);
  const event = {
    httpMethod: 'GET',
    queryStringParameters: {},
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 400);
  const body = JSON.parse(result.body);
  assert.strictEqual(body.error, 'User ID is required');
});

test('get-markets handler should return 405 for non-GET methods', async () => {
  const handler = buildHandler(mockController);
  const event = {
    httpMethod: 'POST',
    queryStringParameters: { user_id: 'valid-user-id' },
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 405);
  assert.strictEqual(result.body, 'Method Not Allowed');
});

test('get-markets handler should return markets for valid user', async () => {
  const handler = buildHandler(mockController);
  const event = {
    httpMethod: 'GET',
    queryStringParameters: { user_id: 'valid-user-id' },
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 200);
  const body = JSON.parse(result.body);
  assert.ok(body.markets);
  assert.strictEqual(body.markets.length, 2);
  assert.strictEqual(body.markets[0].name, 'Supermercado Central');
});

test('get-markets handler should return correct CORS headers', async () => {
  const handler = buildHandler(mockController);
  const event = {
    httpMethod: 'GET',
    queryStringParameters: { user_id: 'valid-user-id' },
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 200);
  assert.ok(result.headers);
  assert.strictEqual(result.headers['Access-Control-Allow-Origin'], '*');
  assert.strictEqual(result.headers['Content-Type'], 'application/json');
});

test('get-markets handler should return empty array for user with no markets', async () => {
  const handler = buildHandler(mockController);
  const event = {
    httpMethod: 'GET',
    queryStringParameters: { user_id: 'user-with-no-markets' },
  };

  const result = await handler(event);

  assert.strictEqual(result.statusCode, 200);
  const body = JSON.parse(result.body);
  assert.ok(body.markets);
  assert.strictEqual(body.markets.length, 0);
});
