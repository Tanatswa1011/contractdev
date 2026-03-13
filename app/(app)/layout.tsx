import { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      <div className="min-h-screen bg-background">{children}</div>
    </>
  );
}
