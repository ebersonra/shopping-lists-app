/**
 * Market Repository
 * Data access layer for markets
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

  // Try multiple environment variable names for backward compatibility
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
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @param {string} fieldName - Name of the field for error messages
 * @throws {Error} - If UUID format is invalid
 */
function validateUuid(uuid, fieldName = 'id') {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error(`Invalid UUID format for ${fieldName}: ${uuid}`);
  }
}

/**
 * Get markets for a user
 * @param {string} user_id - User ID
 * @returns {Promise<Array>} - Array of markets
 */
async function getMarkets(user_id) {
  validateUuid(user_id, 'user_id');

  const supabase = getClient();

  console.log('Fetching markets for user:', user_id);

  try {
    const { data, error } = await supabase
      .from('markets')
      .select('id, name, address, cnpj, phone, email, website, created_at')
      .eq('user_id', user_id)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    console.log(`Found ${data?.length || 0} markets for user ${user_id}`);

    return data || [];
  } catch (error) {
    console.error('Error in getMarkets:', error);
    throw error;
  }
}

/**
 * Get market by ID
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @returns {Promise<Object|null>} - Market or null if not found
 */
async function getMarketById(id, user_id) {
  validateUuid(id, 'id');
  validateUuid(user_id, 'user_id');

  const supabase = getClient();

  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Create a new market
 * @param {Object} marketData - Market data
 * @returns {Promise<Object>} - Created market
 */
async function createMarket(marketData) {
  validateUuid(marketData.user_id, 'user_id');

  const supabase = getClient();

  const { data, error } = await supabase.from('markets').insert(marketData).select().single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update a market
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated market
 */
async function updateMarket(id, user_id, updates) {
  validateUuid(id, 'id');
  validateUuid(user_id, 'user_id');

  const supabase = getClient();

  const { data, error } = await supabase
    .from('markets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Market not found or access denied');
    }
    throw error;
  }

  return data;
}

/**
 * Delete a market (soft delete)
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @returns {Promise<Object>} - Deleted market
 */
async function deleteMarket(id, user_id) {
  validateUuid(id, 'id');
  validateUuid(user_id, 'user_id');

  const supabase = getClient();

  const { data, error } = await supabase
    .from('markets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Market not found or access denied');
    }
    throw error;
  }

  return data;
}

module.exports = {
  getMarkets,
  getMarketById,
  createMarket,
  updateMarket,
  deleteMarket,
};
