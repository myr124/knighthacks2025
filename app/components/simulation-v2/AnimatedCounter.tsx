"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 0.5,
  className = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString()
  );
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration,
      onUpdate: (latest) => {
        count.set(latest);
      },
      onComplete: () => {
        prevValue.current = value;
      },
    });

    return controls.stop;
  }, [value, duration, count]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
