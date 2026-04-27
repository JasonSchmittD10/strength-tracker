-- Phase 2 — User Preferences
-- Adds week-start and unit prefs to profiles. Pure additive; no data loss.
--
-- Day numbering: 0=Sunday, 1=Monday ... 6=Saturday (matches JS Date.getDay()).
--
-- Note: an existing `unit_preference` column ('lb' | 'kg') is left in place.
-- The new `weight_unit` ('lbs' | 'kg') is now canonical going forward; old
-- column is no longer read by the app and may be dropped in a later cleanup.

ALTER TABLE profiles
  ADD COLUMN week_start_day SMALLINT DEFAULT 1 CHECK (week_start_day BETWEEN 0 AND 6),
  ADD COLUMN weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  ADD COLUMN distance_unit TEXT DEFAULT 'mi' CHECK (distance_unit IN ('mi', 'km'));
