# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3003

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: process.env.PORT || 3003, path: '/graphql', method: 'POST', headers: { 'Content-Type': 'application/json' } }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.write('{\"query\": \"{ __typename }\"}'); req.end();"

# Start the application
CMD ["npm", "start"]