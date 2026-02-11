import Image from "next/image";
import { notFound } from "next/navigation";
import { getClosureDates } from "@/actions/closures";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { generateBrandCSSVariables, generateFontCSSVariables } from "@/lib/brand-settings";
import { createClient } from "@/lib/supabase/server";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch business by slug
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, address, phone, logo_url, brand_colors, opening_hours, welcome_text, cover_image_url, font_preset",
    )
    .eq("slug", slug)
    .single();

  if (!business) {
    notFound();
  }

  // Fetch active services, staff, staff_services, and closure dates in parallel
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

  const cssVars = {
    ...generateBrandCSSVariables(business.brand_colors),
    ...generateFontCSSVariables(business.font_preset),
  };

  return (
    <div className="min-h-screen bg-background" style={cssVars as React.CSSProperties}>
      {business.cover_image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={business.cover_image_url}
            alt={business.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      )}
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          {business.logo_url && (
            <Image
              src={business.logo_url}
              alt={business.name}
              width={64}
              height={64}
              className="mx-auto mb-3 rounded-xl object-contain"
            />
          )}
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {business.name}
          </h1>
          {business.address && (
            <p className="mt-1 text-sm text-muted-foreground">{business.address}</p>
          )}
          {business.welcome_text && (
            <p className="mt-2 text-sm text-muted-foreground">{business.welcome_text}</p>
          )}
        </div>

        <BookingWizard
          business={business}
          services={services || []}
          staffMembers={staffMembers || []}
          staffServiceLinks={staffServiceLinks}
          closureDates={closureDates}
        />
      </div>
    </div>
  );
}
