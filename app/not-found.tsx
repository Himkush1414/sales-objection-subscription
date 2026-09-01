import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <p className="text-5xl font-bold text-teal-accent">404</p>
      <h1 className="mt-3 text-lg font-semibold text-slate-100">Page not found</h1>
      <p className="mt-2 text-sm text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Back to home
      </Link>
    </div>
  );
}
