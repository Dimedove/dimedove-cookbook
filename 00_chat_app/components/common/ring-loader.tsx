"use client";

import { Ring } from "ldrs/react";

interface RingLoaderProps {
  size?: number;
}

export function RingLoader({ size = 16 }: RingLoaderProps) {
  return (
    <Ring
      size={size}
      speed={1.1}
      bgOpacity={0}
      stroke={1.75}
      color="#9ca3af"
    />
  );
}
