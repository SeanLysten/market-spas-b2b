-- Codes postaux France - Par département
-- Format: Département XX → Codes postaux XX000-XX999

-- Ain (01)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '01000', '01999', NOW() FROM regions WHERE name = 'Ain' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Aisne (02)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '02000', '02999', NOW() FROM regions WHERE name = 'Aisne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Allier (03)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '03000', '03999', NOW() FROM regions WHERE name = 'Allier' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Alpes-de-Haute-Provence (04)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '04000', '04999', NOW() FROM regions WHERE name = 'Alpes-de-Haute-Provence' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Hautes-Alpes (05)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '05000', '05999', NOW() FROM regions WHERE name = 'Hautes-Alpes' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Alpes-Maritimes (06)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '06000', '06999', NOW() FROM regions WHERE name = 'Alpes-Maritimes' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Ardèche (07)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '07000', '07999', NOW() FROM regions WHERE name = 'Ardèche' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Ardennes (08)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '08000', '08999', NOW() FROM regions WHERE name = 'Ardennes' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Ariège (09)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '09000', '09999', NOW() FROM regions WHERE name = 'Ariège' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Aube (10)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '10000', '10999', NOW() FROM regions WHERE name = 'Aube' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Aude (11)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '11000', '11999', NOW() FROM regions WHERE name = 'Aude' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Aveyron (12)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '12000', '12999', NOW() FROM regions WHERE name = 'Aveyron' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Bouches-du-Rhône (13)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '13000', '13999', NOW() FROM regions WHERE name = 'Bouches-du-Rhône' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Calvados (14)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '14000', '14999', NOW() FROM regions WHERE name = 'Calvados' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Cantal (15)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '15000', '15999', NOW() FROM regions WHERE name = 'Cantal' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Charente (16)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '16000', '16999', NOW() FROM regions WHERE name = 'Charente' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Charente-Maritime (17)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '17000', '17999', NOW() FROM regions WHERE name = 'Charente-Maritime' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Cher (18)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '18000', '18999', NOW() FROM regions WHERE name = 'Cher' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Corrèze (19)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '19000', '19999', NOW() FROM regions WHERE name = 'Corrèze' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Côte-d''Or (21)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '21000', '21999', NOW() FROM regions WHERE name = 'Côte-d''Or' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Côtes-d''Armor (22)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '22000', '22999', NOW() FROM regions WHERE name = 'Côtes-d''Armor' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Creuse (23)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '23000', '23999', NOW() FROM regions WHERE name = 'Creuse' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Dordogne (24)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '24000', '24999', NOW() FROM regions WHERE name = 'Dordogne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Doubs (25)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '25000', '25999', NOW() FROM regions WHERE name = 'Doubs' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Drôme (26)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '26000', '26999', NOW() FROM regions WHERE name = 'Drôme' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Eure (27)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '27000', '27999', NOW() FROM regions WHERE name = 'Eure' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Eure-et-Loir (28)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '28000', '28999', NOW() FROM regions WHERE name = 'Eure-et-Loir' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Finistère (29)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '29000', '29999', NOW() FROM regions WHERE name = 'Finistère' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Gard (30)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '30000', '30999', NOW() FROM regions WHERE name = 'Gard' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Haute-Garonne (31)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '31000', '31999', NOW() FROM regions WHERE name = 'Haute-Garonne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Gers (32)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '32000', '32999', NOW() FROM regions WHERE name = 'Gers' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Gironde (33)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '33000', '33999', NOW() FROM regions WHERE name = 'Gironde' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Hérault (34)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '34000', '34999', NOW() FROM regions WHERE name = 'Hérault' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Ille-et-Vilaine (35)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '35000', '35999', NOW() FROM regions WHERE name = 'Ille-et-Vilaine' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Indre (36)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '36000', '36999', NOW() FROM regions WHERE name = 'Indre' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Indre-et-Loire (37)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '37000', '37999', NOW() FROM regions WHERE name = 'Indre-et-Loire' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Isère (38)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '38000', '38999', NOW() FROM regions WHERE name = 'Isère' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Jura (39)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '39000', '39999', NOW() FROM regions WHERE name = 'Jura' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Landes (40)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '40000', '40999', NOW() FROM regions WHERE name = 'Landes' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Loir-et-Cher (41)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '41000', '41999', NOW() FROM regions WHERE name = 'Loir-et-Cher' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Loire (42)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '42000', '42999', NOW() FROM regions WHERE name = 'Loire' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Haute-Loire (43)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '43000', '43999', NOW() FROM regions WHERE name = 'Haute-Loire' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Loire-Atlantique (44)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '44000', '44999', NOW() FROM regions WHERE name = 'Loire-Atlantique' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Loiret (45)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '45000', '45999', NOW() FROM regions WHERE name = 'Loiret' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Lot (46)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '46000', '46999', NOW() FROM regions WHERE name = 'Lot' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Lot-et-Garonne (47)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '47000', '47999', NOW() FROM regions WHERE name = 'Lot-et-Garonne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Lozère (48)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '48000', '48999', NOW() FROM regions WHERE name = 'Lozère' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Maine-et-Loire (49)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '49000', '49999', NOW() FROM regions WHERE name = 'Maine-et-Loire' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Manche (50)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '50000', '50999', NOW() FROM regions WHERE name = 'Manche' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Marne (51)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '51000', '51999', NOW() FROM regions WHERE name = 'Marne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Haute-Marne (52)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '52000', '52999', NOW() FROM regions WHERE name = 'Haute-Marne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Mayenne (53)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '53000', '53999', NOW() FROM regions WHERE name = 'Mayenne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Meurthe-et-Moselle (54)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '54000', '54999', NOW() FROM regions WHERE name = 'Meurthe-et-Moselle' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Meuse (55)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '55000', '55999', NOW() FROM regions WHERE name = 'Meuse' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Morbihan (56)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '56000', '56999', NOW() FROM regions WHERE name = 'Morbihan' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Moselle (57)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '57000', '57999', NOW() FROM regions WHERE name = 'Moselle' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Nièvre (58)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '58000', '58999', NOW() FROM regions WHERE name = 'Nièvre' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Nord (59)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '59000', '59999', NOW() FROM regions WHERE name = 'Nord' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Oise (60)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '60000', '60999', NOW() FROM regions WHERE name = 'Oise' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Orne (61)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '61000', '61999', NOW() FROM regions WHERE name = 'Orne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Pas-de-Calais (62)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '62000', '62999', NOW() FROM regions WHERE name = 'Pas-de-Calais' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Puy-de-Dôme (63)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '63000', '63999', NOW() FROM regions WHERE name = 'Puy-de-Dôme' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Pyrénées-Atlantiques (64)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '64000', '64999', NOW() FROM regions WHERE name = 'Pyrénées-Atlantiques' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Hautes-Pyrénées (65)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '65000', '65999', NOW() FROM regions WHERE name = 'Hautes-Pyrénées' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Pyrénées-Orientales (66)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '66000', '66999', NOW() FROM regions WHERE name = 'Pyrénées-Orientales' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Bas-Rhin (67)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '67000', '67999', NOW() FROM regions WHERE name = 'Bas-Rhin' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Haut-Rhin (68)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '68000', '68999', NOW() FROM regions WHERE name = 'Haut-Rhin' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Rhône (69)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '69000', '69999', NOW() FROM regions WHERE name = 'Rhône' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Haute-Saône (70)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '70000', '70999', NOW() FROM regions WHERE name = 'Haute-Saône' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Saône-et-Loire (71)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '71000', '71999', NOW() FROM regions WHERE name = 'Saône-et-Loire' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Sarthe (72)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '72000', '72999', NOW() FROM regions WHERE name = 'Sarthe' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Savoie (73)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '73000', '73999', NOW() FROM regions WHERE name = 'Savoie' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Haute-Savoie (74)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '74000', '74999', NOW() FROM regions WHERE name = 'Haute-Savoie' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Paris (75)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '75000', '75999', NOW() FROM regions WHERE name = 'Paris' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Seine-Maritime (76)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '76000', '76999', NOW() FROM regions WHERE name = 'Seine-Maritime' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Seine-et-Marne (77)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '77000', '77999', NOW() FROM regions WHERE name = 'Seine-et-Marne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Yvelines (78)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '78000', '78999', NOW() FROM regions WHERE name = 'Yvelines' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Deux-Sèvres (79)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '79000', '79999', NOW() FROM regions WHERE name = 'Deux-Sèvres' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Somme (80)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '80000', '80999', NOW() FROM regions WHERE name = 'Somme' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Tarn (81)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '81000', '81999', NOW() FROM regions WHERE name = 'Tarn' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Tarn-et-Garonne (82)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '82000', '82999', NOW() FROM regions WHERE name = 'Tarn-et-Garonne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Var (83)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '83000', '83999', NOW() FROM regions WHERE name = 'Var' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Vaucluse (84)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '84000', '84999', NOW() FROM regions WHERE name = 'Vaucluse' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Vendée (85)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '85000', '85999', NOW() FROM regions WHERE name = 'Vendée' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Vienne (86)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '86000', '86999', NOW() FROM regions WHERE name = 'Vienne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Haute-Vienne (87)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '87000', '87999', NOW() FROM regions WHERE name = 'Haute-Vienne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Vosges (88)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '88000', '88999', NOW() FROM regions WHERE name = 'Vosges' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Yonne (89)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '89000', '89999', NOW() FROM regions WHERE name = 'Yonne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Territoire de Belfort (90)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '90000', '90999', NOW() FROM regions WHERE name = 'Territoire de Belfort' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Essonne (91)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '91000', '91999', NOW() FROM regions WHERE name = 'Essonne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Hauts-de-Seine (92)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '92000', '92999', NOW() FROM regions WHERE name = 'Hauts-de-Seine' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Seine-Saint-Denis (93)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '93000', '93999', NOW() FROM regions WHERE name = 'Seine-Saint-Denis' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Val-de-Marne (94)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '94000', '94999', NOW() FROM regions WHERE name = 'Val-de-Marne' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Val-d''Oise (95)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '95000', '95999', NOW() FROM regions WHERE name = 'Val-d''Oise' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Guadeloupe (971)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '97100', '97199', NOW() FROM regions WHERE name = 'Guadeloupe' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Martinique (972)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '97200', '97299', NOW() FROM regions WHERE name = 'Martinique' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Guyane (973)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '97300', '97399', NOW() FROM regions WHERE name = 'Guyane' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- La Réunion (974)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '97400', '97499', NOW() FROM regions WHERE name = 'La Réunion' AND countryId = (SELECT id FROM countries WHERE code = 'FR');

-- Mayotte (976)
INSERT INTO postal_code_ranges (regionId, startCode, endCode, createdAt)
SELECT id, '97600', '97699', NOW() FROM regions WHERE name = 'Mayotte' AND countryId = (SELECT id FROM countries WHERE code = 'FR');
