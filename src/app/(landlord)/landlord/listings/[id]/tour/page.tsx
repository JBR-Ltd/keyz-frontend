import TourWizard from "@/components/tour/TourWizard";

interface TourPageProps {
  params: Promise<{ id: string }>;
}

export default async function LandlordTourPage({ params }: TourPageProps) {
  const { id } = await params;

  return <TourWizard propertyId={Number(id)} role="landlord" />;
}
