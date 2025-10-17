/**
 * Test environment variable handling in repository layer
 */

const { test } = require('node:test');
const assert = require('node:assert');

test('getClient should throw error when SUPABASE_URL is missing', () => {
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

    // Clear the require cache to force reload
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];

    const repository = require('../src/repositories/shoppingListRepository');

    // Attempt to get shopping lists should throw error
    assert.rejects(
      async () => repository.getShoppingLists('608bdcef-56f8-44cd-8991-bb5e1a6dfac4'),
      /Supabase credentials are required/,
      'Should throw error when SUPABASE_URL is missing'
    );
  } finally {
    // Restore original env vars
    if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    if (originalKey) process.env.SUPABASE_SERVICE_API_KEY = originalKey;
    if (originalKey2) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey2;
    if (originalKey3) process.env.SUPABASE_SERVICE_KEY = originalKey3;
    if (originalKey4) process.env.SUPABASE_ANON_KEY = originalKey4;

    // Clear cache again to restore normal state
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];
  }
});

test('getClient should throw error when all key variants are missing', () => {
  // Save original env vars
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_API_KEY;
  const originalKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalKey3 = process.env.SUPABASE_SERVICE_KEY;
  const originalKey4 = process.env.SUPABASE_ANON_KEY;

  try {
    // Set URL but clear all keys
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_API_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_ANON_KEY;

    // Clear the require cache to force reload
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];

    const repository = require('../src/repositories/shoppingListRepository');

    // Attempt to get shopping lists should throw error
    assert.rejects(
      async () => repository.getShoppingLists('608bdcef-56f8-44cd-8991-bb5e1a6dfac4'),
      /Supabase credentials are required/,
      'Should throw error when all key variants are missing'
    );
  } finally {
    // Restore original env vars
    if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    if (originalKey) process.env.SUPABASE_SERVICE_API_KEY = originalKey;
    if (originalKey2) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey2;
    if (originalKey3) process.env.SUPABASE_SERVICE_KEY = originalKey3;
    if (originalKey4) process.env.SUPABASE_ANON_KEY = originalKey4;

    // Clear cache again to restore normal state
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];
  }
});

test('getClient error message should mention missing variables', () => {
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

    // Clear the require cache to force reload
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];

    const repository = require('../src/repositories/shoppingListRepository');

    // Check error message contains helpful information
    assert.rejects(
      async () => repository.getShoppingLists('608bdcef-56f8-44cd-8991-bb5e1a6dfac4'),
      (err) => {
        assert.match(err.message, /Missing:/);
        assert.match(err.message, /SUPABASE_URL/);
        assert.match(err.message, /deployment platform/);
        return true;
      },
      'Error message should be helpful and mention missing variables'
    );
  } finally {
    // Restore original env vars
    if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    if (originalKey) process.env.SUPABASE_SERVICE_API_KEY = originalKey;
    if (originalKey2) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey2;
    if (originalKey3) process.env.SUPABASE_SERVICE_KEY = originalKey3;
    if (originalKey4) process.env.SUPABASE_ANON_KEY = originalKey4;

    // Clear cache again to restore normal state
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];
  }
});

test('getClient should accept SUPABASE_SERVICE_API_KEY (priority 1)', () => {
  // Save original env vars
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_API_KEY;
  const originalKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalKey3 = process.env.SUPABASE_SERVICE_KEY;
  const originalKey4 = process.env.SUPABASE_ANON_KEY;

  try {
    // Set required env vars with SUPABASE_SERVICE_API_KEY
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_API_KEY = 'test-service-api-key';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_ANON_KEY;

    // Clear the require cache to force reload
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];

    const repository = require('../src/repositories/shoppingListRepository');

    // Should not throw when calling a function that uses getClient()
    // The function will fail at Supabase API level but not at credential validation level
    assert.rejects(
      async () => repository.getShoppingLists('608bdcef-56f8-44cd-8991-bb5e1a6dfac4'),
      (err) => {
        // Should NOT be a credentials error
        assert.ok(!err.message.includes('credentials are required'));
        return true;
      }
    );
  } finally {
    // Restore original env vars
    if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    if (originalKey) process.env.SUPABASE_SERVICE_API_KEY = originalKey;
    if (originalKey2) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey2;
    if (originalKey3) process.env.SUPABASE_SERVICE_KEY = originalKey3;
    if (originalKey4) process.env.SUPABASE_ANON_KEY = originalKey4;

    // Clear cache again to restore normal state
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];
  }
});

test('getClient should accept SUPABASE_SERVICE_ROLE_KEY as fallback', () => {
  // Save original env vars
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_API_KEY;
  const originalKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalKey3 = process.env.SUPABASE_SERVICE_KEY;
  const originalKey4 = process.env.SUPABASE_ANON_KEY;

  try {
    // Set required env vars with SUPABASE_SERVICE_ROLE_KEY (no SERVICE_API_KEY)
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_API_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_ANON_KEY;

    // Clear the require cache to force reload
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];

    const repository = require('../src/repositories/shoppingListRepository');

    // Should not throw when calling a function that uses getClient()
    assert.rejects(
      async () => repository.getShoppingLists('608bdcef-56f8-44cd-8991-bb5e1a6dfac4'),
      (err) => {
        // Should NOT be a credentials error
        assert.ok(!err.message.includes('credentials are required'));
        return true;
      }
    );
  } finally {
    // Restore original env vars
    if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    if (originalKey) process.env.SUPABASE_SERVICE_API_KEY = originalKey;
    if (originalKey2) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey2;
    if (originalKey3) process.env.SUPABASE_SERVICE_KEY = originalKey3;
    if (originalKey4) process.env.SUPABASE_ANON_KEY = originalKey4;

    // Clear cache again to restore normal state
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];
  }
});

test('getClient should accept SUPABASE_ANON_KEY as last fallback', () => {
  // Save original env vars
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_API_KEY;
  const originalKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalKey3 = process.env.SUPABASE_SERVICE_KEY;
  const originalKey4 = process.env.SUPABASE_ANON_KEY;

  try {
    // Set required env vars with only SUPABASE_ANON_KEY
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_API_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';

    // Clear the require cache to force reload
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];

    const repository = require('../src/repositories/shoppingListRepository');

    // Should not throw when calling a function that uses getClient()
    assert.rejects(
      async () => repository.getShoppingLists('608bdcef-56f8-44cd-8991-bb5e1a6dfac4'),
      (err) => {
        // Should NOT be a credentials error
        assert.ok(!err.message.includes('credentials are required'));
        return true;
      }
    );
  } finally {
    // Restore original env vars
    if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    if (originalKey) process.env.SUPABASE_SERVICE_API_KEY = originalKey;
    if (originalKey2) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey2;
    if (originalKey3) process.env.SUPABASE_SERVICE_KEY = originalKey3;
    if (originalKey4) process.env.SUPABASE_ANON_KEY = originalKey4;

    // Clear cache again to restore normal state
    delete require.cache[require.resolve('../src/repositories/shoppingListRepository')];
  }
});
