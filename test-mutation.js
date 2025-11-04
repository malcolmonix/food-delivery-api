const http = require('http');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./schema');

async function testPlaceOrder() {
  try {
    console.log('Starting test server for placeOrder...');
    const app = express();

    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();
    server.applyMiddleware({ app });

    const httpServer = app.listen({ port: 4000 }, () => {
      console.log(`🚀 Test server ready at http://localhost:4000${server.graphqlPath}`);

      // Test the placeOrder mutation
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
              console.log('❌ GraphQL errors:', response.errors);
            }
          } catch (e) {
            console.log('Raw response:', body);
          }

          httpServer.close(() => {
            console.log('Test server closed');
            process.exit(0);
          });
        });
      });

      req.on('error', (err) => {
        console.error('❌ Mutation failed:', err.message);
        httpServer.close(() => {
          console.log('Test server closed');
          process.exit(1);
        });
      });

      req.write(data);
      req.end();
    });

  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
}

testPlaceOrder();