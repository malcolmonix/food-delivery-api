const http = require('http');

const mutation = `
  mutation PlaceOrder($input: OrderInput!) {
    placeOrder(input: $input) {
      id
      status
      total
      paymentMethod
      items {
        id
        name
        quantity
        price
      }
    }
  }
`;

const variables = {
  input: {
    restaurantId: "test-restaurant",
    customerId: "test-customer",
    items: [
      {
        name: "Test Item",
        quantity: 2,
        price: 10.99
      }
    ],
    total: 21.98,
    paymentMethod: "CASH"
  }
};

const data = JSON.stringify({ query: mutation, variables });

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

console.log('Testing placeOrder mutation...');
console.log('Sending request to:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Request data:', data);

const req = http.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', res.headers);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
    console.log('Received chunk:', chunk.toString());
  });
  res.on('end', () => {
    console.log('Full response body:', body);
    try {
      const response = JSON.parse(body);
      console.log('✅ placeOrder mutation response:');
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Raw response:', body);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Mutation test failed:', err.message);
  console.error('Error details:', err);
});

req.write(data);
req.end();