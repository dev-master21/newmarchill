import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ProductImageCarouselProps {
  strainType: 'cyan' | 'white' | 'black';
  autoRotate?: boolean;
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({ 
  strainType, 
  autoRotate: _initialAutoRotate = true 
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartFrame, setDragStartFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const imagesPreloaded = useRef<boolean>(false);
  
  const totalFrames = 121; // 0000.png до 0300.png = 301 кадр
  const frameDuration = 5000 / totalFrames; // 10 секунд на полный оборот
  
  // Мапинг типов на папки
  const folderMap = {
    cyan: 'cyan_set',
    white: 'white_set',
    black: 'black_set'
  };

  // Цвета подсветки для каждого типа
  const glowColors = {
    cyan: {
      primary: 'rgba(6, 182, 212, 0.4)',
      secondary: 'rgba(14, 165, 233, 0.3)',
      tertiary: 'rgba(34, 211, 238, 0.2)'
    },
    white: {
      primary: 'rgba(255, 255, 255, 0.3)',
      secondary: 'rgba(229, 229, 229, 0.2)',
      tertiary: 'rgba(245, 245, 245, 0.15)'
    },
    black: {
      primary: 'rgba(120, 120, 120, 0.3)',
      secondary: 'rgba(80, 80, 80, 0.2)',
      tertiary: 'rgba(160, 160, 160, 0.15)'
    }
  };

  const currentGlow = glowColors[strainType];

  // Предзагрузка всех изображений
  useEffect(() => {
    if (imagesPreloaded.current) return;
    
    const folder = folderMap[strainType];
    let loadedCount = 0;
    const imagePaths: string[] = [];
    let isMounted = true;

    const preloadImages = async () => {
      const promises = [];
      
      // Создаем пути для всех кадров
      for (let i = 0; i <= 120; i++) {
        const frameNumber = String(i).padStart(4, '0');
        const imagePath = `/images/${folder}/${frameNumber}.png`;
        imagePaths[i] = imagePath;
        
        const promise = new Promise<void>((resolve) => {
          const img = new Image();
          
          img.onload = () => {
            loadedCount++;
            if (isMounted) {
              setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
            }
            resolve();
          };
          
          img.onerror = () => {
            console.error(`Failed to load image: ${imagePath}`);
            loadedCount++;
            if (isMounted) {
              setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
            }
            resolve();
          };
          
          // Загружаем изображение
          img.src = imagePath;
        });
        
        promises.push(promise);
      }

      try {
        await Promise.all(promises);
        if (isMounted) {
          setLoadedImages(imagePaths);
          setIsLoading(false);
          imagesPreloaded.current = true;
        }
      } catch (error) {
        console.error('Error preloading images:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    preloadImages();

    return () => {
      isMounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [strainType]);

  // Автоматическая анимация
  useEffect(() => {
    if (isLoading || isDragging) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= frameDuration) {
        setCurrentFrame(prevFrame => {
          const nextFrame = (prevFrame + 1) % totalFrames;
          return nextFrame;
        });
        lastFrameTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastFrameTimeRef.current = 0;
    };
  }, [isLoading, isDragging, frameDuration, totalFrames]);

  // Обработка начала перетаскивания
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartFrame(currentFrame);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [currentFrame]);

  // Обработка движения мыши
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const framesDelta = Math.round(deltaX / 2);
    
    let newFrame = dragStartFrame - framesDelta;
    
    while (newFrame < 0) newFrame += totalFrames;
    while (newFrame >= totalFrames) newFrame -= totalFrames;
    
    setCurrentFrame(newFrame);
  }, [isDragging, dragStartX, dragStartFrame, totalFrames]);

  // Обработка окончания перетаскивания
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastFrameTimeRef.current = 0;
  }, []);

  // Глобальные обработчики для мыши
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch события для мобильных устройств
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStartX(touch.clientX);
    setDragStartFrame(currentFrame);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [currentFrame]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX;
    const framesDelta = Math.round(deltaX / 2);
    
    let newFrame = dragStartFrame - framesDelta;
    
    while (newFrame < 0) newFrame += totalFrames;
    while (newFrame >= totalFrames) newFrame -= totalFrames;
    
    setCurrentFrame(newFrame);
  }, [isDragging, dragStartX, dragStartFrame, totalFrames]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastFrameTimeRef.current = 0;
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Анимированная подсветка на фоне */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Основной пульсирующий круг */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full filter blur-3xl"
          style={{
            background: `radial-gradient(circle, ${currentGlow.primary}, transparent)`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Движущийся круг слева */}
        <motion.div
          className="absolute w-64 h-64 rounded-full filter blur-2xl"
          style={{
            background: `radial-gradient(circle, ${currentGlow.secondary}, transparent)`,
          }}
          animate={{
            x: [-100, 100, -100],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Движущийся круг справа */}
        <motion.div
          className="absolute right-0 w-72 h-72 rounded-full filter blur-3xl"
          style={{
            background: `radial-gradient(circle, ${currentGlow.tertiary}, transparent)`,
          }}
          animate={{
            x: [100, -100, 100],
            y: [100, -100, 100],
            scale: [1.2, 0.8, 1.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Дополнительный мерцающий эффект */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${currentGlow.primary}, transparent 70%)`,
          }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Контейнер с изображением */}
      <div 
        ref={containerRef}
        className={`relative w-full h-full flex items-center justify-center ${
          !isLoading ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Градиент по краям для эффекта глубины */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent" />
        </div>
        
        {/* Контейнер для изображений */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Все изображения загружены один раз, показываем через display */}
          {!isLoading && loadedImages.length > 0 && (
            <div className="relative w-full h-full flex items-center justify-center p-6">
              {loadedImages.map((imagePath, index) => (
                <img 
                  key={`frame-${index}`} // Статический ключ
                  src={imagePath}
                  alt={`${strainType} product frame ${index}`}
                  className="absolute max-w-full max-h-full object-contain select-none pointer-events-none"
                  draggable={false}
                  style={{
                    display: index === currentFrame ? 'block' : 'none',
                    filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.25))',
                    transform: 'scale(0.95)',
                    imageRendering: 'crisp-edges',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    willChange: 'display'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm text-white/80 font-light mb-3">Loading collection...</p>
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Название продукта в правом верхнем углу */}
      {!isLoading && (
        <div className="absolute top-6 right-6 text-right pointer-events-none z-20">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
          </motion.div>
        </div>
      )}

      {/* Минималистичная подсказка внизу по центру */}
      {!isLoading && !isDragging && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none z-20"
        >
          <div className="flex items-center gap-2 text-white/30">
            <svg 
              className="w-4 h-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M7.5 15L12 9.75 16.5 15m-9-7.5L12 2.25l4.5 5.25"
              />
            </svg>
            <span className="text-xs font-light uppercase tracking-wider">Drag to rotate</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProductImageCarousel;