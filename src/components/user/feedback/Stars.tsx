"use client";

import { motion } from "framer-motion";

export default function Stars({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: { button: "h-6 w-6", icon: "h-4 w-4" },
    md: { button: "h-8 w-8", icon: "h-5 w-5" },
    lg: { button: "h-12 w-12", icon: "h-8 w-8" },
  };

  const { button, icon } = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button
          key={i}
          type="button"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i === value ? 0 : i)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`${button} grid place-items-center rounded-lg transition-colors ${
            i <= value
              ? "text-amber-400 hover:text-amber-500"
              : "text-gray-300 hover:text-gray-400 hover:bg-gray-100"
          }`}
        >
          <motion.svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={icon}
            initial={false}
            animate={i <= value ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.401 8.163L12 18.897l-7.335 3.863 1.401-8.163L.132 9.211l8.2-1.193z" />
          </motion.svg>
        </motion.button>
      ))}
    </div>
  );
}
