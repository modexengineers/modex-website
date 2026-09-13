import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroStory from "./_home/HeroStory";
import Expertise from "./_home/Expertise";
import ProcessStory from "./_home/ProcessStory";
import ConstructionStory from "./_home/ConstructionStory";
import { getWebsiteProjects } from "@/lib/website-projects";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;


export default async function Home() {
  const featuredProjects = (await getWebsiteProjects({ featuredOnly: true })).slice(0, 4);
  const singleProject = featuredProjects.length === 1 ? featuredProjects[0] : null;

  return (
    <>
      <Header />
      <main>
        <HeroStory />

        <section className="intro-section section-pad">
          <div className="shell intro-grid">
            <div className="section-index">ABOUT MODEX</div>
            <div className="intro-copy">
              <p className="kicker">ONE COORDINATED TEAM</p>
              <h2>
                One team responsible for <em>every stage</em> of your project.
              </h2>
              <p className="body-large">
                Modex Engineers Architects brings architecture, civil engineering and construction together under one roof. We create spaces that respond to the site, the client&apos;s lifestyle, the available budget and the realities of construction.
              </p>
              <Link className="text-link" href="/studio">Discover the studio ↗</Link>
            </div>
            <div className="intro-image-wrap">
              <Image
                src="/images/modex-office.webp"
                alt="Modex Engineers Architects"
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
                className="cover-image"
              />
              <div className="image-caption">MODEX / KASARAGOD</div>
            </div>
          </div>
        </section>

        <section className="signature-section">
          <div className="signature-grid" />
          <div className="shell signature-inner">
            <span className="section-index light">OUR POSITION</span>
            <div className="signature-copy">
              <p>One team from concept to completion.</p>
              <h2>Design and construction,<br/><em>connected.</em></h2>
            </div>
            <p className="signature-note">Architecture · Engineering · Construction<br/>Kasaragod, Kerala.</p>
          </div>
        </section>

        {featuredProjects.length > 0 && (
          <section className="projects-section section-pad">
            <div className="shell">
              <div className="section-heading split-heading">
                <div>
                  <p className="kicker">SELECTED WORK</p>
                  <h2>Architecture seen through <em>real projects.</em></h2>
                </div>
                <p className="section-note">Selected architectural, engineering and construction work by Modex Engineers Architects.</p>
              </div>

              {singleProject ? (
                <Link href={`/projects/${singleProject.slug}`} className="project-feature-single">
                  <div className="project-feature-media">
                    <img src={singleProject.cover_image_url} alt={singleProject.title} loading="lazy" />
                    <span className="project-arrow"><ArrowUpRight size={22} /></span>
                  </div>
                  <div className="project-meta-row project-meta-row-single">
                    <div><span>{singleProject.title}</span><small>{singleProject.category}</small></div>
                    <small>{singleProject.location}</small>
                  </div>
                </Link>
              ) : (
                <div className="project-auto-grid">
                  {featuredProjects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.slug}`} className="project-tile auto-tile">
                      <div className="project-media auto-project-media">
                        <img src={project.cover_image_url} alt={project.title} loading="lazy" />
                        <span className="project-arrow"><ArrowUpRight size={22} /></span>
                      </div>
                      <div className="project-meta-row">
                        <div><span>{project.title}</span><small>{project.category}</small></div>
                        <small>{project.location}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="section-bottom-link">
                <Link href="/projects" className="text-link">Explore all projects <ArrowUpRight size={18} /></Link>
              </div>
            </div>
          </section>
        )}

        <Expertise />
        <ProcessStory />

        <ConstructionStory />

        <section className="cta-section">
          <div className="shell cta-layout">
            <p className="kicker">START A PROJECT</p>
            <h2>Planning something new?<br/><em>Let&apos;s shape it from the first line.</em></h2>
            <div className="cta-actions">
              <Link href="/contact" className="button button-dark">Start a Project <ArrowUpRight size={17}/></Link>
              <a href={site.whatsapp} target="_blank" rel="noreferrer" className="button button-outline-dark"><MessageCircle size={17}/> WhatsApp Modex</a>
            </div>
            <div className="cta-meta"><span>{site.phone}</span><span>Kasaragod, Kerala, India</span></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
