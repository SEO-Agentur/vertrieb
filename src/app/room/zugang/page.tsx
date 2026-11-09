import { AccessDenied } from "@/components/room/AccessDenied";
export const metadata = { title: "Zugang", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return <AccessDenied status={status} />;
}
