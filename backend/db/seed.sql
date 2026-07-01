-- Seed products for the e-commerce store
INSERT INTO products (name, price, stock_quantity) VALUES
  ('Wireless Bluetooth Headphones', 79.99, 25),
  ('Ergonomic Mechanical Keyboard', 129.99, 15),
  ('USB-C Hub 7-in-1', 34.99, 50),
  ('27" 4K IPS Monitor', 399.99, 10),
  ('Portable SSD 1TB', 109.99, 30),
  ('Smart LED Desk Lamp', 59.99, 20),
  ('Noise Cancelling Earbuds', 149.99, 18),
  ('Webcam 1080p Pro', 89.99, 22),
  ('Wireless Charging Pad', 24.99, 40),
  ('Laptop Stand Adjustable', 44.99, 35),
  ('Mechanical Gaming Mouse', 69.99, 28),
  ('USB Microphone Podcast', 119.99, 12),
  ('Graphics Drawing Tablet', 199.99, 8),
  ('Smart Power Strip WiFi', 39.99, 45),
  ('External DVD Writer', 29.99, 60)
ON CONFLICT DO NOTHING;
