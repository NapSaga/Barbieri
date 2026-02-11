import { getServices } from "@/actions/services";
import { getStaff, getStaffServices } from "@/actions/staff";
import { StaffManager } from "@/components/staff/staff-manager";

export default async function StaffPage() {
  const [staffMembers, services, staffServices] = await Promise.all([
    getStaff(),
    getServices(),
    getStaffServices(),
  ]);

  return (
    <StaffManager
      initialStaff={staffMembers}
      services={services}
      initialStaffServices={staffServices}
    />
  );
}
