/**
 * Shopping List Repository
 * Data access layer for shopping lists
 * Following the Controller → Service → Repository pattern
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
  // Priority: SUPABASE_SERVICE_API_KEY > SUPABASE_SERVICE_ROLE_KEY > SUPABASE_SERVICE_KEY > SUPABASE_ANON_KEY
  const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY || 
                       process.env.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_SERVICE_KEY ||
                       process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseKey) missingVars.push('SUPABASE_SERVICE_API_KEY or SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY');
    
    throw new Error(
      `Supabase credentials are required. Missing: ${missingVars.join(', ')}. ` +
      `Please set these environment variables in your deployment platform (Netlify/Vercel) or .env file for local development.`
    );
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Create a new shopping list with items
 * @param {Object} listData - Shopping list data
 * @param {Array} items - Array of shopping list items
 * @returns {Object} - Created shopping list with items
 */
async function createShoppingList(listData, items = []) {
  const supabase = getClient();
  
  // Create the shopping list using stored procedure
  const { data: list, error: listError } = await supabase.rpc('create_shopping_list', {
    p_user_id: listData.user_id,
    p_title: listData.title,
    p_description: listData.description || null,
    p_shopping_date: listData.shopping_date,
    p_market_id: listData.market_id || null
  });
  
  if (listError) throw new Error(listError.message);
  
  // Add items if provided
  if (items.length > 0) {
    const itemPromises = items.map(item => 
      supabase.rpc('add_shopping_list_item', {
        p_list_id: list.id,
        p_product_name: item.product_name,
        p_category: item.category,
        p_quantity: item.quantity,
        p_unit: item.unit,
        p_unit_price: item.unit_price,
        p_notes: item.notes || null
      })
    );
    
    const itemResults = await Promise.all(itemPromises);
    
    // Check for errors in item creation
    const itemErrors = itemResults.filter(result => result.error);
    if (itemErrors.length > 0) {
      throw new Error(`Failed to create items: ${itemErrors.map(e => e.error.message).join(', ')}`);
    }
    
    // Extract item data
    const createdItems = itemResults.map(result => result.data);
    
    return {
      ...list,
      items: createdItems
    };
  }
  
  return {
    ...list,
    items: []
  };
}

/**
 * Get shopping lists for a user
 * @param {string} user_id - User ID
 * @param {Object} options - Query options
 * @returns {Array} - Array of shopping lists
 */
async function getShoppingLists(user_id, options = {}) {
  // Validate UUID format before attempting database connection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!user_id || !uuidRegex.test(user_id)) {
    throw new Error(`Invalid UUID format for user_id: ${user_id}`);
  }
  
  const supabase = getClient();
  
  // Use RPC function for better UUID handling
  // This avoids the 400 error when querying with UUID columns
  const { data, error } = await supabase.rpc('get_shopping_lists_by_user', {
    p_user_id: user_id,
    p_limit: options.limit || null,
    p_offset: options.offset || null,
    p_is_completed: options.is_completed !== undefined ? options.is_completed : null,
    p_market_id: options.market_id || null,
    p_order_by: options.orderBy || 'created_at',
    p_order_direction: options.orderDirection || 'desc'
  });
  
  if (error) {
    console.error('Supabase RPC error:', error);
    console.error('Query details - user_id:', user_id, 'options:', options);
    
    // Check if it's a "function not found" error and provide helpful message
    if (error.message && error.message.includes('Could not find the function')) {
      throw new Error(
        `Database error: The RPC function 'get_shopping_lists_by_user' is not installed in your Supabase database. ` +
        `Please run the SQL script from 'database/get_shopping_lists_by_user_rpc.sql' in your Supabase SQL Editor. ` +
        `See 'database/SUPABASE_SETUP.md' for detailed instructions. ` +
        `Original error: ${error.message}`
      );
    }
    
    throw new Error(`Database error: ${error.message}${error.details ? ' - ' + error.details : ''}${error.hint ? ' (Hint: ' + error.hint + ')' : ''}`);
  }
  
  return data || [];
}

/**
 * Get shopping list by ID
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @returns {Object|null} - Shopping list with items or null if not found
 */
