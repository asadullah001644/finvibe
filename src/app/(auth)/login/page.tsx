import { Suspense } from "react";
import { redirectIfAuthenticatedFromAuthPage } from "@/lib/authRedirect";
import LoginPageClient from "./LoginPageClient";

export default async function LoginPage() {
  await redirectIfAuthenticatedFromAuthPage();

  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
