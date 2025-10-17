/**
 * Test UUID validation in repository layer
 */

const { test } = require('node:test');
const assert = require('node:assert');

test('UUID validation regex - valid UUIDs', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Valid UUIDs with different formats
  assert.ok(uuidRegex.test('608bdcef-56f8-44cd-8991-bb5e1a6dfac4'));
  assert.ok(uuidRegex.test('9eb946b7-7e29-4460-a9cf-81aebac2ea4c'));
  assert.ok(uuidRegex.test('00000000-0000-0000-0000-000000000001'));
  assert.ok(uuidRegex.test('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'));
  assert.ok(uuidRegex.test('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')); // lowercase
  assert.ok(uuidRegex.test('12345678-1234-1234-1234-123456789012'));
});

test('UUID validation regex - invalid UUIDs', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Invalid UUIDs
  assert.ok(!uuidRegex.test('not-a-uuid'));
  assert.ok(!uuidRegex.test('608bdcef-56f8-44cd-8991-bb5e1a6dfac')); // Too short
  assert.ok(!uuidRegex.test('608bdcef-56f8-44cd-8991-bb5e1a6dfac44')); // Too long
  assert.ok(!uuidRegex.test('')); // Empty
  assert.ok(!uuidRegex.test('608bdcef_56f8_44cd_8991_bb5e1a6dfac4')); // Wrong separator
  assert.ok(!uuidRegex.test('608bdcef-56f8-44cd-8991')); // Incomplete
  assert.ok(!uuidRegex.test('608bdcefX56f8X44cdX8991Xbb5e1a6dfac4')); // Wrong separator
  assert.ok(!uuidRegex.test('GGGGGGG-GGGG-GGGG-GGGG-GGGGGGGGGGGG')); // Invalid hex chars
});

test('Repository functions exist', async () => {
  // Verify all repository functions are exported
  const repository = require('../src/repositories/shoppingListRepository');

  assert.ok(typeof repository.createShoppingList === 'function');
  assert.ok(typeof repository.getShoppingLists === 'function');
  assert.ok(typeof repository.getShoppingListById === 'function');
  assert.ok(typeof repository.getShoppingListByShareCode === 'function');
  assert.ok(typeof repository.updateShoppingList === 'function');
  assert.ok(typeof repository.deleteShoppingList === 'function');
  assert.ok(typeof repository.addItemToList === 'function');
  assert.ok(typeof repository.updateShoppingListItem === 'function');
  assert.ok(typeof repository.deleteShoppingListItem === 'function');
});

test('Repository UUID validation - getShoppingLists should reject invalid UUID', async () => {
  const repository = require('../src/repositories/shoppingListRepository');

  // Test with invalid user_id formats
  const invalidUUIDs = [
    '',
    'not-a-uuid',
    '123',
    'GGGGGGG-GGGG-GGGG-GGGG-GGGGGGGGGGGG',
    '608bdcef-56f8-44cd-8991', // incomplete
    null,
    undefined,
  ];

  for (const invalidUUID of invalidUUIDs) {
    await assert.rejects(
      async () => repository.getShoppingLists(invalidUUID),
      /Invalid UUID format/,
      `Should reject invalid UUID: ${invalidUUID}`
    );
  }
});

test('Repository UUID validation - getShoppingListById should reject invalid UUIDs', async () => {
  const repository = require('../src/repositories/shoppingListRepository');
  const validUUID = '608bdcef-56f8-44cd-8991-bb5e1a6dfac4';

  // Test with invalid id
  await assert.rejects(
    async () => repository.getShoppingListById('invalid-id', validUUID),
    /Invalid UUID format for id/
  );

  // Test with invalid user_id
  await assert.rejects(
    async () => repository.getShoppingListById(validUUID, 'invalid-user'),
    /Invalid UUID format for user_id/
  );

  // Test with both invalid
  await assert.rejects(
    async () => repository.getShoppingListById('invalid-id', 'invalid-user'),
    /Invalid UUID format/
  );
});

test('Repository UUID validation - updateShoppingList should reject invalid UUIDs', async () => {
  const repository = require('../src/repositories/shoppingListRepository');
  const validUUID = '608bdcef-56f8-44cd-8991-bb5e1a6dfac4';

  // Test with invalid id
  await assert.rejects(
    async () => repository.updateShoppingList('invalid-id', validUUID, { title: 'New Title' }),
    /Invalid UUID format for id/
  );

  // Test with invalid user_id
  await assert.rejects(
    async () => repository.updateShoppingList(validUUID, 'invalid-user', { title: 'New Title' }),
    /Invalid UUID format for user_id/
  );
});

test('Repository UUID validation - deleteShoppingList should reject invalid UUIDs', async () => {
  const repository = require('../src/repositories/shoppingListRepository');
  const validUUID = '608bdcef-56f8-44cd-8991-bb5e1a6dfac4';

  // Test with invalid id
  await assert.rejects(
    async () => repository.deleteShoppingList('invalid-id', validUUID),
    /Invalid UUID format for id/
  );

  // Test with invalid user_id
  await assert.rejects(
    async () => repository.deleteShoppingList(validUUID, 'invalid-user'),
    /Invalid UUID format for user_id/
  );
});
