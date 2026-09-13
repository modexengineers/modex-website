import type { ReactNode } from "react";
import Link from "next/link";

interface PageHeroProps {
  index: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  backHref?: string;
}

export default function PageHero({
  index,
  eyebrow,
  title,
  description,
  backHref,
}: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="page-hero-grid" aria-hidden="true" />
      <div className="shell page-hero-inner">
        <div className="page-hero-top">
          <span>{index}</span>
          <span>{eyebrow}</span>
        </div>

        <h1>{title}</h1>

        <div className="page-hero-bottom">
          <p>{description}</p>
          {backHref && (
            <Link href={backHref} className="text-link light">
              ← Back
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
