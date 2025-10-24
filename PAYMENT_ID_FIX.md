# Payment ID Fix and Payment Methods Implementation

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

### Phase 1: Quick Fix (Initial Implementation)

Added UUID validation in the `collectFormData()` function in `create-shopping-list.html`:

```javascript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Get payment select value - only use if it's a valid UUID format
const paymentSelectValue = document.getElementById('paymentSelect').value;
const paymentId = paymentSelectValue && UUID_REGEX.test(paymentSelectValue) ? paymentSelectValue : null;
```

Now, when a user selects a payment method:
- If the value is a valid UUID → it's sent to the backend
- If the value is NOT a valid UUID (like "credit") → `null` is sent instead
- Since `payment_id` is nullable in the database, this prevents the error

**Request (After Quick Fix):**
```json
{
  "user_id": "9eb946b7-7e29-4460-a9cf-81aebac2ea4c",
  "title": "Festival Água Verde",
  "payment_id": null,  // ✅ Valid - nullable field
  ...
}
```

### Phase 2: Complete Implementation

Implemented a full payment methods management system:

#### 1. Shared Validation Utility (`src/utils/validation.js`)
- Extracted UUID regex to a shared constant
- Created reusable `isValidUUID()` and `validateUUID()` functions
- Used across test files and production code for consistency

#### 2. Payment Repository (`src/repositories/paymentRepository.js`)
- `getPaymentMethods(user_id, options)` - Fetch user's payment methods from Supabase
- `createPaymentMethod(paymentData)` - Create new payment method
- `updatePaymentMethod(payment_id, user_id, updates)` - Update payment method
- `deletePaymentMethod(payment_id, user_id)` - Soft delete payment method

#### 3. Payment Service (`src/services/paymentService.js`)
- Business logic layer with validation
- Validates payment types (debit, credit, pix)
- Validates description length (max 200 chars)
- Normalizes data before saving

#### 4. Payment Controller (`src/controllers/paymentController.js`)
- HTTP request handler that delegates to service
- Parameter validation and error handling

#### 5. API Endpoints
- `GET /.netlify/functions/get-payment-methods?user_id={uuid}` - Get user's payment methods
- `POST /.netlify/functions/create-payment-method` - Create new payment method

#### 6. UI Updates (`create-shopping-list.html`)
- Updated `loadPaymentMethods()` to fetch from Supabase API instead of hardcoded values
- Added payment creation dialog with form validation
- Added "Adicionar Forma de Pagamento" button below payment select
- Dialog allows creating payment methods on-demand during list creation
- Shows payment description and "(Padrão)" label for default payment method

#### 7. Styling (`static/css/create-shopping-list.css`)
- Added modern dialog overlay with backdrop blur
- Responsive dialog layout
- Consistent with existing dark theme

## Testing

- ✅ Added comprehensive test suite (`tests/payment-id-validation.test.js`) with 9 tests
- ✅ Added payment API tests (`tests/payment-api.test.js`) with 12 tests
- ✅ All validation tests pass (21/21)
- ✅ No security vulnerabilities (verified with CodeQL)
- ✅ Minimal code changes - surgical fix with comprehensive feature addition

## Changes

1. **src/utils/validation.js** - Shared UUID validation utility
2. **src/repositories/paymentRepository.js** - Payment data access layer
3. **src/services/paymentService.js** - Payment business logic
4. **src/controllers/paymentController.js** - Payment HTTP request handler
5. **src/api/get-payment-methods.js** - API endpoint to get payment methods
6. **src/api/create-payment-method.js** - API endpoint to create payment method
7. **src/pages/create-shopping-list.html** - Updated to use UUID constant and load real payment methods
8. **static/css/create-shopping-list.css** - Added dialog styles
9. **tests/payment-id-validation.test.js** - Updated to use shared validation utility
10. **tests/payment-api.test.js** - Added comprehensive payment API tests

## Features

### For Users
- ✅ Can view their saved payment methods when creating a shopping list
- ✅ Can add new payment methods directly from the create list page
- ✅ Can set a payment method as default
- ✅ Payment methods show descriptive names (e.g., "Cartão Visa", "Banco do Brasil")
- ✅ Can create lists without selecting a payment method (optional)

### For Developers
- ✅ Clean separation of concerns (Repository → Service → Controller pattern)
- ✅ Comprehensive validation at all layers
- ✅ Reusable UUID validation utility
- ✅ Consistent error handling
- ✅ Well-tested code with unit tests
- ✅ Type-safe payment types (debit, credit, pix)

## Security

- ✅ No security vulnerabilities (verified with CodeQL)
- ✅ UUID validation prevents SQL injection
- ✅ User authorization on all payment method operations
- ✅ Soft delete prevents data loss
- ✅ Description length limits prevent abuse

