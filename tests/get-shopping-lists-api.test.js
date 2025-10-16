/**
 * Integration test for get-shopping-lists API handler
 * Tests environment variable loading and error handling
 */

const { test } = require('node:test');
const assert = require('node:assert');

test('get-shopping-lists handler should return 400 when user_id is missing', async () => {
  const { buildHandler } = require('../src/api/get-shopping-lists');
  
  const mockController = {
    getShoppingLists: async () => []
  };
  
  const handler = buildHandler(mockController);
  
  const event = {
    httpMethod: 'GET',
    queryStringParameters: {}
  };
  
  const result = await handler(event);
  
  assert.strictEqual(result.statusCode, 400);
  const body = JSON.parse(result.body);
  assert.match(body.error, /User ID is required/);
});

test('get-shopping-lists handler should return 405 for non-GET methods', async () => {
  const { buildHandler } = require('../src/api/get-shopping-lists');
  
  const mockController = {
    getShoppingLists: async () => []
  };
  
  const handler = buildHandler(mockController);
  
  const event = {
    httpMethod: 'POST',
    queryStringParameters: { user_id: '608bdcef-56f8-44cd-8991-bb5e1a6dfac4' }
  };
  
  const result = await handler(event);
  
  assert.strictEqual(result.statusCode, 405);
  assert.strictEqual(result.body, 'Method Not Allowed');
});

test('get-shopping-lists handler should return 500 when credentials are missing', async () => {
  // Save original env vars
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_API_KEY;
  const originalKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalKey3 = process.env.SUPABASE_SERVICE_KEY;
  const originalKey4 = process.env.SUPABASE_ANON_KEY;
  
  try {
    // Clear all Supabase environment variables
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_API_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    
    // Clear require cache
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];
    delete require.cache[require.resolve('../src/services/shoppingListService')];
    delete require.cache[require.resolve('../src/controllers/shoppingListController')];
    delete require.cache[require.resolve('../src/api/get-shopping-lists')];
    
    const { buildHandler } = require('../src/api/get-shopping-lists');
    const handler = buildHandler();
    
    const event = {
      httpMethod: 'GET',
      queryStringParameters: { user_id: '608bdcef-56f8-44cd-8991-bb5e1a6dfac4' }
    };
    
    const result = await handler(event);
    
    assert.strictEqual(result.statusCode, 500);
    const body = JSON.parse(result.body);
    assert.match(body.error, /Supabase credentials are required/);
  } finally {
    // Restore original env vars
    if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    if (originalKey) process.env.SUPABASE_SERVICE_API_KEY = originalKey;
    if (originalKey2) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey2;
    if (originalKey3) process.env.SUPABASE_SERVICE_KEY = originalKey3;
    if (originalKey4) process.env.SUPABASE_ANON_KEY = originalKey4;
    
    // Clear cache again to restore normal state
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];
    delete require.cache[require.resolve('../src/services/shoppingListService')];
    delete require.cache[require.resolve('../src/controllers/shoppingListController')];
    delete require.cache[require.resolve('../src/api/get-shopping-lists')];
  }
});

test('get-shopping-lists handler should call controller with correct params', async () => {
  const { buildHandler } = require('../src/api/get-shopping-lists');
  
  let capturedParams = null;
  const mockController = {
    getShoppingLists: async (params) => {
      capturedParams = params;
      return [];
    }
  };
  
  const handler = buildHandler(mockController);
  
  const event = {
    httpMethod: 'GET',
    queryStringParameters: { 
      user_id: '608bdcef-56f8-44cd-8991-bb5e1a6dfac4',
      limit: '50'
    }
  };
  
  const result = await handler(event);
  
  assert.strictEqual(result.statusCode, 200);
  assert.ok(capturedParams);
  assert.strictEqual(capturedParams.user_id, '608bdcef-56f8-44cd-8991-bb5e1a6dfac4');
  assert.strictEqual(capturedParams.limit, '50');
});

test('get-shopping-lists handler should return correct CORS headers', async () => {
  const { buildHandler } = require('../src/api/get-shopping-lists');
  
  const mockController = {
    getShoppingLists: async () => []
  };
  
  const handler = buildHandler(mockController);
  
  const event = {
    httpMethod: 'GET',
    queryStringParameters: { user_id: '608bdcef-56f8-44cd-8991-bb5e1a6dfac4' }
  };
  
  const result = await handler(event);
  
  assert.strictEqual(result.statusCode, 200);
  assert.ok(result.headers);
  assert.strictEqual(result.headers['Access-Control-Allow-Origin'], '*');
  assert.strictEqual(result.headers['Content-Type'], 'application/json');
});

test('get-shopping-lists handler should return shopping lists data', async () => {
  const { buildHandler } = require('../src/api/get-shopping-lists');
  
  const mockData = [
    { id: 'list1', title: 'Test List 1' },
    { id: 'list2', title: 'Test List 2' }
  ];
  
  const mockController = {
    getShoppingLists: async () => mockData
  };
  
  const handler = buildHandler(mockController);
  
  const event = {
    httpMethod: 'GET',
    queryStringParameters: { user_id: '608bdcef-56f8-44cd-8991-bb5e1a6dfac4' }
  };
  
  const result = await handler(event);
  
  assert.strictEqual(result.statusCode, 200);
  const body = JSON.parse(result.body);
  assert.deepStrictEqual(body, mockData);
});
