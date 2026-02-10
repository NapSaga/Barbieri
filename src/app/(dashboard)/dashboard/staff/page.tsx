import { getStaff } from "@/actions/staff";
import { StaffManager } from "@/components/staff/staff-manager";

export default async function StaffPage() {
  const staffMembers = await getStaff();

  return <StaffManager initialStaff={staffMembers} />;
}
