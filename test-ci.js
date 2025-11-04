#!/usr/bin/env node

/**
 * Simple test script for CI environment
 * Tests the GraphQL server without requiring Firebase credentials
 */

const http = require('http');

async function testGraphQLEndpoint() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: '{ __typename }'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.data && response.data.__typename) {
              console.log('✅ GraphQL endpoint test passed');
              console.log('Response:', response);
              resolve(true);
            } else {
              console.log('❌ Unexpected GraphQL response:', response);
              reject(new Error('Invalid GraphQL response'));
            }
          } catch (error) {
            console.log('❌ Failed to parse GraphQL response:', data);
            reject(error);
          }
        } else {
          console.log(`❌ HTTP ${res.statusCode}: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting GraphQL API tests...');
  
  try {
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testGraphQLEndpoint();
    
    console.log('✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

runTests();