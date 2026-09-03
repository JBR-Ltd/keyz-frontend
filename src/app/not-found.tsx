import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound(): ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-16 text-primary">
      <section className="flex w-full max-w-xl flex-col items-center text-center">
        <p className="font-display text-[8rem] font-bold leading-none tracking-tight text-primary sm:text-[11rem]">
          404
        </p>
        <div className="mt-2 h-1 w-16 rounded-full bg-accent" />
        <h1 className="mt-8 font-display text-3xl font-bold sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md font-body text-base leading-7 text-muted sm:text-lg">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or the link may be outdated.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Go to homepage
          </Link>
          <Link
            href="/tenant/browse"
            className="inline-flex min-h-12 items-center justify-center gap-2 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:text-accent-alt hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Browse properties
          </Link>
        </div>
      </section>
    </main>
  );
}
