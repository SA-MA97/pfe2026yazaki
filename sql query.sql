DROP TABLE IF EXISTS D_Bus CASCADE;
DROP TABLE IF EXISTS D_Calendrier CASCADE;
DROP TABLE IF EXISTS D_Shifts CASCADE;
DROP TABLE IF EXISTS D_Operateurs CASCADE;
DROP TABLE IF EXISTS D_Stations CASCADE;
DROP TABLE IF EXISTS F_Affectations CASCADE;
DROP TABLE IF EXISTS staging_table CASCADE;

CREATE TABLE D_Bus (
    id_bus SERIAL PRIMARY KEY,
    nom_bus VARCHAR(150) NOT NULL
);

CREATE TABLE D_Calendrier (
    Date DATE PRIMARY KEY,
    Annee INTEGER NOT NULL,
    Mois INTEGER NOT NULL
);

CREATE TABLE D_Shifts (
    id_shift SERIAL PRIMARY KEY,
    nom_shift VARCHAR(50) NOT NULL,
    heure_depart_prevue TIME NOT NULL
);

CREATE TABLE D_Operateurs (
    mat VARCHAR(50) PRIMARY KEY, 
    nom_prenom VARCHAR(150) NOT NULL
);

-- 1.2 Dimension hiérarchique (Station liée au Bus)
CREATE TABLE D_Stations (
    id_station SERIAL PRIMARY KEY,
    id_bus INTEGER NOT NULL,
    nom_station VARCHAR(150) NOT NULL,
    nom_region VARCHAR(150),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    CONSTRAINT fk_station_bus FOREIGN KEY (id_bus) REFERENCES D_Bus (id_bus) ON DELETE RESTRICT
);

-- 1.3 Table de Faits (Centrale)
CREATE TABLE F_Affectations (
    id_affectation SERIAL PRIMARY KEY,
    Date_Affectation DATE NOT NULL,
    mat VARCHAR(50) NOT NULL,
    id_station INTEGER NOT NULL,
    id_shift INTEGER NOT NULL,
    heure_arrivee TIME,
    CONSTRAINT fk_fait_date FOREIGN KEY (Date_Affectation) REFERENCES D_Calendrier (Date) ON DELETE RESTRICT,
    CONSTRAINT fk_fait_operateur FOREIGN KEY (mat) REFERENCES D_Operateurs (mat) ON DELETE RESTRICT,
    CONSTRAINT fk_fait_station FOREIGN KEY (id_station) REFERENCES D_Stations (id_station) ON DELETE RESTRICT,
    CONSTRAINT fk_fait_shift FOREIGN KEY (id_shift) REFERENCES D_Shifts (id_shift) ON DELETE RESTRICT
);

CREATE TABLE staging_table (
    mat_raw VARCHAR(100),
    nom_prenom_raw VARCHAR(255),
    station_raw VARCHAR(255),
    station_region_raw VARCHAR(150),
    bus_raw VARCHAR(150),
    bus_region_raw VARCHAR(150),
    shift_raw VARCHAR(100),
    heure_arrivee_raw VARCHAR(50),
    heure_depart_raw VARCHAR(50)
);


COPY staging_table (mat_raw, nom_prenom_raw, station_raw, station_region_raw, bus_raw, bus_region_raw, shift_raw, heure_arrivee_raw, heure_depart_raw) 
FROM 'C:/temp/data.csv' 
DELIMITER ';' 
CSV HEADER 
ENCODING 'UTF8';


INSERT INTO D_Calendrier (Date, Annee, Mois) VALUES ('2024-01-01', 2024, 1) ON CONFLICT (Date) DO NOTHING;

INSERT INTO D_Operateurs (mat, nom_prenom) 
SELECT DISTINCT TRIM(mat_raw), TRIM(nom_prenom_raw) FROM staging_table WHERE mat_raw IS NOT NULL ON CONFLICT (mat) DO NOTHING;

INSERT INTO D_Bus (nom_bus) 
SELECT DISTINCT TRIM(bus_raw) FROM staging_table WHERE bus_raw IS NOT NULL;

INSERT INTO D_Shifts (nom_shift, heure_depart_prevue) 
SELECT DISTINCT TRIM(shift_raw), CAST(TRIM(heure_depart_raw) AS TIME) FROM staging_table WHERE shift_raw IS NOT NULL;

INSERT INTO D_Stations (nom_station, nom_region, id_bus) 
SELECT DISTINCT TRIM(s.station_raw), TRIM(s.station_region_raw), b.id_bus FROM staging_table s JOIN D_Bus b ON TRIM(s.bus_raw) = b.nom_bus WHERE s.station_raw IS NOT NULL;

INSERT INTO F_Affectations (Date_Affectation, mat, id_station, id_shift, heure_arrivee) 
SELECT 
    '2024-01-01'::DATE, 
    TRIM(s.mat_raw), 
    st.id_station, 
    sh.id_shift, 
    CAST(TRIM(s.heure_arrivee_raw) AS TIME) 
