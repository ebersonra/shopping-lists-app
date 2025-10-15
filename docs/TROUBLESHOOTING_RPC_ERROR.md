# 🔧 Troubleshooting: RPC Function Not Found Error

## Error Message

```
Database error: Could not find the function public.get_shopping_lists_by_user(p_is_completed, p_limit, p_market_id, p_offset, p_order_by, p_order_direction, p_user_id) in the schema cache
```

## What This Means

This error occurs when the application tries to call a database function that hasn't been created in your Supabase database. The application uses an RPC (Remote Procedure Call) function to efficiently fetch shopping lists with proper UUID handling.

## Why This Happens

The Supabase database needs to have the RPC function installed. This is a one-time setup step that must be performed after creating your Supabase project.

## Solution

### Option 1: Quick Fix (Recommended)

1. **Go to Supabase SQL Editor**
   - Login to https://app.supabase.com
   - Select your project
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the RPC Function Script**
   - Click **New Query**
   - Copy the entire contents of `database/get_shopping_lists_by_user_rpc.sql`
   - Paste into the SQL Editor
   - Click **RUN** or press `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)

3. **Verify Installation**
   Run this query to confirm the function was created:
   ```sql
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_name = 'get_shopping_lists_by_user';
   ```
   
   Expected result:
   ```
   routine_name                 | routine_type
   ---------------------------- | ------------
   get_shopping_lists_by_user  | FUNCTION
   ```

4. **Test the Function**
   ```sql
   SELECT * FROM get_shopping_lists_by_user(
       '9eb946b7-7e29-4460-a9cf-81aebac2ea4c',  -- your user_id
       50,    -- limit
       0,     -- offset
       NULL,  -- is_completed (NULL = all)
       NULL,  -- market_id (NULL = all)
       'created_at',  -- order by
       'desc' -- direction
   );
   ```

5. **Retry Your Application**
   - Refresh your browser
   - Try loading shopping lists again

### Option 2: Complete Database Setup

If you haven't set up the database yet, follow the complete setup guide:

1. Read `database/SUPABASE_SETUP.md`
2. Execute `database/init.sql` (creates tables and sample data)
3. Execute `database/get_shopping_lists_by_user_rpc.sql` (creates the RPC function)
4. Configure RLS policies if needed

## Understanding the RPC Function

The `get_shopping_lists_by_user` function:
- **Purpose**: Fetches shopping lists for a specific user
- **Benefits**: 
  - Proper UUID type casting
  - Efficient aggregation (counts items in one query)
  - Flexible filtering and sorting
  - Built-in pagination
- **Security**: Runs with `SECURITY DEFINER` privileges
- **Permissions**: Granted to `authenticated` and `anon` roles

## Common Mistakes

### ❌ Forgot to Run the Script
**Symptom**: Function not found error
**Solution**: Run `database/get_shopping_lists_by_user_rpc.sql` in SQL Editor

### ❌ Ran Script in Wrong Project
**Symptom**: Function works in one project but not another
**Solution**: Ensure you're in the correct Supabase project

### ❌ Script Failed Silently
**Symptom**: No error but function doesn't exist
**Solution**: Check the SQL Editor output for errors. Ensure tables exist first.

### ❌ Permissions Not Granted
**Symptom**: "permission denied for function"
**Solution**: The script should grant permissions automatically, but if needed:
```sql
GRANT EXECUTE ON FUNCTION get_shopping_lists_by_user(TEXT, INTEGER, INTEGER, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shopping_lists_by_user(TEXT, INTEGER, INTEGER, BOOLEAN, TEXT, TEXT, TEXT) TO anon;
```

## Verification Checklist

Before reporting issues, verify:

- [ ] Tables exist (`users`, `shopping_lists`, `shopping_list_items`, `markets`)
- [ ] RPC function exists (run verification query above)
- [ ] Sample data exists (run `SELECT COUNT(*) FROM shopping_lists;`)
- [ ] Environment variables are set correctly (see `docs/NETLIFY_FUNCTIONS_ENV_SETUP.md`)
- [ ] Supabase credentials are valid

## Additional Resources

- **Complete Setup Guide**: `database/SUPABASE_SETUP.md`
- **RPC Function Details**: `database/README_RPC.md`
- **Environment Setup**: `docs/NETLIFY_FUNCTIONS_ENV_SETUP.md`
- **Supabase Documentation**: https://supabase.com/docs/guides/database/functions

## Still Having Issues?

If the error persists after following these steps:

1. Check the Supabase project logs for detailed errors
2. Verify your Supabase URL and service key are correct
3. Ensure your database tables are properly migrated
4. Review the complete error stack trace for additional context

## Related Errors

This troubleshooting guide also applies to similar errors:
- `function get_shopping_lists_by_user does not exist`
- `Could not find the function public.get_shopping_lists_by_user`
- `permission denied for function get_shopping_lists_by_user`

---

**Last Updated**: October 2025  
**Applies To**: All Supabase deployments of this application
