import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import { CheckCircle2, Mail } from "lucide-react";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";
import ContactSectionWithShader from "@/block/contact-section-with-shader";
import { Timeline } from "@/components/ui/timeline";
import "./styles.css";

const timelineItems = [
  {
    title: "Now",
    content: (
      <TimelineEntryContent
        eyebrow="2026-present · Founder · Brunner Creative, LLC"
        title="Made the practice official."
        items={[
          "Launched Brunner Creative, LLC for technical content, developer marketing, and AI-era editorial systems.",
          "Kept the work centered on the same problem I have chased for years: making complex products easier to understand, trust, and use.",
          "Built the business around practical strategy, sharp execution, and a deep suspicion of beige content machinery.",
        ]}
      />
    ),
  },
  {
    title: "2022-now",
    content: (
      <TimelineEntryContent
        eyebrow="Jan 2022-present · Consultant and advisor · lindsaybrunner.com"
        title="Built the freelance and advisory layer."
        items={[
          "Helped teams turn complicated ideas into content people actually read and use.",
          "Worked with companies on strategy, messaging, technical storytelling, and content systems.",
          "Operated across developer tools, AI, DevRel, startup GTM, and editorial operations.",
        ]}
      />
    ),
  },
  {
    title: "2025",
    content: (
      <TimelineEntryContent
        eyebrow="Apr 2025-Jan 2026 · Head of Content · Builder.io"
        title="Went deep on AI, content strategy, and the new shape of technical storytelling."
        items={[
          "Led content for an AI-native developer product company while translating complex AI and developer concepts for multiple buyer segments.",
          "Built early content workflows, owned non-developer content, and helped guide developer content strategy.",
          "Launched influencer marketing, persona-specific email campaigns, and SEO/AEO work for AI-driven discovery.",
        ]}
      />
    ),
  },
  {
    title: "2025",
    content: (
      <TimelineEntryContent
        eyebrow="Mar-Aug 2025 · Advisor · Braze"
        title="Advised on technical content and developer-facing messaging."
        items={[
          "Helped sharpen content for a sophisticated technical audience.",
          "Brought developer marketing judgment to strategy, messaging, and editorial work.",
          "Kept the work useful, credible, and allergic to empty marketing fog.",
        ]}
      />
    ),
  },
  {
    title: "2023-2025",
    content: (
      <TimelineEntryContent
        eyebrow="Aug 2023-Jan 2025 · Head of Content and Developer Relations · ngrok"
        title="Owned the messy middle where content, DevRel, product, and go-to-market meet."
        items={[
          "Architected and scaled content, developer relations, brand, events, and customer marketing for a developer infrastructure company.",
          "Revamped global email strategy, including a developer newsletter to 7M+ users with 5x open-rate lift and 5.5x click-through lift.",
          "Built webinar and research programs that generated 1,000+ monthly leads, $57M in influenced pipeline, and 2,500+ developer survey responses.",
        ]}
      />
    ),
  },
  {
    title: "2022-2023",
    content: (
      <TimelineEntryContent
        eyebrow="Jan 2022-Jul 2023 · Head of Marketing · Architect.io"
        title="Ran marketing for an early-stage developer tooling company."
        items={[
          "Doubled inbound traffic twice within 12 months.",
          "Defined buyer personas, built initial sales enablement, and led a brand and website evolution.",
          "Designed the first live event strategy, generating 900+ leads from KCDC 2023.",
        ]}
      />
    ),
  },
  {
    title: "2020-2022",
    content: (
      <TimelineEntryContent
        eyebrow="Mar 2020-Jan 2022 · Director, Content + Advocacy · Split"
        title="Led content and advocacy work for feature delivery and experimentation."
        items={[
          "Led content and advocacy through an executive transition while keeping the marketing engine stable.",
          "Launched Split's first virtual user conference, with 700+ registrations, 300+ live attendees, and $2.8M in pipeline.",
          "Expanded thought leadership, grew CFP acceptances 5x, and delivered 12+ marquee customer stories.",
        ]}
      />
    ),
  },
  {
    title: "2020-2021",
    content: (
      <TimelineEntryContent
        eyebrow="Nov 2020-May 2021 · Advisor · Architect.io"
        title="Advised an early developer tooling team before later joining full-time."
        items={[
          "Helped shape technical story, audience fit, and developer-facing content direction.",
          "Brought content and DevRel pattern recognition into a young product motion.",
          "Started the working relationship that later became the Head of Marketing role.",
        ]}
      />
    ),
  },
  {
    title: "Before 2020",
    content: (
      <TimelineEntryContent
        eyebrow="Stormpath and Okta"
        title="Built the foundation in developer content, technical editing, and audience trust."
        items={[
          "Led developer content strategy across identity, auth, and SaaS infrastructure.",
          "Managed 17 writers and partnered with Developer Relations to publish 150+ technical articles per year.",
          "Helped launch developer.okta.com and scale it to 2M+ annual visitors.",
        ]}
      />
    ),
  },
];

