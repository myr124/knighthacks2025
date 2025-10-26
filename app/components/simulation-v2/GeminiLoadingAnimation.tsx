"use client";

import { motion } from "framer-motion";

export function GeminiLoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      {/* Spinning Gemini Logo */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gemini star shape with gradient colors */}
          <motion.path
            d="M24 4L26.472 17.528L36.728 11.272L30.472 21.528L44 24L30.472 26.472L36.728 36.728L26.472 30.472L24 44L21.528 30.472L11.272 36.728L17.528 26.472L4 24L17.528 21.528L11.272 11.272L21.528 17.528L24 4Z"
            fill="url(#gradient1)"
            animate={{
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <defs>
            <linearGradient id="gradient1" x1="4" y1="4" x2="44" y2="44">
              <stop offset="0%" stopColor="#4285f4" />
              <stop offset="33%" stopColor="#9b72cb" />
              <stop offset="66%" stopColor="#d96570" />
              <stop offset="100%" stopColor="#f2a746" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Loading text */}
      <motion.p
        className="text-sm text-muted-foreground"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Generating AI summary...
      </motion.p>
    </div>
  );
}
