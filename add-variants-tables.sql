-- Table pour les variantes de produits
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  priceAdjustmentHT DECIMAL(10,2) DEFAULT 0.00,
  stockQuantity INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  isDefault BOOLEAN DEFAULT FALSE,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (productId),
  INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les options de variantes (couleur, taille, etc.)
CREATE TABLE IF NOT EXISTS variant_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  variantId INT NOT NULL,
  optionName VARCHAR(100) NOT NULL COMMENT 'Ex: Couleur, Taille, Matériau',
  optionValue VARCHAR(255) NOT NULL COMMENT 'Ex: Bleu, XL, Acier inoxydable',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variantId) REFERENCES product_variants(id) ON DELETE CASCADE,
  INDEX idx_variant_id (variantId),
  INDEX idx_option_name (optionName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
