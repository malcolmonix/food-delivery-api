require('dotenv').config();
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { typeDefs, resolvers } = require('./schema');
const { admin, db } = require('./firebase');

async function testRestaurantManagement() {
  console.log('🍽️ Testing Restaurant & Menu Management...\n');

  let testUserId;
  let testRestaurantId;
  let testMenuItemId;
  let testCategoryId;

  // Create executable schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  try {

    // Test 1: Create a test user first
    console.log('1. Creating test user...');
    const SIGNUP_MUTATION = `
      mutation SignUp($email: String!, $password: String!, $displayName: String) {
        signUp(email: $email, password: $password, displayName: $displayName) {
          user { id email displayName }
          token
        }
      }
    `;

    const signupResult = await graphql({
      schema,
      source: SIGNUP_MUTATION,
      variableValues: {
        email: `restaurant-owner${Date.now()}@example.com`,
        password: 'testpassword123',
        displayName: 'Restaurant Owner',
      },
      contextValue: {},
    });

    if (signupResult.errors) {
      console.error('❌ User creation failed:', signupResult.errors[0].message);
      return;
    }

    testUserId = signupResult.data.signUp.user.id;
    testToken = signupResult.data.signUp.token;
    console.log('✅ Test user created:', testUserId);

    // Test 2: Create a restaurant
    console.log('\n2. Testing restaurant creation...');
    const CREATE_RESTAURANT_MUTATION = `
      mutation CreateRestaurant(
        $name: String!
        $description: String!
        $contactEmail: String
        $phoneNumber: String
        $address: String
        $cuisine: [String!]
        $priceRange: String
        $openingHours: [OpeningHourInput!]
      ) {
        createRestaurant(
          name: $name
          description: $description
          contactEmail: $contactEmail
          phoneNumber: $phoneNumber
          address: $address
          cuisine: $cuisine
          priceRange: $priceRange
          openingHours: $openingHours
        ) {
          id
          name
          description
          contactEmail
          cuisine
          isActive
          openingHours {
            day
            open
            close
            isClosed
          }
        }
      }
    `;

    const restaurantResult = await graphql({
      schema,
      source: CREATE_RESTAURANT_MUTATION,
      variableValues: {
        name: 'Test Restaurant',
        description: 'A great place to eat',
        contactEmail: 'contact@testrestaurant.com',
        phoneNumber: '+1234567890',
        address: '123 Test Street, Test City',
        cuisine: ['Italian', 'Pizza'],
        priceRange: '$$',
        openingHours: [
          { day: 'Monday', open: '09:00', close: '22:00', isClosed: false },
          { day: 'Tuesday', open: '09:00', close: '22:00', isClosed: false },
          { day: 'Wednesday', open: '09:00', close: '22:00', isClosed: false },
          { day: 'Thursday', open: '09:00', close: '22:00', isClosed: false },
          { day: 'Friday', open: '09:00', close: '23:00', isClosed: false },
          { day: 'Saturday', open: '10:00', close: '23:00', isClosed: false },
          { day: 'Sunday', open: '10:00', close: '21:00', isClosed: false },
        ],
      },
      contextValue: {
        user: { uid: testUserId }
      },
    });

    if (restaurantResult.errors) {
      console.error('❌ Restaurant creation failed:', restaurantResult.errors[0].message);
    } else {
      testRestaurantId = restaurantResult.data.createRestaurant.id;
      console.log('✅ Restaurant created:', testRestaurantId);
    }

    // Test 3: Get restaurants list
    console.log('\n3. Testing get restaurants...');
    const RESTAURANTS_QUERY = `
      query Restaurants($search: String, $cuisine: String, $limit: Int) {
        restaurants(search: $search, cuisine: $cuisine, limit: $limit) {
          id
          name
          description
          cuisine
          isActive
          rating
          reviewCount
        }
      }
    `;

    const restaurantsResult = await graphql({
      schema,
      source: RESTAURANTS_QUERY,
      variableValues: {
        limit: 10,
      },
      contextValue: {},
    });

    if (restaurantsResult.errors) {
      console.error('❌ Get restaurants failed:', restaurantsResult.errors[0].message);
    } else {
      console.log('✅ Restaurants retrieved:', restaurantsResult.data.restaurants.length, 'restaurants');
    }

    // Test 4: Get single restaurant
    console.log('\n4. Testing get single restaurant...');
    const RESTAURANT_QUERY = `
      query Restaurant($id: ID!) {
        restaurant(id: $id) {
          id
          name
          description
          contactEmail
          phoneNumber
          address
          cuisine
          priceRange
          openingHours {
            day
            open
            close
            isClosed
          }
          isActive
        }
      }
    `;

    const restaurantQueryResult = await graphql({
      schema,
      source: RESTAURANT_QUERY,
      variableValues: {
        id: testRestaurantId,
      },
      contextValue: {},
    });

    if (restaurantQueryResult.errors) {
      console.error('❌ Get restaurant failed:', restaurantQueryResult.errors[0].message);
    } else {
      console.log('✅ Restaurant retrieved successfully');
    }

    // Test 5: Update restaurant
    console.log('\n5. Testing restaurant update...');
    const UPDATE_RESTAURANT_MUTATION = `
      mutation UpdateRestaurant($id: ID!, $description: String, $phoneNumber: String, $isActive: Boolean) {
        updateRestaurant(id: $id, description: $description, phoneNumber: $phoneNumber, isActive: $isActive) {
          id
          description
          phoneNumber
          isActive
        }
      }
    `;

    const updateResult = await graphql({
      schema,
      source: UPDATE_RESTAURANT_MUTATION,
      variableValues: {
        id: testRestaurantId,
        description: 'An amazing place to eat with great service',
        phoneNumber: '+1987654321',
        isActive: true,
      },
      contextValue: {
        user: { uid: testUserId }
      },
    });

    if (updateResult.errors) {
      console.error('❌ Restaurant update failed:', updateResult.errors[0].message);
    } else {
      console.log('✅ Restaurant updated successfully');
    }

    // Test 6: Create menu item
    console.log('\n6. Testing menu item creation...');
    const CREATE_MENU_ITEM_MUTATION = `
      mutation CreateMenuItem(
        $restaurantId: ID!
        $name: String!
        $description: String!
        $price: Float!
        $category: String!
        $imageUrl: String
        $isAvailable: Boolean
        $isVegetarian: Boolean
        $isVegan: Boolean
        $allergens: [String!]
      ) {
        createMenuItem(
          restaurantId: $restaurantId
          name: $name
          description: $description
          price: $price
          category: $category
          imageUrl: $imageUrl
          isAvailable: $isAvailable
          isVegetarian: $isVegetarian
          isVegan: $isVegan
          allergens: $allergens
        ) {
          id
          name
          description
          price
          category
          isAvailable
          isVegetarian
          isVegan
          allergens
        }
      }
    `;

    const menuItemResult = await graphql({
      schema,
      source: CREATE_MENU_ITEM_MUTATION,
      variableValues: {
        restaurantId: testRestaurantId,
        name: 'Margherita Pizza',
        description: 'Fresh tomato sauce, mozzarella cheese, and basil',
        price: 15.99,
        category: 'Main Course',
        imageUrl: 'https://example.com/pizza.jpg',
        isAvailable: true,
        isVegetarian: true,
        isVegan: false,
        allergens: ['Dairy'],
      },
      contextValue: {
        user: { uid: testUserId }
      },
    });

    if (menuItemResult.errors) {
      console.error('❌ Menu item creation failed:', menuItemResult.errors[0].message);
    } else {
      testMenuItemId = menuItemResult.data.createMenuItem.id;
      console.log('✅ Menu item created:', testMenuItemId);
    }

    // Test 7: Get menu items
    console.log('\n7. Testing get menu items...');
    const MENU_ITEMS_QUERY = `
      query MenuItems($restaurantId: ID!) {
        menuItems(restaurantId: $restaurantId) {
          id
          name
          description
          price
          category
          isAvailable
          isVegetarian
          isVegan
          allergens
        }
      }
    `;

    const menuItemsResult = await graphql({
      schema,
      source: MENU_ITEMS_QUERY,
      variableValues: {
        restaurantId: testRestaurantId,
      },
      contextValue: {},
    });

    if (menuItemsResult.errors) {
      console.error('❌ Get menu items failed:', menuItemsResult.errors[0].message);
    } else {
      console.log('✅ Menu items retrieved:', menuItemsResult.data.menuItems.length, 'items');
    }

    // Test 8: Update menu item
    console.log('\n8. Testing menu item update...');
    const UPDATE_MENU_ITEM_MUTATION = `
      mutation UpdateMenuItem($id: ID!, $price: Float, $isAvailable: Boolean, $description: String) {
        updateMenuItem(id: $id, price: $price, isAvailable: $isAvailable, description: $description) {
          id
          price
          isAvailable
          description
        }
      }
    `;

    const updateMenuResult = await graphql({
      schema,
      source: UPDATE_MENU_ITEM_MUTATION,
      variableValues: {
        id: testMenuItemId,
        price: 17.99,
        isAvailable: true,
        description: 'Fresh tomato sauce, mozzarella cheese, basil, and extra love',
      },
      contextValue: {
        user: { uid: testUserId }
      },
    });

    if (updateMenuResult.errors) {
      console.error('❌ Menu item update failed:', updateMenuResult.errors[0].message);
    } else {
      console.log('✅ Menu item updated successfully');
    }

    // Test 9: Create menu category
    console.log('\n9. Testing menu category creation...');
    const CREATE_CATEGORY_MUTATION = `
      mutation CreateMenuCategory($restaurantId: ID!, $name: String!, $description: String, $displayOrder: Int) {
        createMenuCategory(restaurantId: $restaurantId, name: $name, description: $description, displayOrder: $displayOrder) {
          id
          name
          description
          displayOrder
        }
      }
    `;

    const categoryResult = await graphql({
      schema,
      source: CREATE_CATEGORY_MUTATION,
      variableValues: {
        restaurantId: testRestaurantId,
        name: 'Pizza',
        description: 'Wood-fired pizzas with fresh ingredients',
        displayOrder: 1,
      },
      contextValue: {
        user: { uid: testUserId }
      },
    });

    if (categoryResult.errors) {
      console.error('❌ Category creation failed:', categoryResult.errors[0].message);
    } else {
      testCategoryId = categoryResult.data.createMenuCategory.id;
      console.log('✅ Menu category created:', testCategoryId);
    }

    // Test 10: Get menu categories
    console.log('\n10. Testing get menu categories...');
    const MENU_CATEGORIES_QUERY = `
      query MenuCategories($restaurantId: ID!) {
        menuCategories(restaurantId: $restaurantId) {
          id
          name
          description
          displayOrder
        }
      }
    `;

    const categoriesResult = await graphql({
      schema,
      source: MENU_CATEGORIES_QUERY,
      variableValues: {
        restaurantId: testRestaurantId,
      },
      contextValue: {},
    });

    if (categoriesResult.errors) {
      console.error('❌ Get menu categories failed:', categoriesResult.errors[0].message);
    } else {
      console.log('✅ Menu categories retrieved:', categoriesResult.data.menuCategories.length, 'categories');
    }

    // Test 11: Delete menu item
    console.log('\n11. Testing menu item deletion...');
    const DELETE_MENU_ITEM_MUTATION = `
      mutation DeleteMenuItem($id: ID!) {
        deleteMenuItem(id: $id)
      }
    `;

    const deleteMenuResult = await graphql({
      schema,
      source: DELETE_MENU_ITEM_MUTATION,
      variableValues: {
        id: testMenuItemId,
      },
      contextValue: {
        user: { uid: testUserId }
      },
    });

    if (deleteMenuResult.errors) {
      console.error('❌ Menu item deletion failed:', deleteMenuResult.errors[0].message);
    } else {
      console.log('✅ Menu item deleted successfully');
    }

    // Test 12: Test access control
    console.log('\n12. Testing access control...');
    // Try to create restaurant without authentication
    const unauthResult = await graphql({
      schema,
      source: CREATE_RESTAURANT_MUTATION,
      variableValues: {
        name: 'Unauthorized Restaurant',
        description: 'Should not be created',
      },
      contextValue: {},
    });

    if (unauthResult.errors && unauthResult.errors[0].message.includes('Authentication required')) {
      console.log('✅ Access control working - authentication required');
    } else {
      console.error('❌ Access control failed');
    }

    console.log('\n🎉 All restaurant management tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Clean up test data
    if (testUserId) {
      try {
        console.log('\n🧹 Cleaning up test data...');
        if (testUserId) await admin.auth().deleteUser(testUserId);
        if (testUserId) await db.collection('users').doc(testUserId).delete();

        // Clean up restaurant and related data
        if (testRestaurantId) {
          await db.collection('eateries').doc(testRestaurantId).delete();
        }

        console.log('✅ Test data cleaned up');
      } catch (cleanupError) {
        console.error('⚠️  Cleanup failed:', cleanupError.message);
      }
    }
  }
}

// Run the test
testRestaurantManagement().catch(console.error);