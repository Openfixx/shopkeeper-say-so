-- First migration
ALTER TABLE products 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

ALTER TABLE inventory 
ADD COLUMN user_id UUID REFERENCES auth.users(id);