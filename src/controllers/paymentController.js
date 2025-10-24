/**
 * Payment Controller
 * Handles HTTP requests and delegates to services
 */

const service = require('../services/paymentService');

/**
 * Get payment methods for a user
 * @param {Object} params - Query parameters
 * @param {string} params.user_id - User ID
 * @param {boolean} params.enabled_only - Filter by enabled status
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Array} - Array of payment methods
 */
async function getPaymentMethods(params, srv = service) {
  const { user_id, enabled_only } = params || {};

  if (!user_id) {
    throw new Error('User ID is required');
  }

  const options = {
    enabled_only: enabled_only !== 'false', // Default to true
  };

  return srv.getPaymentMethods(user_id, options);
}

/**
 * Create a new payment method
 * @param {Object} data - Payment method data
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Created payment method
 */
async function createPaymentMethod(data, srv = service) {
  if (!data || typeof data !== 'object') {
    throw new Error('Request data is required');
  }

  const { user_id, type, description, is_default, enabled } = data;

  if (!user_id) {
    throw new Error('User ID is required');
  }

  if (!type) {
    throw new Error('Payment type is required');
  }

  const paymentData = {
    user_id,
    type,
    description,
    is_default,
    enabled,
  };

  return srv.createPaymentMethod(paymentData);
}

/**
 * Update a payment method
 * @param {Object} data - Update data
 * @param {string} data.payment_id - Payment method ID
 * @param {string} data.user_id - User ID for authorization
 * @param {Object} data.updates - Fields to update
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Updated payment method
 */
async function updatePaymentMethod(data, srv = service) {
  const { payment_id, user_id, updates } = data || {};

  if (!payment_id) {
    throw new Error('Payment ID is required');
  }

  if (!user_id) {
    throw new Error('User ID is required');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates object is required');
  }

  return srv.updatePaymentMethod(payment_id, user_id, updates);
}

/**
 * Delete a payment method
 * @param {Object} params - Request parameters
 * @param {string} params.payment_id - Payment method ID
 * @param {string} params.user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Deleted payment method
 */
async function deletePaymentMethod(params, srv = service) {
  const { payment_id, user_id } = params || {};

  if (!payment_id) {
    throw new Error('Payment ID is required');
  }

  if (!user_id) {
    throw new Error('User ID is required');
  }

  return srv.deletePaymentMethod(payment_id, user_id);
}

module.exports = {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
