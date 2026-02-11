import { getReferralInfo, getReferrals } from "@/actions/referral";
import { ReferralDashboard } from "@/components/referral/referral-dashboard";

export default async function ReferralPage() {
  const [info, referrals] = await Promise.all([getReferralInfo(), getReferrals()]);

  return <ReferralDashboard info={info} referrals={referrals} />;
}
