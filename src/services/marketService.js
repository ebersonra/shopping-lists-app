/**
 * Market Service
 * Business logic layer for markets
 */

const repository = require('../repositories/marketRepository');

/**
 * Get markets for a user
 * @param {string} user_id - User ID
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Promise<Array>} - Array of markets
 */
async function getMarkets(user_id, repo = repository) {
  if (!user_id) {
    throw new Error('User ID is required');
  }

  return repo.getMarkets(user_id);
}

/**
 * Get market by ID
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Promise<Object|null>} - Market or null if not found
 */
async function getMarketById(id, user_id, repo = repository) {
  if (!id) {
    throw new Error('Market ID is required');
  }

  if (!user_id) {
    throw new Error('User ID is required');
  }

  return repo.getMarketById(id, user_id);
}

/**
 * Create a new market
 * @param {Object} marketData - Market data
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Promise<Object>} - Created market
 */
async function createMarket(marketData, repo = repository) {
  if (!marketData || typeof marketData !== 'object') {
    throw new Error('Market data is required');
  }

  if (!marketData.user_id) {
    throw new Error('User ID is required');
  }

  if (!marketData.name || marketData.name.trim() === '') {
    throw new Error('Market name is required');
  }

  return repo.createMarket(marketData);
}

/**
 * Update a market
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} updates - Fields to update
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Promise<Object>} - Updated market
 */
async function updateMarket(id, user_id, updates, repo = repository) {
  if (!id) {
    throw new Error('Market ID is required');
  }

  if (!user_id) {
    throw new Error('User ID is required');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates object is required');
  }

  return repo.updateMarket(id, user_id, updates);
}

/**
 * Delete a market
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Promise<Object>} - Deleted market
 */
async function deleteMarket(id, user_id, repo = repository) {
  if (!id) {
    throw new Error('Market ID is required');
  }

  if (!user_id) {
    throw new Error('User ID is required');
  }

  return repo.deleteMarket(id, user_id);
}

module.exports = {
  getMarkets,
  getMarketById,
  createMarket,
  updateMarket,
  deleteMarket,
};
