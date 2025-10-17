# Fix Summary: Invalid UUID for market_id Error

## Issue Description

After fixing the "ShoppingList is not defined" error, a new issue appeared when users tried to create a shopping list and selected a market from the dropdown. The API returned:

```
Error: invalid input syntax for type uuid: "2"
```

### Error Details

**Console Error:**

```
POST /.netlify/functions/create-shopping-list 400 (Bad Request)
Error saving list: Error: invalid input syntax for type uuid: "2"
    at HTMLFormElement.saveList (create-shopping-list.html:1203:19)
```

**API Response:**

```json
{
  "error": "invalid input syntax for type uuid: \"2\""
}
```

**Request Payload:**

```json
{
  "user_id": "9eb946b7-7e29-4460-a9cf-81aebac2ea4c",
  "title": "Test List",
  "shopping_date": "2025-10-16",
  "market_id": "2",
  "items": [...]
}
```

## Root Cause

The `loadMarkets()` function in `src/pages/create-shopping-list.html` was returning hardcoded markets with numeric IDs (1, 2, 3, etc.):

```javascript
async function loadMarkets() {
  return [
    { id: 1, nome: 'Supermercado Pão de Açúcar', endereco: 'Av. Paulista, 1234' },
    { id: 2, nome: 'Extra Hiper', endereco: 'Rua das Flores, 567' },
    { id: 3, nome: 'Carrefour', endereco: 'Shopping Center, Loja 89' },
    { id: 4, nome: 'Atacadão', endereco: 'Av. Marginal, 890' },
    { id: 5, nome: 'Big Bompreço', endereco: 'Rua do Comércio, 123' },
  ];
}
```

When a user selected a market, the numeric ID (e.g., "2") was sent to the API, but the database schema expects `market_id` to be a UUID:

```sql
CREATE TABLE shopping_lists (
    ...
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
    ...
);
```

The database rejected the string "2" as it's not a valid UUID format.

## Solution

The `market_id` field is **optional** in the database schema (nullable). The simplest fix is to remove the hardcoded fake market data and keep the dropdown empty, allowing users to create shopping lists without selecting a market.

### Code Changes

**File: `src/pages/create-shopping-list.html`**

Changed from:

```javascript
async function loadMarkets() {
  return [
    { id: 1, nome: 'Supermercado Pão de Açúcar', endereco: 'Av. Paulista, 1234' },
    { id: 2, nome: 'Extra Hiper', endereco: 'Rua das Flores, 567' },
    { id: 3, nome: 'Carrefour', endereco: 'Shopping Center, Loja 89' },
    { id: 4, nome: 'Atacadão', endereco: 'Av. Marginal, 890' },
    { id: 5, nome: 'Big Bompreço', endereco: 'Rua do Comércio, 123' },
  ];
}
```

To:

```javascript
async function loadMarkets() {
  // TODO: Implement API call to fetch markets from the database
  // For now, return empty array to avoid UUID validation errors
  // Users can create shopping lists without selecting a market (market_id is optional)
  return [];
}
```

This fix:

1. Removes the fake market data with invalid IDs
2. Keeps the market dropdown with only the "Selecione um mercado (opcional)" option
3. Allows `market_id` to be `null` when creating a shopping list
4. Prevents UUID validation errors

## Future Enhancement

To fully implement market selection, the following steps would be needed:

1. **Create a GET markets API endpoint** (`/api/get-markets`)
2. **Fetch markets from the database** with proper UUID IDs
3. **Update `loadMarkets()` function** to call the API:

```javascript
async function loadMarkets() {
  try {
    const response = await fetch('/.netlify/functions/get-markets');
    if (!response.ok) return [];
    const data = await response.json();
    return data.markets || [];
  } catch (error) {
    console.error('Error loading markets:', error);
    return [];
  }
}
```

## Testing

### Test Coverage Added

Added 2 new integration tests in `tests/create-shopping-list-integration.test.js`:

1. **Test null market_id is accepted**
   - Validates that shopping lists can be created without a market
   - Ensures `market_id: null` is handled correctly

2. **Test invalid UUID market_id returns error**
   - Validates that invalid UUID values for market_id are rejected
   - Ensures proper error handling at the database level

### Test Results

All 58 unit tests pass:

```
# tests 58
# pass 58
# fail 0
```

### Manual Verification

Tested creating a shopping list without selecting a market:

```javascript
✅ PASSED: List created successfully with market_id: null
```

## Database Schema Verification

The `shopping_lists` table schema confirms `market_id` is optional:

```sql
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    shopping_date DATE NOT NULL DEFAULT CURRENT_DATE,
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,  -- OPTIONAL
    ...
);
```

- `market_id` is NOT in the `NOT NULL` constraint
- Foreign key has `ON DELETE SET NULL`, confirming nullability
- Users can create shopping lists without selecting a market

## Impact

- **Before Fix**: Users got UUID validation error when selecting a market
- **After Fix**: Users can create shopping lists without errors (market selection is optional)

## Files Modified

1. `src/pages/create-shopping-list.html` - Updated `loadMarkets()` function (4 lines changed)
2. `tests/create-shopping-list-integration.test.js` - Added 2 new tests (48 lines added)
3. `FIX_UUID_MARKET_ERROR.md` - This comprehensive fix documentation

## Related Issues

- Original issue: "ShoppingList is not defined" (Fixed in commit d27a14a)
- This issue: "invalid input syntax for type uuid" (Fixed in this commit)
