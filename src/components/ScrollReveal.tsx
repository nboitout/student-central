"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    const observed = new Set<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
            observed.delete(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    /* Observe any .reveal element not yet tracked */
    function scanAndObserve() {
      document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          observer.observe(el);
        }
      });
    }

    /* Initial scan */
    scanAndObserve();

    /* Watch for new elements added by client-side rendering */
    const mutation = new MutationObserver(() => scanAndObserve());
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);

  return null;
}
