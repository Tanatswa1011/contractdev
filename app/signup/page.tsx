import { PublicOnly } from "@/components/auth/public-only";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <PublicOnly>
      <AuthForm mode="signup" />
    </PublicOnly>
  );
}
