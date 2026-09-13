"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import { services } from "@/lib/data";
import useMobileAutoRail from "./useMobileAutoRail";
import styles from "./ImportantStories.module.css";

const detailPoints: Record<string, string[]> = {
  Architecture: ["Site-responsive planning", "Spatial direction", "Working drawings"],
  "Civil Engineering": ["Site coordination", "Practical engineering inputs", "Execution support"],
  "Structural Design": ["Safe structural strategy", "Buildable detailing", "Architectural coordination"],
  "Interior Design": ["Material direction", "Lighting and detailing", "Functional interiors"],
  "3D Visualisation": ["Design communication", "Client clarity", "Presentation visuals"],
  "Approvals & Documentation": ["Submission sets", "Permit drawings", "Construction documentation"],
  "Estimation & Cost Planning": ["Quantity visibility", "Budget alignment", "Cost decisions"],
  "Construction & Supervision": ["Site supervision", "Quality coordination", "Progress review"],
  "Turnkey Delivery": ["One accountable team", "End-to-end continuity", "Final handover"],
};

export default function Expertise() {
  const [active, setActive] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const current = services[active];
  useMobileAutoRail(railRef, services.length, 3800);

  return (
    <section className={`${styles.section} ${styles.expertiseSection} section-pad`} id="services">
      <div className="shell">
        <div className={styles.sectionHead}>
          <div>
            <p className="kicker">EXPERTISE</p>
            <h2>One practice.<br /><em>Every essential discipline.</em></h2>
          </div>
          <p>
            Architecture, engineering and construction are coordinated as one system, so decisions
            stay consistent from the first sketch to site execution.
          </p>
        </div>

        <div className={`${styles.frame} ${styles.expertiseFrame}`}>
          <div className={styles.cornerTL} />
          <div className={styles.cornerBR} />

          <div className={styles.expertiseFeature}>
            <div className={styles.featureGrid} />
            <div className={styles.featureLineA} />
            <div className={styles.featureLineB} />
            <div className={styles.featureLineC} />

            <div className={styles.featureContent}>
              <span>{current[0]} / MODEX EXPERTISE</span>
              <h3>{current[1]}</h3>
              <p>{current[2]}</p>

              <div className={styles.detailList}>
                {(detailPoints[current[1]] ?? []).map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>

              <Link href="/services" className="text-link">
                Explore services <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          <div className={styles.expertiseList}>
            {services.map(([num, title], index) => (
              <button
                key={num}
                type="button"
                className={active === index ? styles.activeRow : undefined}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
              >
                <span>{num}</span>
                <strong>{title}</strong>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.mobileRailWrap}>
          <div className={styles.mobileRailLabel}>Swipe or wait to explore</div>
          <div ref={railRef} className={styles.mobileRail}>
            {services.map(([num, title, copy]) => (
              <article key={num} data-rail-item className={styles.mobileCard}>
                <span>{num}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <div className={styles.mobileCardLine} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
