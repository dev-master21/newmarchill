// src/pages/Home.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, Play, Pause, Volume2, VolumeX, Flower2, Hash, Sparkles, ArrowRight, Clock, Shield, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/common/AnimatedBackground';
import ProductImageCarousel from '../components/products/ProductImageCarousel';

// Типы для категорий по сортам
type StrainCategory = 'cyan' | 'white' | 'black';

interface CategoryInfo {
  id: StrainCategory;
  name: string;
  title: string;
  subtitle: string;
  strainType: string;
  description: string;
  features: string[];
  icon: typeof Flower2;
  gradient: string;
  shadow: string;
  accentColor: string;
}

const categories: Record<StrainCategory, CategoryInfo> = {
  cyan: {
    id: 'cyan',
    name: 'Cyan',
    title: 'Cyan Edition',
    subtitle: 'HYBRID STRAINS',
    strainType: 'Hybrid',
    description: 'Perfect balance of mind and body effects',
    features: ['Balanced High', 'Creative Focus', 'Social Enhancement'],
    icon: Hash,
    gradient: 'from-cyan-400 via-blue-500 to-teal-600',
    shadow: '0 0 40px rgba(6, 182, 212, 0.4)',
    accentColor: 'cyan'
  },
  white: {
    id: 'white',
    name: 'White',
    title: 'White Edition',
    subtitle: 'SATIVA STRAINS',
    strainType: 'Sativa',
    description: 'Energizing and uplifting experience',
    features: ['Energy Boost', 'Mental Clarity', 'Day Time Use'],
    icon: Sparkles,
    gradient: 'from-gray-100 via-gray-200 to-white',
    shadow: '0 0 40px rgba(255, 255, 255, 0.3)',
    accentColor: 'white'
  },
  black: {
    id: 'black',
    name: 'Black',
    title: 'Black Edition',
    subtitle: 'INDICA STRAINS',
    strainType: 'Indica',
    description: 'Deep relaxation and tranquility',
    features: ['Deep Relaxation', 'Pain Relief', 'Night Time Use'],
    icon: Flower2,
    gradient: 'from-gray-700 via-gray-800 to-black',
    shadow: '0 0 40px rgba(0, 0, 0, 0.5)',
    accentColor: 'black'
  }
};

const VideoHero = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let timeoutId: number;

    timeoutId = window.setTimeout(() => {
      if (isLoading) {
        console.log('Video loading timeout - showing fallback');
        setHasError(true);
        setIsLoading(false);
      }
    }, 15000);

    const handleCanPlay = () => {
      console.log('Video can play');
      clearTimeout(timeoutId);
      setIsLoading(false);
    };

    const handleLoadedData = () => {
      console.log('Video loaded data');
      clearTimeout(timeoutId);
      setIsLoading(false);
      video.play().catch((error) => {
        console.log('Autoplay was prevented:', error);
        setIsPlaying(false);
      });
    };

    const handleError = (e: Event) => {
      console.error('Video loading error:', e);
      clearTimeout(timeoutId);
      setHasError(true);
      setIsLoading(false);
    };

    const handleWaiting = () => {
      console.log('Video is waiting for more data');
    };

    const handleStalled = () => {
      console.log('Video loading stalled');
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleStalled);

    video.load();

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleStalled);
    };
  }, [isLoading]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <motion.section 
      style={{ opacity, scale }}
      className="relative h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Animated background (always shown) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${
        hasError || isLoading ? 'opacity-100' : 'opacity-30'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-darker to-dark" />
        
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(35, 192, 219, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(35, 192, 219, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(35, 192, 219, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(35, 192, 219, 0.15) 0%, transparent 50%)',
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full filter blur-sm"
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 20,
              }}
              animate={{
                y: -20,
                x: Math.random() * window.innerWidth,
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10,
              }}
            />
          ))}
        </div>
      </div>

      {/* Video */}
      {!hasError && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/video/hero-video.mp4" type="video/mp4" />
        </video>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      {/* Hero Content - УМЕНЬШЕННЫЙ ТЕКСТ И ЕЩЕ НИЖЕ */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full text-center px-4 pb-32">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-4xl font-bold mb-3">
            <span className="gradient-text">Premium Cannabis</span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-300 max-w-xl mx-auto">
            Discover our curated collection of premium strains
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <button
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            className="px-6 py-3 gradient-primary text-black font-semibold rounded-full hover:scale-105 transition-transform shadow-lg hover:shadow-[0_0_30px_rgba(35,192,219,0.5)]"
          >
            Explore Collections
          </button>
        </motion.div>
      </div>

      {/* Loading indicator */}
      {isLoading && !hasError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-8 right-8 z-20"
        >
          <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-3 flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full"
            />
            <span className="text-xs text-gray-400">Loading video...</span>
          </div>
        </motion.div>
      )}

      {/* Video controls */}
      {!hasError && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-32 lg:bottom-8 left-8 flex items-center gap-4 z-20"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-12 h-12 rounded-full glass-dark flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="w-12 h-12 rounded-full glass-dark flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </motion.button>
        </motion.div>
      )}

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center cursor-pointer"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="text-xs text-gray-400 mb-2">Scroll to explore</span>
          <ChevronDown className="w-5 h-5 text-primary animate-pulse" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

