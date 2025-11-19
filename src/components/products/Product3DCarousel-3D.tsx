// src/components/products/Product3DCarousel.tsx
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Float, 
  useGLTF
} from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface Product3DCarouselProps {
  strainType: 'cyan' | 'white' | 'black';
  autoRotate?: boolean;
}

// Настройка сцены - как в Product3DView
function SceneSetup() {
  const { gl, scene } = useThree();
  
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = Math.pow(2, 0); // exposure = 0 по умолчанию
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    // НЕ увеличиваем pixelRatio - это вызывает краш
    scene.background = null;
  }, [gl, scene]);
  
  return null;
}

// Освещение как в Product3DView
function Lights() {
  const lightRef1 = useRef<THREE.AmbientLight>(null);
  const lightRef2 = useRef<THREE.DirectionalLight>(null);
  
  useEffect(() => {
    if (lightRef2.current) {
      lightRef2.current.castShadow = true;
      lightRef2.current.shadow.mapSize.width = 2048;
      lightRef2.current.shadow.mapSize.height = 2048;
      lightRef2.current.shadow.camera.near = 0.5;
      lightRef2.current.shadow.camera.far = 50;
      lightRef2.current.shadow.camera.left = -10;
      lightRef2.current.shadow.camera.right = 10;
      lightRef2.current.shadow.camera.top = 10;
      lightRef2.current.shadow.camera.bottom = -10;
    }
  }, []);
  
  return (
    <>
      <ambientLight 
        ref={lightRef1}
        intensity={0.3} 
        color="#FFFFFF" 
      />
      
      <directionalLight 
        ref={lightRef2}
        intensity={0.8 * Math.PI}
        color="#FFFFFF"
        position={[0.5, 0, 0.866]}
        castShadow
      />
      
      <hemisphereLight 
        intensity={0.2}
        color="#FFFFFF"
        groundColor="#444444"
      />
      
      <pointLight 
        position={[10, 10, 10]} 
        intensity={0.5}
        color="#00D9FF"
        distance={30}
        decay={2}
      />
      
      <pointLight 
        position={[-10, -10, -10]} 
        intensity={0.3}
        color="#00D9FF"
        distance={30}
        decay={2}
      />
      
      <spotLight
        position={[5, 5, 5]}
        angle={0.15}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}

// Конфигурация моделей
const modelConfigs = {
  cyan: [
    { path: '/models/zip_lock_cyan.glb', name: 'Zip Lock', scale: 0.7 },
    { path: '/models/nano_blunt_cyan.glb', name: 'Nano Blunt', scale: 0.5 },
    { path: '/models/mini_blunt_cyan.glb', name: 'Mini Blunt', scale: 0.5 },
    { path: '/models/cardboard_cyan.glb', name: 'Cardboard Box', scale: 0.7 },
    { path: '/models/blunt_cyan.glb', name: 'Premium Blunt', scale: 1 },
  ],
  white: [
    { path: '/models/zip_lock_white.glb', name: 'Zip Lock', scale: 0.7 },
    { path: '/models/nano_blunt_white.glb', name: 'Nano Blunt', scale: 0.5 },
    { path: '/models/mini_blunt_white.glb', name: 'Mini Blunt', scale: 0.5 },
    { path: '/models/cardboard_white.glb', name: 'Cardboard Box', scale: 0.7 },
    { path: '/models/blunt_white.glb', name: 'Premium Blunt', scale: 1 },
  ],
  black: [
    { path: '/models/zip_lock_black.glb', name: 'Zip Lock', scale: 0.7 },
    { path: '/models/nano_blunt_black.glb', name: 'Nano Blunt', scale: 0.5 },
    { path: '/models/mini_blunt_black.glb', name: 'Mini Blunt', scale: 0.5 },
    { path: '/models/cardboard_black.glb', name: 'Cardboard Box', scale: 0.7 },
    { path: '/models/blunt_black.glb', name: 'Premium Blunt', scale: 1.0 },
  ],
};

// Оптимизированный компонент модели
function CarouselItem({ 
  modelPath,
  position, 
  rotation, 
  scale,
  isActive,
  distanceFromActive
}: { 
  modelPath: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
  isActive: boolean;
  distanceFromActive: number;
  name: string;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [currentOpacity, setCurrentOpacity] = useState(1);
  const [currentScale, setCurrentScale] = useState(scale);
  
  const { scene } = useGLTF(modelPath);
  
  // Оптимизированное клонирование
  const clonedScene = React.useMemo(() => {
    const cloned = scene.clone();
    
    cloned.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
          // Клонируем материал
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial || 
                material instanceof THREE.MeshPhysicalMaterial) {
              
              // Базовые настройки без излишеств
              material.envMapIntensity = 1;
              material.transparent = true;
              material.needsUpdate = true;
              
              // Оптимизированные настройки текстур
              if (material.map) {
                material.map.anisotropy = 16;
                material.map.minFilter = THREE.LinearMipmapLinearFilter;
                material.map.magFilter = THREE.LinearFilter;
                material.map.generateMipmaps = true;
                material.map.needsUpdate = true;
              }
              
              // Настройка других карт
              ['normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach((mapName) => {
                const map = material[mapName as keyof THREE.MeshStandardMaterial] as THREE.Texture;
                if (map && map instanceof THREE.Texture) {
                  map.anisotropy = 16;
                  map.minFilter = THREE.LinearMipmapLinearFilter;
                  map.magFilter = THREE.LinearFilter;
                  map.generateMipmaps = true;
                  map.needsUpdate = true;
                }
              });
            }
          });
        }
      }
    });
    
    return cloned;
  }, [scene]);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      
      let targetOpacity = 1;
      let targetScale = scale;
      
      if (isActive) {
        targetOpacity = 1;
        targetScale = scale * 1.2;
      } else {
        if (distanceFromActive === 1) {
          targetOpacity = 0.5;
          targetScale = scale * 0.95;
        } else if (distanceFromActive === 2) {
          targetOpacity = 0.3;
          targetScale = scale * 0.85;
        } else {
          targetOpacity = 0.15;
          targetScale = scale * 0.75;
        }
      }
      
      setCurrentOpacity(THREE.MathUtils.lerp(currentOpacity, targetOpacity, 0.08));
      setCurrentScale(THREE.MathUtils.lerp(currentScale, targetScale, 0.08));
      
      meshRef.current.scale.setScalar(currentScale);
      
      // Оптимизированное применение прозрачности
      clonedScene.traverse((child: any) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat) {
              mat.opacity = currentOpacity;
              mat.depthWrite = isActive;
            }
          });
        }
      });
    }
  });

  return (
    <group ref={meshRef} position={position} rotation={[0, rotation, 0]}>
      <Float 
        speed={2}
        rotationIntensity={isActive ? 0.5 : 0.1}
        floatIntensity={isActive ? 1 : 0.3}
      >
        <primitive object={clonedScene} />
      </Float>
    </group>
  );
}

