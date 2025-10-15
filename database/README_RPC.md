# Database Migration - RPC Function for Getting Shopping Lists

## Purpose
This RPC function fixes the 400 Bad Request error when loading shopping lists after the UUID migration.

## Problem
After migrating the `user_id` column from TEXT to UUID, direct queries using `.eq('user_id', user_id)` fail because PostgREST/Supabase doesn't automatically cast string UUIDs to the UUID type properly in all cases.

## Solution
Create an RPC function that explicitly handles UUID casting on the PostgreSQL side.

## How to Apply

### For Supabase Projects
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the contents of `get_shopping_lists_by_user_rpc.sql`
5. Execute the query
6. Verify the function was created successfully

### Verification
Run this query to verify the function exists:
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_shopping_lists_by_user';
```

### Test the Function
```sql
SELECT * FROM get_shopping_lists_by_user(
    '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',  -- p_user_id
    50,  -- p_limit
    0,   -- p_offset
    NULL, -- p_is_completed
    NULL, -- p_market_id
    'created_at', -- p_order_by
    'desc' -- p_order_direction
);
```

## Function Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| p_user_id | TEXT | Required | User ID (will be cast to UUID) |
| p_limit | INTEGER | 50 | Maximum number of results |
| p_offset | INTEGER | 0 | Number of results to skip |
| p_is_completed | BOOLEAN | NULL | Filter by completion status (NULL = all) |
| p_market_id | TEXT | NULL | Filter by market ID |
| p_order_by | TEXT | 'created_at' | Field to order by |
| p_order_direction | TEXT | 'desc' | Order direction ('asc' or 'desc') |

## Return Columns

- `id`: Shopping list ID (UUID)
- `user_id`: User ID (UUID)
- `title`: List title
- `description`: List description
- `shopping_date`: Date of shopping
- `market_id`: Market ID (UUID)
- `market_name`: Name of the market
- `market_address`: Address of the market
- `total_amount`: Total amount (DECIMAL)
- `share_code`: 4-digit share code
- `is_completed`: Completion status
- `items_count`: Number of items in the list
- `checked_items_count`: Number of checked items
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `deleted_at`: Deletion timestamp (NULL if not deleted)

## Benefits

1. **Proper UUID Handling**: Explicitly casts string parameters to UUID type
2. **Single Query**: Aggregates item counts in the same query (better performance)
3. **Flexible Filtering**: Supports filtering by completion status and market
4. **Flexible Ordering**: Supports ordering by different fields and directions
5. **Pagination**: Built-in support for limit and offset

## Security

The function is created with `SECURITY DEFINER`, which means it runs with the privileges of the function creator. Ensure proper RLS (Row Level Security) policies are in place on the underlying tables.

Permissions are granted to:
- `authenticated` - Logged-in users
- `anon` - Anonymous users (if your app allows public access)

## Troubleshooting

### Function not found
```
ERROR: function get_shopping_lists_by_user does not exist
```
**Solution**: Run the migration SQL to create the function.

### Permission denied
```
ERROR: permission denied for function get_shopping_lists_by_user
```
**Solution**: Grant execute permission:
```sql
GRANT EXECUTE ON FUNCTION get_shopping_lists_by_user TO authenticated;
```

### Invalid UUID format
```
ERROR: invalid input syntax for type uuid
```
**Solution**: Ensure the user_id parameter is a valid UUID format (e.g., '9eb946b7-7e29-4460-a9cf-81aebac2ea4c').

## Related Files

- `get_shopping_lists_by_user_rpc.sql` - The RPC function definition
- `src/repositories/shoppingListRepository.js` - Uses this RPC function
- `FIX_DOCUMENTATION.md` - Full documentation of the fix
