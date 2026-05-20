INSERT INTO distributors (id, name, email, phone) 
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'Test Distributor', 'distributor@test.com', '1234567890')
ON CONFLICT (id) DO NOTHING;

INSERT INTO farmers (id, name, email, phone, region) 
VALUES ('123e4567-e89b-12d3-a456-426614174001', 'Test Farmer', 'farmer@test.com', '0987654321', 'North')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, description, price, stock, category, image_key, farmer_id) 
VALUES ('123e4567-e89b-12d3-a456-426614174002', 'Test Apples', 'Fresh red apples', 5.99, 100, 'Fruit', 'apple.jpg', '123e4567-e89b-12d3-a456-426614174001')
ON CONFLICT (id) DO UPDATE SET stock = 100;