// Category Card Component с новой каруселью изображений
const CategoryCard = ({ category, onClick, index }: { 
  category: CategoryInfo; 
  onClick: () => void; 
  index: number 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2, duration: 0.8, type: "spring" }}
      whileHover={{ y: -10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/[0.05] overflow-hidden hover:border-white/[0.1] transition-all duration-500">
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
        />
        
        {/* Image Carousel Section */}
        <div className="relative h-[400px] lg:h-[450px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
          
          {/* Новая карусель изображений */}
          <ProductImageCarousel strainType={category.id} autoRotate={true} />
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 + 0.3 }}
            className="absolute top-6 left-6 z-20 pointer-events-none"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/[0.08]">
              <Icon className={`w-4 h-4 ${category.accentColor === 'cyan' ? 'text-cyan-400' : category.accentColor === 'white' ? 'text-gray-400' : 'text-gray-400'}`} />
              <span className="text-xs font-medium text-white/70">{category.subtitle}</span>
            </div>
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="p-8 pt-0">
          <h3 className="text-2xl font-light mb-2 text-white/90">{category.title}</h3>
          <p className="text-sm text-white/50 mb-6">{category.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {category.features.map((feature, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.2 + i * 0.1 + 0.4 }}
                className="text-xs px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-white/60"
              >
                {feature}
              </motion.span>
            ))}
          </div>
          
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={`w-full py-4 rounded-2xl font-medium text-sm relative overflow-hidden group/btn transition-all duration-300
              bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] cursor-pointer`}
            animate={{ scale: isHovered ? 1.02 : 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className={`absolute inset-0 bg-gradient-to-r ${category.gradient} opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300`}
            />
            
            <span className="relative z-10 flex items-center justify-center gap-2 text-white/80 group-hover/btn:text-white/100">
              Explore {category.strainType}
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        </div>
        
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
          <div className={`w-full h-full bg-gradient-radial ${category.gradient} filter blur-3xl`} />
        </div>
      </div>
    </motion.div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCategoryClick = (categoryId: string) => {
    navigate('/catalog', { state: { strainType: categoryId.toUpperCase() } });
  };

  const stats = [
    { icon: Shield, label: 'Lab Tested', value: '100%' },
    { icon: Award, label: 'Premium Quality', value: 'A+' },
    { icon: Clock, label: 'Fast Delivery', value: '2-4h' },
  ];

  return (
    <div className="min-h-screen relative bg-black">
      <AnimatedBackground />
      
      {/* Video Hero Section */}
      <VideoHero />
      
      {/* Categories Section */}
      <motion.section className="min-h-screen py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs uppercase tracking-[0.3em] text-primary mb-6"
            >
              Choose Your Experience
            </motion.p>
            
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              SELECT YOUR
              <span className="block gradient-text mt-2">STRAIN TYPE</span>
            </h2>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Each strain offers a unique journey. Choose based on your desired experience.
            </p>
          </motion.div>
          
          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {Object.values(categories).map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => handleCategoryClick(category.id)}
                index={index}
              />
            ))}
          </div>
          
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-20 pt-20 border-t border-white/[0.05]"
          >
            <div className="grid grid-cols-3 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <Icon className="w-8 h-8 mx-auto mb-4 text-white/20" />
                    <p className="text-2xl font-light text-white/80 mb-1">{stat.value}</p>
                    <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      {/* 21+ Badge */}
      <motion.div
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
      >
        <motion.div
          className="w-14 h-14 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <span className="text-white/60 font-light text-sm">21+</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;