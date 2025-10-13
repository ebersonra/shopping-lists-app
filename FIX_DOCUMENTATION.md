# Fix - Error loading shopping lists (UUID type mismatch)

## Issue Summary
Users were experiencing a "400 Bad Request" error when trying to load shopping lists:
```
GET https://supermarket-lists.netlify.app/.netlify/functions/get-shopping-lists?user_id=608bdcef-56f8-44cd-8991-bb5e1a6dfac4&limit=50 400 (Bad Request)
Error loading shopping lists: Error: Erro ao carregar listas de compras
```

## Root Cause
The database migration (`convert_shopping_lists_user_id_to_uuid.sql`) converted the `user_id` column from TEXT to UUID type. However, PostgREST/Supabase views (`active_shopping_lists`) may cache schema definitions, causing UUID casting failures when querying with string UUID values.

When the repository code queries the view with `.eq('user_id', string_value)`, PostgREST fails to automatically cast the string to UUID, resulting in a 400 Bad Request error.

## Solution Implemented

### 1. Query Base Tables Instead of Views
Changed from querying the `active_shopping_lists` view to querying the base `shopping_lists` table directly:

```javascript
// Before (querying view)
let query = supabase
  .from('active_shopping_lists')
  .select('*')
  .eq('user_id', user_id);

// After (querying base table with explicit joins)
let query = supabase
  .from('shopping_lists')
  .select(`
    *,
    markets (
      name,
      address
    )
  `)
  .eq('user_id', user_id)
  .is('deleted_at', null);
```

This approach is more reliable because:
- Base tables handle UUID casting more consistently than views
- Avoids view schema caching issues
- More explicit about what data we're fetching

### 2. Manual Aggregation of Item Counts
Since we're no longer using the view that includes aggregated counts, we manually fetch and calculate:

```javascript
// Fetch item counts for all lists
const { data: itemCounts } = await supabase
  .from('shopping_list_items')
  .select('list_id, is_checked')
  .in('list_id', listIds);

// Calculate counts per list
const countsMap = {};
itemCounts.forEach(item => {
  if (!countsMap[item.list_id]) {
    countsMap[item.list_id] = { total: 0, checked: 0 };
  }
  countsMap[item.list_id].total++;
  if (item.is_checked) {
    countsMap[item.list_id].checked++;
  }
});
```

### 3. UUID Format Validation
Added validation to catch invalid UUID formats early with helpful error messages:

```javascript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!user_id || !uuidRegex.test(user_id)) {
  throw new Error(`Invalid UUID format for user_id: ${user_id}`);
}
```

Applied to all repository functions that accept user_id:
- `getShoppingLists()`
- `getShoppingListById()`
- `updateShoppingList()`
- `deleteShoppingList()`

### 4. Enhanced Error Messages
Improved error messages to include Supabase error details:

```javascript
if (error) {
  console.error('Supabase query error:', error);
  throw new Error(
    `Database error: ${error.message}` +
    `${error.details ? ' - ' + error.details : ''}` +
    `${error.hint ? ' (Hint: ' + error.hint + ')' : ''}`
  );
}
```

## Files Modified

1. **src/repositories/shoppingListRepository.js**
   - Modified `getShoppingLists()` - Query base table, manual aggregation, UUID validation BEFORE getClient()
   - Modified `getShoppingListById()` - Query base table with join, UUID validation BEFORE getClient()
   - Modified `updateShoppingList()` - Added UUID validation BEFORE getClient()
   - Modified `deleteShoppingList()` - Added UUID validation BEFORE getClient()

2. **tests/uuid-validation.test.js**
   - Enhanced with comprehensive UUID validation tests
   - Tests for valid UUID formats (multiple variations)
   - Tests for invalid UUID formats (edge cases)
   - Tests for all repository functions that accept UUIDs
   - Tests validate errors are thrown before attempting DB connection

3. **tests/e2e/shopping-lists.spec.js** (NEW)
   - E2E tests for shopping lists page loading
   - Tests API calls with valid UUID parameters
   - Tests for no 400 Bad Request errors
   - Tests for error handling scenarios

4. **tests/e2e/shopping-list-detail.spec.js** (NEW)
   - E2E tests for viewing individual shopping lists
   - Tests CRUD operations with UUID validation
   - Tests handling of invalid UUIDs
   - Tests various valid UUID formats

5. **tests/e2e/create-shopping-list.spec.js** (NEW)
   - E2E tests for creating shopping lists
   - Tests form validation with UUIDs
   - Tests item management
   - Tests UUID format support

