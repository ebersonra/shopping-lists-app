// tests/payment-api.test.js
const test = require('node:test');
const assert = require('node:assert');

/**
 * Tests for payment methods API
 */

test('get-payment-methods API - should reject GET without user_id', async () => {
  const { buildHandler } = require('../src/api/get-payment-methods');
  const handler = buildHandler();

  const event = {
    httpMethod: 'GET',
    queryStringParameters: {},
  };

  const response = await handler(event);

  assert.strictEqual(response.statusCode, 400);
  const body = JSON.parse(response.body);
  assert.strictEqual(body.error, 'User ID is required');
});

test('get-payment-methods API - should reject non-GET methods', async () => {
  const { buildHandler } = require('../src/api/get-payment-methods');
  const handler = buildHandler();

  const event = {
    httpMethod: 'POST',
    queryStringParameters: { user_id: 'test' },
  };

  const response = await handler(event);

  assert.strictEqual(response.statusCode, 405);
  assert.strictEqual(response.body, 'Method Not Allowed');
});

test('get-payment-methods API - should call controller with correct params', async () => {
  const mockController = {
    getPaymentMethods: async (params) => {
      assert.strictEqual(params.user_id, 'test-user-id');
      return [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: 'test-user-id',
          type: 'credit',
          description: 'Test Card',
          enabled: true,
          is_default: true,
        },
      ];
    },
  };

  const { buildHandler } = require('../src/api/get-payment-methods');
  const handler = buildHandler(mockController);

  const event = {
    httpMethod: 'GET',
    queryStringParameters: { user_id: 'test-user-id' },
  };

  const response = await handler(event);

  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.headers['Content-Type']);
  const body = JSON.parse(response.body);
  assert.ok(Array.isArray(body.paymentMethods));
  assert.strictEqual(body.paymentMethods.length, 1);
  assert.strictEqual(body.paymentMethods[0].type, 'credit');
});

test('create-payment-method API - should reject POST without data', async () => {
  const { buildHandler } = require('../src/api/create-payment-method');
  const handler = buildHandler();

  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({}),
  };

  const response = await handler(event);

  assert.strictEqual(response.statusCode, 400);
  const body = JSON.parse(response.body);
  assert.ok(body.error);
});

test('create-payment-method API - should reject non-POST methods', async () => {
  const { buildHandler } = require('../src/api/create-payment-method');
  const handler = buildHandler();

  const event = {
    httpMethod: 'GET',
    body: JSON.stringify({ user_id: 'test', type: 'credit' }),
  };

  const response = await handler(event);

  assert.strictEqual(response.statusCode, 405);
  assert.strictEqual(response.body, 'Method Not Allowed');
});

test('create-payment-method API - should call controller with correct data', async () => {
  const mockController = {
    createPaymentMethod: async (data) => {
      assert.strictEqual(data.user_id, 'test-user-id');
      assert.strictEqual(data.type, 'credit');
      assert.strictEqual(data.description, 'My Card');
      return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...data,
      };
    },
  };

  const { buildHandler } = require('../src/api/create-payment-method');
  const handler = buildHandler(mockController);

  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
      user_id: 'test-user-id',
      type: 'credit',
      description: 'My Card',
      is_default: true,
      enabled: true,
    }),
  };

  const response = await handler(event);

  assert.strictEqual(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.strictEqual(body.type, 'credit');
  assert.strictEqual(body.description, 'My Card');
});

test('Payment Controller - getPaymentMethods should validate user_id', async () => {
  const controller = require('../src/controllers/paymentController');

  await assert.rejects(
    async () => {
      await controller.getPaymentMethods({});
    },
    {
      message: 'User ID is required',
    }
  );
});

test('Payment Controller - createPaymentMethod should validate required fields', async () => {
  const controller = require('../src/controllers/paymentController');

  await assert.rejects(
    async () => {
      await controller.createPaymentMethod({ user_id: 'test' });
    },
    {
      message: 'Payment type is required',
    }
  );
});

test('Payment Service - validatePaymentMethod should validate type', async () => {
  const service = require('../src/services/paymentService');

  assert.throws(
    () => {
      service.validatePaymentMethod({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'invalid',
      });
    },
    {
      message: /Invalid payment type/,
    }
  );
});

test('Payment Service - validatePaymentMethod should validate user_id format', async () => {
  const service = require('../src/services/paymentService');

  assert.throws(
    () => {
      service.validatePaymentMethod({
        user_id: 'not-a-uuid',
        type: 'credit',
      });
    },
    {
      message: 'Invalid user_id format',
    }
  );
});

test('Validation utility - isValidUUID should validate correctly', () => {
  const { isValidUUID } = require('../src/utils/validation');

  assert.strictEqual(isValidUUID('123e4567-e89b-12d3-a456-426614174000'), true);
  assert.strictEqual(isValidUUID('not-a-uuid'), false);
  assert.strictEqual(isValidUUID(''), false);
  assert.strictEqual(isValidUUID(null), false);
  assert.strictEqual(isValidUUID(undefined), false);
});

test('Validation utility - validateUUID should return UUID or null', () => {
  const { validateUUID } = require('../src/utils/validation');

  assert.strictEqual(
    validateUUID('123e4567-e89b-12d3-a456-426614174000'),
    '123e4567-e89b-12d3-a456-426614174000'
  );
  assert.strictEqual(validateUUID('not-a-uuid'), null);
  assert.strictEqual(validateUUID(''), null);
  assert.strictEqual(validateUUID(null), null);
});
