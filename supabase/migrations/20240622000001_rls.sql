-- Second migration
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User access" ON products
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User access" ON inventory
FOR ALL USING (auth.uid() = user_id);