"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { requestCodeAction, verifyCodeAction } from "./actions";
import { getCompanyTheme } from "@/lib/theme";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const companySlug = searchParams.get("company") ?? "flaretechnical";
  const theme = getCompanyTheme(companySlug);
  const placeholder = `you@${
    companySlug === "gasneeds" ? "gasneeds.com" : "flaretechnical.com"
  }`;

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");

  const [requestState, requestAction] = useFormState(requestCodeAction, {});
  const [verifyState, verifyAction] = useFormState(verifyCodeAction, {});

  useEffect(() => {
    if (requestState.sent) {
      setStep("code");
      setEmail(requestState.email ?? "");
    }
  }, [requestState]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4"
      style={theme.vars}
    >
      <div className="w-full max-w-sm rounded-2xl border border-brand-300 bg-surface p-8 shadow-sm">
        <div className="flex justify-center">
          <Image
            src={theme.logo}
            alt={theme.displayName}
            width={theme.logoWidth}
            height={theme.logoHeight}
            className="h-16 w-auto"
            priority
          />
        </div>

        {step === "email" && (
          <form action={requestAction} className="mt-6 space-y-4">
            <div>
              <input
                name="email"
                type="email"
                required
                placeholder={placeholder}
                className="w-full rounded-lg border border-brand-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            {requestState.error && (
              <p className="text-sm text-red-600">{requestState.error}</p>
            )}
            <SubmitButton label="Send me a code" />
          </form>
        )}

        {step === "code" && (
          <form action={verifyAction} className="mt-6 space-y-4">
            <input type="hidden" name="email" value={email} />
            <p className="text-sm text-slate-600">
              We sent a 6-digit code to <strong>{email}</strong>. Check the
              server console if this is running locally without email
              configured.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Sign-in code
              </label>
              <input
                name="code"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="123456"
                className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-center text-lg tracking-[0.5em] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            {verifyState.error && (
              <p className="text-sm text-red-600">{verifyState.error}</p>
            )}
            <SubmitButton label="Verify & sign in" />
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
