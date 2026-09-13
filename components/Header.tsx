"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";

const links = [
  ["Studio", "/studio"],
  ["Services", "/services"],
  ["Projects", "/projects"],
  ["Contact", "/contact"],
] as const;

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <Link href="/" className={styles.brand} aria-label="Modex Engineers Architects home">
          <Image src="/logo/modex-logo.svg" alt="Modex Engineers Architects" width={270} height={76} priority />
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {links.map(([label, href]) => {
            const active = isActiveRoute(pathname, href);
            return (
              <Link key={label} href={href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <Link className={styles.portalLink} href="/portal">Client Portal</Link>
          <Link className={styles.cta} href="/contact">Start a Project</Link>
          <button className={styles.menuButton} type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={24} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div className={`${styles.mobileMenu} ${open ? styles.open : ""}`} aria-hidden={!open}>
        <div className={styles.mobileTop}>
          <Image src="/logo/modex-logo.svg" alt="Modex Engineers Architects" width={230} height={66} priority />
          <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={25} strokeWidth={1.7} /></button>
        </div>

        <div className={styles.mobileBody}>
          <p className={styles.menuEyebrow}>Navigation</p>
          <nav className={styles.mobileLinks} aria-label="Mobile navigation">
            {links.map(([label, href], index) => {
              const active = isActiveRoute(pathname, href);
              return (
                <Link key={label} href={href} className={active ? styles.mobileActive : undefined} onClick={() => setOpen(false)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{label}</strong>
                  <ArrowUpRight size={19} strokeWidth={1.6} />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={styles.mobileActions}>
          <Link href="/contact" className={styles.mobilePrimary} onClick={() => setOpen(false)}>Start a Project <ArrowUpRight size={17}/></Link>
          <Link href="/portal" className={styles.mobileSecondary} onClick={() => setOpen(false)}>Client Portal <ArrowUpRight size={17}/></Link>
        </div>

        <div className={styles.mobileFoot}>
          <div><span>MODEX</span><p>Architecture · Engineering · Construction</p></div>
          <div><span>LOCATION</span><p>Kasaragod, Kerala</p></div>
        </div>
      </div>
    </>
  );
}