FROM staging_table s 
JOIN D_Bus b ON TRIM(s.bus_raw) = b.nom_bus 
JOIN D_Stations st ON TRIM(s.station_raw) = st.nom_station AND st.id_bus = b.id_bus 
JOIN D_Shifts sh ON TRIM(s.shift_raw) = sh.nom_shift AND CAST(TRIM(s.heure_depart_raw) AS TIME) = sh.heure_depart_prevue;


-- A. Remplir le Calendrier (Date fictive car absente du CSV)
INSERT INTO D_Calendrier (Date, Annee, Mois)
VALUES ('2024-01-01', 2024, 1) 
ON CONFLICT (Date) DO NOTHING;

-- B. Extraire et insérer les Opérateurs (Zéro doublon, Espaces nettoyés)
INSERT INTO D_Operateurs (mat, nom_prenom)
SELECT DISTINCT TRIM(mat_raw), TRIM(nom_prenom_raw) 
FROM staging_table 
WHERE mat_raw IS NOT NULL
ON CONFLICT (mat) DO NOTHING;

-- C. Extraire et insérer les Bus
INSERT INTO D_Bus (nom_bus)
SELECT DISTINCT TRIM(bus_raw) 
FROM staging_table 
WHERE bus_raw IS NOT NULL;

-- D. Extraire et insérer les Shifts
INSERT INTO D_Shifts (nom_shift, heure_depart_prevue)
SELECT DISTINCT TRIM(shift_raw), CAST(TRIM(heure_depart_raw) AS TIME) 
FROM staging_table 
WHERE shift_raw IS NOT NULL;

