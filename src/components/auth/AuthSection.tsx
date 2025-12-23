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
  onForgotPassword: () => void;
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
  onGoogleSignIn,
  onForgotPassword
}: AuthSectionProps) {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="order-2 lg:order-1">
        <AuthIntro />
      </div>
      <div className="order-1 lg:order-2">
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
          onForgotPassword={onForgotPassword}
        />
      </div>
    </section>
  );
}
