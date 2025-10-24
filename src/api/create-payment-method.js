if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (e) {}
}

const controller = require('../controllers/paymentController');

function buildHandler(ctrl = controller) {
  return async function (event) {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
      const data = JSON.parse(event.body);
      const result = await ctrl.createPaymentMethod(data);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify(result),
      };
    } catch (e) {
      console.error('Error in create-payment-method:', e);

      // Determine appropriate status code based on error type
      let statusCode = 500;

      if (
        e.message.includes('Invalid') ||
        e.message.includes('required') ||
        e.message.includes('format') ||
        e.message.includes('validation')
      ) {
        statusCode = 400;
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
