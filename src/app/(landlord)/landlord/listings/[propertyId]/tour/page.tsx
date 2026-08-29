import TourWizard from "@/components/tour/TourWizard";

interface TourPageProps {
  params: Promise<{ propertyId: string }>;
}

export default async function LandlordTourPage({ params }: TourPageProps) {
  const { propertyId } = await params;

  return <TourWizard propertyId={Number(propertyId)} role="landlord" />;
}