-- E. Extraire et insérer les Stations (Avec récupération de l'ID du bus)
INSERT INTO D_Stations (nom_station, nom_region, id_bus)
SELECT DISTINCT TRIM(s.station_raw), TRIM(s.station_region_raw), b.id_bus
FROM staging_table s
JOIN D_Bus b ON TRIM(s.bus_raw) = b.nom_bus
WHERE s.station_raw IS NOT NULL;

-- F. Remplir la TABLE DES FAITS en récupérant tous les IDs générés !
INSERT INTO F_Affectations (Date_Affectation, mat, id_station, id_shift, heure_arrivee)
SELECT 
    '2024-01-01'::DATE, 
    TRIM(s.mat_raw),
    st.id_station,
    sh.id_shift,
    CAST(TRIM(s.heure_arrivee_raw) AS TIME)
FROM staging_table s
-- Jointure pour le bus et la station
JOIN D_Bus b 
    ON TRIM(s.bus_raw) = b.nom_bus
JOIN D_Stations st 
    ON TRIM(s.station_raw) = st.nom_station AND st.id_bus = b.id_bus
-- Jointure pour le shift
JOIN D_Shifts sh 
    ON TRIM(s.shift_raw) = sh.nom_shift AND CAST(TRIM(s.heure_depart_raw) AS TIME) = sh.heure_depart_prevue;

	SELECT 'D_Operateurs' AS table_name, COUNT(*) AS lignes FROM D_Operateurs
UNION ALL
SELECT 'D_Bus' AS table_name, COUNT(*) AS lignes FROM D_Bus
UNION ALL
SELECT 'D_Shifts' AS table_name, COUNT(*) AS lignes FROM D_Shifts
UNION ALL
SELECT 'D_Stations' AS table_name, COUNT(*) AS lignes FROM D_Stations
UNION ALL
SELECT 'F_Affectations (TOTAL)' AS table_name, COUNT(*) AS lignes FROM F_Affectations;









-- 1. On vide les tables pleines d'erreurs (la table staging est conservée intacte !)
TRUNCATE TABLE F_Affectations CASCADE;
TRUNCATE TABLE D_Stations CASCADE;
TRUNCATE TABLE D_Bus CASCADE;
TRUNCATE TABLE D_Shifts CASCADE;
TRUNCATE TABLE D_Operateurs CASCADE;
TRUNCATE TABLE D_Calendrier CASCADE;

-- 2. On insère avec TRIM et LOWER (Minuscules forcées) pour écraser les faux doublons
INSERT INTO D_Calendrier (Date, Annee, Mois) VALUES ('2024-01-01', 2024, 1);

INSERT INTO D_Operateurs (mat, nom_prenom) 
SELECT DISTINCT TRIM(LOWER(mat_raw)), TRIM(LOWER(nom_prenom_raw)) 
FROM staging_table 
WHERE mat_raw IS NOT NULL;

INSERT INTO D_Bus (nom_bus) 
SELECT DISTINCT TRIM(LOWER(bus_raw)) 
FROM staging_table 
WHERE bus_raw IS NOT NULL;

INSERT INTO D_Shifts (nom_shift, heure_depart_prevue) 
SELECT DISTINCT TRIM(LOWER(shift_raw)), CAST(TRIM(heure_depart_raw) AS TIME) 
FROM staging_table 
WHERE shift_raw IS NOT NULL;

INSERT INTO D_Stations (nom_station, nom_region, id_bus) 
SELECT DISTINCT TRIM(LOWER(s.station_raw)), TRIM(LOWER(s.station_region_raw)), b.id_bus 
FROM staging_table s 
JOIN D_Bus b ON TRIM(LOWER(s.bus_raw)) = b.nom_bus 
WHERE s.station_raw IS NOT NULL;

-- 3. La Table de faits se relie maintenant parfaitement sans démultiplier
INSERT INTO F_Affectations (Date_Affectation, mat, id_station, id_shift, heure_arrivee) 
SELECT 
    '2024-01-01'::DATE, 
    TRIM(LOWER(s.mat_raw)), 
    st.id_station, 
    sh.id_shift, 
    CAST(TRIM(s.heure_arrivee_raw) AS TIME) 
FROM staging_table s 
JOIN D_Bus b 
    ON TRIM(LOWER(s.bus_raw)) = b.nom_bus 
JOIN D_Stations st 
    ON TRIM(LOWER(s.station_raw)) = st.nom_station AND st.id_bus = b.id_bus 
JOIN D_Shifts sh 
    ON TRIM(LOWER(s.shift_raw)) = sh.nom_shift AND CAST(TRIM(s.heure_depart_raw) AS TIME) = sh.heure_depart_prevue;

-- 4. On lance la vérification !
SELECT 'D_Bus' AS table_name, COUNT(*) AS total FROM D_Bus
UNION ALL
SELECT 'D_Shifts' AS table_name, COUNT(*) AS total FROM D_Shifts
UNION ALL
SELECT 'F_Affectations (Devrait = CSV)' AS table_name, COUNT(*) AS total FROM F_Affectations;







-- 1. VIDAGE COMPLET ET RÉINITIALISATION DES COMPTEURS ID À 1

-- L'ordre de suppression est important à cause des Foreign Keys (Cascade)
-- 'RESTART IDENTITY' est la commande clé qui remet le SERIAL à 1
TRUNCATE TABLE F_Affectations RESTART IDENTITY CASCADE;
TRUNCATE TABLE D_Stations RESTART IDENTITY CASCADE;
TRUNCATE TABLE D_Shifts RESTART IDENTITY CASCADE;
TRUNCATE TABLE D_Bus RESTART IDENTITY CASCADE;
TRUNCATE TABLE D_Operateurs RESTART IDENTITY CASCADE;
TRUNCATE TABLE D_Calendrier RESTART IDENTITY CASCADE;


-- 2. REMPLISSAGE PROPRE DES DIMENSIONS (IDs commenceront à 1)

INSERT INTO D_Calendrier (Date, Annee, Mois) VALUES ('2024-01-01', 2024, 1);

INSERT INTO D_Operateurs (mat, nom_prenom) 
SELECT DISTINCT TRIM(LOWER(mat_raw)), TRIM(LOWER(nom_prenom_raw)) 
FROM staging_table 
WHERE mat_raw IS NOT NULL;

-- C. Bus (Nettoyés) - L'ID Bus commence à 1
INSERT INTO D_Bus (nom_bus) 
SELECT DISTINCT TRIM(LOWER(bus_raw)) 
FROM staging_table 
WHERE bus_raw IS NOT NULL;

INSERT INTO D_Shifts (nom_shift, heure_depart_prevue) 
SELECT DISTINCT TRIM(LOWER(shift_raw)), CAST(TRIM(heure_depart_raw) AS TIME) 
FROM staging_table 
WHERE shift_raw IS NOT NULL;

INSERT INTO D_Stations (nom_station, nom_region, id_bus) 
SELECT DISTINCT TRIM(LOWER(s.station_raw)), TRIM(LOWER(s.station_region_raw)), b.id_bus 
FROM staging_table s 
JOIN D_Bus b ON TRIM(LOWER(s.bus_raw)) = b.nom_bus 
WHERE s.station_raw IS NOT NULL;

-- 3. REMPLISSAGE DE LA TABLE DES FAITS (Liée aux nouveaux IDs "propres")
INSERT INTO F_Affectations (Date_Affectation, mat, id_station, id_shift, heure_arrivee) 
SELECT 
    '2024-01-01'::DATE, 
    TRIM(LOWER(s.mat_raw)), 
    st.id_station, 
    sh.id_shift, 
    CAST(TRIM(s.heure_arrivee_raw) AS TIME) 
FROM staging_table s 
JOIN D_Bus b 
    ON TRIM(LOWER(s.bus_raw)) = b.nom_bus 
JOIN D_Stations st 
    ON TRIM(LOWER(s.station_raw)) = st.nom_station AND st.id_bus = b.id_bus 
JOIN D_Shifts sh 
    ON TRIM(LOWER(s.shift_raw)) = sh.nom_shift AND CAST(TRIM(s.heure_depart_raw) AS TIME) = sh.heure_depart_prevue;

-- 4. VÉRIFICATION POUR POWER BI

SELECT * FROM D_Shifts ORDER BY id_shift;