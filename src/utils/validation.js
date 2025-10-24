/**
 * Validation Utilities
 * Common validation functions used across the application
 */

/**
 * UUID validation regex pattern
 * Matches standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID format
 * @param {string} value - Value to validate
 * @returns {boolean} - True if valid UUID format, false otherwise
 */
function isValidUUID(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return UUID_REGEX.test(value);
}

/**
 * Validate and sanitize a UUID value
 * Returns the UUID if valid, null otherwise
 * @param {string} value - Value to validate
 * @returns {string|null} - Valid UUID or null
 */
function validateUUID(value) {
  return isValidUUID(value) ? value : null;
}

module.exports = {
  UUID_REGEX,
  isValidUUID,
  validateUUID,
};
