import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import HeroSectionWithBeamsAndGrid from "@/block/hero-section-with-beams-and-grid";
import ContactSectionWithShader from "@/block/contact-section-with-shader";
import SingleRowLogoCloud from "@/block/single-row-logo-cloud";
import FeaturesSectionWithHoverEffects from "@/components/features-section-demo-2";
import "./styles.css";

type Essay = {
  title: string;
  description: string;
  date: string;
  href: string;
};

const fallbackEssays: Essay[] = [
  {
    title: "The Problem Is Usually Not the Prompt",
    description: "Or: the tedious human work hiding behind every good AI workflow",
    date: "Apr 21, 2026",
    href: "/thoughts/2026-04-21/the-problem-is-usually-not-the-prompt/",
  },
  {
    title: "Notes From a Marketer Building a Real CLI With Codex",
    description: "Or: How a marketer shipped a developer tool by being very, very annoying about user experience",
    date: "Apr 11, 2026",
    href: "/thoughts/2026-04-11/building-a-cli-with-ai/",
  },
  {
    title: "The Content Resonance Framework: Beyond Engagement Metrics",
    description: "Or: Why top-performing content can still do almost nothing for pipeline, adoption, or trust",
    date: "Mar 5, 2026",
    href: "/thoughts/2026-03-05/content-resonance-framework-beyond-engagement-metrics/",
  },
];

function getHomepageEssays(): Essay[] {
  const dataEl = document.getElementById("homepage-thoughts-data");

  if (!dataEl?.textContent) {
    return fallbackEssays;
  }

  try {
    const parsed = JSON.parse(dataEl.textContent);
    const data = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    if (!Array.isArray(data)) return fallbackEssays;

    const essays = data.filter((item): item is Essay => (
      typeof item?.title === "string" &&
      typeof item?.description === "string" &&
      typeof item?.date === "string" &&
      typeof item?.href === "string"
    ));

    return essays.length > 0 ? essays : fallbackEssays;
  } catch {
    return fallbackEssays;
  }
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-mono text-xs font-bold uppercase text-brand-yellow sm:text-sm">
      {children}
    </p>
  );
}

function Homepage() {
  const essays = getHomepageEssays();

  return (
    <div className="overflow-hidden bg-site-black">
      <HeroSectionWithBeamsAndGrid />

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <Eyebrow>What I do</Eyebrow>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-5xl">Write, edit, and improve the systems and tooling your teams are already using to reach technical audiences.</h2>
            <p className="text-lg text-site-muted">
              From AI-assisted drafting to developer content, POV, mentorship, and content systems.
            </p>
          </div>
          <FeaturesSectionWithHoverEffects />
        </div>
      </section>

      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-7xl">
          <SingleRowLogoCloud />
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <Eyebrow>How I think</Eyebrow>
              <h2 className="mb-0 text-3xl font-bold text-white sm:text-5xl">Samples beat adjectives</h2>
            </div>
            <a href="/thoughts/" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-yellow no-underline">
              Read more thoughts
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {essays.map((essay) => (
              <a
                key={essay.href}
                href={essay.href}
                className="group rounded-2xl border border-white/10 bg-site-surface p-6 no-underline transition hover:-translate-y-1 hover:border-brand-pink/60 hover:bg-site-surface-raised"
              >
                <Sparkles className="mb-5 h-5 w-5 text-brand-pink" />
                <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">
                  {essay.date}
                </p>
                <h3 className="mb-3 text-xl font-bold text-white">
                  <span className="bg-linear-to-r from-brand-pink via-brand-red to-brand-yellow bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_2px]">
                    {essay.title}
                  </span>
                </h3>
                <p className="mb-0 text-sm leading-6 text-site-muted">{essay.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <ContactSectionWithShader
        colors={["#050505", "#ff0037", "#ff1b8d", "#ffdd00", "#ff8800"]}
        secondaryCta={{
          href: "/about/",
          label: "More about me",
        }}
      />

      <section className="workshop-home-section px-6 py-16 md:py-20" aria-labelledby="workshop-home-title">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/20 bg-[#1d0e1d]">
          <div className="grid gap-8 p-7 sm:p-10 md:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)] md:items-end md:gap-12 md:p-12">
            <div>
              <Eyebrow>I built this</Eyebrow>
              <h2 id="workshop-home-title" className="max-w-2xl text-3xl font-bold text-white sm:text-5xl">
                A tiny desktop home for the tools I actually use.
              </h2>
            </div>
            <div>
              <p className="max-w-xl text-base leading-7 text-site-muted sm:text-lg">
                Workshop is a local-first Mac app with a deliberately empty shelf. Add Slate for the Markdown you keep reopening, or Pulse for recurring things that cannot quietly disappear.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <a
                  href="/workshop/"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-yellow px-5 py-3 font-bold text-black no-underline transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand-pink"
                >
                  Explore Workshop
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href="/workshop/#tools" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-yellow no-underline hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand-pink">
                  Meet Slate + Pulse
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
          <a href="/workshop/" className="group block p-3 no-underline sm:p-5" aria-label="Explore Workshop">
            <img
              src="/images/workshop/workshop-shelf.png"
              alt="Workshop desktop app with Slate and Pulse ready to install"
              className="w-full rounded-lg border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition duration-500 group-hover:scale-[1.01]"
              loading="lazy"
            />
          </a>
        </div>
      </section>
    </div>
  );
}

const root = document.getElementById("homepage-root");

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <MotionConfig reducedMotion="user">
        <Homepage />
      </MotionConfig>
    </React.StrictMode>,
  );
}
