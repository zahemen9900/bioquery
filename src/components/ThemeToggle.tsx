import { useTheme } from '@/hooks/use-theme';
import { motion } from 'motion/react';
import { RiMoonLine, RiSunLine } from 'react-icons/ri';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-scheme-border bg-scheme-surface hover:bg-scheme-surface-hover transition-theme"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        initial={false}
        animate={{
          scale: theme === 'light' ? 1 : 0,
          opacity: theme === 'light' ? 1 : 0,
          rotate: theme === 'light' ? 0 : 180,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <RiSunLine className="h-5 w-5 text-scheme-text" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          scale: theme === 'dark' ? 1 : 0,
          opacity: theme === 'dark' ? 1 : 0,
          rotate: theme === 'dark' ? 0 : -180,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <RiMoonLine className="h-5 w-5 text-scheme-text" />
      </motion.div>
    </button>
  );
}
