# **API Endpoints Summary**

## **📡 Available Endpoints**

### **GraphQL API**
```
POST http://localhost:4000/graphql
```
**Purpose:** Main GraphQL endpoint for all queries and mutations
**Content-Type:** application/json
**Method:** POST

### **GraphQL Playground (Development)**
```
GET http://localhost:4000/graphql
```
**Purpose:** Interactive GraphQL IDE for testing and exploration
**Available:** Only in development mode
**Browser Access:** Direct URL access

### **Health Check**
```
GET http://localhost:4000/.well-known/apollo/server-health
```
**Purpose:** Server health monitoring and load balancer checks
**Response:** JSON status information
**Use:** Infrastructure monitoring

## **🔍 GraphQL Operations**

### **Queries**
| Operation | Description | Parameters |
|---|---|---|
| `orders` | Get all orders | None |
| `order` | Get single order by ID | `id: ID!` |

### **Mutations**
| Operation | Description | Key Parameters |
|---|---|---|
| `placeOrder` | Create new order | `restaurant`, `orderInput`, `paymentMethod`, `orderDate` |

## **📊 Data Flow**

### **Order Placement Flow**
1. **Client Request** → `placeOrder` mutation
2. **Server Validation** → Required fields check
3. **Amount Calculation** → Subtotal + charges = total
4. **Status Logic** → CASH → CONFIRMED, others → PENDING_PAYMENT
5. **Firebase Save** → Store in `orders` collection
6. **Response** → Return order with generated ID

### **Order Retrieval Flow**
1. **Client Request** → `orders` or `order` query
2. **Firebase Query** → Fetch from `orders` collection
3. **Data Mapping** → Convert to GraphQL format
4. **Response** → Return order(s) data

## **🔒 Authentication & Security**

### **Current Implementation**
- **Authentication:** Firebase Admin SDK (server-side)
- **Authorization:** Firestore security rules
- **User Context:** Placeholder (`"anonymous"`)
- **API Keys:** None required (server-to-server)

### **Security Features**
- ✅ Service account authentication
- ✅ Server-side only operations
- ✅ No client credentials exposed
- ✅ Firestore access control
- ✅ Input validation
- ✅ Error sanitization

## **📈 Monitoring & Observability**

### **Health Endpoints**
- Apollo Server health: `/.well-known/apollo/server-health`
- Custom health checks can be added

### **Logging**
- Server startup logs
- Firebase operation logs
- Error stack traces
- Request/response logging

### **Metrics** (Future)
- Request count per endpoint
- Response times
- Error rates
- Firebase operation metrics

## **🚀 Deployment Endpoints**

### **Development**
```bash
npm run dev  # http://localhost:4000
```

### **Production**
```bash
npm start    # Configurable port via PORT env var
```

### **Docker**
```dockerfile
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/.well-known/apollo/server-health || exit 1
```

## **🔧 Configuration Endpoints**

### **Environment Variables**
All configuration via `.env` file:
- Firebase credentials
- Server port
- Node environment

### **Runtime Configuration**
- No runtime config endpoints
- All config loaded at startup
- Hot reload not supported

## **📋 API Versioning**

### **Current Version**
- **Version:** 1.0.0
- **GraphQL Schema:** Stable
- **Breaking Changes:** None planned

### **Version Strategy**
- Semantic versioning (MAJOR.MINOR.PATCH)
- GraphQL schema evolution
- Backward compatibility maintained
- Deprecation warnings for breaking changes

## **🧪 Testing Endpoints**

### **Test Scripts**
```bash
node test-firebase.js      # Firebase connection
node test-simple.js        # GraphQL queries
node test-running-server.js # Mutations
node test-integrated.js    # Full integration
```

### **Test Coverage**
- ✅ Firebase operations (CRUD)
- ✅ GraphQL schema validation
- ✅ Business logic (payment status)
- ✅ Error handling
- ✅ Data persistence

## **🔗 Integration Points**

### **Frontend Applications**
- **ChopChop:** Apollo Client → `localhost:4000/graphql`
- **Future Apps:** Same GraphQL endpoint

### **External Services**
- **Firebase Firestore:** Primary database
- **Firebase Auth:** Future user authentication
- **Payment Gateways:** Future payment processing

### **Infrastructure**
- **Load Balancers:** Health check endpoint
- **Monitoring:** Server logs and health status
- **CI/CD:** Automated testing and deployment

---

**📊 Summary:**
- **1 GraphQL endpoint** for all operations
- **1 health check endpoint** for monitoring
- **1 playground endpoint** for development
- **100% server-side authentication**
- **Full test coverage** with multiple test scripts