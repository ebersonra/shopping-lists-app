if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (e) {}
}

const controller = require('../controllers/shoppingListController');

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

      console.log('Getting shopping lists for user:', params.user_id);
      console.log('Request params:', params);

      const result = await ctrl.getShoppingLists(params);

      console.log('Shopping lists result:', result);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
        body: JSON.stringify(result),
      };
    } catch (e) {
      console.error('Error in get-shopping-lists:', e);
      console.error('Error stack:', e.stack);

      // Determine appropriate status code based on error type
      let statusCode = 500; // Default to server error

      // Client errors (4xx)
      if (
        e.message.includes('Invalid UUID format') ||
        e.message.includes('User ID is required') ||
        e.message.includes('Limit must be') ||
        e.message.includes('Offset must be')
      ) {
        statusCode = 400;
      } else if (e.message.includes('not found') || e.message.includes('Not found')) {
        statusCode = 404;
      } else if (e.message.includes('Unauthorized') || e.message.includes('not authorized')) {
        statusCode = 403;
      }

      return {
        statusCode,
        body: JSON.stringify({
          error: e.message,
          details: process.env.NODE_ENV !== 'production' ? e.stack : undefined,
        }),
      };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler;
