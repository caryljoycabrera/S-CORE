#!/usr/bin/env node

/**
 * Rate Limiter Test Script
 * Tests rate limiting functionality across different endpoints
 * 
 * Usage:
 *   node test-rate-limiting.js [endpoint] [count]
 * 
 * Examples:
 *   node test-rate-limiting.js login 6          # Test login rate limit (5 limit)
 *   node test-rate-limiting.js message 31       # Test message rate limit (30 limit)
 *   node test-rate-limiting.js api 101          # Test API rate limit (100 limit)
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:8080';

// Rate limit test configurations
const testConfigs = {
  login: {
    path: '/login',
    method: 'POST',
    limit: 5,
    window: '15 minutes',
    body: 'username=test&password=wrong',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  },
  register: {
    path: '/register',
    method: 'POST',
    limit: 5,
    window: '15 minutes',
    body: 'firstName=Test&lastName=User&email=test@test.com&username=testuser&password=TestPass123',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  },
  message: {
    path: '/messages/test-conv/send',
    method: 'POST',
    limit: 30,
    window: '5 minutes',
    body: JSON.stringify({ content: 'Test message' }),
    headers: { 'Content-Type': 'application/json' },
    requiresAuth: true
  },
  api: {
    path: '/api/deadlines',
    method: 'GET',
    limit: 100,
    window: '15 minutes',
    requiresAuth: true
  }
};

/**
 * Make HTTP request
 */
function makeRequest(config, index) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + config.path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: config.method,
      headers: config.headers || {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          request: index
        });
      });
    });

    req.on('error', reject);

    if (config.body) {
      req.write(config.body);
    }
    req.end();
  });
}

/**
 * Format response for display
 */
function formatResponse(result, total) {
  const isLimited = result.status === 429;
  const statusColor = isLimited ? '\x1b[31m' : '\x1b[32m';
  const resetColor = '\x1b[0m';

  console.log(`\n[Request ${result.request}/${total}] ${statusColor}Status: ${result.status}${resetColor}`);
  
  if (result.headers['retry-after']) {
    console.log(`  Retry-After: ${result.headers['retry-after']}s`);
  }
  if (result.headers['x-ratelimit-limit']) {
    console.log(`  Limit: ${result.headers['x-ratelimit-limit']}`);
  }
  if (result.headers['x-ratelimit-remaining']) {
    console.log(`  Remaining: ${result.headers['x-ratelimit-remaining']}`);
  }
  if (result.headers['x-ratelimit-reset']) {
    console.log(`  Reset: ${new Date(result.headers['x-ratelimit-reset'] * 1000).toLocaleTimeString()}`);
  }

  if (isLimited) {
    console.log(`  ${statusColor}⚠ RATE LIMITED${resetColor}`);
  }
}

/**
 * Run rate limit test
 */
async function runTest(endpoint, count) {
  const config = testConfigs[endpoint];
  
  if (!config) {
    console.error(`\n❌ Unknown endpoint: ${endpoint}`);
    console.error(`Available endpoints: ${Object.keys(testConfigs).join(', ')}\n`);
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Rate Limiter Test: ${endpoint.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Endpoint: ${config.path}`);
  console.log(`Method: ${config.method}`);
  console.log(`Rate Limit: ${config.limit} requests per ${config.window}`);
  console.log(`Sending: ${count} requests`);
  console.log(`${'='.repeat(60)}`);

  const results = [];
  
  for (let i = 1; i <= count; i++) {
    try {
      const result = await makeRequest(config, i);
      results.push(result);
      formatResponse(result, count);
      
      // Add delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`\n❌ Request ${i} failed:`, error.message);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  
  const successCount = results.filter(r => r.status !== 429).length;
  const limitedCount = results.filter(r => r.status === 429).length;
  const firstLimitAt = results.findIndex(r => r.status === 429) + 1;

  console.log(`✓ Successful requests: ${successCount}`);
  console.log(`⚠ Rate limited (429): ${limitedCount}`);
  if (limitedCount > 0) {
    console.log(`  First limit at request: ${firstLimitAt}/${count}`);
  }
  console.log(`\nExpected behavior:`);
  console.log(`  - First ${config.limit} requests should succeed (status 200)`);
  console.log(`  - Request ${config.limit + 1} onwards should return 429`);
  console.log(`  - Responses should include Retry-After header\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const endpoint = args[0] || 'login';
const count = parseInt(args[1]) || 6;

if (count > 1000) {
  console.error('❌ Maximum 1000 requests allowed');
  process.exit(1);
}

runTest(endpoint, count).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
