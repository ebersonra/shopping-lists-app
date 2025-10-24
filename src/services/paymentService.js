/**
 * Payment Service
 * Business logic layer for payment methods
 */

const repository = require('../repositories/paymentRepository');
const { isValidUUID } = require('../utils/validation');

/**
 * Validate payment method data
 * @param {Object} data - Payment method data
 * @throws {Error} - If validation fails
 */
function validatePaymentMethod(data) {
  const required = ['user_id', 'type'];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate user_id is a UUID
  if (!isValidUUID(data.user_id)) {
    throw new Error('Invalid user_id format');
  }

  // Validate payment type
  const validTypes = ['debit', 'credit', 'pix'];
  if (!validTypes.includes(data.type)) {
    throw new Error(`Invalid payment type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Validate description length if provided
  if (data.description && data.description.length > 200) {
    throw new Error('Description must be 200 characters or less');
  }
}

/**
 * Get payment methods for a user
 * @param {string} user_id - User ID
 * @param {Object} options - Query options
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Array} - Array of payment methods
 */
async function getPaymentMethods(user_id, options = {}, repo = repository) {
  if (!user_id) {
    throw new Error('User ID is required');
  }

  if (!isValidUUID(user_id)) {
    throw new Error('Invalid user_id format');
  }

  return repo.getPaymentMethods(user_id, options);
}

/**
 * Create a new payment method
 * @param {Object} paymentData - Payment method data
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object} - Created payment method
 */
async function createPaymentMethod(paymentData, repo = repository) {
  validatePaymentMethod(paymentData);

  // Normalize data
  const normalizedData = {
    ...paymentData,
    description: paymentData.description ? paymentData.description.trim() : null,
  };

  return repo.createPaymentMethod(normalizedData);
}

/**
 * Update a payment method
 * @param {string} payment_id - Payment method ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} updates - Fields to update
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object} - Updated payment method
 */
async function updatePaymentMethod(payment_id, user_id, updates, repo = repository) {
  if (!payment_id || !user_id) {
    throw new Error('Payment ID and User ID are required');
  }

  if (!isValidUUID(payment_id) || !isValidUUID(user_id)) {
    throw new Error('Invalid ID format');
  }

  // Validate updates if type is being changed
  if (updates.type) {
    const validTypes = ['debit', 'credit', 'pix'];
    if (!validTypes.includes(updates.type)) {
      throw new Error(`Invalid payment type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate description length if provided
  if (updates.description && updates.description.length > 200) {
    throw new Error('Description must be 200 characters or less');
  }

  // Normalize string fields
  const normalizedUpdates = { ...updates };
  if (normalizedUpdates.description) {
    normalizedUpdates.description = normalizedUpdates.description.trim();
  }

  return repo.updatePaymentMethod(payment_id, user_id, normalizedUpdates);
}

/**
 * Delete a payment method
 * @param {string} payment_id - Payment method ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object} - Deleted payment method
 */
async function deletePaymentMethod(payment_id, user_id, repo = repository) {
  if (!payment_id || !user_id) {
    throw new Error('Payment ID and User ID are required');
  }

  if (!isValidUUID(payment_id) || !isValidUUID(user_id)) {
    throw new Error('Invalid ID format');
  }

  return repo.deletePaymentMethod(payment_id, user_id);
}

module.exports = {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  validatePaymentMethod,
};
