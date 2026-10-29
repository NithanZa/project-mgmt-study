import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-3 px-4 py-16">
      <p className="text-xs uppercase tracking-wide text-muted">404</p>
      <h1 className="text-2xl font-semibold">That page is not part of the course.</h1>
      <Link href="/" className="text-sm font-medium text-accent hover:underline">
        ← Back to the course
      </Link>
    </main>
  );
}
