"use client";

import { RefObject, useEffect } from "react";

export default function useMobileAutoRail<T extends HTMLElement>(
  ref: RefObject<T | null>,
  itemCount: number,
  delay = 3600,
) {
  useEffect(() => {
    const rail = ref.current;
    if (!rail || itemCount < 2) return;

    const mobile = window.matchMedia("(max-width: 780px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let timer: number | undefined;
    let index = 0;
    let holdUntil = 0;
    let scrollTimer: number | undefined;

    const getItems = () =>
      Array.from(rail.querySelectorAll<HTMLElement>("[data-rail-item]"));

    const nearestIndex = () => {
      const items = getItems();
      if (!items.length) return 0;
      const target = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      items.forEach((item, itemIndex) => {
        const center = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(center - target);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = itemIndex;
        }
      });
      return best;
    };

    const pause = () => {
      holdUntil = Date.now() + 7000;
    };

    const onScroll = () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        index = nearestIndex();
      }, 120);
    };

    const start = () => {
      if (!mobile.matches || reduceMotion.matches) return;
      timer = window.setInterval(() => {
        if (Date.now() < holdUntil) return;
        const items = getItems();
        if (items.length < 2) return;
        index = (index + 1) % items.length;
        rail.scrollTo({ left: items[index].offsetLeft, behavior: "smooth" });
      }, delay);
    };

    rail.addEventListener("pointerdown", pause, { passive: true });
    rail.addEventListener("touchstart", pause, { passive: true });
    rail.addEventListener("wheel", pause, { passive: true });
    rail.addEventListener("scroll", onScroll, { passive: true });
    start();

    const restart = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
      start();
    };

    mobile.addEventListener("change", restart);
    reduceMotion.addEventListener("change", restart);

    return () => {
      if (timer) window.clearInterval(timer);
      if (scrollTimer) window.clearTimeout(scrollTimer);
      rail.removeEventListener("pointerdown", pause);
      rail.removeEventListener("touchstart", pause);
      rail.removeEventListener("wheel", pause);
      rail.removeEventListener("scroll", onScroll);
      mobile.removeEventListener("change", restart);
      reduceMotion.removeEventListener("change", restart);
    };
  }, [delay, itemCount, ref]);
}
