-- SUPABASE SQL SCHEMA FOR FOOD DELIVERY PLATFORM

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- For custom auth if used
  display_name TEXT,
  phone_number TEXT,
  photo_url TEXT,
  user_type TEXT DEFAULT 'customer', -- 'customer', 'rider', 'vendor', 'admin'
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_online BOOLEAN DEFAULT false,
  last_location_update TIMESTAMPTZ,
  last_status_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(uid) ON DELETE CASCADE,
  label TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  contact_email TEXT,
  phone_number TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cuisine TEXT[] DEFAULT '{}',
  price_range TEXT,
  rating DOUBLE PRECISION,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  opening_hours JSONB DEFAULT '[]',
  owner_id TEXT REFERENCES users(uid),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- MENU CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DOUBLE PRECISION NOT NULL,
  category TEXT,
  category_id TEXT REFERENCES menu_categories(id),
  image_url TEXT,
  image_hint TEXT,
  is_available BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  allergens TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES users(uid),
  rider_id TEXT REFERENCES users(uid),
  restaurant TEXT, -- Name or ID
  restaurant_id TEXT REFERENCES restaurants(id),
  order_items JSONB NOT NULL DEFAULT '[]',
  order_amount DOUBLE PRECISION NOT NULL,
  paid_amount DOUBLE PRECISION NOT NULL,
  payment_method TEXT NOT NULL,
  order_status TEXT NOT NULL,
  order_date TEXT NOT NULL,
  expected_time TEXT,
  is_picked_up BOOLEAN DEFAULT false,
  pickup_code TEXT,
  payment_processed BOOLEAN DEFAULT false,
  delivery_charges DOUBLE PRECISION DEFAULT 0,
  tipping DOUBLE PRECISION DEFAULT 0,
  taxation_amount DOUBLE PRECISION DEFAULT 0,
  address TEXT,
  instructions TEXT,
  coupon_code TEXT,
  status_history JSONB DEFAULT '[]',
  customer_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RIDES TABLE
CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY,
  ride_id TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES users(uid),
  rider_id TEXT REFERENCES users(uid),
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL,
  fare DOUBLE PRECISION NOT NULL,
  distance DOUBLE PRECISION,
  duration INTEGER,
  payment_method TEXT,
  rating INTEGER,
  feedback TEXT,
  delivery_code TEXT,
  rider_photo TEXT,
  rider_name TEXT,
  rider_phone TEXT,
  accepted_at TIMESTAMPTZ,
  arrived_at_pickup_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  arrived_at_dropoff_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RIDER NOTIFICATIONS TABLE (for persistent notification history)
CREATE TABLE IF NOT EXISTS rider_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  rider_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'new_ride', 'ride_cancelled', 'payment', 'rating', 'promo', 'message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  ride_id TEXT,
  sender_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for rider notifications
CREATE INDEX IF NOT EXISTS idx_rider_notifications_rider_id ON rider_notifications(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_notifications_created_at ON rider_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rider_notifications_read ON rider_notifications(read);
CREATE INDEX IF NOT EXISTS idx_rider_notifications_ride_id ON rider_notifications(ride_id);

-- ERRORS TABLE (for error tracking system)
CREATE TABLE IF NOT EXISTS errors (
  id SERIAL PRIMARY KEY,
  app TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  name TEXT,
  code TEXT,
  
  -- GraphQL specific
  graphql_errors JSONB,
  network_error JSONB,
  
  -- Context
  page TEXT,
  url TEXT,
  severity TEXT DEFAULT 'error',
  context JSONB,
  error_info JSONB,
  
  -- Device & Browser
  device_info JSONB,
  ip TEXT,
  
  -- User info
  user_id TEXT,
  user_email TEXT,
  
  -- Session info
  session_id TEXT,
  
  -- Status
  is_critical BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Timestamps
  client_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on errors for faster queries
CREATE INDEX IF NOT EXISTS idx_errors_app ON errors(app);
CREATE INDEX IF NOT EXISTS idx_errors_severity ON errors(severity);
CREATE INDEX IF NOT EXISTS idx_errors_is_critical ON errors(is_critical);
CREATE INDEX IF NOT EXISTS idx_errors_resolved ON errors(resolved);
CREATE INDEX IF NOT EXISTS idx_errors_created_at ON errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_user_id ON errors(user_id);

-- RLS (Row Level Security) - Basic Setup
-- Disable RLS for now or set it to allow all for testing
-- In production, you'll want to refine these roles.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access' AND tablename = 'users') THEN
        CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access' AND tablename = 'addresses') THEN
        CREATE POLICY "Service role full access" ON addresses FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access' AND tablename = 'restaurants') THEN
        CREATE POLICY "Service role full access" ON restaurants FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access' AND tablename = 'menu_categories') THEN
        CREATE POLICY "Service role full access" ON menu_categories FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access' AND tablename = 'menu_items') THEN
        CREATE POLICY "Service role full access" ON menu_items FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access' AND tablename = 'orders') THEN
        CREATE POLICY "Service role full access" ON orders FOR ALL TO service_role USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access' AND tablename = 'rides') THEN
        CREATE POLICY "Service role full access" ON rides FOR ALL TO service_role USING (true);
    END IF;
END $$;

-- Add errors table to RLS
ALTER TABLE errors ENABLE ROW LEVEL SECURITY;

-- Add errors table policy
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access' AND tablename = 'errors') THEN
        CREATE POLICY "Service role full access" ON errors FOR ALL TO service_role USING (true);
    END IF;
END $$;

-- Add rider_notifications table to RLS
ALTER TABLE rider_notifications ENABLE ROW LEVEL SECURITY;

-- Add rider_notifications table policy
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access' AND tablename = 'rider_notifications') THEN
        CREATE POLICY "Service role full access" ON rider_notifications FOR ALL TO service_role USING (true);
    END IF;
END $$;
