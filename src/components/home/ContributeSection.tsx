"use client";

import { BookOpen, MessageCircle, GitPullRequest, Hash, User } from "lucide-react";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";
import { Marquee } from "@/components/ui/Marquee";
import { AnimatedList } from "@/components/ui/AnimatedList";
import { IconCloud } from "@/components/ui/IconCloud";

/* ── Documentation: marquee of code snippets ── */
const codeSnippets = [
  { name: "@task", body: "from flytekit import task, workflow" },
  { name: "@workflow", body: "def my_pipeline(data: str) -> int:" },
  { name: "ImageSpec", body: "image = ImageSpec(packages=[\"pandas\"])" },
  { name: "map_task", body: "map_task(process)(data=inputs)" },
  { name: "Resources", body: "requests=Resources(cpu=\"2\", mem=\"4Gi\")" },
  { name: "Secret", body: "secret=Secret(group=\"aws\", key=\"s3\")" },
];

function DocsBackground() {
  return (
    <Marquee
      pauseOnHover
      className="absolute top-8 [--duration:25s] [mask-image:linear-gradient(to_top,transparent_30%,#000_100%)]"
    >
      {codeSnippets.map((s, i) => (
        <figure
          key={i}
          className="relative w-40 cursor-pointer overflow-hidden rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-3 transform-gpu blur-[0.5px] transition-all duration-300 ease-out hover:blur-none"
        >
          <p className="text-xs font-semibold text-[var(--heading)]">{s.name}</p>
          <p className="mt-1 text-[10px] text-[var(--muted)] leading-relaxed" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
            {s.body}
          </p>
        </figure>
      ))}
    </Marquee>
  );
}

/* ── Community: animated Slack-like messages ── */
const slackMessages = [
  { user: "contributor", channel: "#plugins", text: "Just published a new DuckDB plugin!" },
  { user: "community", channel: "#announcements", text: "Flyte 2.0 RC is out, try it!" },
  { user: "newcomer", channel: "#help", text: "How do I configure Spark resources?" },
  { user: "contributor", channel: "#plugins", text: "W&B integration is amazing" },
  { user: "flytebot", channel: "#releases", text: "flytekit v1.15.0 released" },
  { user: "community", channel: "#general", text: "Onboarded 50 workflows this week" },
];

function SlackMessage({ user, channel, text }: { user: string; channel: string; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border-2 border-[var(--border)] bg-[var(--card-bg)] p-2.5 text-left">
      <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[var(--accent-light)] flex items-center justify-center">
        <User className="w-3 h-3 text-[#6f2aef]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[var(--heading)]">{user}</span>
          <span className="text-[9px] text-[var(--muted)] flex items-center gap-0.5">
            <Hash className="w-2 h-2" />{channel.replace("#", "")}
          </span>
        </div>
        <p className="text-[10px] text-[var(--muted)] leading-snug truncate">{text}</p>
      </div>
    </div>
  );
}

function CommunityBackground() {
  const items = slackMessages.map((msg, i) => (
    <SlackMessage key={i} {...msg} />
  ));

  return (
    <div className="absolute top-8 right-3 left-3 h-[200px] overflow-hidden [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] transition-all duration-300 ease-out group-hover:scale-[1.02]">
      <AnimatedList items={items} delay={2500} />
    </div>
  );
}

/* ── Contribute: icon cloud of plugin logos ── */
function ContributeBackground() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const slugs = [
    "spark", "bigquery", "ray", "wandb", "kf-pytorch", "airflow",
    "snowflake", "mlflow", "dbt", "huggingface", "dask", "polars",
    "pandera", "duckdb", "aws-sagemaker", "kf-tensorflow",
  ];
  const images = slugs.map((s) => `${basePath}/icons/plugins/${s}.svg`);

  return (
    <div className="absolute -top-4 right-0 left-0 flex justify-center [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)] transition-all duration-300 ease-out group-hover:scale-105">
      <IconCloud images={images} size={340} autoRotate />
    </div>
  );
}

export function ContributeSection() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 py-20">
      <h2 className="text-2xl font-semibold text-[var(--heading)] mb-2">Get Involved</h2>
      <p className="text-[var(--muted)] mb-8">Learn, connect, and contribute to the Flyte ecosystem.</p>

      <BentoGrid className="auto-rows-[20rem] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <BentoCard
          name="Documentation"
          description="Learn how to build, test, and publish your own Flyte plugins."
          href="https://www.union.ai/docs/v1/flyte/community/contributing-code/"
          Icon={BookOpen}
          background={<DocsBackground />}
          cta="Read the docs"
          className="sm:col-span-2 lg:col-span-1"
        />
        <BentoCard
          name="Community"
          description="Join thousands of developers on Slack to discuss Flyte and share plugins."
          href="https://slack.flyte.org"
          Icon={MessageCircle}
          background={<CommunityBackground />}
          cta="Join Slack"
        />
        <BentoCard
          name="Contribute"
          description="Submit your plugin to the registry. Open and extensible."
          href="https://www.union.ai/docs/v1/flyte/community/contributing-code/"
          Icon={GitPullRequest}
          background={<ContributeBackground />}
          cta="Learn how to contribute"
        />
      </BentoGrid>
    </section>
  );
}
