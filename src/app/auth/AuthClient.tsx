"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import AuthSection from "@/components/auth/AuthSection";
import type { AuthFormState, AuthMode } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";
import OverlayLoader from "@/components/ui/OverlayLoader";
import Snackbar, { type SnackbarVariant } from "@/components/ui/Snackbar";
import { auth, db } from "@/lib/firebase";

const defaultAuthForm: AuthFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  password: ""
};

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authForm, setAuthForm] = useState<AuthFormState>(defaultAuthForm);
  const [authFieldErrors, setAuthFieldErrors] = useState<
    Partial<Record<keyof AuthFormState, boolean>>
  >({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: SnackbarVariant;
  } | null>(null);

  const nextPath = useMemo(() => searchParams.get("next") ?? "/", [searchParams]);

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(nextPath);
    }
  }, [loading, user, router, nextPath]);

  const handleAuthChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
    setAuthFieldErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validateAuthFields = (fields: (keyof AuthFormState)[]) => {
    const nextErrors: Partial<Record<keyof AuthFormState, boolean>> = {};
    fields.forEach((field) => {
      if (!authForm[field].trim()) {
        nextErrors[field] = true;
      }
    });

    setAuthFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setAuthError("Please fill in the required fields.");
      return false;
    }

    return true;
  };

  const handleEmailSignIn = async () => {
    setAuthError(null);
    if (!validateAuthFields(["email", "password"])) {
      return;
    }
    setActionLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      setSnackbar({ message: "Welcome back! You are signed in.", variant: "success" });
      setAuthForm(defaultAuthForm);
      router.replace(nextPath);
    } catch (error) {
      setAuthError("Unable to sign in with email/password.");
      setSnackbar({ message: "Unable to sign in with email/password.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    setAuthError(null);
    if (!validateAuthFields(["firstName", "lastName", "email", "password"])) {
      return;
    }
    setActionLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        authForm.email,
        authForm.password
      );
      await setDoc(doc(db, "users", credential.user.uid), {
        firstName: authForm.firstName.trim(),
        lastName: authForm.lastName.trim(),
        email: authForm.email.trim(),
        phone: authForm.phone.trim(),
        gender: authForm.gender,
        createdAt: serverTimestamp()
      });
      setSnackbar({ message: "Account created! Welcome to Aura Pulse.", variant: "success" });
      setAuthForm(defaultAuthForm);
      router.replace(nextPath);
    } catch (error) {
      setAuthError("Unable to create account.");
      setSnackbar({ message: "Unable to create account.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setActionLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSnackbar({ message: "Signed in with Google.", variant: "success" });
      router.replace(nextPath);
    } catch (error) {
      setAuthError("Unable to sign in with Google.");
      setSnackbar({ message: "Unable to sign in with Google.", variant: "error" });
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || user) {
    return (
      <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 pb-20 pt-24 text-slate-100">
        <OverlayLoader />
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 pb-20 pt-24 text-slate-100">
      <AuthSection
        mode={authMode}
        form={authForm}
        fieldErrors={authFieldErrors}
        error={authError}
        isLoading={actionLoading}
        onModeChange={setAuthMode}
        onChange={handleAuthChange}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onGoogleSignIn={handleGoogleSignIn}
      />
      {actionLoading ? <OverlayLoader /> : null}
      {snackbar ? (
        <Snackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={() => setSnackbar(null)}
        />
      ) : null}
    </main>
  );
}
