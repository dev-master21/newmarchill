import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Product3DCarouselProps {
  productType: string;
  strainType: 'cyan' | 'white' | 'black';
}

const Product3DCarousel: React.FC<Product3DCarouselProps> = ({ 
  productType,
  strainType
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartFrame, setDragStartFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<string[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const imagesPreloaded = useRef<boolean>(false);
  
  const totalFrames = 121;
  const frameDuration = 5000 / totalFrames;
  
  const productFolderMap: { [key: string]: string } = {
    'plastic-bags': 'plastic-bags',
    'boxes': 'boxes',
    'nano-blunts': 'nano-blunts',
    'big-blunts': 'big-blunts'
  };

  const strainFolderMap = {
    cyan: 'cyan',
    white: 'white',
    black: 'black'
  };

  // Коэффициенты масштабирования для разных типов продуктов
  const scaleFactors: { [key: string]: number } = {
    'plastic-bags': 2.0,
    'boxes': 1.5,
    'nano-blunts': 2.0,
    'big-blunts': 2.0
  };

  // Получаем коэффициент для текущего типа продукта
  const currentScale = scaleFactors[productType] || 2.0;

  const glowColors = {
    cyan: 'rgba(6, 182, 212, 0.3)',
    white: 'rgba(255, 255, 255, 0.2)',
    black: 'rgba(120, 120, 120, 0.2)'
  };

  const currentGlow = glowColors[strainType];

  useEffect(() => {
    if (imagesPreloaded.current) return;
    
    const productFolder = productFolderMap[productType] || 'boxes';
    const strainFolder = strainFolderMap[strainType];
    let loadedCount = 0;
    const imagePaths: string[] = [];
    let isMounted = true;

    const preloadImages = async () => {
      const promises = [];
      
      for (let i = 0; i <= 120; i++) {
        const frameNumber = String(i).padStart(4, '0');
        const imagePath = `/images/${productFolder}/${strainFolder}/${frameNumber}.png`;
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
            loadedCount++;
            if (isMounted) {
              setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
            }
            resolve();
          };
          
          img.src = imagePath;
        });
        
        promises.push(promise);
      }

      try {
        await Promise.all(promises);
        if (isMounted) {
          imagesRef.current = imagePaths;
          setIsLoading(false);
          imagesPreloaded.current = true;
        }
      } catch (error) {
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
  }, [productType, strainType, totalFrames]);

  useEffect(() => {
    if (isLoading || isDragging || imagesRef.current.length === 0) {
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
        setCurrentFrame(prevFrame => (prevFrame + 1) % totalFrames);
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const framesDelta = Math.round(deltaX / 2);
    
    let newFrame = dragStartFrame - framesDelta;
    while (newFrame < 0) newFrame += totalFrames;
    while (newFrame >= totalFrames) newFrame -= totalFrames;
    
    setCurrentFrame(newFrame);
  }, [isDragging, dragStartX, dragStartFrame, totalFrames]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastFrameTimeRef.current = 0;
  }, []);

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
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full filter blur-3xl"
          style={{
            background: `radial-gradient(circle, ${currentGlow}, transparent)`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

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
        {/* Увеличенный контейнер для изображений */}
        <div className="relative w-full h-full flex items-center justify-center">
          {!isLoading && imagesRef.current.length > 0 && (
            <>
              {imagesRef.current.map((imagePath, index) => (
                <img 
                  key={`frame-${index}`}
                  src={imagePath}
                  alt={`${productType} ${strainType} frame ${index}`}
                  className="absolute max-w-full max-h-full object-contain select-none pointer-events-none"
                  draggable={false}
                  style={{
                    display: index === currentFrame ? 'block' : 'none',
                    filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))',
                    transform: `scale(${currentScale})`, // ИЗМЕНЕНО: динамический коэффициент
                    transformOrigin: 'center center',
                  }}
                />
              ))}
            </>
          )}
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-3">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-xs text-white/60">{loadProgress}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product3DCarousel;