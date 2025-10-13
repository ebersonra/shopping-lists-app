-- RPC function to get shopping lists for a user
-- This function handles UUID casting properly and avoids the 400 error

CREATE OR REPLACE FUNCTION get_shopping_lists_by_user(
    p_user_id TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_is_completed BOOLEAN DEFAULT NULL,
    p_market_id TEXT DEFAULT NULL,
    p_order_by TEXT DEFAULT 'created_at',
    p_order_direction TEXT DEFAULT 'desc'
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    title TEXT,
    description TEXT,
    shopping_date DATE,
    market_id UUID,
    market_name TEXT,
    market_address TEXT,
    total_amount DECIMAL(10,2),
    share_code TEXT,
    is_completed BOOLEAN,
    items_count BIGINT,
    checked_items_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.id,
        sl.user_id,
        sl.title,
        sl.description,
        sl.shopping_date,
        sl.market_id,
        m.name as market_name,
        m.address as market_address,
        sl.total_amount,
        sl.share_code,
        sl.is_completed,
        (SELECT COUNT(*) FROM shopping_list_items WHERE list_id = sl.id)::BIGINT as items_count,
        (SELECT COUNT(*) FROM shopping_list_items WHERE list_id = sl.id AND is_checked = true)::BIGINT as checked_items_count,
        sl.created_at,
        sl.updated_at,
        sl.deleted_at
    FROM shopping_lists sl
    LEFT JOIN markets m ON sl.market_id = m.id
    WHERE sl.user_id = p_user_id::UUID
        AND sl.deleted_at IS NULL
        AND (p_is_completed IS NULL OR sl.is_completed = p_is_completed)
        AND (p_market_id IS NULL OR sl.market_id = p_market_id::UUID)
    ORDER BY 
        CASE WHEN p_order_by = 'created_at' AND p_order_direction = 'asc' THEN sl.created_at END ASC,
        CASE WHEN p_order_by = 'created_at' AND p_order_direction = 'desc' THEN sl.created_at END DESC,
        CASE WHEN p_order_by = 'shopping_date' AND p_order_direction = 'asc' THEN sl.shopping_date END ASC,
        CASE WHEN p_order_by = 'shopping_date' AND p_order_direction = 'desc' THEN sl.shopping_date END DESC,
        CASE WHEN p_order_by = 'updated_at' AND p_order_direction = 'asc' THEN sl.updated_at END ASC,
        CASE WHEN p_order_by = 'updated_at' AND p_order_direction = 'desc' THEN sl.updated_at END DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_shopping_lists_by_user(TEXT, INTEGER, INTEGER, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shopping_lists_by_user(TEXT, INTEGER, INTEGER, BOOLEAN, TEXT, TEXT, TEXT) TO anon;

COMMENT ON FUNCTION get_shopping_lists_by_user IS 'Get shopping lists for a user with proper UUID handling';
