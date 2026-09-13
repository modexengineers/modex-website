"use client";

import { useRef } from "react";
import { processSteps } from "@/lib/data";
import useMobileAutoRail from "./useMobileAutoRail";
import styles from "./ImportantStories.module.css";

export default function ProcessStory() {
  const railRef = useRef<HTMLDivElement>(null);
  useMobileAutoRail(railRef, processSteps.length, 3600);

  return (
    <section className={`${styles.section} ${styles.processSection} section-pad`} id="process">
      <div className="shell">
        <div className={styles.sectionHead}>
          <div>
            <p className="kicker">PROCESS</p>
            <h2>From brief to build.<br /><em>A process you can follow.</em></h2>
          </div>
          <p>
            A project feels easier when every stage is visible. Our workflow keeps design,
            engineering, documentation and execution connected in one readable sequence.
          </p>
        </div>

        <div className={`${styles.frame} ${styles.processFrame}`}>
          <div className={styles.cornerTL} />
          <div className={styles.cornerBR} />

          <div className={styles.processMap}>
            <div className={styles.processMapGrid} />
            <div className={styles.mapStrokeA} />
            <div className={styles.mapStrokeB} />
            <div className={styles.mapStrokeC} />
            <div className={styles.mapStrokeD} />
            <div className={styles.mapCaption}>
              <span>MODEX / PROJECT JOURNEY</span>
              <strong>Eight stages.<br />One continuous workflow.</strong>
            </div>
          </div>

          <div className={styles.processList}>
            {processSteps.map(([num, title, copy]) => (
              <article key={num}>
                <span>{num}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.mobileRailWrap}>
          <div className={styles.mobileRailLabel}>Project stages — auto scroll</div>
          <div ref={railRef} className={styles.mobileRail}>
            {processSteps.map(([num, title, copy]) => (
              <article key={num} data-rail-item className={`${styles.mobileCard} ${styles.processMobileCard}`}>
                <span>{num}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <div className={styles.processMiniTrack}><i /><i /><i /></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
