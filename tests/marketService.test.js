// tests/marketService.test.js
const test = require('node:test');
const assert = require('node:assert');
const marketService = require('../src/services/marketService');

// Mock repository
const mockRepo = {
  getMarkets: async (user_id) => {
    if (user_id === 'test-user-id') {
      return [
        {
          id: 'market-uuid-1',
          name: 'Supermercado Central',
          address: 'Av. Principal, 1000',
          user_id: 'test-user-id',
        },
        {
          id: 'market-uuid-2',
          name: 'Mercado do Bairro',
          address: 'Rua das Flores, 123',
          user_id: 'test-user-id',
        },
      ];
    }
    return [];
  },
  getMarketById: async (id, user_id) => {
    if (id === 'market-uuid-1' && user_id === 'test-user-id') {
      return {
        id: 'market-uuid-1',
        name: 'Supermercado Central',
        address: 'Av. Principal, 1000',
        user_id: 'test-user-id',
      };
    }
    return null;
  },
  createMarket: async (marketData) => {
    return {
      id: 'new-market-uuid',
      ...marketData,
    };
  },
};

test('marketService - getMarkets should return markets for user', async () => {
  const markets = await marketService.getMarkets('test-user-id', mockRepo);
  assert.strictEqual(markets.length, 2);
  assert.strictEqual(markets[0].name, 'Supermercado Central');
});

test('marketService - getMarkets should require user_id', async () => {
  await assert.rejects(async () => await marketService.getMarkets(null, mockRepo), {
    message: 'User ID is required',
  });
});

test('marketService - getMarketById should return market', async () => {
  const market = await marketService.getMarketById('market-uuid-1', 'test-user-id', mockRepo);
  assert.ok(market);
  assert.strictEqual(market.name, 'Supermercado Central');
});

test('marketService - getMarketById should require market id', async () => {
  await assert.rejects(
    async () => await marketService.getMarketById(null, 'test-user-id', mockRepo),
    { message: 'Market ID is required' }
  );
});

test('marketService - getMarketById should require user_id', async () => {
  await assert.rejects(
    async () => await marketService.getMarketById('market-uuid-1', null, mockRepo),
    { message: 'User ID is required' }
  );
});

test('marketService - createMarket should create market', async () => {
  const marketData = {
    user_id: 'test-user-id',
    name: 'Novo Mercado',
    address: 'Rua Nova, 456',
  };

  const market = await marketService.createMarket(marketData, mockRepo);
  assert.ok(market);
  assert.strictEqual(market.name, 'Novo Mercado');
});

test('marketService - createMarket should require user_id', async () => {
  const marketData = {
    name: 'Novo Mercado',
  };

  await assert.rejects(async () => await marketService.createMarket(marketData, mockRepo), {
    message: 'User ID is required',
  });
});

test('marketService - createMarket should require name', async () => {
  const marketData = {
    user_id: 'test-user-id',
  };

  await assert.rejects(async () => await marketService.createMarket(marketData, mockRepo), {
    message: 'Market name is required',
  });
});
