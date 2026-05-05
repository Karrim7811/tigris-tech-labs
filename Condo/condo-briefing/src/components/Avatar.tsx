"use client";

import Image from "next/image";

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  accent?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Avatar({
  name,
  src,
  size = 96,
  accent = "#101E7F",
}: AvatarProps) {
  if (src) {
    return (
      <div
        className="relative rounded-full overflow-hidden ring-2 ring-aon-pale shadow-sm"
        style={{ width: size, height: size }}
      >
        <Image src={src} alt={name} fill className="object-cover" sizes={`${size}px`} />
      </div>
    );
  }

  return (
    <div
      className="grid place-items-center rounded-full font-semibold text-white shadow-sm"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${accent} 0%, #060B26 100%)`,
        fontSize: size * 0.32,
        letterSpacing: "0.05em",
      }}
    >
      {initials(name)}
    </div>
  );
}
