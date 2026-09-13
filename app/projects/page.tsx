import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import ProjectRail from "./ProjectRail";
import { getWebsiteProjects } from "@/lib/website-projects";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectsPage() {
  const projects = await getWebsiteProjects();

  return (
    <>
      <Header />
      <main>
        <PageHero
          index="03"
          eyebrow="PROJECTS"
          title={
            <>
              Selected work.
              <br />
              <em>Designed around people and place.</em>
            </>
          }
          description="Residential, commercial, interior and construction work developed by Modex Engineers Architects."
        />

        <section className="listing-section py-14 md:py-20 xl:py-24">
          <div className="shell">
            {!projects.length ? (
              <div className="public-project-empty">
                <span>MODEX / PROJECTS</span>
                <h2>Portfolio updates in progress.</h2>
                <p>Projects uploaded by Modex will appear here automatically.</p>
              </div>
            ) : (
              <>
                {/* Desktop / tablet: normal compact grid */}
                <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-x-7 gap-y-12 xl:gap-x-8 xl:gap-y-14">
                  {projects.map((project, index) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.slug}`}
                      className="group block min-w-0"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-[#E7E2D9]">
                        <img
                          src={project.cover_image_url}
                          alt={project.title}
                          loading={index < 6 ? "eager" : "lazy"}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                        />

                        <span className="absolute left-4 top-4 z-10 grid h-9 min-w-9 place-items-center bg-white/92 px-2 text-[10px] tracking-[0.12em] text-[#14003F]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-4 border-t border-[rgba(20,0,63,.14)] pt-4">
                        <div className="min-w-0">
                          <h2 className="m-0 font-[var(--display)] text-[clamp(25px,2vw,34px)] font-medium leading-[.98] tracking-[-.035em] text-[#18151C]">
                            {project.title}
                          </h2>
                          <p className="mt-2 text-[9px] uppercase leading-5 tracking-[.11em] text-[#827D85]">
                            {project.category} · {project.location}
                          </p>
                        </div>
                        <ArrowUpRight size={20} className="mt-1 shrink-0 text-[#18151C]" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Mobile only: horizontal swipe rail */}
                <div className="md:hidden">
                  <ProjectRail projects={projects} />
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
