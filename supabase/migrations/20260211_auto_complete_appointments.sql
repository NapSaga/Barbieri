-- Migration: auto_complete_appointments
-- Adds per-business configurable delay for auto-completing appointments
-- Auto-complete confirmed appointments whose end_time + delay has passed
-- Updates client total_visits and last_visit_at accordingly

-- Step 1: Add configurable delay column (default 20 minutes)
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS auto_complete_delay_minutes integer DEFAULT 20;

-- Step 2: Create/replace function with per-business delay
CREATE OR REPLACE FUNCTION public.auto_complete_appointments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  completed_count integer;
BEGIN
  -- Update confirmed appointments where end_time + per-business delay has passed (Europe/Rome)
  WITH completed AS (
    UPDATE public.appointments a
    SET
      status = 'completed',
      updated_at = now()
    FROM public.businesses b
    WHERE
      a.business_id = b.id
      AND a.status = 'confirmed'
      AND (a.date::text || ' ' || a.end_time::text)::timestamp AT TIME ZONE 'Europe/Rome'
          + make_interval(mins => COALESCE(b.auto_complete_delay_minutes, 20))
          <= now()
    RETURNING a.id, a.client_id
  ),
  client_updates AS (
    UPDATE public.clients c
    SET
      total_visits = c.total_visits + sub.visit_count,
      last_visit_at = now(),
      updated_at = now()
    FROM (
      SELECT client_id, count(*)::integer AS visit_count
      FROM completed
      WHERE client_id IS NOT NULL
      GROUP BY client_id
    ) sub
    WHERE c.id = sub.client_id
  )
  SELECT count(*)::integer INTO completed_count FROM completed;

  RETURN completed_count;
END;
$$;

-- Step 3: pg_cron schedule (every 20 minutes)
-- SELECT cron.unschedule('auto-complete-appointments');
-- SELECT cron.schedule(
--   'auto-complete-appointments',
--   '*/20 * * * *',
--   $$SELECT public.auto_complete_appointments()$$
-- );
