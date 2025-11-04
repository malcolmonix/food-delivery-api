require('dotenv').config();
const { ApolloServer } = require('apollo-server');
const { typeDefs, resolvers } = require('./schema');
const { admin, db } = require('./firebase');

async function testAuth() {
  console.log('🧪 Testing User Authentication & Profiles...\n');

  let server;
  let testUserId;
  let testToken;
  let testAddressId;

  try {
    // Start test server
    server = new ApolloServer({
      typeDefs,
      resolvers,
      context: () => ({}), // No auth for signup
    });

    // Test 1: Sign up a new user
    console.log('1. Testing user sign up...');
    const SIGNUP_MUTATION = `
      mutation SignUp($email: String!, $password: String!, $displayName: String, $phoneNumber: String) {
        signUp(email: $email, password: $password, displayName: $displayName, phoneNumber: $phoneNumber) {
          user {
            id
            uid
            email
            displayName
            phoneNumber
            addresses {
              id
            }
          }
          token
        }
      }
    `;

    const signupResult = await server.executeOperation({
      query: SIGNUP_MUTATION,
      variables: {
        email: `test${Date.now()}@example.com`,
        password: 'testpassword123',
        displayName: 'Test User',
        phoneNumber: null, // Make phone number optional
      },
    });

    if (signupResult.errors) {
      console.error('❌ Sign up failed:', signupResult.errors[0].message);
      return;
    }

    testUserId = signupResult.data.signUp.user.id;
    testToken = signupResult.data.signUp.token;
    console.log('✅ User signed up successfully:', testUserId);

    // Test 2: Sign in with the created user
    console.log('\n2. Testing user sign in...');
    const SIGNIN_MUTATION = `
      mutation SignIn($email: String!, $password: String!) {
        signIn(email: $email, password: $password) {
          user {
            id
            email
            displayName
          }
          token
        }
      }
    `;

    const signinResult = await server.executeOperation({
      query: SIGNIN_MUTATION,
      variables: {
        email: signupResult.data.signUp.user.email,
        password: 'testpassword123',
      },
    });

    if (signinResult.errors) {
      console.error('❌ Sign in failed:', signinResult.errors[0].message);
    } else {
      console.log('✅ User signed in successfully');
    }

    // Test 3: Get user profile (me query)
    console.log('\n3. Testing get user profile...');
    const ME_QUERY = `
      query Me {
        me {
          id
          email
          displayName
          phoneNumber
          addresses {
            id
            label
            street
            city
            state
            zipCode
            country
            isDefault
          }
        }
      }
    `;

    const meResult = await server.executeOperation({
      query: ME_QUERY,
      contextValue: { user: { uid: testUserId } },
    });

    if (meResult.errors) {
      console.error('❌ Get profile failed:', meResult.errors[0].message);
    } else {
      console.log('✅ User profile retrieved successfully');
    }

    // Test 4: Add an address
    console.log('\n4. Testing add address...');
    const ADD_ADDRESS_MUTATION = `
      mutation AddAddress($label: String!, $street: String!, $city: String!, $state: String!, $zipCode: String!, $country: String!, $isDefault: Boolean) {
        addAddress(label: $label, street: $street, city: $city, state: $state, zipCode: $zipCode, country: $country, isDefault: $isDefault) {
          id
          label
          street
          city
          state
          zipCode
          country
          isDefault
        }
      }
    `;

    const addressResult = await server.executeOperation({
      query: ADD_ADDRESS_MUTATION,
      variables: {
        label: 'Home',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: true,
      },
      contextValue: { user: { uid: testUserId } },
    });

    if (addressResult.errors) {
      console.error('❌ Add address failed:', addressResult.errors[0].message);
    } else {
      testAddressId = addressResult.data.addAddress.id;
      console.log('✅ Address added successfully:', testAddressId);
    }

    // Test 5: Get addresses
    console.log('\n5. Testing get addresses...');
    const ADDRESSES_QUERY = `
      query Addresses {
        addresses {
          id
          label
          street
          city
          isDefault
        }
      }
    `;

    const addressesResult = await server.executeOperation({
      query: ADDRESSES_QUERY,
      contextValue: { user: { uid: testUserId } },
    });

    if (addressesResult.errors) {
      console.error('❌ Get addresses failed:', addressesResult.errors[0].message);
    } else {
      console.log('✅ Addresses retrieved successfully:', addressesResult.data.addresses.length, 'addresses');
    }

    // Test 6: Update profile
    console.log('\n6. Testing update profile...');
    const UPDATE_PROFILE_MUTATION = `
      mutation UpdateProfile($displayName: String, $phoneNumber: String) {
        updateProfile(displayName: $displayName, phoneNumber: $phoneNumber) {
          id
          displayName
          phoneNumber
        }
      }
    `;

    const updateResult = await server.executeOperation({
      query: UPDATE_PROFILE_MUTATION,
      variables: {
        displayName: 'Updated Test User',
        phoneNumber: '+1987654321',
      },
      contextValue: { user: { uid: testUserId } },
    });

    if (updateResult.errors) {
      console.error('❌ Update profile failed:', updateResult.errors[0].message);
    } else {
      console.log('✅ Profile updated successfully');
    }

    // Test 7: Place an order (requires authentication now)
    console.log('\n7. Testing place order with authentication...');
    const PLACE_ORDER_MUTATION = `
      mutation PlaceOrder($restaurant: String!, $orderInput: [OrderItemInput!]!, $paymentMethod: String!, $orderDate: String!) {
        placeOrder(restaurant: $restaurant, orderInput: $orderInput, paymentMethod: $paymentMethod, orderDate: $orderDate) {
          id
          orderId
          userId
          orderStatus
          orderAmount
          paidAmount
        }
      }
    `;

    const orderResult = await server.executeOperation({
      query: PLACE_ORDER_MUTATION,
      variables: {
        restaurant: 'Test Restaurant',
        orderInput: [{
          title: 'Test Item',
          food: 'Test Food',
          description: 'Test Description',
          quantity: 1,
          price: 10.99,
          total: 10.99,
        }],
        paymentMethod: 'CASH',
        orderDate: new Date().toISOString(),
      },
      contextValue: { user: { uid: testUserId } },
    });

    if (orderResult.errors) {
      console.error('❌ Place order failed:', orderResult.errors[0].message);
    } else {
      console.log('✅ Order placed successfully:', orderResult.data.placeOrder.orderId);
    }

    // Test 8: Get user orders
    console.log('\n8. Testing get user orders...');
    const ORDERS_QUERY = `
      query Orders {
        orders {
          id
          orderId
          restaurant
          orderStatus
          orderAmount
        }
      }
    `;

    const ordersResult = await server.executeOperation({
      query: ORDERS_QUERY,
      contextValue: { user: { uid: testUserId } },
    });

    if (ordersResult.errors) {
      console.error('❌ Get orders failed:', ordersResult.errors[0].message);
    } else {
      console.log('✅ User orders retrieved successfully:', ordersResult.data.orders.length, 'orders');
    }

    // Test 9: Delete address
    console.log('\n9. Testing delete address...');
    const DELETE_ADDRESS_MUTATION = `
      mutation DeleteAddress($id: ID!) {
        deleteAddress(id: $id)
      }
    `;

    const deleteResult = await server.executeOperation({
      query: DELETE_ADDRESS_MUTATION,
      variables: {
        id: testAddressId,
      },
      contextValue: { user: { uid: testUserId } },
    });

    if (deleteResult.errors) {
      console.error('❌ Delete address failed:', deleteResult.errors[0].message);
    } else {
      console.log('✅ Address deleted successfully');
    }

    // Test 10: Test authentication required errors
    console.log('\n10. Testing authentication required errors...');
    const unauthResult = await server.executeOperation({
      query: ME_QUERY,
    });

    if (unauthResult.errors && unauthResult.errors[0].message.includes('Authentication required')) {
      console.log('✅ Authentication properly required for protected queries');
    } else {
      console.error('❌ Authentication not properly enforced');
    }

    console.log('\n🎉 All authentication tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Clean up test data
    if (testUserId) {
      try {
        console.log('\n🧹 Cleaning up test data...');
        await admin.auth().deleteUser(testUserId);
        await db.collection('users').doc(testUserId).delete();
        const addressesSnapshot = await db.collection('addresses').where('userId', '==', testUserId).get();
        const batch = db.batch();
        addressesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log('✅ Test data cleaned up');
      } catch (cleanupError) {
        console.error('⚠️  Cleanup failed:', cleanupError.message);
      }
    }
  }
}

// Run the test
testAuth().catch(console.error);