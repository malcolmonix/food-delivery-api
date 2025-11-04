const http = require('http');

// Test order status updates against running server
async function testOrderStatusUpdates() {
  try {
    console.log('Testing order status updates against running server...');

    // First, place an order
    const placeOrderMutation = `
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
          statusHistory {
            status
            timestamp
            note
          }
        }
      }
    `;

    const orderVariables = {
      restaurant: "Test Restaurant",
      orderInput: [
        {
          title: "Test Pizza",
          food: "Pizza",
          description: "Delicious test pizza",
          quantity: 1,
          price: 15.99,
          total: 15.99
        }
      ],
      paymentMethod: "CARD",
      orderDate: new Date().toISOString()
    };

    const placeOrderData = JSON.stringify({ query: placeOrderMutation, variables: orderVariables });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': placeOrderData.length
      }
    };

    console.log('Placing test order...');

    const placeOrderReq = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.data && response.data.placeOrder) {
            const order = response.data.placeOrder;
            console.log('✅ Order placed successfully!');
            console.log('Order ID:', order.orderId);
            console.log('Initial Status:', order.orderStatus);
            console.log('Status History:', order.statusHistory.length, 'entries');

            // Now update the status multiple times
            updateOrderStatus(order.id, 'CONFIRMED', 'Payment confirmed');
          } else if (response.errors) {
            console.log('❌ Place order errors:', JSON.stringify(response.errors, null, 2));
          }
        } catch (e) {
          console.log('Raw response:', body);
        }
      });
    });

    placeOrderReq.on('error', (err) => {
      console.error('❌ Place order failed:', err.message);
    });

    placeOrderReq.write(placeOrderData);
    placeOrderReq.end();

    // Function to update order status
    function updateOrderStatus(orderId, status, note) {
      const updateMutation = `
        mutation UpdateOrderStatus($orderId: ID!, $status: String!, $note: String) {
          updateOrderStatus(orderId: $orderId, status: $status, note: $note) {
            id
            orderId
            orderStatus
            statusHistory {
              status
              timestamp
              note
            }
            updatedAt
          }
        }
      `;

      const updateData = JSON.stringify({
        query: updateMutation,
        variables: { orderId, status, note }
      });

      const updateOptions = {
        hostname: 'localhost',
        port: 4000,
        path: '/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': updateData.length
        }
      };

      console.log(`\nUpdating order status to: ${status}`);

      const updateReq = http.request(updateOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (response.data && response.data.updateOrderStatus) {
              const updatedOrder = response.data.updateOrderStatus;
              console.log(`✅ Status updated to: ${updatedOrder.orderStatus}`);
              console.log(`Status History: ${updatedOrder.statusHistory.length} entries`);

              // Continue with next status update
              const statusFlow = ['CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
              const currentIndex = statusFlow.indexOf(status);

              if (currentIndex < statusFlow.length - 1) {
                const nextStatus = statusFlow[currentIndex + 1];
                const nextNote = getStatusNote(nextStatus);
                setTimeout(() => updateOrderStatus(orderId, nextStatus, nextNote), 500);
              } else {
                // Final status reached, get the complete order
                setTimeout(() => getOrderDetails(orderId), 500);
              }
            } else if (response.errors) {
              console.log('❌ Update status errors:', JSON.stringify(response.errors, null, 2));
            }
          } catch (e) {
            console.log('Raw response:', body);
          }
        });
      });

      updateReq.on('error', (err) => {
        console.error('❌ Update status failed:', err.message);
      });

      updateReq.write(updateData);
      updateReq.end();
    }

    function getStatusNote(status) {
      const notes = {
        'CONFIRMED': 'Payment confirmed, order confirmed',
        'PROCESSING': 'Restaurant is preparing your order',
        'READY': 'Order is ready for pickup/delivery',
        'OUT_FOR_DELIVERY': 'Order is out for delivery',
        'DELIVERED': 'Order has been delivered successfully'
      };
      return notes[status] || `Status updated to ${status}`;
    }

    function getOrderDetails(orderId) {
      const query = `
        query GetOrder($id: ID!) {
          order(id: $id) {
            id
            orderId
            orderStatus
            statusHistory {
              status
              timestamp
              note
            }
            createdAt
            updatedAt
          }
        }
      `;

      const queryData = JSON.stringify({
        query,
        variables: { id: orderId }
      });

      const queryOptions = {
        hostname: 'localhost',
        port: 4000,
        path: '/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': queryData.length
        }
      };

      console.log('\n📋 Getting complete order details...');

      const queryReq = http.request(queryOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (response.data && response.data.order) {
              const order = response.data.order;
              console.log('✅ Complete order retrieved!');
              console.log('Order ID:', order.orderId);
              console.log('Final Status:', order.orderStatus);
              console.log('Created:', order.createdAt);
              console.log('Last Updated:', order.updatedAt);
              console.log('\n📈 Status History:');
              order.statusHistory.forEach((update, index) => {
                console.log(`  ${index + 1}. ${update.status} - ${new Date(update.timestamp).toLocaleString()}`);
                console.log(`     Note: ${update.note}`);
              });
              console.log('\n🎉 Order status tracking test completed!');
            } else if (response.errors) {
              console.log('❌ Query errors:', JSON.stringify(response.errors, null, 2));
            }
          } catch (e) {
            console.log('Raw response:', body);
          }
        });
      });

      queryReq.on('error', (err) => {
        console.error('❌ Query failed:', err.message);
      });

      queryReq.write(queryData);
      queryReq.end();
    }

  } catch (error) {
    console.error('Error in test:', error);
  }
}

testOrderStatusUpdates();