"use client";

import { Check } from "lucide-react";
import { useRef } from "react";
import useMobileAutoRail from "./useMobileAutoRail";
import styles from "./ImportantStories.module.css";

const principles = [
  "Design-led execution",
  "Engineering coordination",
  "Site supervision",
  "Quality control",
];

const stages = [
  ["01", "Site preparation", "Setting out, access and site readiness before construction begins."],
  ["02", "Foundation", "Ground conditions, levels and structural foundations coordinated correctly."],
  ["03", "Structure", "Columns, slabs and structural systems checked against the design intent."],
  ["04", "Services", "MEP and civil service routes coordinated before finishes close the work."],
  ["05", "Finishes", "Materials, detailing and workmanship reviewed for consistency and quality."],
  ["06", "Handover", "Final review, completion checks and a clear handover to the client."],
] as const;

export default function ConstructionStory() {
  const railRef = useRef<HTMLDivElement>(null);
  useMobileAutoRail(railRef, stages.length, 3800);

  return (
    <section className={`${styles.section} ${styles.constructionSection}`} id="construction">
      <div className="shell">
        <div className={`${styles.frame} ${styles.constructionFrame}`}>
          <div className={styles.cornerTL} />
          <div className={styles.cornerBR} />

          <div className={styles.constructionCopy}>
            <p className="kicker light">CONSTRUCTION</p>
            <h2>Design deserves<br /><em>careful execution.</em></h2>
            <p>
              The Modex team stays involved on site so architecture, structure, materials,
              workmanship and cost remain coordinated through construction.
            </p>

            <div className={styles.principles}>
              {principles.map((item) => (
                <div key={item}><Check size={15} /><span>{item}</span></div>
              ))}
            </div>
          </div>

          <div className={styles.constructionVisual}>
            <div className={styles.constructionGrid} />
            <div className={styles.structureOutlineA} />
            <div className={styles.structureOutlineB} />
            <div className={styles.structureOutlineC} />
            <div className={styles.structureColumnA} />
            <div className={styles.structureColumnB} />
            <div className={styles.structureColumnC} />
            <div className={styles.structureBeamA} />
            <div className={styles.structureBeamB} />
            <div className={styles.structureBase} />

            <div className={styles.constructionBadge}>
              <span>MODEX / ON SITE</span>
              <strong>Design continuity<br />through execution.</strong>
            </div>
          </div>

          <div className={styles.stageGrid}>
            {stages.map(([num, title]) => (
              <div key={num}>
                <span>{num}</span>
                <strong>{title}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.mobileRailWrap} ${styles.mobileRailDarkWrap}`}>
          <div className={styles.mobileRailLabel}>Construction sequence — auto scroll</div>
          <div ref={railRef} className={styles.mobileRail}>
            {stages.map(([num, title, copy]) => (
              <article key={num} data-rail-item className={`${styles.mobileCard} ${styles.constructionMobileCard}`}>
                <span>{num}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <div className={styles.buildIcon}>
                  <i /><i /><i />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
