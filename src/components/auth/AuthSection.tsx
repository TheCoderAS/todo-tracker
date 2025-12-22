"use client";

import AuthForm, { type AuthFormState, type AuthMode } from "@/components/auth/AuthForm";
import AuthIntro from "@/components/auth/AuthIntro";

type AuthSectionProps = {
  mode: AuthMode;
  form: AuthFormState;
  fieldErrors: Partial<Record<keyof AuthFormState, boolean>>;
  error: string | null;
  isLoading: boolean;
  onModeChange: (mode: AuthMode) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onEmailSignIn: () => void;
  onEmailSignUp: () => void;
  onGoogleSignIn: () => void;
};

export default function AuthSection({
  mode,
  form,
  fieldErrors,
  error,
  isLoading,
  onModeChange,
  onChange,
  onEmailSignIn,
  onEmailSignUp,
  onGoogleSignIn
}: AuthSectionProps) {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <AuthIntro />
      <AuthForm
        mode={mode}
        form={form}
        fieldErrors={fieldErrors}
        error={error}
        isLoading={isLoading}
        onModeChange={onModeChange}
        onChange={onChange}
        onEmailSignIn={onEmailSignIn}
        onEmailSignUp={onEmailSignUp}
        onGoogleSignIn={onGoogleSignIn}
      />
    </section>
  );
}
