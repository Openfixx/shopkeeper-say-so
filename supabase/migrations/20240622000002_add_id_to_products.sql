
-- Add an ID column to the products table
ALTER TABLE products ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY;
