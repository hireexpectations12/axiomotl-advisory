import AdminGate from "../../components/AdminGate";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ recovery?: string }>;
}) {
  const params = await searchParams;
  return <AdminGate recovery={params.recovery === "1"} />;
}
