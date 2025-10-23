-- ========================================================================
-- Payment Methods Table Creation Script
-- ========================================================================
-- Description: Creates the payment methods table for shopping lists
-- Date: 2025-10-23
-- Version: 1.0.0
--
-- This script creates the payment table to store payment method information
-- for shopping lists. Each user can have multiple payment methods, and each
-- shopping list can be associated with a payment method.
--
-- Usage (to be executed manually in Supabase):
--   Execute this script in your Supabase SQL editor
--
-- ========================================================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- PAYMENT METHODS TABLE
-- ========================================================================

-- Table for storing payment methods
CREATE TABLE IF NOT EXISTS payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'pix')),
    enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT payment_description_not_empty CHECK (description IS NULL OR length(trim(description)) > 0),
    CONSTRAINT payment_description_length CHECK (description IS NULL OR length(description) <= 200)
);

COMMENT ON TABLE payment IS 'Payment methods available for users to associate with shopping lists';
COMMENT ON COLUMN payment.id IS 'Unique payment method identifier (UUID)';
COMMENT ON COLUMN payment.user_id IS 'UUID of the user who owns this payment method';
COMMENT ON COLUMN payment.list_id IS 'Optional reference to shopping list (for list-specific payment methods)';
COMMENT ON COLUMN payment.type IS 'Payment type: debit, credit, or pix';
COMMENT ON COLUMN payment.enabled IS 'Whether this payment method is currently active';
COMMENT ON COLUMN payment.is_default IS 'Whether this is the default payment method for the user';
COMMENT ON COLUMN payment.description IS 'Description of the payment method (e.g., "My Visa Credit Card", "Banco do Brasil")';
COMMENT ON COLUMN payment.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- ========================================================================
-- INDEXES FOR PERFORMANCE
-- ========================================================================

