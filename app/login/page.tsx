import { PublicOnly } from "@/components/auth/public-only";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <PublicOnly>
      <AuthForm mode="login" />
    </PublicOnly>
  );
}