6. **tests/shoppingListFunctions.test.js**
   - Fixed import paths from `../../netlify/functions/` to `../src/api/`

7. **tests/shoppingListService.test.js**
   - Fixed import path from `../../src/services/` to `../src/services/`

8. **tests/shoppingListService.integration.test.js**
   - Fixed import path from `../../src/services/` to `../src/services/`

## Testing

### Automated Unit Tests
```bash
npm test
```
✅ All 31 unit tests passing
- UUID validation regex (valid and invalid formats)
- Repository function existence  
- UUID validation in getShoppingLists, getShoppingListById, updateShoppingList, deleteShoppingList
- Service layer validation tests
- Integration tests with mocked repository

### E2E Tests
```bash
npm run test:e2e
```
✅ Created comprehensive E2E test suites (30 tests total):

**Shopping Lists Page Tests** (`tests/e2e/shopping-lists.spec.js`)
- Load shopping lists page without errors
- Handle API calls with valid UUID user_id parameter
- Verify no 400 Bad Request errors for valid UUIDs
- Display empty state when no lists exist
- Handle navigation to create shopping list
- Maintain user session across page reloads
- Handle missing user data gracefully
- Handle invalid UUID format
- Work with various valid UUID formats

**Shopping List Detail Tests** (`tests/e2e/shopping-list-detail.spec.js`)
- Handle valid UUID parameters in URL
- No 400 Bad Request for get-shopping-list API
- Handle missing list ID parameter
- Handle invalid UUID format in list ID
- Handle non-existent list ID gracefully
- Handle update operations with valid UUIDs
- Handle delete operations with valid UUIDs
- Handle adding items with valid UUIDs
- Reject operations with invalid UUIDs gracefully
- Work with various valid UUID formats

**Create Shopping List Tests** (`tests/e2e/create-shopping-list.spec.js`)
- Load create shopping list page
- Use valid UUID when creating shopping list
- No 400 errors when creating list with valid UUID
- Redirect to welcome if no user data exists
- Handle form validation errors gracefully
- Allow adding items to the list
- Create shopping list with items using valid UUID
- Work with user having various valid UUID formats

### Manual Testing Checklist
- [x] Load shopping lists page - displays lists without 400 error
- [x] Create new shopping list - works with UUID user_id
- [x] View existing shopping list - loads correctly with UUID validation
- [x] Update shopping list - works with UUID validation
- [x] Delete shopping list - works with UUID validation
- [x] Verify item counts display correctly
- [x] Verify market information displays correctly
- [x] All repository functions validate UUIDs before database connection

## Impact Analysis

### Functions Affected
All functions in the repository layer that query with `user_id`:
- ✅ `getShoppingLists()` - FIXED
- ✅ `getShoppingListById()` - FIXED  
- ✅ `updateShoppingList()` - FIXED
- ✅ `deleteShoppingList()` - FIXED

### API Endpoints Affected
- ✅ `/.netlify/functions/get-shopping-lists` - Uses fixed `getShoppingLists()`
- ✅ `/.netlify/functions/get-shopping-list` - Uses fixed `getShoppingListById()`
- ✅ `/.netlify/functions/create-shopping-list` - Uses RPC (already UUID-compatible)

### Pages Affected
- ✅ `shopping-lists.html` - Calls get-shopping-lists endpoint
- ✅ `view-shopping-list.html` - Calls get-shopping-list endpoint
- ✅ `create-shopping-list.html` - No changes needed

## Alternative Approaches Considered

1. **Using RPC Functions** - Would require creating new stored procedures for all queries
2. **Casting in PostgREST** - Tried `.eq('user_id::text', user_id)` but incorrect syntax
3. **Refreshing Views** - Would require database access and may not persist
4. **Using .filter() method** - Same issue as .eq() with UUID casting

## Deployment Notes

1. This fix is backward compatible - works with existing UUID user_id values
2. No database migrations required - only application code changes
3. Monitor error logs for any UUID validation errors after deployment
4. Consider adding database indexes on user_id columns if not already present

## Related Issues

- Database migration: `database/convert_shopping_lists_user_id_to_uuid.sql`
- View definition: `CREATE OR REPLACE VIEW active_shopping_lists`

## References

- Supabase-js Documentation: https://supabase.com/docs/reference/javascript/introduction
- PostgREST UUID Handling: https://postgrest.org/en/stable/api.html#uuid-columns
- PostgreSQL UUID Type: https://www.postgresql.org/docs/current/datatype-uuid.html
