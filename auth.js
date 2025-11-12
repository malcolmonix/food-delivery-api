/**
 * Authentication Service
 * Handles user authentication with JWT tokens and bcrypt password hashing
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { dbHelpers } = require('./database');

// JWT Secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User and token
 */
async function register(userData) {
  const { email, password, displayName, phoneNumber } = userData;
  
  // Check if user already exists
  const existingUser = dbHelpers.getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create user
  const uid = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newUser = {
    uid,
    email,
    password: hashedPassword,
    displayName: displayName || null,
    phoneNumber: phoneNumber || null,
    photoURL: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  dbHelpers.createUser(newUser);
  
  // Generate token
  const token = generateToken(newUser);
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = newUser;
  
  return {
    user: {
      id: uid,
      ...userWithoutPassword,
      addresses: [],
    },
    token,
  };
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User and token
 */
async function login(email, password) {
  // Get user by email
  const user = dbHelpers.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Verify password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }
  
  // Generate token
  const token = generateToken(user);
  
  // Get user addresses
  const addresses = dbHelpers.getAddressesByUserId(user.uid);
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: {
      id: user.uid,
      ...userWithoutPassword,
      addresses: addresses.map(addr => ({
        ...addr,
        isDefault: Boolean(addr.isDefault),
      })),
    },
    token,
  };
}

/**
 * Get user by UID
 * @param {string} uid - User UID
 * @returns {Object|null} User object without password
 */
function getUserById(uid) {
  const user = dbHelpers.getUserByUid(uid);
  if (!user) return null;
  
  const addresses = dbHelpers.getAddressesByUserId(uid);
  
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    id: uid,
    ...userWithoutPassword,
    addresses: addresses.map(addr => ({
      ...addr,
      isDefault: Boolean(addr.isDefault),
    })),
  };
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  register,
  login,
  getUserById,
};
