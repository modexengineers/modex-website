import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWebsiteProjectBySlug } from "@/lib/website-projects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getWebsiteProjectBySlug(slug);
  if (!project) notFound();

  const images = project.website_project_images.length
    ? project.website_project_images
    : [{ id: "cover", image_url: project.cover_image_url, caption: null, image_type: "Exterior", is_cover: true } as any];

  const cover = images.find((image) => image.is_cover) || images[0];
  const gallery = [cover, ...images.filter((image) => image.id !== cover.id)];

  return (
    <>
      <Header />
      <main className="project-case-page">
        <section className="project-case-intro section-pad">
          <div className="shell project-case-grid">
            <div className="project-case-copy">
              <p className="kicker">PROJECT STORY</p>
              <h1>{project.title}</h1>
              <p className="project-case-lead">
                {project.description || project.short_description || "Project information will be updated by Modex."}
              </p>
              <div className="project-case-tags">
                <span>{project.category}</span>
                <span>{project.location}</span>
                {project.status && <span>{project.status}</span>}
              </div>
            </div>

            <div className="project-case-facts">
              <div><span>Location</span><strong>{project.location || "—"}</strong></div>
              <div><span>Category</span><strong>{project.category || "—"}</strong></div>
              <div><span>Year</span><strong>{project.year || "—"}</strong></div>
              <div><span>Area</span><strong>{project.area || "—"}</strong></div>
            </div>
          </div>
        </section>

        <section className="project-gallery project-gallery-refined">
          <div className="shell">
            <figure className="project-gallery-main project-gallery-main-fluid">
              <img src={cover.image_url} alt={cover.caption || `${project.title} cover image`} />
              {(cover.caption || cover.image_type) && (
                <figcaption>
                  <span>{cover.image_type}</span>
                  {cover.caption && <p>{cover.caption}</p>}
                </figcaption>
              )}
            </figure>

            {gallery.length > 1 && (
              <div className="project-gallery-auto">
                {gallery.slice(1).map((image, index) => (
                  <figure key={image.id} className={`project-gallery-card gallery-card-${(index % 3) + 1}`}>
                    <img src={image.image_url} alt={image.caption || `${project.title} ${image.image_type}`} loading="lazy" />
                    {(image.caption || image.image_type) && (
                      <figcaption>
                        <span>{image.image_type}</span>
                        {image.caption && <p>{image.caption}</p>}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}

            {project.services?.length > 0 && (
              <div className="project-services-strip">
                <span>Services</span>
                <div>{project.services.map((service) => <strong key={service}>{service}</strong>)}</div>
              </div>
            )}

            <Link className="text-link" href="/projects">← Back to projects</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
