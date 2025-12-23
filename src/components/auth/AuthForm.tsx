import type { ChangeEvent } from "react";
import { FaGoogle } from "react-icons/fa6";
import { FiLock, FiMail, FiPhone, FiUser, FiUsers } from "react-icons/fi";

import Field from "@/components/ui/Field";
import SelectInput from "@/components/ui/SelectInput";
import TextInput from "@/components/ui/TextInput";

export type AuthMode = "signin" | "signup";

export type AuthFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  password: string;
};

type AuthFormProps = {
  mode: AuthMode;
  form: AuthFormState;
  fieldErrors: Partial<Record<keyof AuthFormState, boolean>>;
  error: string | null;
  isLoading: boolean;
  onModeChange: (mode: AuthMode) => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onEmailSignIn: () => void;
  onEmailSignUp: () => void;
  onGoogleSignIn: () => void;
  onForgotPassword: () => void;
};

export default function AuthForm({
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
}: AuthFormProps) {
  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-8 shadow-2xl shadow-slate-950/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-slate-400">
            {mode === "signin"
              ? "Sign in to continue managing your to-dos."
              : "Tell us a little about you to personalize the workspace."}
          </p>
        </div>
        <div className="flex w-full rounded-full border border-slate-800/70 bg-slate-900/60 p-1 text-xs font-semibold sm:w-auto">
          <button
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-center transition sm:flex-none ${
              mode === "signin" ? "bg-sky-500/20 text-sky-200" : "text-slate-400"
            }`}
            onClick={() => onModeChange("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-center transition sm:flex-none ${
              mode === "signup" ? "bg-sky-500/20 text-sky-200" : "text-slate-400"
            }`}
            onClick={() => onModeChange("signup")}
          >
            Sign up
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {mode === "signup" ? (
          <>
            <Field
              label="First name"
              icon={<FiUser className="h-4 w-4 text-slate-400" />}
              controlClassName={fieldErrors.firstName ? "border-rose-500/70" : undefined}
            >
              <TextInput
                name="firstName"
                type="text"
                placeholder="Jane"
                value={form.firstName}
                onChange={onChange}
              />
            </Field>
            <Field
              label="Last name"
              icon={<FiUser className="h-4 w-4 text-slate-400" />}
              controlClassName={fieldErrors.lastName ? "border-rose-500/70" : undefined}
            >
              <TextInput
                name="lastName"
                type="text"
                placeholder="Doe"
                value={form.lastName}
                onChange={onChange}
              />
            </Field>
          </>
        ) : null}

        <Field
          label="Email address"
          icon={<FiMail className="h-4 w-4 text-slate-400" />}
          className="sm:col-span-2"
          controlClassName={fieldErrors.email ? "border-rose-500/70" : undefined}
        >
          <TextInput
            name="email"
            type="email"
            placeholder="jane@aurapulse.com"
            value={form.email}
            onChange={onChange}
          />
        </Field>

        {mode === "signup" ? (
          <>
            <Field label="Phone number" icon={<FiPhone className="h-4 w-4 text-slate-400" />}>
              <TextInput
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={onChange}
              />
            </Field>
            <Field label="Gender" icon={<FiUsers className="h-4 w-4 text-slate-400" />}>
              <SelectInput name="gender" value={form.gender} onChange={onChange}>
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not">Prefer not to say</option>
              </SelectInput>
            </Field>
          </>
        ) : null}

        <Field
          label="Password"
          icon={<FiLock className="h-4 w-4 text-slate-400" />}
          className="sm:col-span-2"
          controlClassName={fieldErrors.password ? "border-rose-500/70" : undefined}
        >
          <TextInput
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={onChange}
          />
        </Field>
        {mode === "signin" ? (
          <div className="flex justify-end sm:col-span-2">
            <button
              type="button"
              className="text-xs font-semibold text-sky-200 transition hover:text-sky-100"
              onClick={onForgotPassword}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3">
        {mode === "signin" ? (
          <button
            onClick={onEmailSignIn}
            disabled={isLoading}
            className="w-full rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Sign in with email
          </button>
        ) : (
          <button
            onClick={onEmailSignUp}
            disabled={isLoading}
            className="w-full rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Create my account
          </button>
        )}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600"
          onClick={onGoogleSignIn}
        >
          <FaGoogle className="h-4 w-4" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
