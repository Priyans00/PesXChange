import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

function LoginFormWrapper() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormWrapper />
    </Suspense>
  );
}
