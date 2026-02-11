import { getPlanLimits } from "@/actions/billing";
import { getServices } from "@/actions/services";
import { getStaff, getStaffServices } from "@/actions/staff";
import { StaffManager } from "@/components/staff/staff-manager";

export default async function StaffPage() {
  const [staffMembers, services, staffServices, planLimits] = await Promise.all([
    getStaff(),
    getServices(),
    getStaffServices(),
    getPlanLimits(),
  ]);

  return (
    <StaffManager
      initialStaff={staffMembers}
      services={services}
      initialStaffServices={staffServices}
      maxStaff={planLimits.maxStaff}
    />
  );
}
