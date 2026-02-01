require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const graphqlUploadExpress = require('graphql-upload/graphqlUploadExpress.js');
const { typeDefs, resolvers } = require('./schema');
const { admin } = require('./firebase');
const { dbHelpers, db } = require('./database.memory');

async function startServer() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:9001',
    'http://localhost:9002',
    'http://localhost:9010',
    'http://localhost:9011',
    'http://localhost:4000',
    'https://deliver-mi.vercel.app',
    'https://rider-mi.vercel.app',
    'https://chopchop.vercel.app',
    'https://menuverse.vercel.app'
  ];

  // In development, always include localhost origins
  const originList = process.env.NODE_ENV === 'production' 
    ? (allowedOrigins.length ? allowedOrigins : defaultOrigins)
    : [...defaultOrigins, ...allowedOrigins];
  console.log('🔧 CORS allowed origins:', originList);

  const corsOptions = {
    origin: (origin, callback) => {
      console.log('🔍 CORS request from origin:', origin);
      
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in the allowed list
      console.log('🔍 Checking if origin is in list:', originList.includes(origin));
      if (originList.includes(origin)) {
        console.log('✅ Origin allowed:', origin);
        return callback(null, true);
      }

      // Allow Vercel preview deployments
      if (origin.includes('.vercel.app')) {
        console.log('✅ Vercel origin allowed:', origin);
        return callback(null, true);
      }

      // Reject other origins
      console.log('❌ Origin rejected:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-api-key', 'x-api_key', 'x-api'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));

  // Handle preflight quickly
  app.options('*', cors(corsOptions));

  // Authentication middleware using Firebase Auth
  const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (token) {
      try {
        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('🔐 Auth Middleware: Decoded token keys:', Object.keys(decodedToken));
        console.log('🔐 Auth Middleware: UID:', decodedToken.uid, 'Email:', decodedToken.email);
        req.user = decodedToken;
      } catch (error) {
        console.error('Error verifying Firebase token:', error.message);
        // Don't throw error here, just don't set user
      }
    }

    next();
  };

  app.use(authMiddleware);

  // File upload middleware (must be before Apollo middleware)
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));
  // JSON body parsing for REST endpoints
  app.use(express.json());

  // Lightweight endpoint for MenuVerse to notify API that a vendor marked an order ready
  app.post('/notify-ready', async (req, res) => {
    try {
      const { body } = req;
      // require authenticated user (authMiddleware sets req.user)
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { orderId, pickupAddress, dropoffAddress, customerName, customerContact, vendorName, vendorContact } = body || {};

      // Verify caller is owner of the restaurant for this order
      try {
        let orderRecord = null;
        if (orderId) {
          orderRecord = await dbHelpers.getOrderById(orderId);
          if (!orderRecord) {
            // try lookup by the public orderId column
            try {
              // Note: Using supabase for lookup instead of direct db.prepare
              orderRecord = await dbHelpers.getOrderByOrderId(orderId);
            } catch (e) {
              orderRecord = null;
            }
          }
        }

        if (!orderRecord) return res.status(404).json({ error: 'Order not found or cannot verify ownership' });

        // orderRecord.restaurant may be a restaurant id; verify owner
        const maybeRestaurant = await dbHelpers.getRestaurantById(orderRecord.restaurant);
        if (!maybeRestaurant || maybeRestaurant.ownerId !== req.user.uid) {
          return res.status(403).json({ error: 'Forbidden: Only the restaurant owner may call this endpoint' });
        }
      } catch (e) {
        console.warn('notify-ready: ownership verification failed', e.message || e);
        return res.status(500).json({ error: 'Failed to verify ownership' });
      }

      // Build deep-link URL to DeliverMi (rider app)
      const DELIVERMI_URL = process.env.DELIVERMI_URL || 'http://localhost:9010';
      const deepLink = `${DELIVERMI_URL.replace(/\/$/, '')}/order/${encodeURIComponent(orderId || '')}`;

      // Prepare notification payload (include `url` for the SW click handler)
      const message = {
        notification: {
          title: 'Order ready for pickup',
          body: `${vendorName || 'Vendor'} — ${pickupAddress || ''}`,
        },
        data: {
          type: 'ORDER_READY',
          orderId: orderId || '',
          pickupAddress: pickupAddress || '',
          dropoffAddress: dropoffAddress || '',
          customerName: customerName || '',
          customerContact: customerContact || '',
          vendorName: vendorName || '',
          vendorContact: vendorContact || '',
          url: deepLink,
        }
      };

      // If Firebase Admin available, collect rider tokens and send multicast
      if (admin && admin.messaging && admin.firestore) {
        try {
          const firestore = admin.firestore();
          const ridersSnapshot = await firestore.collection('riders').get();
          const tokens = [];
          ridersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data && data.fcmToken && (data.available === undefined || data.available === true)) tokens.push(data.fcmToken);
          });

          if (tokens.length) {
            const chunkSize = 500;
            for (let i = 0; i < tokens.length; i += chunkSize) {
              const chunk = tokens.slice(i, i + chunkSize);
              try {
                await admin.messaging().sendMulticast({ tokens: chunk, ...message });
              } catch (err) {
                console.warn('Failed sending notify-ready chunk:', err.message || err);
              }
            }
          }
        } catch (err) {
          console.warn('notify-ready: failed to send notifications', err.message || err);
        }
      }

      return res.json({ ok: true });
    } catch (err) {
      console.error('notify-ready error', err.message || err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  // Return driver details for a given order (used by restaurant UI to show assigned driver)
  app.get('/order-driver/:orderId', async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const { orderId } = req.params;
      if (!orderId) return res.status(400).json({ error: 'orderId required' });

      // Lookup order by id or public orderId
      let order = await dbHelpers.getOrderById(orderId);
      if (!order) {
        try {
          order = await dbHelpers.getOrderByOrderId(orderId);
        } catch (e) { order = null; }
      }
      if (!order) return res.status(404).json({ error: 'Order not found' });

      // Verify caller is the restaurant owner
      const maybeRestaurant = await dbHelpers.getRestaurantById(order.restaurant);
      if (!maybeRestaurant || maybeRestaurant.ownerId !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const riderId = order.riderId;
      if (!riderId) return res.json({ assigned: false });

      // Try to fetch rider profile from users table and Firestore riders collection
      let riderProfile = await dbHelpers.getUserByUid(riderId) || null;
      let riderExtra = null;
      try {
        const snap = await admin.firestore().collection('riders').doc(riderId).get();
        if (snap.exists) riderExtra = snap.data();
      } catch (e) {
        riderExtra = null;
      }

      // Count other active orders for the rider
      const otherOrders = await dbHelpers.getOrdersByRiderId(riderId) || [];
      const activeCount = otherOrders.filter(o => o.id !== order.id && !['DELIVERED', 'CANCELLED'].includes(o.orderStatus)).length;

      return res.json({
        assigned: true,
        rider: {
          uid: riderId,
          name: riderProfile ? (riderProfile.displayName || riderProfile.email) : (riderExtra && riderExtra.name) || null,
          email: riderProfile ? riderProfile.email : (riderExtra && riderExtra.email) || null,
          phone: riderProfile ? riderProfile.phoneNumber : (riderExtra && riderExtra.phone) || null,
          fcmToken: riderExtra ? riderExtra.fcmToken : null,
          available: riderExtra ? riderExtra.available : null,
          activeOrders: activeCount,
        }
      });
    } catch (e) {
      console.error('/order-driver error', e.message || e);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  // Webhook: rider location updates
  app.post('/api/webhooks/rider-location-update', async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.headers['x-api_key'] || req.headers['x-api'] || '';
      const expected = process.env.DELIVERMI_WEBHOOK_API_KEY || process.env.CHOPCHOP_WEBHOOK_API_KEY || '';
      if (!expected || !apiKey || apiKey !== expected) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const payload = req.body || {};
      const { orderId, riderId, latitude, longitude, heading, speed, timestamp } = payload;
      if (!orderId || !riderId || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Invalid payload; required: orderId, riderId, latitude, longitude' });
      }

      const firestore = admin.firestore();

      const loc = {
        lat: latitude,
        lng: longitude,
        heading: heading || null,
        speed: speed || null,
        at: timestamp || new Date().toISOString(),
        riderId
      };

      // Write to rider-locations/{riderId} for quick lookup
      try {
        await firestore.collection('rider-locations').doc(riderId).set({
          location: loc,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('rider-location-update: failed writing rider-locations', e.message || e);
      }

      // Update the customer-facing order document (customer-orders/{orderId}) with latest rider location
      try {
        const orderRef = firestore.collection('customer-orders').doc(orderId);
        await orderRef.set({
          rider: {
            id: riderId,
            location: loc
          },
          lastRiderLocationAt: loc.at
        }, { merge: true });

        // Also append a tracking update entry for history
        await orderRef.update({
          trackingUpdates: admin.firestore.FieldValue.arrayUnion(loc)
        });
      } catch (e) {
        console.warn('rider-location-update: failed writing customer-orders', e.message || e);
      }

      return res.json({ ok: true });
    } catch (err) {
      console.error('rider-location-update error', err.message || err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      user: req.user,
    }),
  });

  await server.start();
  server.applyMiddleware({ app });

  // Global Error Handler Middleware
  app.use((err, req, res, next) => {
    console.error('🔥 Global API Error:', err.stack || err.message || err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString()
    });
  });

  const PORT = process.env.PORT || 4000;
  app.listen({ port: PORT }, () =>
    console.log(`🚀 Food Delivery API server ready at http://localhost:${PORT}${server.graphqlPath}`)
  );
}

startServer().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});