async function getShoppingListById(id, user_id) {
  // Validate UUID formats before attempting database connection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    throw new Error(`Invalid UUID format for id: ${id}`);
  }
  if (!user_id || !uuidRegex.test(user_id)) {
    throw new Error(`Invalid UUID format for user_id: ${user_id}`);
  }
  
  const supabase = getClient();
  
  // Get the list from base table with market join
  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .select(`
      *,
      markets (
        name,
        address
      )
    `)
    .eq('id', id)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .single();
  
  if (listError) {
    if (listError.code === 'PGRST116') return null; // Not found
    console.error('Supabase query error:', listError);
    throw new Error(`Database error: ${listError.message}${listError.details ? ' - ' + listError.details : ''}`);
  }
  
  // Get the items
  const { data: items, error: itemsError } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('list_id', id)
    .order('category', { ascending: true })
    .order('unit_price', { ascending: true });
  
  if (itemsError) throw new Error(itemsError.message);
  
  // Transform list to match expected format (flatten markets)
  return {
    ...list,
    market_name: list.markets?.name || null,
    market_address: list.markets?.address || null,
    markets: undefined,
    items: items || []
  };
}

/**
 * Get shopping list by share code
 * @param {string} shareCode - 4-digit share code
 * @returns {Object|null} - Shopping list with items or null if not found
 */
async function getShoppingListByShareCode(shareCode) {
  const supabase = getClient();
  
  const { data, error } = await supabase.rpc('get_shopping_list_by_code', {
    p_share_code: shareCode
  });
  
  if (error) throw new Error(error.message);
  
  if (!data || data.length === 0) return null;
  
  const result = data[0];
  return {
    ...result.list_data,
    items: result.items_data || []
  };
}

/**
 * Update shopping list
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated shopping list
 */
async function updateShoppingList(id, user_id, updates) {
  // Validate UUID formats before attempting database connection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    throw new Error(`Invalid UUID format for id: ${id}`);
  }
  if (!user_id || !uuidRegex.test(user_id)) {
    throw new Error(`Invalid UUID format for user_id: ${user_id}`);
  }
  
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('shopping_lists')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();
  
  if (error) {
    console.error('Supabase update error:', error);
    throw new Error(`Database error: ${error.message}${error.details ? ' - ' + error.details : ''}`);
  }
  return data;
}

/**
 * Delete shopping list (soft delete)
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @returns {Object} - Deleted shopping list
 */
async function deleteShoppingList(id, user_id) {
  // Validate UUID formats before attempting database connection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    throw new Error(`Invalid UUID format for id: ${id}`);
  }
  if (!user_id || !uuidRegex.test(user_id)) {
    throw new Error(`Invalid UUID format for user_id: ${user_id}`);
  }
  
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('shopping_lists')
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();
  
  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Database error: ${error.message}${error.details ? ' - ' + error.details : ''}`);
  }
  return data;
}

/**
 * Add item to shopping list
 * @param {string} listId - Shopping list ID
 * @param {Object} itemData - Item data
 * @returns {Object} - Created item
 */
async function addItemToList(listId, itemData) {
  const supabase = getClient();
  
  const { data, error } = await supabase.rpc('add_shopping_list_item', {
    p_list_id: listId,
    p_product_name: itemData.product_name,
    p_category: itemData.category,
    p_quantity: itemData.quantity,
    p_unit: itemData.unit,
    p_unit_price: itemData.unit_price,
    p_notes: itemData.notes || null
  });
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update shopping list item
 * @param {string} itemId - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated item
 */
async function updateShoppingListItem(itemId, updates) {
  const supabase = getClient();
  
  // Calculate total_price if quantity or unit_price changed
  if (updates.quantity !== undefined || updates.unit_price !== undefined) {
    // Get current item data to calculate total
    const { data: currentItem, error: currentError } = await supabase
      .from('shopping_list_items')
      .select('quantity, unit_price')
      .eq('id', itemId)
      .single();
    
    if (currentError) throw new Error(currentError.message);
    
    const quantity = updates.quantity !== undefined ? updates.quantity : currentItem.quantity;
    const unitPrice = updates.unit_price !== undefined ? updates.unit_price : currentItem.unit_price;
    updates.total_price = quantity * unitPrice;
  }
  
  const { data, error } = await supabase
    .from('shopping_list_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete shopping list item
 * @param {string} itemId - Item ID
 * @returns {Object} - Deleted item
 */
async function deleteShoppingListItem(itemId) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  createShoppingList,
  getShoppingLists,
  getShoppingListById,
  getShoppingListByShareCode,
  updateShoppingList,
  deleteShoppingList,
  addItemToList,
  updateShoppingListItem,
  deleteShoppingListItem
};
