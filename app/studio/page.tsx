import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, MapPin, Phone } from "lucide-react";
import { site } from "@/lib/site";
import styles from "./studio.module.css";

const capabilities = [
  {
    index: "01",
    title: "Architecture",
    text: "Site planning, space planning, elevations, design development, working drawings and visualisation.",
  },
  {
    index: "02",
    title: "Engineering",
    text: "Civil and structural coordination, technical planning, approvals, estimation and construction documentation.",
  },
  {
    index: "03",
    title: "Construction",
    text: "Site execution, supervision, coordination, quality control and final handover.",
  },
];

const principles = [
  {
    index: "01",
    title: "Understand the site",
    text: "Every project begins with the land, the client requirements, the budget and the way the space needs to work.",
  },
  {
    index: "02",
    title: "Coordinate before building",
    text: "Architecture and engineering are developed together so decisions are resolved before they reach site.",
  },
  {
    index: "03",
    title: "Design for execution",
    text: "Buildability, cost, materials and site conditions remain part of the design conversation from the beginning.",
  },
  {
    index: "04",
    title: "Stay involved",
    text: "The same project thinking continues through drawings, approvals, supervision, construction and handover.",
  },
];

export default function StudioPage() {
  return (
    <>
      <Header />
      <main className={styles.studioPage}>
        <PageHero
          index="01"
          eyebrow="STUDIO"
          title={
            <>
              Architecture shaped by engineering.
              <br />
              <em>Delivered through construction.</em>
            </>
          }
          description="Modex Engineers Architects brings architecture, civil engineering and construction together under one coordinated practice in Kasaragod."
        />

        <section className={styles.aboutSection}>
          <div className={`shell ${styles.aboutGrid}`}>
            <div className={styles.aboutCopy}>
              <p className="kicker">ABOUT MODEX</p>
              <h2>
                One practice.
                <br />
                <em>Every stage of the project.</em>
              </h2>
              <p>
                We work across architecture, engineering and construction, allowing projects to move from the first discussion to site execution with greater clarity and coordination.
              </p>
              <p>
                Our work includes residences, commercial spaces and mixed projects, with the same team able to stay involved through planning, design development, technical drawings, approvals, engineering, construction and handover.
              </p>
            </div>

            <div className={styles.officeWrap}>
              <div className={styles.officeImage}>
                <Image
                  src="/images/modex-office.webp"
                  fill
                  alt="Modex Engineers Architects studio"
                  sizes="(max-width: 900px) 100vw, 52vw"
                />
              </div>
              <div className={styles.officeCaption}>
                <span>MODEX ENGINEERS ARCHITECTS</span>
                <span>KASARAGOD, KERALA</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.capabilitiesSection}>
          <div className="shell">
            <div className={styles.sectionLead}>
              <p className="kicker">CONNECTED CAPABILITIES</p>
              <h2>
                One team.
                <br />
                <em>Three connected disciplines.</em>
              </h2>
              <p>
                Bringing the core disciplines together helps reduce gaps between what is imagined, what is engineered and what is finally built.
              </p>
            </div>

            <div className={styles.capabilityGrid}>
              {capabilities.map((item) => (
                <article className={styles.capabilityCard} key={item.index}>
                  <span className={styles.cardIndex}>{item.index}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <div className={styles.cardLine} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.approachSection}>
          <div className={`shell ${styles.approachGrid}`}>
            <div className={styles.approachIntro}>
              <p className="kicker">OUR APPROACH</p>
              <h2>
                Designed to work
                <br />
                <em>beyond the drawing.</em>
              </h2>
              <p>
                Good architecture must also make sense technically, financially and on site. Our process keeps those realities connected from the beginning.
              </p>
            </div>

            <div className={styles.principleList}>
              {principles.map((item) => (
                <article className={styles.principleRow} key={item.index}>
                  <span>{item.index}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.locationSection}>
          <div className={`shell ${styles.locationGrid}`}>
            <div>
              <p className={styles.lightKicker}>BASED IN KASARAGOD</p>
              <h2>
                Close to the project.
                <br />
                <em>Connected through every stage.</em>
              </h2>
            </div>
            <div className={styles.locationCopy}>
              <p>
                Our practice works closely with clients, consultants and site teams throughout the design and construction process.
              </p>
              <div className={styles.contactBits}>
                <span><MapPin size={17} /> Kasaragod, Kerala</span>
                <a href={site.phoneHref}><Phone size={17} /> {site.phone}</a>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={`shell ${styles.ctaGrid}`}>
            <div>
              <p className="kicker">START A PROJECT</p>
              <h2>
                Have a project in mind?
                <br />
                <em>Start with a conversation.</em>
              </h2>
            </div>
            <div className={styles.ctaSide}>
              <p>
                Tell us what you are planning, where the project is located and what stage you are at. We can help map the next steps.
              </p>
              <div className={styles.ctaActions}>
                <Link href="/contact" className="button button-dark">
                  Start a Project <ArrowUpRight size={17} />
                </Link>
                <a href={site.whatsapp} target="_blank" rel="noreferrer" className="button button-outline-dark">
                  <MessageCircle size={17} /> WhatsApp Modex
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
