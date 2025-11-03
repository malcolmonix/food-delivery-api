const http = require('http');

const query = `query { orders { id orderId } }`;
const data = JSON.stringify({ query });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing GraphQL API...');

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log('✅ GraphQL API responding:');
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Raw response:', body);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ API test failed:', err.message);
});

req.write(data);
req.end();