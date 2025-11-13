require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const graphqlUploadExpress = require('graphql-upload/graphqlUploadExpress.js');
const { typeDefs, resolvers } = require('./schema');
const { admin } = require('./firebase');
const { dbHelpers, db } = require('./database');

async function startServer() {
  const app = express();

  // Authentication middleware using Firebase Auth
  const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (token) {
      try {
        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
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
          orderRecord = dbHelpers.getOrderById(orderId);
          if (!orderRecord) {
            // try lookup by the public orderId column
            try {
              const stmt = db.prepare('SELECT * FROM orders WHERE orderId = ?');
              orderRecord = stmt.get(orderId);
            } catch (e) {
              orderRecord = null;
            }
          }
        }

        if (!orderRecord) return res.status(404).json({ error: 'Order not found or cannot verify ownership' });

        // orderRecord.restaurant may be a restaurant id; verify owner
        const maybeRestaurant = dbHelpers.getRestaurantById(orderRecord.restaurant);
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

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      user: req.user,
    }),
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  app.listen({ port: PORT }, () =>
    console.log(`🚀 Food Delivery API server ready at http://localhost:${PORT}${server.graphqlPath}`)
  );
}

startServer().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});