function AboutPage() {
  return (
    <div className="bg-site-black text-white">
      <AboutIntro />
      <ReceiptsSection />
      <Timeline
        data={timelineItems}
        heading="Here's the timeline version"
      />
      <ContactSectionWithShader
        colors={["#050505", "#ff0037", "#ff1b8d", "#ffdd00", "#ff8800"]}
        secondaryCta={{
          href: "/thoughts/",
          label: "Read my blog",
        }}
      />
    </div>
  );
}

function ReceiptsSection() {
  const receipts = [
    "Built developer content programs reaching 2M+ annual visitors.",
    "Ran a developer newsletter to 7M+ users, improving open rates 5x and click-through rates 5.5x.",
    "Built webinar and event programs that generated 1,000+ monthly leads and $57M in influenced pipeline.",
    "Launched community and customer programs with 2,500+ survey responses, 700+ conference registrations, and 12+ marquee customer stories.",
    "Led content, DevRel, brand, events, customer marketing, SEO, and AI-era editorial systems across developer tooling companies.",
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 md:px-8 md:pb-10 lg:px-10">
      <div className="border-y border-white/10 py-8 md:py-10">
        <h2 className="max-w-4xl text-3xl leading-tight font-bold tracking-tight text-white md:text-5xl">
          The receipts
        </h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2 md:gap-x-8">
          {receipts.map((receipt) => (
            <div
              key={receipt}
              className="flex gap-3 text-sm leading-7 text-white/68 md:text-base"
            >
              <CheckCircle2 className="mt-1.5 h-4 w-4 shrink-0 text-brand-pink" />
              <span>{receipt}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutIntro() {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 md:px-8 md:py-20 lg:grid-cols-[1fr_280px] lg:items-start lg:gap-16">
      <div>
        <h1 className="max-w-4xl font-[Inter,system-ui,sans-serif] text-[clamp(1.9rem,8.6vw,3.9rem)] leading-[1.08] font-extrabold tracking-tight text-white md:leading-[1.12]">
          Hey, I&apos;m{" "}
          <span className="about-name-gradient">
            Lindsay Brunner
          </span>
          ,{" "}
          a writer, editor, and DevRel-shaped content person in the San Francisco Bay Area.
        </h1>

        <div className="mt-7 max-w-3xl space-y-5 text-base leading-7 text-white/62 md:mt-10 md:space-y-6 md:text-xl md:leading-9">
          <p>
            I&apos;m a content-and-DevRel hybrid who has built a career
            translating scary-sounding tech into copy that normal humans, and
            skeptical CXOs, can trust. These days, I freelance with teams that
            need clearer strategy, sharper technical content, better launch
            messaging, or a sane way to use AI without turning the whole
            content operation into beige soup.
          </p>
          <p>
            I live in the San Francisco Bay Area with my husband Alex, our son
            Lucas, and four cats (Piper, Sophie, Sunny, and Tucker) who
            routinely audition for the role of remote-work sabotage
            specialists. I also maintain an industrial-sized stash of dot grid
            notebooks “just in case,” and (deeply) rely on my custom agentic AI
            assistant, GUPPI, to remind me that lunch is not optional and yes, I
            should take my meds.
          </p>
          <p>
            If you need someone who can ship fast, make deep tech sound
            refreshingly human, and slip a dry joke into an enterprise brief
            without anyone noticing, you&apos;ve found your person.
          </p>
        </div>
      </div>

      <aside className="mx-auto max-w-[220px] md:max-w-[280px] lg:sticky lg:top-28">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-brand-pink via-brand-red to-brand-yellow p-[2px] shadow-2xl">
          <div className="rounded-[1.65rem] bg-[#111] p-3">
            <div className="overflow-hidden rounded-[1.35rem] bg-brand-pink/16">
              <img
                src="/images/avatar-color-trans.png"
                alt="Lindsay Brunner"
                className="aspect-square w-full object-contain"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <SocialLink
            href="https://www.linkedin.com/in/lindsaybrunner/"
            label="LinkedIn"
            icon={<IconBrandLinkedin className="h-5 w-5" />}
          />
          <SocialLink
            href="https://github.com/LindsayB610"
            label="GitHub"
            icon={<IconBrandGithub className="h-5 w-5" />}
          />
          <SocialLink
            href="mailto:hello@lindsaybrunner.com"
            label="Email Lindsay"
            icon={<Mail className="h-5 w-5" />}
          />
        </div>
      </aside>
    </section>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition hover:-translate-y-0.5 hover:border-brand-pink/70 hover:text-white"
    >
      {icon}
    </a>
  );
}

function TimelineEntryContent({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="max-w-3xl pb-2">
      <p className="font-mono text-[0.7rem] font-bold tracking-[0.22em] text-brand-yellow uppercase">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl leading-snug font-bold text-white md:text-2xl">
        {title}
      </h3>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex gap-3 text-sm leading-7 text-white/68 md:text-base"
          >
            <CheckCircle2 className="mt-1.5 h-4 w-4 shrink-0 text-brand-pink" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const root = document.getElementById("about-root");

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <MotionConfig reducedMotion="user">
        <AboutPage />
      </MotionConfig>
    </React.StrictMode>,
  );
}
