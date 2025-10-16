/**
 * Environment Configuration
 * Loads environment variables for the application
 *
 * For development: Variables can be set here
 * For production: Use build-time environment variable injection
 */

// Try to load from window.ENV (injected at build time)
// Or use defaults from .env for development

const ENV = {
  // Supabase Configuration
  SUPABASE_URL: window.ENV?.SUPABASE_URL,
  SUPABASE_ANON_KEY: window.ENV?.SUPABASE_ANON_KEY,

  // Node Environment
  NODE_ENV: window.ENV?.NODE_ENV || 'development',

  // External APIs
  RECEITA_WS_URL: window.ENV?.RECEITA_WS_URL || 'https://www.receitaws.com.br/v1/cnpj',
  BRASIL_API_URL: window.ENV?.BRASIL_API_URL || 'https://brasilapi.com.br',
};

// Validate required variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter((varName) => !ENV[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars);
  console.warn('   The app may not work correctly without these variables.');
  console.warn('   For local development, create a .env file with your credentials.');
  console.warn('   For production, set environment variables in your deployment platform.');
}

// Log configuration in development
if (ENV.NODE_ENV === 'development') {
  console.log('🔧 Environment Configuration:');
  console.log('  - SUPABASE_URL:', ENV.SUPABASE_URL);
  console.log('  - SUPABASE_ANON_KEY:', ENV.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
  console.log('  - NODE_ENV:', ENV.NODE_ENV);
}

// Make ENV available globally
if (typeof window !== 'undefined') {
  window.APP_ENV = ENV;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENV;
}
