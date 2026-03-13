import { PublicOnly } from "@/components/auth/public-only";
import { LandingPage } from "@/components/public/landing-page";

export default function Page() {
  return (
    <PublicOnly>
      <LandingPage />
    </PublicOnly>
  );
}

