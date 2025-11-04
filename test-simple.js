const http = require('http');

// Test simple query first
const testQuery = () => {
  const query = `{ orders { id orderId orderStatus paidAmount } }`;
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

  console.log('Testing simple query...');

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Response:', body);
      // Now test mutation
      testMutation();
    });
  });

  req.on('error', (err) => {
    console.error('Query test failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Error details:', err);
  });

  req.write(data);
  req.end();
};

// Test placeOrder mutation
const testMutation = () => {
  const mutation = `
    mutation PlaceOrder(
      $restaurant: String!
      $orderInput: [OrderItemInput!]!
      $paymentMethod: String!
      $orderDate: String!
    ) {
      placeOrder(
        restaurant: $restaurant
        orderInput: $orderInput
        paymentMethod: $paymentMethod
        orderDate: $orderDate
      ) {
        id
        orderId
        orderStatus
        paidAmount
        paymentMethod
        orderItems {
          id
          title
          quantity
          price
          total
        }
      }
    }
  `;

  const variables = {
    restaurant: "Test Restaurant",
    orderInput: [
      {
        title: "Test Item",
        food: "Pizza",
        description: "Delicious pizza",
        quantity: 2,
        variation: "Large",
        addons: ["Extra Cheese"],
        specialInstructions: "Extra spicy",
        price: 10.99,
        total: 21.98
      }
    ],
    paymentMethod: "CASH",
    orderDate: new Date().toISOString()
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

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Mutation response:', body);
    });
  });

  req.on('error', (err) => {
    console.error('Mutation test failed:', err.message);
  });

  req.write(data);
  req.end();
};

testQuery();