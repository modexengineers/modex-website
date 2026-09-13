"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";

type RailProject = {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  cover_image_url: string;
};

export default function ProjectRail({ projects }: { projects: RailProject[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const move = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;

    const firstCard = rail.querySelector<HTMLElement>("[data-project-card]");
    const gap = 28;
    const distance = (firstCard?.offsetWidth || rail.clientWidth * 0.82) + gap;

    rail.scrollBy({ left: distance * direction, behavior: "smooth" });
  };

  const syncActive = () => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-project-card]"));
    if (!cards.length) return;

    const railCenter = rail.scrollLeft + rail.clientWidth / 2;
    let closest = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - railCenter);
      if (distance < closestDistance) {
        closest = index;
        closestDistance = distance;
      }
    });

    setActiveIndex(closest);
  };

  return (
    <div className="projects-rail-shell">
      <div className="projects-rail-head">
        <div>
          <span className="projects-rail-count">
            {String(activeIndex + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </span>
          <p>Scroll or swipe to explore projects</p>
        </div>
        <div className="projects-rail-controls" aria-label="Project carousel controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous project">
            <ArrowLeft size={18} />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next project">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="projects-rail"
        data-count={projects.length}
        onScroll={syncActive}
      >
        {projects.map((project, index) => (
          <Link
            href={`/projects/${project.slug}`}
            key={project.id}
            className="projects-rail-card"
            data-project-card
          >
            <div className="projects-rail-image">
              <img src={project.cover_image_url} alt={project.title} loading={index < 2 ? "eager" : "lazy"} />
              <span className="projects-rail-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="projects-rail-arrow"><ArrowUpRight size={22} /></span>
            </div>
            <div className="projects-rail-meta">
              <div>
                <h2>{project.title}</h2>
                <p>{project.category} · {project.location}</p>
              </div>
              <ArrowUpRight size={22} />
            </div>
          </Link>
        ))}
        <div className="projects-rail-end" aria-hidden="true">
          <span>MODEX / PROJECTS</span>
          <strong>More work<br/>coming soon.</strong>
        </div>
      </div>
    </div>
  );
}
