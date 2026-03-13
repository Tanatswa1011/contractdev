import { PublicOnly } from "@/components/auth/public-only";
import { AuthForm } from "@/components/auth/auth-form";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = next || "/dashboard";

  return (
    <PublicOnly fallbackPath={nextPath}>
      <AuthForm mode="login" nextPath={nextPath} />
    </PublicOnly>
  );
}
