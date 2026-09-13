import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="site-footer modex-footer">
      <div className="shell">
        <div className="modex-footer-main">
          <div className="modex-footer-brand">
            <Image
              src="/logo/modex-logo.svg"
              alt="Modex Engineers Architects"
              width={1200}
              height={469}
              className="modex-footer-logo"
            />
            <p>Architecture · Engineering · Construction<br/>Kasaragod, Kerala</p>
          </div>

          <div className="modex-footer-column">
            <strong>Explore</strong>
            <Link href="/studio">Studio</Link>
            <Link href="/services">Services</Link>
            <Link href="/projects">Projects</Link>
          </div>

          <div className="modex-footer-column">
            <strong>Contact</strong>
            <a href={site.phoneHref}>{site.phone}</a>
            <a href={site.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
            <Link href="/contact">Start an enquiry</Link>
          </div>

          <div className="modex-footer-column">
            <strong>Client</strong>
            <Link href="/portal">Client Portal</Link>
            <Link href="/contact" className="modex-footer-project">Start a Project <ArrowUpRight size={14}/></Link>
          </div>
        </div>

        <div className="modex-footer-bottom">
          <span>© 2026 Modex Engineers Architects</span>
          <span>Kasaragod, Kerala</span>
        </div>
      </div>
    </footer>
  );
}
