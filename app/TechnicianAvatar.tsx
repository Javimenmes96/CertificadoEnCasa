"use client";

import { useState } from "react";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";
}

export default function TechnicianAvatar({
  src,
  name,
  size = 50,
  className = "",
}: {
  src: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`avatar ${className}`.trim()}
      style={{ width: size, height: size, minWidth: size, overflow: "hidden" }}
      aria-label={`Foto de perfil de ${name}`}
    >
      {failed ? (
        initials(name)
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </div>
  );
}
