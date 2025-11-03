const http = require('http');

// Test the placeOrder mutation against the running server
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

  console.log('Testing placeOrder mutation against running server...');

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('✅ Mutation test completed!');
      console.log('Response:', body);

      try {
        const response = JSON.parse(body);
        if (response.data && response.data.placeOrder) {
          const order = response.data.placeOrder;
          console.log('✅ Order placed successfully!');
          console.log('Order ID:', order.orderId);
          console.log('Order Status:', order.orderStatus);
          console.log('Payment Method:', order.paymentMethod);
          console.log('Paid Amount:', order.paidAmount);

          if (order.paymentMethod === 'CASH' && order.orderStatus === 'CONFIRMED') {
            console.log('✅ CASH payment correctly set status to CONFIRMED');
          } else {
            console.log('❌ Payment status logic failed');
          }
        } else if (response.errors) {
          console.log('❌ GraphQL errors:', JSON.stringify(response.errors, null, 2));
        }
      } catch (e) {
        console.log('Raw response:', body);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Mutation failed:', err.message);
  });

  req.write(data);
  req.end();
};

testPlaceOrder();