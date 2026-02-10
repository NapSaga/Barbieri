import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getClosureDates } from "@/actions/closures";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch business by slug
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, address, phone, logo_url, brand_colors, opening_hours")
    .eq("slug", slug)
    .single();

  if (!business) {
    notFound();
  }

  // Fetch active services, staff, and closure dates in parallel
  const [{ data: services }, { data: staffMembers }, closureDates] = await Promise.all([
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
    getClosureDates(business.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          {business.address && (
            <p className="mt-1 text-sm text-gray-500">{business.address}</p>
          )}
        </div>

        <BookingWizard
          business={business}
          services={services || []}
          staffMembers={staffMembers || []}
          closureDates={closureDates}
        />
      </div>
    </div>
  );
}
