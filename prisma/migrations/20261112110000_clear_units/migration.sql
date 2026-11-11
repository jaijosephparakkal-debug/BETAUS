-- Flats and tenants are not loaded for now (Jai's call): only the building list stays.
-- Removes the flats loaded by 20261112100000_buildings_units. The Unit table stays for later.
-- Existing log entries keep their text; the form falls back to a typed flat number.
DELETE FROM "Unit";
