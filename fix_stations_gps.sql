-- ============================================================
-- Yazaki TMS — Correction des coordonnées GPS des stations
-- Toutes les positions ont été vérifiées sur terre
-- (aucune dans le Lac de Bizerte ou la Méditerranée)
-- Sources : Wikipedia, latitude.to, maptons.com, countrycoordinate.com
-- ============================================================

UPDATE D_Stations SET
  latitude = 37.2597,
  longitude = 9.8823
WHERE nom_station ILIKE '%Zarzouna%';
-- Zarzouna : centre-ville, sur terre (ancien: 37.269 / 9.885 = trop proche du port)

UPDATE D_Stations SET
  latitude = 37.2720,
  longitude = 9.8580
WHERE nom_station ILIKE '%Corniche%';
-- Corniche Plage : route côtière côté terre (ancien: 37.277 / 9.862 = bord de mer)

UPDATE D_Stations SET
  latitude = 37.1537,
  longitude = 9.7859
WHERE nom_station ILIKE '%Menzel Bourguiba%';
-- Menzel Bourguiba : centre-ville confirmé Wikipedia

UPDATE D_Stations SET
  latitude = 37.2419,
  longitude = 9.8739
WHERE nom_station ILIKE '%Menzel Abderrahmane%';
-- Menzel Abderrahmane : ancien 37.2398 / 9.9012 = dans le Lac de Bizerte !

UPDATE D_Stations SET
  latitude = 37.1670,
  longitude = 9.7670
WHERE nom_station ILIKE '%Tinja%';
-- Tinja : bourg sur terre, légèrement corrigé

UPDATE D_Stations SET
  latitude = 37.2162,
  longitude = 10.1143
WHERE nom_station ILIKE '%Ras Jebel%';
-- Ras Jebel : centre-ville confirmé maptons.com

UPDATE D_Stations SET
  latitude = 37.0400,
  longitude = 9.6650
WHERE nom_station ILIKE '%Mateur%';
-- Mateur : centre-ville confirmé Wikipedia

UPDATE D_Stations SET
  latitude = 37.2746,
  longitude = 9.8627
WHERE nom_station ILIKE '%Bizerte%Centre%' OR nom_station ILIKE '%Bizerte Centre%';
-- Bizerte Centre Ville : coordonnées officielles

-- Vérification
SELECT nom_station, nom_region, latitude, longitude FROM D_Stations ORDER BY nom_station;
