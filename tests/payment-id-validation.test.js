// tests/payment-id-validation.test.js
const test = require('node:test');
const assert = require('node:assert');
const { validateUUID } = require('../src/utils/validation');

/**
 * Tests for payment_id UUID validation in create-shopping-list
 *
 * This test validates that the HTML form correctly handles payment_id values:
 * - Non-UUID values (like "credit", "debit", "pix") should be converted to null
 * - Valid UUID values should be preserved
 * - Empty values should be converted to null
 */

// Use the shared validation utility
function validatePaymentId(paymentSelectValue) {
  return validateUUID(paymentSelectValue);
}

test('payment_id validation - should return null for "credit"', () => {
  const result = validatePaymentId('credit');
  assert.strictEqual(result, null, 'Non-UUID string "credit" should be converted to null');
});

test('payment_id validation - should return null for "debit"', () => {
  const result = validatePaymentId('debit');
  assert.strictEqual(result, null, 'Non-UUID string "debit" should be converted to null');
});

test('payment_id validation - should return null for "pix"', () => {
  const result = validatePaymentId('pix');
  assert.strictEqual(result, null, 'Non-UUID string "pix" should be converted to null');
});

test('payment_id validation - should return null for empty string', () => {
  const result = validatePaymentId('');
  assert.strictEqual(result, null, 'Empty string should be converted to null');
});

test('payment_id validation - should return null for undefined', () => {
  const result = validatePaymentId(undefined);
  assert.strictEqual(result, null, 'Undefined should be converted to null');
});

test('payment_id validation - should preserve valid UUID', () => {
  const validUuid = '9eb946b7-7e29-4460-a9cf-81aebac2ea4c';
  const result = validatePaymentId(validUuid);
  assert.strictEqual(result, validUuid, 'Valid UUID should be preserved');
});

test('payment_id validation - should preserve valid UUID (uppercase)', () => {
  const validUuid = '9EB946B7-7E29-4460-A9CF-81AEBAC2EA4C';
  const result = validatePaymentId(validUuid);
  assert.strictEqual(result, validUuid, 'Valid UUID (uppercase) should be preserved');
});

test('payment_id validation - should return null for invalid UUID format', () => {
  const invalidUuid = '9eb946b7-7e29-4460-a9cf';
  const result = validatePaymentId(invalidUuid);
  assert.strictEqual(result, null, 'Invalid UUID format should be converted to null');
});

test('payment_id validation - should return null for malformed UUID', () => {
  const malformedUuid = 'not-a-uuid-at-all';
  const result = validatePaymentId(malformedUuid);
  assert.strictEqual(result, null, 'Malformed UUID should be converted to null');
});
