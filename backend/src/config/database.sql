CREATE DATABASE IF NOT EXISTS chillium_db;
USE chillium_db;

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Thailand',
  avatar VARCHAR(255),
  role ENUM('customer', 'admin') DEFAULT 'customer',
  points INT DEFAULT 0,
  level ENUM('Bronze', 'Silver', 'Gold', 'Platinum') DEFAULT 'Bronze',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  type ENUM('WHITE', 'BLACK', 'CYAN') NOT NULL,
  category_id INT,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  size VARCHAR(50),
  thc VARCHAR(20),
  cbd VARCHAR(20),
  image VARCHAR(255),
  gallery JSON,
  features JSON,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Strains table
CREATE TABLE strains (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  effects JSON,
  flavors JSON,
  thc_content VARCHAR(20),
  cbd_content VARCHAR(20),
  type ENUM('Sativa', 'Indica', 'Hybrid'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product strains junction table
CREATE TABLE product_strains (
  product_id INT,
  strain_id INT,
  PRIMARY KEY (product_id, strain_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (strain_id) REFERENCES strains(id) ON DELETE CASCADE
);

-- Inventory table
CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT UNIQUE,
  quantity INT DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  last_restock_date TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  delivery_method ENUM('standard', 'express') DEFAULT 'standard',
  payment_method VARCHAR(50),
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  
  -- Delivery info
  delivery_name VARCHAR(100),
  delivery_phone VARCHAR(20),
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_postal_code VARCHAR(20),
  delivery_country VARCHAR(100),
  
  -- Additional info
  gift_message TEXT,
  notes TEXT,
  tracking_number VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Order items table
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT,
  product_id INT,
  strain_id INT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (strain_id) REFERENCES strains(id) ON DELETE SET NULL
);

-- Cart table
CREATE TABLE cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  product_id INT,
  strain_id INT NULL,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (strain_id) REFERENCES strains(id) ON DELETE SET NULL
);

-- Promo codes table
CREATE TABLE promo_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User promo codes usage
CREATE TABLE user_promo_usage (
  user_id INT,
  promo_code_id INT,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, promo_code_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE
);

-- User achievements
CREATE TABLE user_achievements (
  user_id INT,
  achievement_type VARCHAR(50),
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, achievement_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Inventory logs
CREATE TABLE inventory_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT,
  type ENUM('restock', 'sale', 'adjustment', 'return') NOT NULL,
  quantity INT NOT NULL,
  reference_id INT NULL,
  reference_type VARCHAR(50) NULL,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default data
INSERT INTO categories (name, slug, description, icon, color) VALUES
('Flowers', 'flowers', 'Premium cannabis flowers', 'Flower2', 'emerald'),
('Pre-Rolls', 'pre-rolls', 'Ready to enjoy pre-rolled joints', 'Cigarette', 'blue'),
('Blunts', 'blunts', 'Premium hand-rolled blunts', 'Hash', 'purple');

-- Create indexes
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_cart_user ON cart(user_id);