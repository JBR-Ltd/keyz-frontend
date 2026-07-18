import { redirect } from "next/navigation";

export default function LandlordPayoutVerificationPage() {
  redirect("/landlord/verify?mode=confirm");
}
