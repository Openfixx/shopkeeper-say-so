
-- First migration
ALTER TABLE products 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

ALTER TABLE inventory 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add product_id column to inventory table to properly link to products
ALTER TABLE inventory
ADD COLUMN product_id UUID REFERENCES products(id);

-- Create indexes for performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_inventory_user_id ON inventory(user_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
