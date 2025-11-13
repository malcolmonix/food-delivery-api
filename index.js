require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const graphqlUploadExpress = require('graphql-upload/graphqlUploadExpress.js');
const { typeDefs, resolvers } = require('./schema');
const { admin } = require('./firebase');

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

      // Prepare notification payload
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