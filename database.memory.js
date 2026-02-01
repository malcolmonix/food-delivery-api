/**
 * In-Memory Database Module
 * Simple in-memory storage for local development
 */

// In-memory storage
const storage = {
  users: new Map(),
  restaurants: new Map(),
  menuItems: new Map(),
  orders: new Map(),
  addresses: new Map(),
  rides: new Map()
};

// Initialize with sample data for testing
function initializeSampleData() {
  // Sample users
  const sampleUsers = [
    {
      id: 'user-1',
      uid: 'user-1',
      email: 'john@example.com',
      displayName: 'John Doe',
      phoneNumber: '+1234567890',
      userType: 'customer',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user-2',
      uid: 'user-2',
      email: 'jane@example.com',
      displayName: 'Jane Smith',
      phoneNumber: '+1234567891',
      userType: 'customer',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rider-1',
      uid: 'rider-1',
      email: 'rider1@example.com',
      displayName: 'Mike Wilson',
      phoneNumber: '+1234567892',
      userType: 'rider',
      averageRating: 4.8,
      vehicleType: 'motorcycle',
      isOnline: true,
      latitude: 6.5244,
      longitude: 3.3792,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rider-2',
      uid: 'rider-2',
      email: 'rider2@example.com',
      displayName: 'Sarah Johnson',
      phoneNumber: '+1234567893',
      userType: 'rider',
      averageRating: 4.6,
      vehicleType: 'bicycle',
      isOnline: false,
      latitude: 6.4541,
      longitude: 3.3947,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Sample restaurants
  const sampleRestaurants = [
    {
      id: 'restaurant-1',
      name: 'Pizza Palace',
      description: 'Best pizza in town',
      cuisine: '["Italian", "Pizza"]',
      rating: 4.5,
      reviewCount: 120,
      isActive: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'restaurant-2',
      name: 'Burger Barn',
      description: 'Gourmet burgers and fries',
      cuisine: '["American", "Burgers"]',
      rating: 4.2,
      reviewCount: 85,
      isActive: true,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'restaurant-3',
      name: 'Sushi Spot',
      description: 'Fresh sushi and Japanese cuisine',
      cuisine: '["Japanese", "Sushi"]',
      rating: 4.7,
      reviewCount: 95,
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Sample orders
  const sampleOrders = [
    {
      id: 'order-1',
      orderId: 'ORD-001',
      userId: 'user-1',
      restaurant: 'Pizza Palace',
      orderItems: JSON.stringify([
        {
          title: 'Margherita Pizza',
          food: 'Pizza',
          description: 'Classic tomato and mozzarella',
          quantity: 1,
          price: 12.99,
          total: 12.99
        },
        {
          title: 'Garlic Bread',
          food: 'Sides',
          description: 'Toasted with garlic butter',
          quantity: 2,
          price: 4.50,
          total: 9.00
        }
      ]),
      orderAmount: 25.99,
      paidAmount: 25.99,
      paymentMethod: 'CARD',
      orderStatus: 'COMPLETED',
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      riderId: 'rider-1',
      deliveryCharges: 3.99,
      address: '123 Main St, City',
      statusHistory: JSON.stringify([
        { status: 'PENDING', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'ACCEPTED', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString() },
        { status: 'COMPLETED', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() }
      ]),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
    },
    {
      id: 'order-2',
      orderId: 'ORD-002',
      userId: 'user-2',
      restaurant: 'Burger Barn',
      orderItems: JSON.stringify([
        {
          title: 'Classic Burger',
          food: 'Burger',
          description: 'Beef patty with lettuce and tomato',
          quantity: 1,
          price: 10.50,
          total: 10.50
        },
        {
          title: 'French Fries',
          food: 'Sides',
          description: 'Crispy golden fries',
          quantity: 1,
          price: 5.00,
          total: 5.00
        }
      ]),
      orderAmount: 18.50,
      paidAmount: 18.50,
      paymentMethod: 'CASH',
      orderStatus: 'COMPLETED',
      orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      riderId: 'rider-2',
      deliveryCharges: 2.99,
      address: '456 Oak Ave, City',
      statusHistory: JSON.stringify([
        { status: 'PENDING', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { status: 'ACCEPTED', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString() },
        { status: 'COMPLETED', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString() }
      ]),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()
    },
    {
      id: 'order-3',
      orderId: 'ORD-003',
      userId: 'user-1',
      restaurant: 'Sushi Spot',
      orderItems: JSON.stringify([
        {
          title: 'California Roll',
          food: 'Sushi',
          description: 'Crab, avocado, cucumber',
          quantity: 2,
          price: 12.50,
          total: 25.00
        },
        {
          title: 'Miso Soup',
          food: 'Soup',
          description: 'Traditional Japanese soup',
          quantity: 1,
          price: 3.75,
          total: 3.75
        }
      ]),
      orderAmount: 32.75,
      paidAmount: 32.75,
      paymentMethod: 'CARD',
      orderStatus: 'IN_PROGRESS',
      orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      riderId: 'rider-1',
      deliveryCharges: 4.99,
      address: '789 Pine St, City',
      statusHistory: JSON.stringify([
        { status: 'PENDING', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { status: 'ACCEPTED', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
      ]),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'order-4',
      orderId: 'ORD-004',
      userId: 'user-2',
      restaurant: 'Pizza Palace',
      orderItems: JSON.stringify([
        {
          title: 'Pepperoni Pizza',
          food: 'Pizza',
          description: 'Loaded with pepperoni',
          quantity: 1,
          price: 14.25,
          total: 14.25
        },
        {
          title: 'Coke',
          food: 'Drinks',
          description: 'Chilled soft drink',
          quantity: 2,
          price: 2.00,
          total: 4.00
        }
      ]),
      orderAmount: 22.25,
      paidAmount: 22.25,
      paymentMethod: 'WALLET',
      orderStatus: 'PENDING',
      orderDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      deliveryCharges: 3.99,
      address: '321 Elm St, City',
      statusHistory: JSON.stringify([
        { status: 'PENDING', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
      ]),
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'order-5',
      orderId: 'ORD-005',
      userId: 'user-1',
      restaurant: 'Burger Barn',
      orderItems: JSON.stringify([
        {
          title: 'Double Cheeseburger',
          food: 'Burger',
          description: 'Two beef patties with cheese',
          quantity: 1,
          price: 15.99,
          total: 15.99
        }
      ]),
      orderAmount: 15.99,
      paidAmount: 15.99,
      paymentMethod: 'CARD',
      orderStatus: 'PROCESSING',
      orderDate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      riderId: 'rider-2',
      deliveryCharges: 3.50,
      address: '123 Main St, City',
      statusHistory: JSON.stringify([
        { status: 'PENDING', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
        { status: 'PROCESSING', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() }
      ]),
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    }
  ];

  // Sample rides
  const sampleRides = [
    {
      id: 'ride-1',
      rideId: 'RIDE-001',
      userId: 'user-1',
      riderId: 'rider-1',
      pickupAddress: '123 Main St',
      dropoffAddress: '456 Oak Ave',
      status: 'COMPLETED',
      fare: 15.50,
      distance: 5.2,
      duration: 18,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString()
    },
    {
      id: 'ride-2',
      rideId: 'RIDE-002',
      userId: 'user-2',
      riderId: 'rider-2',
      pickupAddress: '789 Pine St',
      dropoffAddress: '321 Elm St',
      status: 'COMPLETED',
      fare: 12.75,
      distance: 3.8,
      duration: 14,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString()
    }
  ];

  // Populate storage
  sampleUsers.forEach(user => storage.users.set(user.id, user));
  sampleRestaurants.forEach(restaurant => storage.restaurants.set(restaurant.id, restaurant));
  sampleOrders.forEach(order => storage.orders.set(order.id, order));
  sampleRides.forEach(ride => storage.rides.set(ride.id, ride));

  console.log('🎯 Sample data initialized:', {
    users: storage.users.size,
    restaurants: storage.restaurants.size,
    orders: storage.orders.size,
    rides: storage.rides.size
  });
}

// Initialize sample data on module load
initializeSampleData();

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const dbHelpers = {
  // ==================== USER OPERATIONS ====================

  async createUser(userData) {
    const id = userData.uid || generateId();
    const user = {
      id,
      uid: userData.uid || id,
      email: userData.email,
      displayName: userData.displayName || null,
      phoneNumber: userData.phoneNumber || null,
      photoURL: userData.photoURL || null,
      userType: userData.userType || 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storage.users.set(id, user);
    console.log('✅ User created in memory:', user.email);
    return user;
  },

  async getUserByUid(uid) {
    return this.getUserById(uid);
  },

  async getUserById(uid) {
    for (const [id, user] of storage.users) {
      if (user.uid === uid) {
        return user;
      }
    }
    return null;
  },

  async getUserByEmail(email) {
    for (const [id, user] of storage.users) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  },

  async updateUser(uid, updates) {
    for (const [id, user] of storage.users) {
      if (user.uid === uid) {
        const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
        storage.users.set(id, updatedUser);
        return updatedUser;
      }
    }
    return null;
  },

  // ==================== RESTAURANT OPERATIONS ====================

  async createRestaurant(restaurantData) {
    const id = generateId();
    const restaurant = {
      id,
      ...restaurantData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storage.restaurants.set(id, restaurant);
    console.log('✅ Restaurant created in memory:', restaurant.name);
    return restaurant;
  },

  async getAllRestaurants() {
    return Array.from(storage.restaurants.values());
  },

  async getRestaurantById(id) {
    return storage.restaurants.get(id) || null;
  },

  // ==================== ORDER OPERATIONS ====================

  async createOrder(orderData) {
    const id = generateId();
    const order = {
      id,
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storage.orders.set(id, order);
    console.log('✅ Order created in memory:', id);
    return id;
  },

  async getOrderById(id) {
    return storage.orders.get(id) || null;
  },

  async getOrdersByUser(userId) {
    return Array.from(storage.orders.values()).filter(order => order.userId === userId);
  },

  async updateOrderStatus(orderId, status) {
    const order = storage.orders.get(orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      storage.orders.set(orderId, order);
      return order;
    }
    return null;
  },

  // ==================== ADDRESS OPERATIONS ====================

  async createAddress(addressData) {
    const id = generateId();
    const address = {
      id,
      ...addressData,
      createdAt: new Date().toISOString()
    };

    storage.addresses.set(id, address);
    return address;
  },

  async getAddressesByUser(userId) {
    return Array.from(storage.addresses.values()).filter(addr => addr.userId === userId);
  },

  async getAddressesByUserId(userId) {
    return this.getAddressesByUser(userId);
  },

  // ==================== RIDE OPERATIONS ====================

  async createRide(rideData) {
    const id = generateId();
    const ride = {
      id,
      ...rideData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storage.rides.set(id, ride);
    console.log('✅ Ride created in memory:', id);
    return id;
  },

  async getRideById(id) {
    return storage.rides.get(id) || null;
  },

  async updateRideStatus(rideId, status) {
    const ride = storage.rides.get(rideId);
    if (ride) {
      ride.status = status;
      ride.updatedAt = new Date().toISOString();
      storage.rides.set(rideId, ride);
      return ride;
    }
    return null;
  },

  async getPendingRides() {
    return Array.from(storage.rides.values())
      .filter(ride => ride.status === 'REQUESTED' && !ride.riderId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getAvailableRides() {
    return this.getPendingRides();
  },

  // ==================== STATISTICS OPERATIONS ====================

  async getStatistics() {
    const users = Array.from(storage.users.values());
    const restaurants = Array.from(storage.restaurants.values());
    const orders = Array.from(storage.orders.values());
    const rides = Array.from(storage.rides.values());

    // Calculate basic counts
    const totalUsers = users.length;
    const totalRestaurants = restaurants.length;
    const totalOrders = orders.length;
    const totalRiders = users.filter(user => user.userType === 'rider').length;

    // Calculate revenue from orders
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + (parseFloat(order.orderAmount) || 0);
    }, 0);

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate orders by status
    const statusCounts = {};
    orders.forEach(order => {
      const status = order.orderStatus || 'PENDING';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
    }));

    // Calculate top restaurants by order count
    const restaurantStats = {};
    orders.forEach(order => {
      const restaurantId = order.restaurant;
      if (!restaurantStats[restaurantId]) {
        restaurantStats[restaurantId] = {
          orderCount: 0,
          revenue: 0
        };
      }
      restaurantStats[restaurantId].orderCount++;
      restaurantStats[restaurantId].revenue += parseFloat(order.orderAmount) || 0;
    });

    const topRestaurants = Object.entries(restaurantStats)
      .map(([restaurantId, stats]) => {
        const restaurant = restaurants.find(r => r.id === restaurantId);
        return {
          id: restaurantId,
          name: restaurant?.name || 'Unknown Restaurant',
          orderCount: stats.orderCount,
          revenue: stats.revenue,
          averageRating: restaurant?.rating || 0
        };
      })
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);

    // Calculate top riders by delivery count
    const riderStats = {};
    orders.forEach(order => {
      if (order.riderId) {
        if (!riderStats[order.riderId]) {
          riderStats[order.riderId] = {
            deliveryCount: 0,
            earnings: 0
          };
        }
        riderStats[order.riderId].deliveryCount++;
        riderStats[order.riderId].earnings += parseFloat(order.deliveryCharges) || 0;
      }
    });

    // Also include ride earnings for riders
    rides.forEach(ride => {
      if (ride.riderId && ride.status === 'COMPLETED') {
        if (!riderStats[ride.riderId]) {
          riderStats[ride.riderId] = {
            deliveryCount: 0,
            earnings: 0
          };
        }
        riderStats[ride.riderId].earnings += parseFloat(ride.fare) || 0;
      }
    });

    const topRiders = Object.entries(riderStats)
      .map(([riderId, stats]) => {
        const rider = users.find(u => u.uid === riderId);
        return {
          id: riderId,
          displayName: rider?.displayName || 'Unknown Rider',
          deliveryCount: stats.deliveryCount,
          earnings: stats.earnings,
          averageRating: rider?.averageRating || 0
        };
      })
      .sort((a, b) => b.deliveryCount - a.deliveryCount)
      .slice(0, 5);

    return {
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalRiders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      topRestaurants,
      topRiders,
      lastUpdated: new Date().toISOString()
    };
  }
};

// Mock database object for compatibility
const db = {
  prepare: () => ({
    all: () => [],
    get: () => null,
    run: () => ({ changes: 1 })
  })
};

console.log('🧠 In-memory database initialized for local development');

module.exports = { dbHelpers, db, generateId };