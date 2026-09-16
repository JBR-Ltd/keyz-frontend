import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { POLICIES, findPolicy } from "@/lib/policies";

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return POLICIES.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({ params }: PolicyPageProps) {
  const policy = findPolicy((await params).slug);

  return policy
    ? { title: `${policy.title} | Rello`, description: policy.summary }
    : { title: "Policy | Rello" };
}

export default async function PolicyPage({
  params,
}: PolicyPageProps): Promise<ReactElement> {
  const policy = findPolicy((await params).slug);

  if (!policy) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface-soft px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/policies"
          className="font-body text-sm font-bold text-muted underline-offset-4 hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          All policies
        </Link>

        <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
          {policy.title}
        </h1>
        <p className="mt-4 font-body text-base leading-7 text-muted">
          {policy.summary}
        </p>
        <p className="mt-2 font-body text-sm text-muted">
          Last updated {policy.updated}
        </p>

        <div className="mt-10 grid gap-8">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl font-bold text-primary">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-3 font-body text-base leading-7 text-muted"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-4 grid gap-2">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-3 font-body text-base leading-7 text-muted"
                    >
                      <span
                        className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-alt"
                        aria-hidden="true"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-2xl border border-border bg-bg p-6 font-body text-sm leading-6 text-muted">
          Something here not matching what the product does? Tell us. A policy
          that is not true is worse than no policy.
        </p>
      </article>
    </main>
  );
}
