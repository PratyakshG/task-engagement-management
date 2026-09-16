import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen text-neutral-900 bg-foreground">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Task & Engagement Manager
            </h1>
          </div>

          <Link
            href="/login"
            className="rounded-md border hover:border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-background hover:text-foreground transition-all"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Manage client engagements.
          <span className="block text-muted-foreground">
            Keep every task on track.
          </span>
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          A centralized workspace for managing clients, engagements, tasks,
          assignments, recurring services, and review workflows.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-md border bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-background hover:text-foreground transition-all"
          >
            Go to dashboard
          </Link>

          <Link
            href="/login"
            className="rounded-md border bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-background hover:text-foreground transition-all"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
