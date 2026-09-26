"use client";

import { useId } from "react";

export function Logo({ size = 28 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  const gapId = `zunia-mark-gap-${uid}`;
  return (
    <svg
      viewBox="0 0 96 120"
      width={size}
      height={(size * 120) / 96}
      className="block shrink-0 text-fg"
      aria-hidden
    >
      <defs>
        <mask id={gapId} maskUnits="userSpaceOnUse" x="0" y="0" width="96" height="120">
          <rect width="96" height="120" fill="#fff" />
          <path
            d="M26 20 L70 46 L26 72"
            fill="none"
            stroke="#000"
            strokeWidth="30"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <g mask={`url(#${gapId})`}>
        <path
          d="M26 48 L70 74 L26 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M26 20 L70 46 L26 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
