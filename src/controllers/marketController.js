/**
 * Market Controller
 * Handles HTTP requests and delegates to services
 */

const service = require('../services/marketService');

/**
 * Get markets for a user
 * @param {Object} params - Query parameters
 * @param {string} params.user_id - User ID
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Promise<Array>} - Array of markets
 */
async function getMarkets(params, srv = service) {
  const { user_id } = params || {};

  if (!user_id) {
    throw new Error('User ID is required');
  }

  return srv.getMarkets(user_id);
}

/**
 * Get market by ID
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Promise<Object|null>} - Market or null if not found
 */
async function getMarketById(id, user_id, srv = service) {
  if (!id) {
    throw new Error('Market ID is required');
  }

  if (!user_id) {
    throw new Error('User ID is required');
  }

  return srv.getMarketById(id, user_id);
}

/**
 * Create a new market
 * @param {Object} data - Market data
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Promise<Object>} - Created market
 */
async function createMarket(data, srv = service) {
  if (!data || typeof data !== 'object') {
    throw new Error('Request data is required');
  }

  return srv.createMarket(data);
}

/**
 * Update a market
 * @param {Object} data - Update data
 * @param {string} data.id - Market ID
 * @param {string} data.user_id - User ID for authorization
 * @param {Object} data.updates - Fields to update
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Promise<Object>} - Updated market
 */
async function updateMarket(data, srv = service) {
  const { id, user_id, updates } = data || {};

  if (!id) {
    throw new Error('Market ID is required');
  }

  if (!user_id) {
    throw new Error('User ID is required');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates object is required');
  }

  return srv.updateMarket(id, user_id, updates);
}

/**
 * Delete a market
 * @param {Object} params - Request parameters
 * @param {string} params.id - Market ID
 * @param {string} params.user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Promise<Object>} - Deleted market
 */
async function deleteMarket(params, srv = service) {
  const { id, user_id } = params || {};

  if (!id) {
    throw new Error('Market ID is required');
  }

  if (!user_id) {
    throw new Error('User ID is required');
  }

  return srv.deleteMarket(id, user_id);
}

module.exports = {
  getMarkets,
  getMarketById,
  createMarket,
  updateMarket,
  deleteMarket,
};
