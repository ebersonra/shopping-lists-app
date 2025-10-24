/**
 * Payment Repository
 * Data access layer for payment methods
 */

const { createClient } = require('@supabase/supabase-js');

// Try to load dotenv for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available, continue without it
  }
}

/**
 * Get Supabase client
 * @returns {Object} - Supabase client instance
 */
function getClient() {
  const supabaseUrl = process.env.SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_API_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseKey)
      missingVars.push(
        'SUPABASE_SERVICE_API_KEY or SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY'
      );

    throw new Error(
      `Supabase credentials are required. Missing: ${missingVars.join(', ')}. ` +
        `Please set these environment variables in your deployment platform (Netlify/Vercel) or .env file for local development.`
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get payment methods for a user
 * @param {string} user_id - User ID (UUID)
 * @param {Object} options - Query options
 * @param {boolean} options.enabled_only - Only return enabled payment methods (default: true)
 * @returns {Array} - Array of payment methods
 */
async function getPaymentMethods(user_id, options = {}) {
  const { enabled_only = true } = options;

  const supabase = getClient();

  let query = supabase
    .from('payment')
    .select('*')
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (enabled_only) {
    query = query.eq('enabled', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get payment methods: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new payment method
 * @param {Object} paymentData - Payment method data
 * @param {string} paymentData.user_id - User ID (UUID)
 * @param {string} paymentData.type - Payment type (debit, credit, pix)
 * @param {string} paymentData.description - Description of payment method
 * @param {boolean} paymentData.is_default - Whether this is the default payment method
 * @param {boolean} paymentData.enabled - Whether this payment method is enabled
 * @returns {Object} - Created payment method
 */
async function createPaymentMethod(paymentData) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('payment')
    .insert({
      user_id: paymentData.user_id,
      type: paymentData.type,
      description: paymentData.description || null,
      is_default: paymentData.is_default || false,
      enabled: paymentData.enabled !== undefined ? paymentData.enabled : true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create payment method: ${error.message}`);
  }

  return data;
}

/**
 * Update a payment method
 * @param {string} payment_id - Payment method ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated payment method
 */
async function updatePaymentMethod(payment_id, user_id, updates) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('payment')
    .update(updates)
    .eq('id', payment_id)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update payment method: ${error.message}`);
  }

  if (!data) {
    throw new Error('Payment method not found');
  }

  return data;
}

/**
 * Delete a payment method (soft delete)
 * @param {string} payment_id - Payment method ID
 * @param {string} user_id - User ID for authorization
 * @returns {Object} - Deleted payment method
 */
async function deletePaymentMethod(payment_id, user_id) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('payment')
    .update({
      deleted_at: new Date().toISOString(),
      enabled: false,
    })
    .eq('id', payment_id)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to delete payment method: ${error.message}`);
  }

  if (!data) {
    throw new Error('Payment method not found');
  }

  return data;
}

module.exports = {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
