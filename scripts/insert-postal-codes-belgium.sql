-- Script pour insérer les plages de codes postaux belges
-- Basé sur le système de codes postaux officiels de Belgique

-- Bruxelles-Capitale (1000-1299)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '1000', '1299', NOW(), NOW()
FROM regions 
WHERE name = 'Bruxelles-Capitale' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Brabant Wallon (1300-1499)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '1300', '1499', NOW(), NOW()
FROM regions 
WHERE name = 'Brabant Wallon' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Brabant Flamand (1500-1999 et 3000-3499)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '1500', '1999', NOW(), NOW()
FROM regions 
WHERE name = 'Brabant Flamand' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '3000', '3499', NOW(), NOW()
FROM regions 
WHERE name = 'Brabant Flamand' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Anvers (2000-2999)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '2000', '2999', NOW(), NOW()
FROM regions 
WHERE name = 'Anvers' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Limbourg (3500-3999)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '3500', '3999', NOW(), NOW()
FROM regions 
WHERE name = 'Limbourg' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Liège (4000-4999)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '4000', '4999', NOW(), NOW()
FROM regions 
WHERE name = 'Liège' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Namur (5000-5999)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '5000', '5999', NOW(), NOW()
FROM regions 
WHERE name = 'Namur' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Hainaut (6000-7999)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '6000', '7999', NOW(), NOW()
FROM regions 
WHERE name = 'Hainaut' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Flandre Occidentale (8000-8999)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '8000', '8999', NOW(), NOW()
FROM regions 
WHERE name = 'Flandre Occidentale' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Flandre Orientale (9000-9999)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '9000', '9999', NOW(), NOW()
FROM regions 
WHERE name = 'Flandre Orientale' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Luxembourg (6600-6999 - partie spécifique)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt, updatedAt)
SELECT id, '6600', '6999', NOW(), NOW()
FROM regions 
WHERE name = 'Luxembourg' AND countryId = (SELECT id FROM countries WHERE code = 'BE')
ON DUPLICATE KEY UPDATE updatedAt = NOW();
