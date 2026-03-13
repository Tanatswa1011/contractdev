import { PublicOnly } from "@/components/auth/public-only";
import { AuthForm } from "@/components/auth/auth-form";

interface SignupPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;
  const nextPath = next || "/dashboard";

  return (
    <PublicOnly fallbackPath={nextPath}>
      <AuthForm mode="signup" nextPath={nextPath} />
    </PublicOnly>
  );
}
