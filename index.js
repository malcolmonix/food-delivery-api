require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { graphqlUploadExpress } = require('graphql-upload');
const { typeDefs, resolvers } = require('./schema');
const { verifyToken } = require('./auth');

async function startServer() {
  const app = express();

  // Authentication middleware using JWT
  const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (token) {
      try {
        const decodedToken = verifyToken(token);
        req.user = decodedToken;
      } catch (error) {
        console.error('Error verifying token:', error.message);
        // Don't throw error here, just don't set user
      }
    }

    next();
  };

  app.use(authMiddleware);
  
  // File upload middleware (must be before Apollo middleware)
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

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