import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { services } from "@/lib/data";
import { site } from "@/lib/site";

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          index="02"
          eyebrow="SERVICES"
          title={<>Design to delivery.<br/><em>One connected workflow.</em></>}
          description="Architecture, engineering and construction coordinated by one team — reducing gaps between what is designed and what is built."
        />

        <section className="service-detail-section section-pad">
          <div className="shell">
            {services.map(([number, title, copy]) => (
              <article className="service-detail-row" key={number}>
                <span>{number}</span>
                <h2>{title}</h2>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="shell cta-layout">
            <p className="kicker">START A PROJECT</p>
            <h2>Need one team from design to site?<br/><em>Start with a conversation.</em></h2>
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
