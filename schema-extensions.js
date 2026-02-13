/**
 * Schema Extensions for Complete Order Fulfillment Workflow
 * This file contains the new GraphQL type definitions and resolvers
 * to be integrated into the main schema.js file
 */

// ==================== TYPE DEFINITIONS ====================

const newTypeDefs = `
  # Extended Restaurant type with state
  extend type Restaurant {
    state: String
    isApproved: Boolean
    ownerId: String
  }

  # Extended User type with state
  extend type User {
    state: String
    userType: String  # customer, vendor, rider, admin
  }

  # Rider type (if not exists)
  type Rider {
    id: ID!
    uid: String!
    name: String!
    email: String!
    phone: String!
    state: String!
    vehicleType: String
    vehicleNumber: String