import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Определяем мобильное устройство
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    
    // Проверяем настройки reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Если пользователь предпочитает reduced motion, показываем статичный фон
  if (reduceMotion) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      </div>
    );
  }

  // Упрощенная версия для мобильных устройств
  if (isMobile) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Статичный градиент для мобильных */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        
        {/* Только одна легкая анимированная сфера */}
        <motion.div
          className="absolute top-20 left-10 w-48 h-48"
          style={{ transform: 'translateZ(0)' }} // Форсируем GPU
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="w-full h-full bg-gradient-radial from-primary/20 to-transparent rounded-full filter blur-xl" />
        </motion.div>
      </div>
    );
  }

  // Полная версия для десктопа с оптимизациями
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Оптимизированные градиентные сферы с GPU ускорением */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 will-change-transform"
        style={{ transform: 'translateZ(0)' }}
        animate={{
          x: [0, 80, 0],
          y: [0, -80, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear", // Linear проще для расчетов
        }}
      >
        <div className="w-full h-full bg-gradient-radial from-primary/25 via-primary/10 to-transparent rounded-full filter blur-2xl" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 will-change-transform"
        style={{ transform: 'translateZ(0)' }}
        animate={{
          x: [0, -100, 0],
          y: [0, 80, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
          delay: 5
        }}
      >
        <div className="w-full h-full bg-gradient-radial from-secondary/20 via-secondary/10 to-transparent rounded-full filter blur-2xl" />
      </motion.div>
      
      {/* Статичная сетка без анимации на мобильных */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(35, 192, 219, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(35, 192, 219, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Уменьшенное количество частиц с оптимизированной анимацией */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-primary/30 rounded-full will-change-transform"
            style={{ 
              transform: 'translateZ(0)',
              left: `${(i + 1) * 12}%`,
              top: `${80 + (i % 3) * 10}%`
            }}
            animate={{
              y: [-20, -window.innerHeight - 20],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear",
              opacity: {
                times: [0, 0.1, 0.9, 1],
                ease: "easeInOut"
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;