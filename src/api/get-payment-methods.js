if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (e) {}
}

const controller = require('../controllers/paymentController');

function buildHandler(ctrl = controller) {
  return async function (event) {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
      const params = event.queryStringParameters || {};

      if (!params.user_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'User ID is required' }),
        };
      }

      const result = await ctrl.getPaymentMethods(params);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
        body: JSON.stringify({ paymentMethods: result }),
      };
    } catch (e) {
      console.error('Error in get-payment-methods:', e);

      // Determine appropriate status code based on error type
      let statusCode = 500;

      if (
        e.message.includes('Invalid') ||
        e.message.includes('required') ||
        e.message.includes('format')
      ) {
        statusCode = 400;
      } else if (e.message.includes('not found') || e.message.includes('Not found')) {
        statusCode = 404;
      }

      return {
        statusCode,
        body: JSON.stringify({
          error: e.message,
        }),
      };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler;
