import { motion } from 'motion/react';
import type { ReactNode } from 'react';

export default function Screen({ children }: { children: ReactNode }) {
  return (
    <motion.main
      className="screen"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
    >
      {children}
    </motion.main>
  );
}
