"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const LOGOS_PER_ROW = 5;

const LOGOS = [
  {
    id: "okta",
    title: "Okta",
    src: "/images/logos/okta.svg",
    className: "h-6 max-w-[118px] invert",
  },
  {
    id: "braze",
    title: "Braze",
    src: "/images/logos/braze.svg",
    className: "h-6 max-w-[110px] translate-y-0.5 invert",
  },
  {
    id: "builder",
    title: "Builder.io",
    src: "/images/logos/builder.svg",
    className: "h-7 max-w-[142px] invert",
  },
  {
    id: "ngrok",
    title: "ngrok",
    src: "/images/logos/ngrok.svg",
    className: "h-6 max-w-[112px] invert",
  },
  {
    id: "split",
    title: "Split",
    src: "/images/logos/split.svg",
    className: "h-7 max-w-[142px] grayscale brightness-125 contrast-125",
  },
  {
    id: "parasail",
    title: "Parasail",
    src: "/images/logos/parasail.png",
    className: "h-5 max-w-[126px]",
  },
];

export default function SingleRowLogoCloud() {
  const [setIndex, setSetIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = setInterval(() => {
      setSetIndex((i) => (i + 1) % LOGOS.length);
    }, 5200);
    return () => clearInterval(id);
  }, []);

  const visibleLogos = Array.from(
    { length: LOGOS_PER_ROW },
    (_, index) => LOGOS[(setIndex + index) % LOGOS.length],
  );

  return (
    <section
      aria-label="Companies Lindsay has worked with"
      className="mx-auto flex min-h-28 w-full max-w-6xl items-center justify-center px-4 py-8 sm:min-h-32 sm:py-10 md:px-8"
    >
      <div className="flex w-full flex-col items-center gap-6 sm:gap-8 md:flex-row md:items-stretch md:gap-4 lg:gap-6">
        <h2 className="flex min-h-10 shrink-0 translate-y-[9px] items-center text-center text-sm font-medium leading-none tracking-tight text-zinc-400 sm:min-h-12 sm:text-base md:mr-6 md:text-left lg:mr-8">
          Trusted by the best
        </h2>
        <div className="grid min-h-10 w-full grid-cols-5 items-center justify-items-center gap-x-3 sm:gap-x-5 md:flex md:min-h-12 md:flex-1 md:justify-between md:gap-8">
          <AnimatePresence mode="popLayout">
            {visibleLogos.map((logo, index) => (
              <motion.div
                key={logo.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.68, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.42,
                  ease: "easeInOut",
                  delay: index * 0.06,
                }}
                className="flex w-full items-center justify-center"
              >
                <img
                  src={logo.src}
                  alt={logo.title}
                  className={`w-full object-contain transition-opacity duration-200 hover:opacity-100 ${logo.className}`}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
