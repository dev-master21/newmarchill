// src/components/products/Product3DView.tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Float, Sparkles } from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface Product3DViewProps {
  productType: string;
  minimal?: boolean; // Новый проп для минималистичного режима
}

function Model({ productType }: { productType: string }) {
  const meshRef = useRef<any>(null);

  // Мапинг типов продуктов на пути к моделям
  const modelPaths: Record<string, string> = {
    'flowers': '/models/flowers.glb',
    'prerolls': '/models/prerolls.glb', 
    'blunts': '/models/blunts.glb',
    'default': '/models/product.glb'
  };

  const modelPath = modelPaths[productType] || modelPaths.default;
  const { scene } = useGLTF(modelPath);

  // Настройка текстур для высокого качества
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Настройка материалов
        if (child.material) {
          // Если это массив материалов
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial || 
                material instanceof THREE.MeshPhysicalMaterial) {
              // Включаем все карты
              if (material.map) {
                material.map.anisotropy = 8; // Максимальная анизотропная фильтрация
                material.map.minFilter = THREE.LinearMipmapLinearFilter;
                material.map.magFilter = THREE.LinearFilter;
                material.map.generateMipmaps = true;
                material.map.needsUpdate = true;
              }
              
              // Настройка других карт (normal, roughness, metalness и т.д.)
              ['normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach((mapName) => {
                const map = material[mapName as keyof THREE.MeshStandardMaterial] as THREE.Texture;
                if (map && map instanceof THREE.Texture) {
                  map.anisotropy = 16;
                  map.minFilter = THREE.LinearMipmapLinearFilter;
                  map.magFilter = THREE.LinearFilter;
                  map.generateMipmaps = true;
                  map.needsUpdate = true;
                }
              });
              
              // Улучшаем качество материала
              material.needsUpdate = true;
            }
          });
        }
      }
    });
  }, [scene]);

  // Автоматическое вращение с покачиванием
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      // Плавное покачивание по Y
      meshRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  // Настройки масштаба для разных типов продуктов
  const scales: Record<string, number> = {
    'flowers': 2,
    'prerolls': 2,
    'blunts': 2,
    'default': 2
  };

  const scale = scales[productType] || scales.default;

  return (
    <Float
      speed={4} // Скорость анимации
      rotationIntensity={0.2} // Интенсивность вращения 
      floatIntensity={0.2} // Интенсивность покачивания
    >
      <primitive ref={meshRef} object={scene} scale={scale} position={[0, -0.5, 0]} />
    </Float>
  );
}

const Product3DView: React.FC<Product3DViewProps> = ({ productType, minimal = false }) => {
  return (
    <div className="relative w-full h-full">
      {/* Анимированный градиент на фоне - только если не минимальный режим */}
      {!minimal && (
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
          
          {/* Анимированный градиент */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.2) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(0, 217, 255, 0.2) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(0, 217, 255, 0.2) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.2) 0%, transparent 50%)',
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 13], fov: 45 }}
        className="cursor-grab active:cursor-grabbing"
        dpr={[1, 2]} // Поддержка высокого DPI
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
          alpha: true,
          stencil: false,
          // Важно для качества текстур
          preserveDrawingBuffer: true,
        }}
        // Линейное цветовое пространство для правильного отображения цветов
        linear
      >
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#00D9FF" />
          </mesh>
        }>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <pointLight position={[-10, -10, -10]} color="#00D9FF" intensity={0.3} />
          
          {/* Дополнительное освещение для лучшей видимости текстур */}
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          
          {/* Дополнительная подсветка снизу */}
          <pointLight position={[0, -5, 0]} color="#00D9FF" intensity={0.5} />

          {/* Sparkles эффект - только если не минимальный режим */}
          {!minimal && (
            <Sparkles
              count={30}
              scale={8}
              size={2}
              speed={0.3}
              opacity={0.6}
              color="#00D9FF"
            />
          )}

          <Model productType={productType} />
          
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 3}
            autoRotate
            autoRotateSpeed={0.3}
          />
          
          <Environment 
            preset="studio" 
            resolution={512} // Высокое разрешение окружения
          />
        </Suspense>
      </Canvas>

      {/* Простые UI элементы - только если не минимальный режим */}
      {!minimal && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Угловые маркеры */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-cyan-400/20 rounded-tl" />
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-cyan-400/20 rounded-tr" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-cyan-400/20 rounded-bl" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-cyan-400/20 rounded-br" />
        </div>
      )}

      {/* Loading spinner - только если не минимальный режим */}
      {!minimal && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
          />
        </div>
      )}
    </div>
  );
};

// Предзагрузка моделей для лучшей производительности
export function preloadModels() {
  useGLTF.preload('/models/flowers.glb');
  useGLTF.preload('/models/prerolls.glb');
  useGLTF.preload('/models/blunts.glb');
  useGLTF.preload('/models/product.glb');
}

export default Product3DView;