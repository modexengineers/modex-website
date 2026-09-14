"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./HeroStory.module.css";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Range = [number, number, number, number];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const map = (value: number, start: number, end: number) =>
  clamp01((value - start) / Math.max(0.0001, end - start));

function rangeOpacity(progress: number, [fadeInStart, fullStart, fullEnd, fadeOutEnd]: Range) {
  if (progress <= fadeInStart || progress >= fadeOutEnd) return 0;
  if (progress >= fullStart && progress <= fullEnd) return 1;
  if (progress < fullStart) return map(progress, fadeInStart, fullStart);
  return 1 - map(progress, fullEnd, fadeOutEnd);
}

const captionRanges: Range[] = [
  [0, 0.002, 0.13, 0.20],
  [0.14, 0.20, 0.30, 0.38],
  [0.31, 0.38, 0.48, 0.57],
  [0.49, 0.57, 0.68, 0.77],
  [0.70, 0.78, 0.94, 1.01],
];

const mobileHeroStages = [
  ["01", "REALITY"],
  ["02", "DRAWING"],
  ["03", "DESIGN"],
  ["04", "ENGINEERING"],
  ["05", "DELIVER"],
] as const;

const mobileLayerMap = [0, 1, 2, 3, 0] as const;

export default function HeroStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mobileStage, setMobileStage] = useState(0);
  const captions = useRef<(HTMLDivElement | null)[]>([]);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const stageItems = useRef<(HTMLLIElement | null)[]>([]);
  const progressBar = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // MODEX MOBILE FIVE-STAGE HERO: keep the image visible while the user scrolls.
    // The stage follows scroll progress so every transformation is actually seen.
    if (window.matchMedia("(max-width: 820px)").matches) {
      captions.current.forEach((node, index) => {
        if (!node) return;
        node.style.opacity = index === 0 ? "1" : "0";
        node.style.transform = "none";
        node.style.pointerEvents = index === 0 ? "auto" : "none";
      });

      if (stageRef.current) stageRef.current.style.transform = "none";

      const mobileStory = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const nextStage = Math.min(
            mobileHeroStages.length - 1,
            Math.floor(self.progress * mobileHeroStages.length),
          );
          setMobileStage(nextStage);
        },
      });

      return () => mobileStory.kill();
    }

    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;

          if (progressBar.current) {
            progressBar.current.style.transform = `scaleY(${p})`;
          }

          captions.current.forEach((node, index) => {
            if (!node) return;
            const opacity = rangeOpacity(p, captionRanges[index]);
            node.style.opacity = String(opacity);
            node.style.transform = `translate3d(0, ${(1 - opacity) * 22}px, 0)`;
            node.style.pointerEvents = opacity > 0.55 ? "auto" : "none";
          });

          // IMAGE STORY
          // 0 real project → 1 traced drawing → 2 clay model →
          // 3 structural frame → 4 completed project again.
          const realityStart = 1 - map(p, 0.13, 0.25);
          const outline = rangeOpacity(p, [0.10, 0.19, 0.29, 0.39]);
          const clay = rangeOpacity(p, [0.29, 0.39, 0.49, 0.59]);
          const structure = rangeOpacity(p, [0.49, 0.59, 0.69, 0.80]);
          const realityEnd = map(p, 0.72, 0.84);
          const realityOpacity = Math.max(realityStart, realityEnd);

          const layerOpacity = [realityOpacity, outline, clay, structure];
          layers.current.forEach((node, index) => {
            if (!node) return;
            node.style.opacity = String(layerOpacity[index] ?? 0);
          });

          // Real image gets slightly calmer as the drawing is introduced.
          const realImage = layers.current[0];
          if (realImage) {
            const desaturate = map(p, 0.10, 0.23) * (1 - map(p, 0.72, 0.86));
            realImage.style.filter = `saturate(${1 - desaturate * 0.48}) contrast(${1 - desaturate * 0.06})`;
          }

          // The transparent drawing sits over the real building during the first transition.
          const drawingOverlay = layers.current[1];
          if (drawingOverlay) {
            const scale = 0.985 + map(p, 0.10, 0.30) * 0.015;
            drawingOverlay.style.transform = `scale(${scale})`;
          }

          if (stageRef.current) {
            const zoom = 1 + Math.sin(p * Math.PI) * 0.018;
            stageRef.current.style.transform = `translate3d(0,-50%,0) scale(${zoom})`;
          }

          const active = p < 0.18 ? 0 : p < 0.37 ? 1 : p < 0.56 ? 2 : p < 0.76 ? 3 : 4;
          stageItems.current.forEach((node, index) => {
            if (!node) return;
            node.dataset.active = index === active ? "true" : "false";
          });
        },
      });

      return () => trigger.kill();
    }, section);

    return () => context.revert();
  }, []);

  // MODEX MOBILE FIVE-STAGE AUTOPLAY
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 820px)").matches) return;

    const visibleLayer = mobileLayerMap[mobileStage];
    layers.current.forEach((node, index) => {
      if (!node) return;
      node.style.opacity = index === visibleLayer ? "1" : "0";
      node.style.pointerEvents = index === visibleLayer ? "auto" : "none";
    });

    if (stageRef.current) {
      stageRef.current.dataset.mobileStage = String(mobileStage);
    }
  }, [mobileStage]);

  const setCaption = (index: number) => (node: HTMLDivElement | null) => {
    captions.current[index] = node;
  };

  const setLayer = (index: number) => (node: HTMLDivElement | null) => {
    layers.current[index] = node;
  };

  const setStageItem = (index: number) => (node: HTMLLIElement | null) => {
    stageItems.current[index] = node;
  };

  return (
    <section ref={sectionRef} className={styles.story} aria-label="Modex project design and engineering story">
      <div className={styles.sticky}>
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.glow} aria-hidden="true" />

        <div className={styles.location}>
          KASARAGOD · KERALA
          <br />
          ARCHITECTURE / ENGINEERING / BUILD
        </div>

        <div ref={stageRef} className={styles.visualStage} aria-hidden="true">
          <div className={styles.imageFrame}>
            <div ref={setLayer(0)} className={`${styles.layer} ${styles.reality}`} style={{ opacity: 1 }}>
              <img src="/hero/modex-reality.webp" alt="" />
              <span className={styles.projectTag}>PROPOSED RESIDENCE · KASARAGOD</span>
            </div>

            <div ref={setLayer(1)} className={`${styles.layer} ${styles.outline}`} style={{ opacity: 0 }}>
              <div className={styles.lineBase} />
              <img src="/hero/modex-outline.png" alt="" />
              <div className={styles.drawingMeta}>
                <span>FRONT ELEVATION</span>
                <span>DESIGN DEVELOPMENT</span>
              </div>
            </div>

            <div ref={setLayer(2)} className={`${styles.layer} ${styles.model}`} style={{ opacity: 0 }}>
              <img src="/hero/modex-clay.webp" alt="" />
              <span className={styles.cornerLabel}>FORM / MASS / OPENINGS</span>
            </div>

            <div ref={setLayer(3)} className={`${styles.layer} ${styles.structure}`} style={{ opacity: 0 }}>
              <img src="/hero/modex-structure.webp" alt="" />
              <span className={styles.cornerLabel}>STRUCTURE / SLABS / COLUMNS</span>
            </div>
          </div>

          <div className={styles.mobileActiveStage} aria-hidden="true">
            <span>{mobileHeroStages[mobileStage][0]}</span>
            <strong>{mobileHeroStages[mobileStage][1]}</strong>
          </div>

          <div className={styles.dimensionX} />
          <div className={styles.dimensionY} />
          <span className={styles.dimensionLabel}>DESIGN → ENGINEERING → BUILD</span>
        </div>

        <div className={styles.mobileStages} aria-label="Project transformation stages">
          {mobileHeroStages.map(([number, label], index) => (
            <button
              key={number}
              type="button"
              data-active={mobileStage === index ? "true" : "false"}
              onClick={() => setMobileStage(index)}
              aria-label={`${number} ${label}`}
              aria-pressed={mobileStage === index}
            >
              <span>{number}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </div>

        <div ref={setCaption(0)} className={`${styles.caption} ${styles.mainCaption}`} style={{ opacity: 1 }}>
          <p className="kicker">ARCHITECTURE · ENGINEERING · CONSTRUCTION</p>
          <h1>
            We design spaces.
            <br />
            Engineer possibilities.
            <br />
            <em>Build them into reality.</em>
          </h1>
          <p className={styles.copy}>
            Complete architectural, civil engineering and construction solutions — from first idea to final handover.
          </p>
          <div className={styles.buttons}>
            <Link href="/projects" className="button button-dark">
              Explore Projects <ArrowDownRight size={17} />
            </Link>
            <Link href="/contact" className="button button-outline-dark">
              Discuss Your Project
            </Link>
          </div>
        </div>

        <div ref={setCaption(1)} className={`${styles.caption} ${styles.stageCaption}`}>
          <span className={styles.stageNumber}>02 / DRAWING</span>
          <h2>
            Every built space
            <br />
            begins with a <em>precise line.</em>
          </h2>
          <p>Proportion, openings and façade relationships are resolved before the project reaches site.</p>
        </div>

        <div ref={setCaption(2)} className={`${styles.caption} ${styles.stageCaption}`}>
          <span className={styles.stageNumber}>03 / DESIGN</span>
          <h2>
            Ideas take <em>form</em>
            <br />
            before they are built.
          </h2>
          <p>Volumes, light, circulation and material intent are tested as one coordinated architectural composition.</p>
        </div>

        <div ref={setCaption(3)} className={`${styles.caption} ${styles.stageCaption}`}>
          <span className={styles.stageNumber}>04 / ENGINEERING</span>
          <h2>
            Architecture backed
            <br />
            by <em>engineering.</em>
          </h2>
          <p>The finished form is supported by carefully coordinated slabs, columns, structural walls and construction logic.</p>
        </div>

        <div ref={setCaption(4)} className={`${styles.caption} ${styles.stageCaption}`}>
          <span className={styles.stageNumber}>05 / REALITY</span>
          <h2>
            From the first line
            <br />
            to the <em>final handover.</em>
          </h2>
          <p>One team carries the project from architectural intent through engineering and execution.</p>
          <Link href="/contact" className="text-link">
            Start your project <ArrowDownRight size={18} />
          </Link>
        </div>

        <aside className={styles.timeline} aria-label="Hero story stages">
          <div className={styles.progressTrack}>
            <div ref={progressBar} className={styles.progressFill} />
          </div>
          <ol>
            {[
              ["01", "REALITY"],
              ["02", "DRAWING"],
              ["03", "DESIGN"],
              ["04", "ENGINEERING"],
              ["05", "DELIVER"],
            ].map(([number, label], index) => (
              <li key={number} ref={setStageItem(index)} data-active={index === 0 ? "true" : "false"}>
                <span>{number}</span>
                <strong>{label}</strong>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
