const http = require('http');

// Test the placeOrder mutation
const testPlaceOrder = () => {
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
        title: "Test Pizza",
        food: "Pizza",
        description: "Delicious test pizza",
        quantity: 2,
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
      console.log('Response:', body);
      try {
        const response = JSON.parse(body);
        if (response.data && response.data.placeOrder) {
          console.log('✅ placeOrder mutation successful!');
          console.log('Order ID:', response.data.placeOrder.orderId);
          console.log('Order Status:', response.data.placeOrder.orderStatus);
        } else if (response.errors) {
          console.log('❌ GraphQL errors:', response.errors);
        }
      } catch (e) {
        console.log('Raw response:', body);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Mutation test failed:', err.message);
  });

  req.write(data);
  req.end();
};

// Test orders query
const testOrdersQuery = () => {
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

  console.log('Testing orders query...');

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Response:', body);
      try {
        const response = JSON.parse(body);
        if (response.data && response.data.orders) {
          console.log('✅ Orders query successful!');
          console.log('Found', response.data.orders.length, 'orders');
          // Now test the mutation
          setTimeout(testPlaceOrder, 1000);
        } else if (response.errors) {
          console.log('❌ GraphQL errors:', response.errors);
        }
      } catch (e) {
        console.log('Raw response:', body);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Query test failed:', err.message);
  });

  req.write(data);
  req.end();
};

testOrdersQuery();