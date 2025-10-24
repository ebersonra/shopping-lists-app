// tests/payment-field.test.js
const test = require('node:test');
const assert = require('node:assert');
const { ShoppingList } = require('../src/models/ShoppingList');
const controller = require('../src/controllers/shoppingListController');

/**
 * Tests for payment_id field in shopping list creation
 */

test('ShoppingList model should accept payment_id', () => {
  const listData = {
    user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    title: 'Test List',
    shopping_date: '2025-10-23',
    payment_id: 'credit',
  };

  const list = new ShoppingList(listData);

  assert.strictEqual(list.payment_id, 'credit', 'payment_id should be set');
});

test('ShoppingList model should allow null payment_id', () => {
  const listData = {
    user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    title: 'Test List',
    shopping_date: '2025-10-23',
    payment_id: null,
  };

  const list = new ShoppingList(listData);

  assert.strictEqual(list.payment_id, null, 'payment_id should be null');
});

test('ShoppingList model should default payment_id to null when not provided', () => {
  const listData = {
    user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    title: 'Test List',
    shopping_date: '2025-10-23',
  };

  const list = new ShoppingList(listData);

  assert.strictEqual(list.payment_id, null, 'payment_id should default to null');
});

test('ShoppingList toDbFormat should include payment_id', () => {
  const listData = {
    user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    title: 'Test List',
    shopping_date: '2025-10-23',
    payment_id: 'debit',
  };

  const list = new ShoppingList(listData);
  const dbFormat = list.toDbFormat();

  assert.ok(dbFormat.hasOwnProperty('payment_id'), 'dbFormat should have payment_id property');
  assert.strictEqual(dbFormat.payment_id, 'debit', 'payment_id should be debit in dbFormat');
});

test('ShoppingList toDbFormat should set payment_id to null when not provided', () => {
  const listData = {
    user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    title: 'Test List',
    shopping_date: '2025-10-23',
  };

  const list = new ShoppingList(listData);
  const dbFormat = list.toDbFormat();

  assert.ok(dbFormat.hasOwnProperty('payment_id'), 'dbFormat should have payment_id property');
  assert.strictEqual(dbFormat.payment_id, null, 'payment_id should be null in dbFormat');
});

test('ShoppingList validation should pass with payment_id', () => {
  const listData = {
    user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    title: 'Test List',
    shopping_date: '2025-10-23',
    payment_id: 'pix',
  };

  const list = new ShoppingList(listData);
  const validation = list.validate();

  assert.strictEqual(validation.isValid, true, 'Validation should pass with payment_id');
  assert.strictEqual(validation.errors.length, 0, 'Should have no validation errors');
});

test('Controller createShoppingList should accept payment_id', async () => {
  const mockService = {
    createShoppingList: async (listData, items) => {
      // Verify that payment_id is passed through
      assert.ok(
        listData.hasOwnProperty('payment_id'),
        'Service should receive payment_id in listData'
      );
      assert.strictEqual(listData.payment_id, 'credit', 'payment_id should be credit');

      return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...listData,
        items,
      };
    },
  };

  const requestData = {
    user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    title: 'Test List',
    shopping_date: '2025-10-23',
    payment_id: 'credit',
    items: [
      {
        product_name: 'Test Item',
        category: 'Mercearia',
        quantity: 1,
        unit: 'un',
        unit_price: 5,
      },
    ],
  };

  const result = await controller.createShoppingList(requestData, mockService);

  assert.ok(result, 'Result should be returned');
  assert.strictEqual(result.payment_id, 'credit', 'Result should include payment_id');
});

test('Controller createShoppingList should accept null payment_id', async () => {
  const mockService = {
    createShoppingList: async (listData, items) => {
      assert.ok(
        listData.hasOwnProperty('payment_id'),
        'Service should receive payment_id in listData'
      );
      assert.strictEqual(listData.payment_id, null, 'payment_id should be null');

      return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...listData,
        items,
      };
    },
  };

  const requestData = {
    user_id: '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',
    title: 'Test List',
    shopping_date: '2025-10-23',
    payment_id: null,
    items: [
      {
        product_name: 'Test Item',
        category: 'Mercearia',
        quantity: 1,
        unit: 'un',
        unit_price: 5,
      },
    ],
  };

  const result = await controller.createShoppingList(requestData, mockService);

  assert.ok(result, 'Result should be returned');
  assert.strictEqual(result.payment_id, null, 'Result should have null payment_id');
});
