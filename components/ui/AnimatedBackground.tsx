'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { Wallet, IndianRupee, Sparkles, TrendingUp, Receipt, Target, PieChart, Shield } from 'lucide-react';

interface FloatingIcon {
  id: number;
  Icon: React.ElementType;
  x: string;
  y: string;
  size: number;
  color: string;
  blur: number;
  speed: number;
  delay: number;
  rotation: number;
}

const ICONS = [Wallet, IndianRupee, Sparkles, TrendingUp, Receipt, Target, PieChart, Shield];
const COLORS = [
  'text-violet-500',
  'text-indigo-500',
  'text-fuchsia-500',
  'text-emerald-500',
  'text-sky-500',
  'text-amber-500',
  'text-pink-500',
];

function generateIcons(count: number): FloatingIcon[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    Icon: ICONS[Math.floor(Math.random() * ICONS.length)],
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.floor(Math.random() * 40) + 20, // 20px to 60px
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    blur: Math.random() * 4 + 1, // 1px to 5px blur for depth
    speed: Math.random() * 1.5 + 0.5, // Parallax speed multiplier
    delay: Math.random() * 2,
    rotation: Math.random() * 360,
  }));
}

function FloatingIconItem({ icon, smoothProgress }: { icon: FloatingIcon; smoothProgress: any }) {
  const yRange = [-150 * icon.speed, 150 * icon.speed];
  const yTransform = useTransform(smoothProgress, [0, 1], yRange);

  return (
    <motion.div
      className={`absolute ${icon.color} opacity-20`}
      style={{
        left: icon.x,
        top: icon.y,
        filter: `blur(${icon.blur}px)`,
        y: yTransform,
        rotate: icon.rotation,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.1, 0.3, 0.1],
        scale: 1,
        rotate: [icon.rotation, icon.rotation + 90, icon.rotation],
      }}
      transition={{
        opacity: {
          duration: 4 + Math.random() * 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: icon.delay,
        },
        rotate: {
          duration: 20 + Math.random() * 20,
          repeat: Infinity,
          ease: "linear",
        },
        scale: {
          duration: 1,
          delay: icon.delay,
        }
      }}
    >
      <icon.Icon size={icon.size} strokeWidth={1.5} />
    </motion.div>
  );
}

export function AnimatedBackground() {
  const [icons, setIcons] = useState<FloatingIcon[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Scroll parallax config
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 20,
    stiffness: 100,
    mass: 0.5,
  });

  useEffect(() => {
    // Generate icons only on client to avoid hydration mismatch
    setIcons(generateIcons(15));
  }, []);

  if (shouldReduceMotion) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]"
    >
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)]" />

      {/* Floating Parallax Icons */}
      {icons.map((icon) => (
        <FloatingIconItem key={icon.id} icon={icon} smoothProgress={smoothProgress} />
      ))}
    </div>
  );
}
