import { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      {children}
    </div>
  );
}
