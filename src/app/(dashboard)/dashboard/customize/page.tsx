import { redirect } from "next/navigation";
import { getClosureDates } from "@/actions/closures";
import { FormCustomizer } from "@/components/customize/form-customizer";
import { createClient } from "@/lib/supabase/server";

export default async function CustomizePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, address, opening_hours, brand_colors, logo_url, welcome_text, cover_image_url, font_preset",
    )
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/dashboard");

  const [{ data: services }, { data: staffMembers }, { data: staffServicesRaw }, closureDates] =
    await Promise.all([
      supabase
        .from("services")
        .select("id, name, duration_minutes, price_cents, is_combo")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("staff")
        .select("id, name, photo_url, working_hours")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("staff_services")
        .select("staff_id, service_id, staff!inner(business_id)")
        .eq("staff.business_id", business.id),
      getClosureDates(business.id),
    ]);

  const staffServiceLinks = (staffServicesRaw || []).map((row) => ({
    staffId: row.staff_id,
    serviceId: row.service_id,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <FormCustomizer
        business={business}
        services={services || []}
        staffMembers={staffMembers || []}
        staffServiceLinks={staffServiceLinks}
        closureDates={closureDates}
      />
    </div>
  );
}