-- Indexes for payment table
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_list_id ON payment(list_id) WHERE list_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_type ON payment(type);
CREATE INDEX IF NOT EXISTS idx_payment_enabled ON payment(enabled) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_is_default ON payment(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_deleted_at ON payment(deleted_at) WHERE deleted_at IS NULL;

-- ========================================================================
-- TRIGGERS
-- ========================================================================

-- Trigger to update payment.updated_at
CREATE TRIGGER trg_set_updated_at_payment
    BEFORE UPDATE ON payment
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ========================================================================
-- HELPER FUNCTIONS
-- ========================================================================

-- Function to ensure only one default payment per user
CREATE OR REPLACE FUNCTION enforce_single_default_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        -- Unset is_default for all other payment methods of this user
        UPDATE payment 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_default = TRUE
        AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION enforce_single_default_payment() IS 'Ensures only one default payment method per user';

-- Trigger to enforce single default payment
CREATE TRIGGER trg_enforce_single_default_payment
    BEFORE INSERT OR UPDATE ON payment
    FOR EACH ROW
    WHEN (NEW.is_default = TRUE)
    EXECUTE FUNCTION enforce_single_default_payment();

-- ========================================================================
-- ADD PAYMENT_ID TO SHOPPING_LISTS TABLE
-- ========================================================================

-- Add payment_id column to shopping_lists table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shopping_lists' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE shopping_lists 
        ADD COLUMN payment_id UUID REFERENCES payment(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_shopping_lists_payment_id 
        ON shopping_lists(payment_id) WHERE payment_id IS NOT NULL;
        
        COMMENT ON COLUMN shopping_lists.payment_id IS 'Reference to the payment method used for this shopping list';
    END IF;
END $$;

-- ========================================================================
-- STORED PROCEDURES / FUNCTIONS
-- ========================================================================

-- Function to get active payment methods for a user
CREATE OR REPLACE FUNCTION get_user_payment_methods(
    p_user_id UUID,
    p_enabled_only BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    list_id UUID,
    type TEXT,
    enabled BOOLEAN,
    is_default BOOLEAN,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.list_id,
        p.type,
        p.enabled,
        p.is_default,
        p.description,
        p.created_at,
        p.updated_at
    FROM payment p
    WHERE p.user_id = p_user_id
    AND p.deleted_at IS NULL
    AND (NOT p_enabled_only OR p.enabled = TRUE)
    ORDER BY p.is_default DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_payment_methods(UUID, BOOLEAN) IS 'Retrieves active payment methods for a user';

-- Function to create a payment method
CREATE OR REPLACE FUNCTION create_payment_method(
    p_user_id UUID,
    p_type TEXT,
    p_description TEXT,
    p_is_default BOOLEAN DEFAULT FALSE,
    p_enabled BOOLEAN DEFAULT TRUE,
    p_list_id UUID DEFAULT NULL
) RETURNS payment AS $$
DECLARE
    v_payment payment;
BEGIN
    -- Validate payment type
    IF p_type NOT IN ('debit', 'credit', 'pix') THEN
        RAISE EXCEPTION 'Invalid payment type. Must be: debit, credit, or pix';
    END IF;
    
    INSERT INTO payment (user_id, type, description, is_default, enabled, list_id)
    VALUES (p_user_id, p_type, p_description, p_is_default, p_enabled, p_list_id)
    RETURNING * INTO v_payment;
    
    RETURN v_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_payment_method(UUID, TEXT, TEXT, BOOLEAN, BOOLEAN, UUID) IS 'Creates a new payment method';

-- Function to update a payment method
CREATE OR REPLACE FUNCTION update_payment_method(
    p_payment_id UUID,
    p_user_id UUID,
    p_type TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_is_default BOOLEAN DEFAULT NULL,
    p_enabled BOOLEAN DEFAULT NULL
) RETURNS payment AS $$
DECLARE
    v_payment payment;
BEGIN
    -- Get current payment method
    SELECT * INTO v_payment FROM payment WHERE id = p_payment_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment method not found or does not belong to user';
    END IF;
    
    -- Validate payment type if provided
    IF p_type IS NOT NULL AND p_type NOT IN ('debit', 'credit', 'pix') THEN
        RAISE EXCEPTION 'Invalid payment type. Must be: debit, credit, or pix';
    END IF;
    
    -- Update only provided fields
    UPDATE payment
    SET 
        type = COALESCE(p_type, type),
        description = COALESCE(p_description, description),
        is_default = COALESCE(p_is_default, is_default),
        enabled = COALESCE(p_enabled, enabled)
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;
    
    RETURN v_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_payment_method(UUID, UUID, TEXT, TEXT, BOOLEAN, BOOLEAN) IS 'Updates an existing payment method';

-- Function to soft delete a payment method
CREATE OR REPLACE FUNCTION delete_payment_method(
    p_payment_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE payment 
    SET deleted_at = now(), enabled = FALSE
    WHERE id = p_payment_id 
    AND user_id = p_user_id 
    AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_payment_method(UUID, UUID) IS 'Soft deletes a payment method';

-- Function to get default payment method for a user
CREATE OR REPLACE FUNCTION get_default_payment_method(p_user_id UUID)
RETURNS payment AS $$
DECLARE
    v_payment payment;
BEGIN
    SELECT * INTO v_payment
    FROM payment
    WHERE user_id = p_user_id
    AND is_default = TRUE
    AND enabled = TRUE
    AND deleted_at IS NULL
    LIMIT 1;
    
    RETURN v_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_default_payment_method(UUID) IS 'Retrieves the default payment method for a user';

-- ========================================================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================================================

-- Insert sample payment methods for existing users
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get first sample user
    SELECT id INTO v_user_id FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440001'::UUID LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Add sample payment methods for the user
        INSERT INTO payment (user_id, type, description, is_default, enabled) VALUES
            (v_user_id, 'credit', 'Cartão Visa Platinum', true, true),
            (v_user_id, 'debit', 'Conta Banco do Brasil', false, true),
            (v_user_id, 'pix', 'PIX - Celular', false, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ========================================================================
-- VERIFICATION AND SUMMARY
-- ========================================================================

DO $$
DECLARE
    v_payment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_payment_count FROM payment WHERE deleted_at IS NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Payment table creation completed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Active payment methods: %', v_payment_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '- Payment methods table with user relationship';
    RAISE NOTICE '- Support for debit, credit, and pix payment types';
    RAISE NOTICE '- Default payment method enforcement';
    RAISE NOTICE '- Soft delete support';
    RAISE NOTICE '- payment_id column added to shopping_lists table';
    RAISE NOTICE '========================================';
END $$;

-- ========================================================================
-- END OF SCRIPT
-- ========================================================================
