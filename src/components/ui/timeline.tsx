"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "motion/react";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({
  data,
  heading = "Timeline",
  description,
}: {
  data: TimelineEntry[];
  heading?: string;
  description?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full bg-site-black font-sans md:px-10"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-2 md:px-8 md:pt-18 md:pb-6 lg:px-10">
        <h2 className="text-3xl md:text-5xl mb-5 text-white max-w-4xl font-bold tracking-tight">
          {heading}
        </h2>
        {description ? (
          <p className="text-white/62 text-base md:text-lg leading-8 max-w-3xl">
            {description}
          </p>
        ) : null}
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-16 md:pl-10 lg:pl-14">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-7 md:pt-14 md:gap-10"
          >
            <div className="sticky z-40 flex h-10 max-w-xs items-center self-start md:top-40 md:w-full lg:max-w-sm">
              <div className="absolute left-1 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-black md:left-3">
                <div className="h-4 w-4 rounded-full bg-brand-pink/40 border border-brand-pink p-2" />
              </div>
              <h3 className="hidden h-10 translate-y-[0.42em] items-center pl-20 text-xl leading-none font-bold text-white/35 md:flex md:text-3xl">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pl-14 pr-4 md:pl-4">
              <h3 className="md:hidden block text-xl mb-4 text-left font-bold text-white/45">
                {item.title}
              </h3>
              {item.content}{" "}
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute left-6 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-white/20 to-transparent to-[99%] md:left-8 [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] "
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-gradient-to-t from-brand-red via-brand-pink to-brand-yellow from-[0%] via-[45%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
