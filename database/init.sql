-- ========================================================================
-- Shopping Lists Application - Database Initialization Script
-- ========================================================================
-- Description: Complete database setup for shopping lists application
-- Date: 2025-10-12
-- Version: 1.0.0
--
-- This script creates all necessary tables, functions, triggers, views,
-- and indexes for the shopping lists application with UUID support.
--
-- Requirements:
--   - PostgreSQL 12+ (for gen_random_uuid())
--   - Supabase or standard PostgreSQL instance
--
-- Usage:
--   psql -U your_user -d your_database -f init.sql
--
-- ========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- HELPER FUNCTIONS
-- ========================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_updated_at() IS 'Automatically updates the updated_at column to current timestamp';

-- ========================================================================
-- USERS TABLE
-- ========================================================================

-- Table for application users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    preferred_market_id UUID,
    skipped_onboarding BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT users_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT users_phone_format CHECK (phone IS NULL OR length(regexp_replace(phone, '\D', '', 'g')) >= 10),
    CONSTRAINT users_email_format CHECK (email IS NULL OR email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

COMMENT ON TABLE users IS 'Application users with profile information';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.name IS 'User full name (required)';
COMMENT ON COLUMN users.phone IS 'User phone number (WhatsApp)';
COMMENT ON COLUMN users.email IS 'User email address';
COMMENT ON COLUMN users.preferred_market_id IS 'Reference to user preferred market';
COMMENT ON COLUMN users.skipped_onboarding IS 'Whether user skipped the welcome onboarding';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_preferred_market_id ON users(preferred_market_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = TRUE;

-- Trigger to update users.updated_at
CREATE TRIGGER trg_set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ========================================================================
-- MARKETS TABLE
-- ========================================================================

-- Table for markets/stores
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    cnpj TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT markets_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT markets_cnpj_format CHECK (cnpj IS NULL OR length(regexp_replace(cnpj, '\D', '', 'g')) = 14),
    CONSTRAINT markets_email_format CHECK (email IS NULL OR email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

COMMENT ON TABLE markets IS 'Stores/markets where shopping is done';
COMMENT ON COLUMN markets.user_id IS 'UUID of the user who created the market';
COMMENT ON COLUMN markets.name IS 'Market name (required)';
COMMENT ON COLUMN markets.address IS 'Full address of the market';
COMMENT ON COLUMN markets.cnpj IS 'Brazilian company registration number (14 digits)';
COMMENT ON COLUMN markets.phone IS 'Contact phone number';
COMMENT ON COLUMN markets.email IS 'Contact email address';
COMMENT ON COLUMN markets.website IS 'Market website URL';
COMMENT ON COLUMN markets.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Indexes for markets table
CREATE INDEX IF NOT EXISTS idx_markets_user_id ON markets(user_id);
CREATE INDEX IF NOT EXISTS idx_markets_name ON markets(name);
CREATE INDEX IF NOT EXISTS idx_markets_cnpj ON markets(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_markets_deleted_at ON markets(deleted_at) WHERE deleted_at IS NULL;

-- Trigger to update markets.updated_at
CREATE TRIGGER trg_set_updated_at_markets
    BEFORE UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add foreign key constraint to users.preferred_market_id after markets table is created
ALTER TABLE users
    ADD CONSTRAINT fk_users_preferred_market 
    FOREIGN KEY (preferred_market_id) 
    REFERENCES markets(id) 
    ON DELETE SET NULL;

-- ========================================================================
-- SHOPPING LISTS TABLE
-- ========================================================================

-- Main shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    shopping_date DATE NOT NULL DEFAULT CURRENT_DATE,
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
    total_amount NUMERIC(10,2) DEFAULT 0.00,
    share_code TEXT NOT NULL UNIQUE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT shopping_lists_title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT shopping_lists_share_code_format CHECK (share_code ~ '^\d{4}$'),
    CONSTRAINT shopping_lists_total_amount_positive CHECK (total_amount >= 0)
);

COMMENT ON TABLE shopping_lists IS 'Shopping lists with shareable codes';
COMMENT ON COLUMN shopping_lists.user_id IS 'UUID of the user who created the list';
COMMENT ON COLUMN shopping_lists.title IS 'Shopping list title (required)';
COMMENT ON COLUMN shopping_lists.description IS 'Optional description of the shopping list';
COMMENT ON COLUMN shopping_lists.shopping_date IS 'Target date for shopping';
COMMENT ON COLUMN shopping_lists.market_id IS 'Reference to the market where shopping will be done';
COMMENT ON COLUMN shopping_lists.total_amount IS 'Calculated total amount of all items';
COMMENT ON COLUMN shopping_lists.share_code IS 'Unique 4-digit code for sharing the list';
COMMENT ON COLUMN shopping_lists.is_completed IS 'Whether the shopping is completed';
COMMENT ON COLUMN shopping_lists.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- ========================================================================
-- SHOPPING LIST ITEMS TABLE
-- ========================================================================

-- Shopping list items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'un',
    unit_price NUMERIC(10,2) DEFAULT 0.00,
    total_price NUMERIC(10,2) DEFAULT 0.00,
    is_checked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT shopping_list_items_product_name_not_empty CHECK (length(trim(product_name)) > 0),
    CONSTRAINT shopping_list_items_category_not_empty CHECK (length(trim(category)) > 0),
    CONSTRAINT shopping_list_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT shopping_list_items_unit_price_positive CHECK (unit_price >= 0),
    CONSTRAINT shopping_list_items_total_price_positive CHECK (total_price >= 0)
);

COMMENT ON TABLE shopping_list_items IS 'Items belonging to shopping lists';
COMMENT ON COLUMN shopping_list_items.list_id IS 'Reference to the parent shopping list';
COMMENT ON COLUMN shopping_list_items.product_name IS 'Name of the product (required)';
COMMENT ON COLUMN shopping_list_items.category IS 'Product category (required)';
COMMENT ON COLUMN shopping_list_items.quantity IS 'Quantity to purchase (must be positive)';
COMMENT ON COLUMN shopping_list_items.unit IS 'Unit of measurement (un, kg, g, l, ml, cx, pct)';
COMMENT ON COLUMN shopping_list_items.unit_price IS 'Price per unit';
COMMENT ON COLUMN shopping_list_items.total_price IS 'Calculated total (quantity * unit_price)';
COMMENT ON COLUMN shopping_list_items.is_checked IS 'Whether the item has been purchased';
COMMENT ON COLUMN shopping_list_items.notes IS 'Optional notes about the item';

-- ========================================================================
-- SHARE CODE GENERATION
-- ========================================================================

-- Function to generate unique 4-digit share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    max_attempts INTEGER := 100;
    attempt INTEGER := 0;
BEGIN
    LOOP
        -- Generate 4 random digits
        new_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Check if the code already exists
        SELECT EXISTS(
            SELECT 1 FROM shopping_lists 
            WHERE share_code = new_code 
            AND deleted_at IS NULL
        ) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
        
        -- Prevent infinite loop
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique share code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_share_code() IS 'Generates a unique 4-digit share code for shopping lists';

-- Trigger function to auto-generate share_code
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
        NEW.share_code := generate_share_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set share_code before insert
CREATE TRIGGER trg_set_share_code
    BEFORE INSERT ON shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION set_share_code();

-- ========================================================================
-- UPDATED_AT TRIGGERS
-- ========================================================================

-- Trigger to update shopping_lists.updated_at
CREATE TRIGGER trg_set_updated_at_shopping_lists
    BEFORE UPDATE ON shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Trigger to update shopping_list_items.updated_at
CREATE TRIGGER trg_set_updated_at_shopping_list_items
    BEFORE UPDATE ON shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ========================================================================
-- TOTAL AMOUNT CALCULATION
-- ========================================================================

-- Function to automatically update shopping list total
CREATE OR REPLACE FUNCTION update_shopping_list_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shopping_lists 
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM shopping_list_items 
        WHERE list_id = COALESCE(NEW.list_id, OLD.list_id)
    )
    WHERE id = COALESCE(NEW.list_id, OLD.list_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_shopping_list_total() IS 'Automatically recalculates shopping list total when items change';

-- Triggers to update total when items are modified
CREATE TRIGGER trg_update_list_total_insert
    AFTER INSERT ON shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_list_total();

CREATE TRIGGER trg_update_list_total_update
    AFTER UPDATE ON shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_list_total();

CREATE TRIGGER trg_update_list_total_delete
    AFTER DELETE ON shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_list_total();

-- ========================================================================
-- INDEXES FOR PERFORMANCE
-- ========================================================================

-- Shopping lists indexes
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_share_code ON shopping_lists(share_code);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_at ON shopping_lists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_shopping_date ON shopping_lists(shopping_date);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_market_id ON shopping_lists(market_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_deleted_at ON shopping_lists(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shopping_lists_is_completed ON shopping_lists(is_completed);

-- Shopping list items indexes
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON shopping_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_category ON shopping_list_items(category);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_is_checked ON shopping_list_items(is_checked);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_created_at ON shopping_list_items(created_at);

-- ========================================================================
-- VIEWS
-- ========================================================================

-- View for active shopping lists with market info and item counts
CREATE OR REPLACE VIEW active_shopping_lists AS
SELECT 
    sl.id,
    sl.user_id,
    sl.title,
    sl.description,
    sl.shopping_date,
    sl.market_id,
    sl.total_amount,
    sl.share_code,
    sl.is_completed,
    sl.created_at,
    sl.updated_at,
    sl.deleted_at,
    m.name as market_name,
    m.address as market_address,
    (SELECT COUNT(*) FROM shopping_list_items WHERE list_id = sl.id) as items_count,
    (SELECT COUNT(*) FROM shopping_list_items WHERE list_id = sl.id AND is_checked = true) as checked_items_count
FROM shopping_lists sl
LEFT JOIN markets m ON sl.market_id = m.id
WHERE sl.deleted_at IS NULL
ORDER BY sl.created_at DESC;

COMMENT ON VIEW active_shopping_lists IS 'Active shopping lists with market details and item statistics';

-- View for shopping list items grouped by category
CREATE OR REPLACE VIEW shopping_list_items_by_category AS
SELECT 
    sli.id,
    sli.list_id,
    sli.product_name,
    sli.category,
    sli.quantity,
    sli.unit,
    sli.unit_price,
    sli.total_price,
    sli.is_checked,
    sli.notes,
    sli.created_at,
    sli.updated_at,
    sl.title as list_title,
    sl.share_code,
    sl.user_id as list_user_id
FROM shopping_list_items sli
JOIN shopping_lists sl ON sli.list_id = sl.id
WHERE sl.deleted_at IS NULL
ORDER BY sli.category ASC, sli.product_name ASC;

COMMENT ON VIEW shopping_list_items_by_category IS 'Shopping list items with parent list info, organized by category';

-- ========================================================================
-- STORED PROCEDURES / FUNCTIONS
-- ========================================================================

-- Function to get shopping list by share code
CREATE OR REPLACE FUNCTION get_shopping_list_by_code(p_share_code TEXT)
RETURNS TABLE(
    list_data jsonb,
    items_data jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        json_build_object(
            'id', sl.id,
            'user_id', sl.user_id,
            'title', sl.title,
            'description', sl.description,
            'shopping_date', sl.shopping_date,
            'market_id', sl.market_id,
            'market_name', sl.market_name,
            'market_address', sl.market_address,
            'total_amount', sl.total_amount,
            'share_code', sl.share_code,
            'is_completed', sl.is_completed,
            'items_count', sl.items_count,
            'checked_items_count', sl.checked_items_count,
            'created_at', sl.created_at,
            'updated_at', sl.updated_at,
            'deleted_at', sl.deleted_at
        )::jsonb as list_data,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', sli.id,
                    'product_name', sli.product_name,
                    'category', sli.category,
                    'quantity', sli.quantity,
                    'unit', sli.unit,
                    'unit_price', sli.unit_price,
                    'total_price', sli.total_price,
                    'is_checked', sli.is_checked,
                    'notes', sli.notes,
                    'created_at', sli.created_at,
                    'updated_at', sli.updated_at
                ) ORDER BY sli.category, sli.product_name
            ) FILTER (WHERE sli.id IS NOT NULL),
            '[]'::json
        )::jsonb as items_data
    FROM active_shopping_lists sl
    LEFT JOIN shopping_list_items sli ON sl.id = sli.list_id
    WHERE sl.share_code = p_share_code
    GROUP BY 
        sl.id, sl.user_id, sl.title, sl.description, sl.shopping_date, 
        sl.market_id, sl.market_name, sl.market_address, sl.total_amount, 
        sl.share_code, sl.is_completed, sl.items_count, sl.checked_items_count,
        sl.created_at, sl.updated_at, sl.deleted_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_shopping_list_by_code(TEXT) IS 'Retrieves a shopping list and its items by share code';

-- Function to create a shopping list
CREATE OR REPLACE FUNCTION create_shopping_list(
    p_user_id UUID,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_shopping_date DATE DEFAULT CURRENT_DATE,
    p_market_id UUID DEFAULT NULL
) RETURNS shopping_lists AS $$
DECLARE
    v_list shopping_lists;
BEGIN
    INSERT INTO shopping_lists (user_id, title, description, shopping_date, market_id)
    VALUES (p_user_id, p_title, p_description, p_shopping_date, p_market_id)
    RETURNING * INTO v_list;
    
    RETURN v_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_shopping_list(UUID, TEXT, TEXT, DATE, UUID) IS 'Creates a new shopping list';

-- Function to add item to shopping list
CREATE OR REPLACE FUNCTION add_shopping_list_item(
    p_list_id UUID,
    p_product_name TEXT,
    p_category TEXT,
    p_quantity NUMERIC DEFAULT 1,
    p_unit TEXT DEFAULT 'un',
    p_unit_price NUMERIC DEFAULT 0.00,
    p_notes TEXT DEFAULT NULL
) RETURNS shopping_list_items AS $$
DECLARE
    v_item shopping_list_items;
    v_total_price NUMERIC;
BEGIN
    -- Calculate total price
    v_total_price := p_quantity * p_unit_price;
    
    INSERT INTO shopping_list_items (
        list_id, product_name, category, quantity, unit, unit_price, total_price, notes
    )
    VALUES (
        p_list_id, p_product_name, p_category, p_quantity, p_unit, p_unit_price, v_total_price, p_notes
    )
    RETURNING * INTO v_item;
    
    RETURN v_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_shopping_list_item(UUID, TEXT, TEXT, NUMERIC, TEXT, NUMERIC, TEXT) IS 'Adds an item to a shopping list';

-- Function to update shopping list item
CREATE OR REPLACE FUNCTION update_shopping_list_item(
    p_item_id UUID,
    p_product_name TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_quantity NUMERIC DEFAULT NULL,
    p_unit TEXT DEFAULT NULL,
    p_unit_price NUMERIC DEFAULT NULL,
    p_is_checked BOOLEAN DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS shopping_list_items AS $$
DECLARE
    v_item shopping_list_items;
    v_new_total_price NUMERIC;
BEGIN
    -- Get current item
    SELECT * INTO v_item FROM shopping_list_items WHERE id = p_item_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shopping list item not found with id: %', p_item_id;
    END IF;
    
    -- Update only provided fields
    IF p_product_name IS NOT NULL THEN
        v_item.product_name := p_product_name;
    END IF;
    
    IF p_category IS NOT NULL THEN
        v_item.category := p_category;
    END IF;
    
    IF p_quantity IS NOT NULL THEN
        v_item.quantity := p_quantity;
    END IF;
    
    IF p_unit IS NOT NULL THEN
        v_item.unit := p_unit;
    END IF;
    
    IF p_unit_price IS NOT NULL THEN
        v_item.unit_price := p_unit_price;
    END IF;
    
    IF p_is_checked IS NOT NULL THEN
        v_item.is_checked := p_is_checked;
    END IF;
    
    IF p_notes IS NOT NULL THEN
        v_item.notes := p_notes;
    END IF;
    
    -- Recalculate total price
    v_new_total_price := v_item.quantity * v_item.unit_price;
    
    -- Update the record
    UPDATE shopping_list_items 
    SET 
        product_name = v_item.product_name,
        category = v_item.category,
        quantity = v_item.quantity,
        unit = v_item.unit,
        unit_price = v_item.unit_price,
        total_price = v_new_total_price,
        is_checked = v_item.is_checked,
        notes = v_item.notes
    WHERE id = p_item_id
    RETURNING * INTO v_item;
    
    RETURN v_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_shopping_list_item(UUID, TEXT, TEXT, NUMERIC, TEXT, NUMERIC, BOOLEAN, TEXT) IS 'Updates an existing shopping list item';

-- Function to soft delete a shopping list
CREATE OR REPLACE FUNCTION delete_shopping_list(
    p_list_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE shopping_lists 
    SET deleted_at = now()
    WHERE id = p_list_id AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_shopping_list(UUID) IS 'Soft deletes a shopping list';

-- Function to remove item from shopping list
CREATE OR REPLACE FUNCTION remove_shopping_list_item(
    p_item_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM shopping_list_items WHERE id = p_item_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION remove_shopping_list_item(UUID) IS 'Permanently removes an item from a shopping list';

-- Function to get user's shopping lists
CREATE OR REPLACE FUNCTION get_user_shopping_lists(
    p_user_id UUID,
    p_include_completed BOOLEAN DEFAULT TRUE,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
    id UUID,
    user_id UUID,
    title TEXT,
    description TEXT,
    shopping_date DATE,
    market_id UUID,
    market_name TEXT,
    market_address TEXT,
    total_amount NUMERIC,
    share_code TEXT,
    is_completed BOOLEAN,
    items_count BIGINT,
    checked_items_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        asl.id,
        asl.user_id,
        asl.title,
        asl.description,
        asl.shopping_date,
        asl.market_id,
        asl.market_name,
        asl.market_address,
        asl.total_amount,
        asl.share_code,
        asl.is_completed,
        asl.items_count,
        asl.checked_items_count,
        asl.created_at,
        asl.updated_at
    FROM active_shopping_lists asl
    WHERE asl.user_id = p_user_id
    AND (p_include_completed OR asl.is_completed = FALSE)
    ORDER BY asl.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_shopping_lists(UUID, BOOLEAN, INTEGER, INTEGER) IS 'Retrieves shopping lists for a specific user with pagination';

-- Function to create a new user
CREATE OR REPLACE FUNCTION create_user(
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_preferred_market_id UUID DEFAULT NULL,
    p_skipped_onboarding BOOLEAN DEFAULT FALSE
) RETURNS users AS $$
DECLARE
    v_user users;
BEGIN
    INSERT INTO users (name, phone, email, preferred_market_id, skipped_onboarding)
    VALUES (p_name, p_phone, p_email, p_preferred_market_id, p_skipped_onboarding)
    RETURNING * INTO v_user;
    
    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_user(TEXT, TEXT, TEXT, UUID, BOOLEAN) IS 'Creates a new user account';

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user(
    p_user_id UUID,
    p_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_preferred_market_id UUID DEFAULT NULL
) RETURNS users AS $$
DECLARE
    v_user users;
BEGIN
    -- Get current user
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found with id: %', p_user_id;
    END IF;
    
    -- Update only provided fields
    UPDATE users
    SET 
        name = COALESCE(p_name, name),
        phone = COALESCE(p_phone, phone),
        email = COALESCE(p_email, email),
        preferred_market_id = COALESCE(p_preferred_market_id, preferred_market_id)
    WHERE id = p_user_id
    RETURNING * INTO v_user;
    
    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_user(UUID, TEXT, TEXT, TEXT, UUID) IS 'Updates user profile information';

-- Function to get user by id
CREATE OR REPLACE FUNCTION get_user_by_id(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    phone TEXT,
    email TEXT,
    preferred_market_id UUID,
    preferred_market_name TEXT,
    skipped_onboarding BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.phone,
        u.email,
        u.preferred_market_id,
        m.name as preferred_market_name,
        u.skipped_onboarding,
        u.is_active,
        u.created_at,
        u.updated_at
    FROM users u
    LEFT JOIN markets m ON u.preferred_market_id = m.id
    WHERE u.id = p_user_id
    AND u.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_by_id(UUID) IS 'Retrieves user information by ID with preferred market details';

-- Function to get user by phone
CREATE OR REPLACE FUNCTION get_user_by_phone(p_phone TEXT)
RETURNS TABLE(
    id UUID,
    name TEXT,
    phone TEXT,
    email TEXT,
    preferred_market_id UUID,
    preferred_market_name TEXT,
    skipped_onboarding BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.phone,
        u.email,
        u.preferred_market_id,
        m.name as preferred_market_name,
        u.skipped_onboarding,
        u.is_active,
        u.created_at,
        u.updated_at
    FROM users u
    LEFT JOIN markets m ON u.preferred_market_id = m.id
    WHERE u.phone = p_phone
    AND u.deleted_at IS NULL
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_by_phone(TEXT) IS 'Retrieves user information by phone number';

-- Function to soft delete a user
CREATE OR REPLACE FUNCTION delete_user(
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET deleted_at = now(), is_active = FALSE
    WHERE id = p_user_id AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_user(UUID) IS 'Soft deletes a user account';

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS TABLE(
    total_lists INTEGER,
    completed_lists INTEGER,
    active_lists INTEGER,
    total_items INTEGER,
    total_spent NUMERIC,
    favorite_market TEXT,
    favorite_category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT sl.id)::INTEGER as total_lists,
        COUNT(DISTINCT CASE WHEN sl.is_completed THEN sl.id END)::INTEGER as completed_lists,
        COUNT(DISTINCT CASE WHEN NOT sl.is_completed AND sl.deleted_at IS NULL THEN sl.id END)::INTEGER as active_lists,
        COUNT(sli.id)::INTEGER as total_items,
        COALESCE(SUM(sl.total_amount), 0)::NUMERIC as total_spent,
        (
            SELECT m.name 
            FROM shopping_lists sl2 
            JOIN markets m ON sl2.market_id = m.id 
            WHERE sl2.user_id = p_user_id 
            GROUP BY m.name 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as favorite_market,
        (
            SELECT sli2.category 
            FROM shopping_list_items sli2
            JOIN shopping_lists sl2 ON sli2.list_id = sl2.id
            WHERE sl2.user_id = p_user_id
            GROUP BY sli2.category
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as favorite_category
    FROM users u
    LEFT JOIN shopping_lists sl ON u.id = sl.user_id
    LEFT JOIN shopping_list_items sli ON sl.id = sli.list_id
    WHERE u.id = p_user_id
    GROUP BY u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_statistics(UUID) IS 'Retrieves comprehensive statistics for a user';

-- ========================================================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- ========================================================================

-- Insert sample users
INSERT INTO users (id, name, phone, email, skipped_onboarding) VALUES
    (
        '550e8400-e29b-41d4-a716-446655440001'::UUID,
        'Ana Silva',
        '11987654321',
        'ana.silva@email.com',
        false
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002'::UUID,
        'João Santos',
        '11912345678',
        'joao.santos@email.com',
        false
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003'::UUID,
        'Maria Oliveira',
        '11998765432',
        'maria.oliveira@email.com',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- Insert sample markets
INSERT INTO markets (id, user_id, name, address, cnpj, phone) VALUES
    (
        '650e8400-e29b-41d4-a716-446655440001'::UUID,
        '550e8400-e29b-41d4-a716-446655440001'::UUID,
        'Supermercado Central',
        'Av. Principal, 1000 - Centro',
        '12345678000190',
        '11987654321'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440002'::UUID,
        '550e8400-e29b-41d4-a716-446655440001'::UUID,
        'Mercado do Bairro',
        'Rua das Flores, 500 - Jardim',
        '98765432000112',
        '11912345678'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440003'::UUID,
        '550e8400-e29b-41d4-a716-446655440002'::UUID,
        'Atacadão Popular',
        'Av. dos Estados, 2500 - Industrial',
        '11223344000155',
        '11955667788'
    )
ON CONFLICT (id) DO NOTHING;

-- Update users with preferred markets
UPDATE users SET preferred_market_id = '650e8400-e29b-41d4-a716-446655440001'::UUID 
WHERE id = '550e8400-e29b-41d4-a716-446655440001'::UUID;

UPDATE users SET preferred_market_id = '650e8400-e29b-41d4-a716-446655440003'::UUID 
WHERE id = '550e8400-e29b-41d4-a716-446655440002'::UUID;

-- Insert sample shopping lists
INSERT INTO shopping_lists (id, user_id, title, description, shopping_date, market_id, share_code) VALUES
    (
        '750e8400-e29b-41d4-a716-446655440001'::UUID,
        '550e8400-e29b-41d4-a716-446655440001'::UUID,
        'Compras da Semana',
        'Lista de compras para a semana',
        CURRENT_DATE,
        '650e8400-e29b-41d4-a716-446655440001'::UUID,
        '1234'
    ),
    (
        '750e8400-e29b-41d4-a716-446655440002'::UUID,
        '550e8400-e29b-41d4-a716-446655440001'::UUID,
        'Churrasco do Final de Semana',
        'Itens para o churrasco de sábado',
        CURRENT_DATE + INTERVAL '3 days',
        '650e8400-e29b-41d4-a716-446655440001'::UUID,
        '5678'
    ),
    (
        '750e8400-e29b-41d4-a716-446655440003'::UUID,
        '550e8400-e29b-41d4-a716-446655440002'::UUID,
        'Compras do Mês',
        'Compras mensais no atacado',
        CURRENT_DATE,
        '650e8400-e29b-41d4-a716-446655440003'::UUID,
        '9012'
    )
ON CONFLICT (share_code) DO NOTHING;

-- Insert sample items (requires list IDs from above)
DO $$
DECLARE
    v_list_id UUID;
BEGIN
    -- Get first list ID (Ana Silva's weekly shopping)
    v_list_id := '750e8400-e29b-41d4-a716-446655440001'::UUID;
    
    IF EXISTS (SELECT 1 FROM shopping_lists WHERE id = v_list_id) THEN
        INSERT INTO shopping_list_items (list_id, product_name, category, quantity, unit, unit_price, total_price) VALUES
            (v_list_id, 'Arroz Branco 5kg', 'Cereais e Grãos', 1, 'pct', 15.90, 15.90),
            (v_list_id, 'Feijão Preto 1kg', 'Cereais e Grãos', 2, 'pct', 7.50, 15.00),
            (v_list_id, 'Óleo de Soja 900ml', 'Mercearia', 1, 'un', 4.99, 4.99),
            (v_list_id, 'Leite Integral 1L', 'Laticínios', 3, 'un', 4.20, 12.60),
            (v_list_id, 'Pão Francês', 'Padaria', 0.5, 'kg', 12.00, 6.00),
            (v_list_id, 'Café Torrado 500g', 'Mercearia', 1, 'pct', 18.90, 18.90),
            (v_list_id, 'Açúcar Cristal 1kg', 'Mercearia', 1, 'pct', 4.50, 4.50);
    END IF;
    
    -- Get second list ID (Ana Silva's BBQ shopping)
    v_list_id := '750e8400-e29b-41d4-a716-446655440002'::UUID;
    
    IF EXISTS (SELECT 1 FROM shopping_lists WHERE id = v_list_id) THEN
        INSERT INTO shopping_list_items (list_id, product_name, category, quantity, unit, unit_price, total_price) VALUES
            (v_list_id, 'Picanha Premium', 'Açougue', 1.5, 'kg', 65.00, 97.50),
            (v_list_id, 'Linguiça Toscana', 'Açougue', 0.8, 'kg', 28.00, 22.40),
            (v_list_id, 'Costela Bovina', 'Açougue', 2.0, 'kg', 35.00, 70.00),
            (v_list_id, 'Carvão 5kg', 'Utilidades', 1, 'pct', 18.00, 18.00),
            (v_list_id, 'Cerveja Lata 350ml', 'Bebidas', 12, 'un', 3.50, 42.00),
            (v_list_id, 'Refrigerante 2L', 'Bebidas', 3, 'un', 6.00, 18.00),
            (v_list_id, 'Pão de Alho', 'Padaria', 2, 'un', 8.50, 17.00);
    END IF;
    
    -- Get third list ID (João Santos' monthly shopping)
    v_list_id := '750e8400-e29b-41d4-a716-446655440003'::UUID;
    
    IF EXISTS (SELECT 1 FROM shopping_lists WHERE id = v_list_id) THEN
        INSERT INTO shopping_list_items (list_id, product_name, category, quantity, unit, unit_price, total_price) VALUES
            (v_list_id, 'Arroz 5kg - Fardo 6un', 'Cereais e Grãos', 1, 'fardo', 85.00, 85.00),
            (v_list_id, 'Feijão 1kg - Fardo 10un', 'Cereais e Grãos', 1, 'fardo', 68.00, 68.00),
            (v_list_id, 'Óleo 900ml - Caixa 20un', 'Mercearia', 1, 'cx', 89.00, 89.00),
            (v_list_id, 'Papel Higiênico - Fardo 64 rolos', 'Higiene', 1, 'fardo', 120.00, 120.00),
            (v_list_id, 'Detergente - Caixa 24un', 'Limpeza', 1, 'cx', 48.00, 48.00);
    END IF;
END $$;

-- ========================================================================
-- VERIFICATION AND SUMMARY
-- ========================================================================

DO $$
DECLARE
    v_users_count INTEGER;
    v_markets_count INTEGER;
    v_lists_count INTEGER;
    v_items_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_users_count FROM users;
    SELECT COUNT(*) INTO v_markets_count FROM markets;
    SELECT COUNT(*) INTO v_lists_count FROM shopping_lists;
    SELECT COUNT(*) INTO v_items_count FROM shopping_list_items;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database initialization completed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Users: %', v_users_count;
    RAISE NOTICE 'Markets: %', v_markets_count;
    RAISE NOTICE 'Shopping Lists: %', v_lists_count;
    RAISE NOTICE 'Shopping List Items: %', v_items_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Sample data created:';
    RAISE NOTICE '- 3 users (Ana Silva, João Santos, Maria Oliveira)';
    RAISE NOTICE '- 3 markets (Supermercado Central, Mercado do Bairro, Atacadão Popular)';
    RAISE NOTICE '- 3 shopping lists with items';
    RAISE NOTICE '========================================';
END $$;

-- ========================================================================
-- END OF INITIALIZATION SCRIPT
-- ========================================================================
