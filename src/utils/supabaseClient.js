/**
 * Supabase Client Utility
 * Manages connection and operations with Supabase
 * 
 * Configuration is loaded from config.js (which reads from environment)
 */

// Get configuration from APP_ENV (set by config.js)
function getSupabaseConfig() {
    // Check if config is loaded
    if (typeof window !== 'undefined' && window.APP_ENV) {
        return {
            url: window.APP_ENV.SUPABASE_URL,
            anonKey: window.APP_ENV.SUPABASE_ANON_KEY
        };
    }
    
    // Fallback: Try to get from environment variables (for Node.js context)
    if (typeof process !== 'undefined' && process.env) {
        return {
            url: process.env.SUPABASE_URL,
            anonKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_API_KEY
        };
    }
    
    // Last resort: throw error
    console.error('❌ Supabase configuration not found!');
    console.error('Make sure to include config.js before supabaseClient.js');
    throw new Error('Supabase configuration not available. Include config.js first.');
}

// Initialize Supabase client (will be loaded from CDN in HTML)
let supabaseClient = null;

/**
 * Initialize Supabase client
 * @returns {Object} Supabase client instance
 */
function initSupabase() {
    if (supabaseClient) {
        return supabaseClient;
    }

    if (typeof window !== 'undefined' && window.supabase) {
        const config = getSupabaseConfig();
        
        supabaseClient = window.supabase.createClient(
            config.url,
            config.anonKey
        );
        
        console.log('✅ Supabase client initialized');
        console.log('   URL:', config.url);
        console.log('   Key:', config.anonKey ? '✓ Loaded from config' : '✗ Missing');
        
        return supabaseClient;
    }

    console.error('❌ Supabase library not loaded');
    console.error('Add this to your HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return null;
}

/**
 * Get Supabase client instance
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

/**
 * User Management Functions
 */

/**
 * Get user by phone number
 * @param {string} phone - Phone number (digits only)
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByPhone(phone) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // Remove non-digit characters
        const cleanPhone = phone.replace(/\D/g, '');

        const { data, error } = await client
            .rpc('get_user_by_phone', { p_phone: cleanPhone });

        if (error) {
            console.error('Error fetching user by phone:', error);
            return null;
        }

        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Exception in getUserByPhone:', error);
        return null;
    }
}

/**
 * Get user by ID
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserById(userId) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await client
            .rpc('get_user_by_id', { p_user_id: userId });

        if (error) {
            console.error('Error fetching user by ID:', error);
            return null;
        }

        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Exception in getUserById:', error);
        return null;
    }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.name - User name
 * @param {string} [userData.phone] - User phone
 * @param {string} [userData.email] - User email
 * @param {string} [userData.preferred_market_id] - Preferred market UUID
 * @param {boolean} [userData.skipped_onboarding] - Whether skipped onboarding
 * @returns {Promise<Object|null>} Created user object or null
 */
async function createUser(userData) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // Clean phone if provided
        const cleanPhone = userData.phone ? userData.phone.replace(/\D/g, '') : null;

        const { data, error } = await client
            .rpc('create_user', {
                p_name: userData.name,
                p_phone: cleanPhone,
                p_email: userData.email || null,
                p_preferred_market_id: userData.preferred_market_id || null,
                p_skipped_onboarding: userData.skipped_onboarding || false
            });

        if (error) {
            console.error('Error creating user:', error);
            return null;
        }

        console.log('✅ User created successfully:', data);
        return data;
    } catch (error) {
        console.error('Exception in createUser:', error);
        return null;
    }
}

/**
 * Get or create user by phone
 * If user exists, returns existing user
 * If user doesn't exist, creates new user
 * @param {Object} userData - User data
 * @returns {Promise<Object|null>} User object or null
 */
async function getOrCreateUser(userData) {
    try {
        // Try to get existing user by phone
        if (userData.phone) {
            const existingUser = await getUserByPhone(userData.phone);
            if (existingUser) {
                console.log('✅ Existing user found:', existingUser);
                return existingUser;
            }
        }

        // User doesn't exist, create new one
        console.log('📝 Creating new user...');
        const newUser = await createUser(userData);
        return newUser;
    } catch (error) {
        console.error('Exception in getOrCreateUser:', error);
        return null;
    }
}

/**
 * Update user profile
 * @param {string} userId - User UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated user object or null
 */
async function updateUser(userId, updates) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // Clean phone if provided
        const cleanPhone = updates.phone ? updates.phone.replace(/\D/g, '') : null;

        const { data, error } = await client
            .rpc('update_user', {
                p_user_id: userId,
                p_name: updates.name || null,
                p_phone: cleanPhone,
                p_email: updates.email || null,
                p_preferred_market_id: updates.preferred_market_id || null
            });

        if (error) {
            console.error('Error updating user:', error);
            return null;
        }

        console.log('✅ User updated successfully');
        return data;
    } catch (error) {
        console.error('Exception in updateUser:', error);
        return null;
    }
}

/**
 * Get user statistics
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} User statistics or null
 */
async function getUserStatistics(userId) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await client
            .rpc('get_user_statistics', { p_user_id: userId });

        if (error) {
            console.error('Error fetching user statistics:', error);
            return null;
        }

        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Exception in getUserStatistics:', error);
        return null;
    }
}

/**
 * Find or create market by name
 * @param {string} marketName - Market name
 * @param {string} userId - User UUID who is creating the market
 * @returns {Promise<string|null>} Market UUID or null
 */
async function findOrCreateMarket(marketName, userId) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // First, try to find existing market by name
        const { data: existingMarkets, error: searchError } = await client
            .from('markets')
            .select('id')
            .ilike('name', `%${marketName}%`)
            .is('deleted_at', null)
            .limit(1);

        if (!searchError && existingMarkets && existingMarkets.length > 0) {
            console.log('✅ Found existing market:', existingMarkets[0].id);
            return existingMarkets[0].id;
        }

        // Market doesn't exist, create new one
        const marketData = {
            user_id: userId,
            name: marketName.charAt(0).toUpperCase() + marketName.slice(1),
            address: null,
            cnpj: null,
            phone: null,
            email: null,
            website: null
        };

        const { data: newMarket, error: createError } = await client
            .from('markets')
            .insert([marketData])
            .select()
            .single();

        if (createError) {
            console.error('Error creating market:', createError);
            return null;
        }

        console.log('✅ Market created successfully:', newMarket.id);
        return newMarket.id;
    } catch (error) {
        console.error('Exception in findOrCreateMarket:', error);
        return null;
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSupabase,
        getSupabaseClient,
        getUserByPhone,
        getUserById,
        createUser,
        getOrCreateUser,
        updateUser,
        getUserStatistics,
        findOrCreateMarket
    };
}

// Make functions available globally for browser
if (typeof window !== 'undefined') {
    window.SupabaseUtils = {
        initSupabase,
        getSupabaseClient,
        getUserByPhone,
        getUserById,
        createUser,
        getOrCreateUser,
        updateUser,
        getUserStatistics,
        findOrCreateMarket
    };
}
