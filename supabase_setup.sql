
-- Create schema for our application
CREATE SCHEMA IF NOT EXISTS public;

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-secret-key-here';

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  shop_id UUID,
  preferred_language TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  position TEXT NOT NULL,
  expiry DATE,
  price NUMERIC NOT NULL,
  image_url TEXT,
  barcode TEXT,
  stock_alert NUMERIC,
  shop_id UUID,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BILLS TABLE
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total NUMERIC NOT NULL,
  delivery_option BOOLEAN DEFAULT false,
  payment_method TEXT DEFAULT 'cash',
  partial_payment BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BILL ITEMS TABLE
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills NOT NULL,
  product_id UUID REFERENCES products NOT NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SHOPS TABLE
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  distance NUMERIC,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STOCK ALERTS TABLE
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products NOT NULL,
  threshold NUMERIC NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BARCODE PRODUCTS TABLE (shared across all users)
CREATE TABLE IF NOT EXISTS barcode_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- PROFILES RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_policy ON products
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY products_insert_policy ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY products_update_policy ON products
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY products_delete_policy ON products
  FOR DELETE USING (auth.uid() = user_id);

-- BILLS RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY bills_select_policy ON bills
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY bills_insert_policy ON bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY bills_update_policy ON bills
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY bills_delete_policy ON bills
  FOR DELETE USING (auth.uid() = user_id);

-- BILL ITEMS RLS
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY bill_items_select_policy ON bill_items
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY bill_items_insert_policy ON bill_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY bill_items_update_policy ON bill_items
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY bill_items_delete_policy ON bill_items
  FOR DELETE USING (auth.uid() = user_id);

-- SHOPS RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY shops_select_policy ON shops
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY shops_insert_policy ON shops
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY shops_update_policy ON shops
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY shops_delete_policy ON shops
  FOR DELETE USING (auth.uid() = user_id);

-- STOCK ALERTS RLS
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_alerts_select_policy ON stock_alerts
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY stock_alerts_insert_policy ON stock_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY stock_alerts_update_policy ON stock_alerts
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY stock_alerts_delete_policy ON stock_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- BARCODE PRODUCTS has no RLS - all users can query it
ALTER TABLE barcode_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY barcode_products_select_policy ON barcode_products
  FOR SELECT USING (true);

-- Create some initial barcode product entries
INSERT INTO barcode_products (barcode, name, unit, price, image_url)
VALUES
  ('8901234567890', 'Sugar', 'kg', 45, 'https://images.unsplash.com/photo-1581600140682-d4e68c8e3d9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
  ('8901234567891', 'Rice', 'kg', 60, 'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
  ('8901234567892', 'Salt', 'kg', 20, 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
  ('8901234567893', 'Flour', 'kg', 40, 'https://images.unsplash.com/photo-1627485937980-221ea163c3c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
  ('8901234567894', 'Cooking Oil', 'liter', 120, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')
ON CONFLICT (barcode) DO NOTHING;
