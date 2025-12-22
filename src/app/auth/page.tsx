import { Suspense } from "react";

import AuthClient from "./AuthClient";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 pb-20 pt-24 text-slate-100" />
      }
    >
      <AuthClient />
    </Suspense>
  );
}
