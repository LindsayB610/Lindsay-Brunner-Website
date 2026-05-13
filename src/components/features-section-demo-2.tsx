import type React from "react";
import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconArticle,
  IconBinaryTree2,
  IconBrain,
  IconChartArrowsVertical,
  IconUsersGroup,
  IconSparkles,
  IconTerminal2,
} from "@tabler/icons-react";

export default function FeaturesSectionDemo() {
  const features = [
    {
      title: "AI-era content workflows",
      description:
        "Prompts, review loops, and drafting systems that help marketers use AI without outsourcing their judgment.",
      icon: <IconBrain />,
    },
    {
      title: "Technical content",
      description:
        "Technical blogs, product explainers, tutorials, and long-form assets based on the work you're already doing.",
      icon: <IconArticle />,
    },
    {
      title: "Ghostwriting and POV",
      description:
        "Founder, executive, and practitioner writing with a real argument, not warmed-over LinkedIn mush.",
      icon: <IconAdjustmentsBolt />,
    },
    {
      title: "Content rescue missions",
      description:
        "Messy strategy, scattered docs, unclear narrative, or drafts that only Claude could love.",
      icon: <IconSparkles />,
    },
    {
      title: "Developer marketing strategy",
      description:
        "Positioning, audience maps, content plans, and launch narratives for products that need developer trust.",
      icon: <IconChartArrowsVertical />,
    },
    {
      title: "Developer audience research",
      description:
        "Sharper reads on what technical buyers, builders, and skeptical practitioners actually need to hear.",
      icon: <IconTerminal2 />,
    },
    {
      title: "Editorial systems",
      description:
        "Workflow cleanup, content audits, message architecture, and repeatable systems for teams shipping a lot.",
      icon: <IconBinaryTree2 />,
    },
    {
      title: "Mentorship and enablement",
      description:
        "Guidance for content marketers learning dev audiences, plus practical AI workflow coaching for traditional teams.",
      icon: <IconUsersGroup />,
    },
  ];
  return (
    <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 py-3 md:grid-cols-2 md:py-6 lg:grid-cols-4">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "group/feature relative flex min-h-0 flex-col border-white/10 py-6 md:min-h-60 md:py-10 lg:border-r",
        (index === 0 || index === 4) && "lg:border-l",
        index < 4 && "lg:border-b"
      )}
    >
      <div className="relative z-10 mb-3 px-6 text-brand-yellow/80 transition duration-200 group-hover/feature:text-brand-yellow md:mb-4 md:px-10">
        {icon}
      </div>
      <div className="relative z-10 mb-2 px-6 text-lg font-bold md:px-10">
        <div className="absolute inset-y-0 left-0 h-6 w-1 origin-center rounded-tr-full rounded-br-full bg-white/20 transition-all duration-200 group-hover/feature:h-8 group-hover/feature:bg-brand-pink" />
        <span className="inline-block text-white transition duration-200 group-hover/feature:translate-x-2">
          {title}
        </span>
      </div>
      <p className="relative z-10 max-w-sm px-6 text-sm leading-6 text-site-muted md:max-w-xs md:px-10">
        {description}
      </p>
    </div>
  );
};
