require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/use/ws');
const { typeDefs, resolvers } = require('./schema');
const { admin } = require('./firebase');

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Authentication middleware
  const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (token) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
      } catch (error) {
        console.error('Error verifying token:', error);
        // Don't throw error here, just don't set user
      }
    }

    next();
  };

  app.use(authMiddleware);

  // Create executable schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Set up WebSocket subscription handler
  const serverCleanup = useServer({
    schema,
    context: async (ctx) => {
      // Extract token from connection params for subscriptions
      const token = ctx.connectionParams?.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          return { user: decodedToken };
        } catch (error) {
          console.error('Subscription auth error:', error);
        }
      }
      return { user: null };
    },
  }, wsServer);

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({
      user: req.user,
    }),
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  httpServer.listen({ port: PORT }, () => {
    console.log(`🚀 Firebase GraphQL API server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🔌 WebSocket subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});