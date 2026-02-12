-- Partial unique index to prevent double bookings at the DB level.
-- Only active appointments (not cancelled/no_show) are constrained.
-- This guarantees atomicity even under concurrent INSERT race conditions.
CREATE UNIQUE INDEX appointments_no_overlap_idx
  ON appointments (staff_id, date, start_time)
  WHERE status NOT IN ('cancelled', 'no_show');
