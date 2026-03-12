/* eslint-disable @next/next/no-img-element */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface PluginIconProps {
  slug: string;
  name: string;
  className?: string;
}

export function PluginIcon({ slug, name, className = "w-5 h-5" }: PluginIconProps) {
  return (
    <img
      src={`${basePath}/icons/plugins/${slug}.svg`}
      alt={name}
      width={40}
      height={40}
      className={`${className} rounded-lg`}
    />
  );
}
