import { createClient } from "@supabase/supabase-js";

// Singleton admin client (service role key) — bypasses RLS.
// Use ONLY for public-facing server actions (booking, waitlist) and webhooks.
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono richieste.");
    }
    _supabaseAdmin = createClient(url, serviceKey);
  }
  return _supabaseAdmin;
}
