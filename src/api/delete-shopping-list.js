/**
 * Delete Shopping List
 * Netlify Function to soft delete a shopping list
 */

// Load env vars only in development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (e) {}
}

const controller = require('../controllers/shoppingListController');

/**
 * Build handler function for dependency injection
 * @param {Object} ctrl - Controller to inject
 * @returns {Function} - Handler function
 */
function buildHandler(ctrl = controller) {
  return async function (event) {
    // Only allow DELETE requests
    if (event.httpMethod !== 'DELETE') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    try {
      const data = JSON.parse(event.body || '{}');
      const { id, user_id } = data;

      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Shopping list ID is required' }),
        };
      }

      if (!user_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'User ID is required' }),
        };
      }

      // Delete the shopping list
      const deletedList = await ctrl.deleteShoppingList({ id, user_id });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        },
        body: JSON.stringify({
          message: 'Shopping list deleted successfully',
          list: deletedList,
        }),
      };
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message || 'Internal server error' }),
      };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler; // For testing