// Карусель
function Carousel({ models, activeIndex }: { models: any[]; activeIndex: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [targetRotation, setTargetRotation] = useState(0);
  
  useEffect(() => {
    const anglePerItem = (Math.PI * 2) / models.length;
    setTargetRotation(-activeIndex * anglePerItem);
  }, [activeIndex, models.length]);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.05
      );
    }
  });

  const radius = 4;
  
  const getDistanceFromActive = (index: number, activeIdx: number, total: number) => {
    const distance = Math.abs(index - activeIdx);
    return Math.min(distance, total - distance);
  };
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {models.map((model, index) => {
        const angle = (index / models.length) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const distanceFromActive = getDistanceFromActive(index, activeIndex, models.length);
        
        return (
          <CarouselItem
            key={`${model.path}-${index}`}
            modelPath={model.path}
            position={[x, 0, z]}
            rotation={-angle}
            scale={model.scale}
            isActive={index === activeIndex}
            distanceFromActive={distanceFromActive}
            name={model.name}
          />
        );
      })}
    </group>
  );
}

// Loading компонент
function LoadingSpinner() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00D9FF" />
    </mesh>
  );
}

// Главный компонент
const Product3DCarousel: React.FC<Product3DCarouselProps> = ({ 
  strainType, 
  autoRotate = true 
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const [isLoading, setIsLoading] = useState(true);
  const models = modelConfigs[strainType];

  useEffect(() => {
    const paths = models.map(m => m.path);
    paths.forEach(path => useGLTF.preload(path));
    
    setTimeout(() => setIsLoading(false), 1500);
  }, [models]);

  useEffect(() => {
    if (isAutoRotating && !isLoading) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % models.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAutoRotating, models.length, isLoading]);

  const handleModelClick = (index: number) => {
    setActiveIndex(index);
    setIsAutoRotating(false);
  };

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev - 1 + models.length) % models.length);
    setIsAutoRotating(false);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % models.length);
    setIsAutoRotating(false);
  };

  return (
    <div className="relative w-full h-full">
      <Canvas 
        shadows
        camera={{ 
          position: [0, 0, 18], // Как в Product3DView
          fov: 45,
          near: 0.01,
          far: 1000
        }}
        className="cursor-grab active:cursor-grabbing"
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
          alpha: true,
          stencil: false,
          preserveDrawingBuffer: true,
        }}
        linear
      >
        <SceneSetup />
        
        <Suspense fallback={<LoadingSpinner />}>
          <Lights />
          
          <Environment 
            preset="studio"
            background={false}
            resolution={2048}
          />
          
          {!isLoading && <Carousel models={models} activeIndex={activeIndex} />}
          
          <OrbitControls 
            target={[0, 0, 0]}
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 3}
            autoRotate={false}
            screenSpacePanning={true}
          />
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-400">Loading 3D models...</p>
          </div>
        </div>
      )}

      {/* UI элементы */}
      {!isLoading && (
        <>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
            <div className="flex gap-2 bg-black/60 backdrop-blur-md rounded-full p-2 border border-white/10">
              {models.map((_, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleModelClick(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeIndex 
                      ? 'bg-primary w-8' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center"
            >
              {isAutoRotating ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-5.197-3.028A1 1 0 008 9v6a1 1 0 001.555.832l5.197-3.028a1 1 0 000-1.664z" />
                </svg>
              )}
            </motion.button>
          </div>

          <motion.div 
            key={activeIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center pointer-events-none"
          >
            <h3 className="text-xl font-bold text-white mb-1">
              {models[activeIndex].name}
            </h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              {strainType} Edition
            </p>
          </motion.div>

          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center group hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center group hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export function preloadCarouselModels() {
  const types = ['zip_lock', 'nano_blunt', 'mini_blunt', 'cardboard', 'blunt'];
  const colors = ['cyan', 'white', 'black'];
  
  types.forEach(type => {
    colors.forEach(color => {
      useGLTF.preload(`/models/${type}_${color}.glb`);
    });
  });
}

export default Product3DCarousel;