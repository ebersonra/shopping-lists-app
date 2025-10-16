// tests/create-shopping-list-integration.test.js
const test = require('node:test');
const assert = require('node:assert');
const { buildHandler } = require('../src/api/create-shopping-list');

/**
 * Integration test to verify the "ShoppingList is not defined" bug is fixed
 * This test validates that the controller properly imports and uses the ShoppingList model
 */

test('Integration - create-shopping-list should not throw "ShoppingList is not defined"', async () => {
  const handler = buildHandler();
  
  // Create a request with the exact payload from the bug report
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
      user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
      title: 'Teste Super',
      description: 'Teste',
      shopping_date: '2025-10-16',
      market_id: '1',
      items: [{
        product_name: 'Sal',
        category: 'Mercearia',
        quantity: 1,
        unit: 'un',
        unit_price: 5,
        total_price: 5
      }]
    })
  };
  
  const result = await handler(event);
  
  // The handler should not return a 400 error with "ShoppingList is not defined"
  // It may return 400 for other reasons (like missing Supabase credentials in test env)
  // but the error should not be "ShoppingList is not defined"
  assert.ok(result.statusCode !== undefined, 'Response should have a status code');
  
  if (result.statusCode === 400) {
    const body = JSON.parse(result.body);
    assert.notStrictEqual(
      body.error,
      'ShoppingList is not defined',
      'Should not have "ShoppingList is not defined" error'
    );
  }
});

test('Integration - create-shopping-list should validate using models', async () => {
  const handler = buildHandler();
  
  // Test with missing required fields that should be caught by model validation
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
      user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
      // Missing title - should be caught by ShoppingList model validation
      shopping_date: '2025-10-16',
      items: [{
        product_name: 'Sal',
        category: 'Mercearia',
        quantity: 1,
        unit: 'un'
      }]
    })
  };
  
  const result = await handler(event);
  
  // Should get a 400 error with validation message
  assert.strictEqual(result.statusCode, 400);
  
  const body = JSON.parse(result.body);
  assert.ok(body.error, 'Should have an error message');
  assert.ok(
    body.error.includes('Title is required'),
    'Error should mention missing title'
  );
});

test('Integration - create-shopping-list should validate item fields using models', async () => {
  const handler = buildHandler();
  
  // Test with invalid item data that should be caught by ShoppingListItem model validation
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
      user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
      title: 'Test List',
      shopping_date: '2025-10-16',
      items: [{
        // Missing product_name - should be caught by ShoppingListItem model validation
        category: 'Mercearia',
        quantity: 1,
        unit: 'un'
      }]
    })
  };
  
  const result = await handler(event);
  
  // Should get a 400 error with validation message
  assert.strictEqual(result.statusCode, 400);
  
  const body = JSON.parse(result.body);
  assert.ok(body.error, 'Should have an error message');
  assert.ok(
    body.error.includes('Product name is required'),
    'Error should mention missing product name'
  );
});

test('Integration - create-shopping-list should reject invalid method', async () => {
  const handler = buildHandler();
  
  const event = {
    httpMethod: 'GET', // Wrong method
    body: '{}'
  };
  
  const result = await handler(event);
  
  assert.strictEqual(result.statusCode, 405);
  assert.strictEqual(result.body, 'Method Not Allowed');
});
