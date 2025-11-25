import React from 'react';
import { motion } from 'framer-motion';

// Компонент для мерцающих звёзд
export const SparkleEffect = ({ count = 3 }: { count?: number }) => {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full will-change-transform"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            transform: 'translateZ(0)', // GPU ускорение
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
};

// Компонент для волнового эффекта
export const WaveEffect = ({ color = "primary" }: { color?: string }) => {
  return (
    <motion.div
      className={`absolute inset-0 bg-${color}/10 rounded-full will-change-transform`}
      style={{ transform: 'translateZ(0)' }}
      animate={{
        scale: [1, 2, 2.5],
        opacity: [0.5, 0.2, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
};

// Компонент для плавающего текста
export const FloatingText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay,
        duration: 0.8,
        ease: "easeOut",
      }}
      style={{ transform: 'translateZ(0)' }}
    >
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Убираем тяжелые компоненты MorphingShape и GlowingLines
export const GradientGlow = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(35, 192, 219, 0.2) 0%, transparent 70%)',
        transform: 'translateZ(0)',
      }}
    />
  );
};