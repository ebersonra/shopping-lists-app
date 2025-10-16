// tests/shoppingListController.test.js
const test = require('node:test');
const assert = require('node:assert');
const controller = require('../src/controllers/shoppingListController');

// Mock service
const mockService = {
  createShoppingList: async (listData, items) => {
    return {
      id: 'mock-list-id',
      ...listData,
      items: items
    };
  },
  getShoppingLists: async (user_id, options) => {
    return [];
  },
  getShoppingListById: async (id, user_id) => {
    return null;
  }
};

test('Controller - createShoppingList should validate using ShoppingList model', async () => {
  const validData = {
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Test List',
    description: 'Test description',
    shopping_date: '2025-10-16',
    market_id: '1',
    items: [
      {
        product_name: 'Sal',
        category: 'Mercearia',
        quantity: 1,
        unit: 'un',
        unit_price: 5,
        total_price: 5
      }
    ]
  };

  const result = await controller.createShoppingList(validData, mockService);
  assert.ok(result);
  assert.strictEqual(result.id, 'mock-list-id');
});

test('Controller - createShoppingList should reject when user_id is missing', async () => {
  const invalidData = {
    title: 'Test List',
    shopping_date: '2025-10-16',
    items: []
  };

  await assert.rejects(
    async () => await controller.createShoppingList(invalidData, mockService),
    { message: 'User ID is required' }
  );
});

test('Controller - createShoppingList should reject when title is missing', async () => {
  const invalidData = {
    user_id: '00000000-0000-0000-0000-000000000001',
    shopping_date: '2025-10-16',
    items: []
  };

  await assert.rejects(
    async () => await controller.createShoppingList(invalidData, mockService),
    (error) => {
      return error.message.includes('Title is required');
    }
  );
});

test('Controller - createShoppingList should reject when shopping_date is missing', async () => {
  const invalidData = {
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Test List',
    items: []
  };

  await assert.rejects(
    async () => await controller.createShoppingList(invalidData, mockService),
    (error) => {
      return error.message.includes('Shopping date is required');
    }
  );
});

test('Controller - createShoppingList should reject when items is not an array', async () => {
  const invalidData = {
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Test List',
    shopping_date: '2025-10-16',
    items: 'not an array'
  };

  await assert.rejects(
    async () => await controller.createShoppingList(invalidData, mockService),
    { message: 'Items must be an array' }
  );
});

test('Controller - createShoppingList should validate item fields', async () => {
  const invalidData = {
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Test List',
    shopping_date: '2025-10-16',
    items: [
      {
        // missing product_name
        category: 'Mercearia',
        quantity: 1,
        unit: 'un'
      }
    ]
  };

  await assert.rejects(
    async () => await controller.createShoppingList(invalidData, mockService),
    (error) => {
      return error.message.includes('Product name is required');
    }
  );
});

test('Controller - createShoppingList should validate item category', async () => {
  const invalidData = {
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Test List',
    shopping_date: '2025-10-16',
    items: [
      {
        product_name: 'Sal',
        // missing category
        quantity: 1,
        unit: 'un'
      }
    ]
  };

  await assert.rejects(
    async () => await controller.createShoppingList(invalidData, mockService),
    (error) => {
      return error.message.includes('Category is required');
    }
  );
});

test('Controller - createShoppingList should validate item unit', async () => {
  const invalidData = {
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Test List',
    shopping_date: '2025-10-16',
    items: [
      {
        product_name: 'Sal',
        category: 'Mercearia',
        quantity: 1,
        unit: 'invalid-unit' // invalid unit value
      }
    ]
  };

  await assert.rejects(
    async () => await controller.createShoppingList(invalidData, mockService),
    (error) => {
      return error.message.includes('Unit must be one of');
    }
  );
});

test('Controller - createShoppingList should handle multiple items', async () => {
  const validData = {
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Test List',
    shopping_date: '2025-10-16',
    items: [
      {
        product_name: 'Sal',
        category: 'Mercearia',
        quantity: 1,
        unit: 'un',
        unit_price: 5,
        total_price: 5
      },
      {
        product_name: 'Açúcar',
        category: 'Mercearia',
        quantity: 2,
        unit: 'kg',
        unit_price: 10,
        total_price: 20
      }
    ]
  };

  const result = await controller.createShoppingList(validData, mockService);
  assert.ok(result);
  assert.strictEqual(result.items.length, 2);
});
