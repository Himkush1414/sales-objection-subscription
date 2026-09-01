"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, Target, X } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { PlanBadge } from "@/components/PlanBadge";
import { TokenCounter } from "@/components/TokenCounter";
import { logOut } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Generate" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavBar() {
  const { user, subscription } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logOut();
    setOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/80 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-100">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-accent text-navy-950">
            <Target size={16} />
          </span>
          <span className="hidden sm:inline">SalesEdge</span>
        </Link>

        <div className="mx-1 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-white/10 text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {subscription && (
            <div className="hidden items-center gap-2 sm:flex">
              <PlanBadge plan={subscription.plan} />
              <TokenCounter />
            </div>
          )}

          {user ? (
            <button onClick={handleLogout} className="btn-ghost hidden !px-3 !py-1.5 text-xs sm:inline-flex">
              <LogOut size={14} /> Logout
            </button>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn-ghost !px-3 !py-1.5 text-xs">
                Login
              </Link>
              <Link href="/signup" className="btn-primary !px-3 !py-1.5 text-xs">
                Sign up
              </Link>
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-200 md:hidden"
            aria-label="Menu"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-navy-950/95 px-4 py-3 md:hidden">
          {subscription && (
            <div className="mb-3 flex items-center gap-2">
              <PlanBadge plan={subscription.plan} />
              <TokenCounter />
            </div>
          )}
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
              >
                <LogOut size={14} /> Logout
              </button>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1 !py-2 text-xs">
                  Login
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary flex-1 !py-2 text-xs">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
