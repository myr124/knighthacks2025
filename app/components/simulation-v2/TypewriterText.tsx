"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypewriterTextProps {
  text: string;
  speed?: number; // characters per second
  onComplete?: () => void;
  className?: string;
  children?: (displayText: string) => React.ReactNode;
}

export function TypewriterText({
  text,
  speed = 100, // 100 characters per second for fast typing
  onComplete,
  className = "",
  children
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset when text changes
    setCurrentIndex(0);
    setDisplayText("");
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 1000 / speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  if (children) {
    return <>{children(displayText)}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
        />
      )}
    </motion.div>
  );
}
