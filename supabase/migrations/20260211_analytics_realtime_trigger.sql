-- 1. Trigger function: recalculate analytics_daily when appointment status changes
CREATE OR REPLACE FUNCTION recalc_analytics_on_appointment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Recalculate for the appointment's date
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_analytics_daily(OLD.date);
    RETURN OLD;
  END IF;

  -- For INSERT or UPDATE, recalculate the new date
  PERFORM calculate_analytics_daily(NEW.date);

  -- If date changed on UPDATE, also recalculate the old date
  IF TG_OP = 'UPDATE' AND OLD.date IS DISTINCT FROM NEW.date THEN
    PERFORM calculate_analytics_daily(OLD.date);
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create trigger on appointments table
DROP TRIGGER IF EXISTS trg_recalc_analytics ON appointments;
CREATE TRIGGER trg_recalc_analytics
  AFTER INSERT OR UPDATE OF status, date, service_id OR DELETE
  ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION recalc_analytics_on_appointment_change();

-- 3. Update cron job to also calculate today (not just yesterday)
SELECT cron.unschedule('analytics-daily-calc');
SELECT cron.schedule(
  'analytics-daily-calc',
  '5 2 * * *',
  $$SELECT calculate_analytics_daily(CURRENT_DATE - 1); SELECT calculate_analytics_daily(CURRENT_DATE);$$
);
