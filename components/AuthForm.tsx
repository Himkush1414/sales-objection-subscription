"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import { logIn, signUp } from "@/lib/auth";
import { getSubscription } from "@/lib/subscription";
import { useSession } from "@/components/SessionProvider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { refresh } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const result = isSignup ? signUp(email, password, name) : logIn(email, password);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }

    // ensure a subscription record exists
    if (result.user) getSubscription(result.user.email);
    refresh();
    router.push("/");
  };

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-teal-accent text-navy-950">
          <Target size={20} />
        </span>
        <h1 className="text-xl font-bold text-slate-100">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {isSignup
            ? "Start with 3 free reports every month."
            : "Log in to keep generating Sales Intelligence Reports."}
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-5">
        {isSignup && (
          <div>
            <label className="label" htmlFor="name">
              Name <span className="text-slate-600">(optional)</span>
            </label>
            <input
              id="name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rao"
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />}
          {isSignup ? "Sign up" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-400">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-teal-accent hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-teal-accent hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
