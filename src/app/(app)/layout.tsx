import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/app/Sidebar";
import { LiveBar } from "@/components/app/LiveBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ name: user.name, role: user.role }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <LiveBar />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
