const http = require('http');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./schema');

async function testServer() {
  try {
    console.log('Starting test server...');
    const app = express();

    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();
    server.applyMiddleware({ app });

    const httpServer = app.listen({ port: 4000 }, () => {
      console.log(`🚀 Test server ready at http://localhost:4000${server.graphqlPath}`);

      // Now test the query
      const query = `{ orders { id } }`;
      const data = JSON.stringify({ query });

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

      console.log('Testing GraphQL query...');

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log('✅ Query successful!');
          console.log('Response:', body);
          httpServer.close(() => {
            console.log('Test server closed');
            process.exit(0);
          });
        });
      });

      req.on('error', (err) => {
        console.error('❌ Query failed:', err.message);
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

testServer();