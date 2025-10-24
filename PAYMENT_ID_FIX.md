# Payment ID Fix Documentation

## Issue Description

When creating a shopping list, the application was sending invalid values for the `payment_id` field to the database, causing a 400 Bad Request error:

```
Error: invalid input syntax for type uuid: "credit"
```

### Root Cause

The `create-shopping-list.html` page was using hardcoded string values (`"credit"`, `"debit"`, `"pix"`) for payment methods in the dropdown, but the database `shopping_lists` table expects `payment_id` to be a UUID that references the `payment` table.

**Request (Before Fix):**
```json
{
  "user_id": "9eb946b7-7e29-4460-a9cf-81aebac2ea4c",
  "title": "Festival Água Verde",
  "payment_id": "credit",  // ❌ Invalid - not a UUID
  ...
}
```

**Database Schema:**
```sql
CREATE TABLE shopping_lists (
    ...
    payment_id UUID REFERENCES payment(id) ON DELETE SET NULL,
    ...
);
```

## Solution

Added UUID validation in the `collectFormData()` function in `create-shopping-list.html`:

```javascript
// Get payment select value - only use if it's a valid UUID format
const paymentSelectValue = document.getElementById('paymentSelect').value;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const paymentId = paymentSelectValue && uuidRegex.test(paymentSelectValue) ? paymentSelectValue : null;
```

Now, when a user selects a payment method:
- If the value is a valid UUID → it's sent to the backend
- If the value is NOT a valid UUID (like "credit") → `null` is sent instead
- Since `payment_id` is nullable in the database, this prevents the error

**Request (After Fix):**
```json
{
  "user_id": "9eb946b7-7e29-4460-a9cf-81aebac2ea4c",
  "title": "Festival Água Verde",
  "payment_id": null,  // ✅ Valid - nullable field
  ...
}
```

## Testing

Added comprehensive tests in `tests/payment-id-validation.test.js`:
- ✅ Non-UUID strings ("credit", "debit", "pix") → null
- ✅ Empty strings → null
- ✅ Undefined values → null
- ✅ Valid UUIDs → preserved
- ✅ Invalid UUID formats → null

All 116 tests pass, including the new validation tests.

## Future Improvements

For a complete solution, consider:

1. **Create a Payment Methods API Endpoint:**
   - Add `GET /.netlify/functions/get-payment-methods?user_id={uuid}`
   - Return actual payment methods from the database with their UUIDs

2. **Update the HTML Form:**
   - Load real payment methods instead of hardcoded options
   - Display user's saved payment methods with proper UUIDs

3. **Allow Users to Add Payment Methods:**
   - Create UI for managing payment methods
   - Store them in the `payment` table with proper user associations

## Files Changed

- `src/pages/create-shopping-list.html` - Added UUID validation for payment_id
- `tests/payment-id-validation.test.js` - Added validation tests

## Security

No security vulnerabilities were introduced (verified with CodeQL).
