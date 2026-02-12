-- 1. Create notification_type enum
CREATE TYPE notification_type AS ENUM (
  'new_booking',
  'cancellation',
  'confirmation',
  'no_show',
  'waitlist_converted'
);

-- 2. Create notifications table
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX notifications_business_id_idx ON notifications(business_id);
CREATE INDEX notifications_business_read_idx ON notifications(business_id, read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- 3. RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view own notifications"
  ON notifications FOR SELECT
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Business owners can update own notifications"
  ON notifications FOR UPDATE
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Service role can insert (triggers run as SECURITY DEFINER)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 4. Enable Supabase Realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. Trigger function: generate notifications on appointment changes
CREATE OR REPLACE FUNCTION generate_appointment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_client_name text;
  v_service_name text;
  v_notif_type public.notification_type;
  v_title text;
  v_body text;
  v_date_formatted text;
  v_time_formatted text;
BEGIN
  -- Only generate notifications for relevant events
  IF TG_OP = 'INSERT' THEN
    -- New online booking
    IF NEW.source = 'online' AND NEW.status = 'booked' THEN
      v_notif_type := 'new_booking';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      CASE NEW.status
        WHEN 'cancelled' THEN v_notif_type := 'cancellation';
        WHEN 'confirmed' THEN v_notif_type := 'confirmation';
        WHEN 'no_show' THEN v_notif_type := 'no_show';
        ELSE RETURN NEW;
      END CASE;
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Fetch client name
  SELECT COALESCE(first_name, '') || COALESCE(' ' || last_name, '')
  INTO v_client_name
  FROM public.clients
  WHERE id = NEW.client_id;

  IF v_client_name IS NULL OR v_client_name = '' THEN
    v_client_name := 'Cliente';
  END IF;

  -- Fetch service name
  SELECT name INTO v_service_name
  FROM public.services
  WHERE id = NEW.service_id;

  IF v_service_name IS NULL THEN
    v_service_name := 'Servizio';
  END IF;

  -- Format date and time
  v_date_formatted := to_char(NEW.date, 'DD/MM/YYYY');
  v_time_formatted := substring(NEW.start_time::text from 1 for 5);

  -- Build title and body
  CASE v_notif_type
    WHEN 'new_booking' THEN
      v_title := 'Nuova prenotazione';
      v_body := v_client_name || ' ha prenotato ' || v_service_name || ' per il ' || v_date_formatted || ' alle ' || v_time_formatted;
    WHEN 'cancellation' THEN
      v_title := 'Appuntamento cancellato';
      v_body := v_client_name || ' ha cancellato ' || v_service_name || ' del ' || v_date_formatted || ' alle ' || v_time_formatted;
    WHEN 'confirmation' THEN
      v_title := 'Appuntamento confermato';
      v_body := v_client_name || ' ha confermato ' || v_service_name || ' per il ' || v_date_formatted || ' alle ' || v_time_formatted;
    WHEN 'no_show' THEN
      v_title := 'Cliente non presentato';
      v_body := v_client_name || ' non si è presentato per ' || v_service_name || ' del ' || v_date_formatted || ' alle ' || v_time_formatted;
  END CASE;

  -- Insert notification
  INSERT INTO public.notifications (business_id, type, title, body, appointment_id)
  VALUES (NEW.business_id, v_notif_type, v_title, v_body, NEW.id);

  RETURN NEW;
END;
$$;

-- 6. Create trigger on appointments table
DROP TRIGGER IF EXISTS trg_generate_notification ON appointments;
CREATE TRIGGER trg_generate_notification
  AFTER INSERT OR UPDATE OF status
  ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION generate_appointment_notification();
