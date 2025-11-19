import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info, Leaf, Sparkles } from 'lucide-react';

interface Strain {
  name: string;
  thc: string;
  effect: string;
  flavor: string;
  description: string;
}

interface StrainSelectorProps {
  strains: string[];
  selectedStrain: string | null;
  onSelect: (strain: string) => void;
}

// Временные данные о сортах
const strainDetails: Record<string, Strain> = {
  'Amnesia Haze': {
    name: 'Amnesia Haze',
    thc: '22-25%',
    effect: 'Energetic, Creative, Uplifted',
    flavor: 'Citrus, Lemon, Earthy',
    description: 'A classic sativa with powerful cerebral effects and citrus notes.',
  },
  'Super Silver Haze': {
    name: 'Super Silver Haze',
    thc: '23-26%',
    effect: 'Happy, Energetic, Creative',
    flavor: 'Citrus, Spicy, Herbal',
    description: 'Award-winning sativa known for its long-lasting energetic high.',
  },
  'Purple Kush': {
    name: 'Purple Kush',
    thc: '20-22%',
    effect: 'Relaxed, Sleepy, Happy',
    flavor: 'Grape, Berry, Earthy',
    description: 'Pure indica with deep relaxation and sweet grape flavors.',
  },
  'Blue Dream': {
    name: 'Blue Dream',
    thc: '21-24%',
    effect: 'Balanced, Creative, Relaxed',
    flavor: 'Berry, Sweet, Herbal',
    description: 'Popular hybrid offering full-body relaxation with gentle cerebral invigoration.',
  },
};

const StrainSelector: React.FC<StrainSelectorProps> = ({ strains, selectedStrain, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const currentStrainDetails = selectedStrain ? strainDetails[selectedStrain] : null;

  return (
    <div className="relative">
      {/* Selector Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-dark p-4 rounded-xl flex items-center justify-between group"
      >
        <div className="flex items-center space-x-3">
          <Leaf className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Select Strain</p>
            <p className="font-medium">
              {selectedStrain || 'Choose your strain'}
            </p>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-dark rounded-xl overflow-hidden z-20"
          >
            {strains.map((strain, index) => (
              <motion.button
                key={strain}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onSelect(strain);
                  setIsOpen(false);
                }}
                className={`w-full p-4 text-left hover:bg-white/5 transition-colors flex items-center justify-between group ${
                  selectedStrain === strain ? 'bg-primary/10' : ''
                }`}
              >
                <div>
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {strain}
                  </p>
                  {strainDetails[strain] && (
                    <p className="text-xs text-gray-500 mt-1">
                      THC: {strainDetails[strain].thc} • {strainDetails[strain].effect.split(',')[0]}
                    </p>
                  )}
                </div>
                
                {selectedStrain === strain && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strain Info Button */}
      {selectedStrain && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowInfo(!showInfo)}
          className="mt-3 w-full py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium flex items-center justify-center space-x-2 hover:bg-primary/20 transition-colors"
        >
          <Info className="w-4 h-4" />
          <span>Strain Information</span>
        </motion.button>
      )}

      {/* Strain Info Modal */}
      <AnimatePresence>
        {showInfo && currentStrainDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark p-6 rounded-2xl max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold gradient-text">
                  {currentStrainDetails.name}
                </h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* THC Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-primary font-semibold">THC: {currentStrainDetails.thc}</span>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Effects</p>
                  <p className="text-white">{currentStrainDetails.effect}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Flavors</p>
                  <p className="text-white">{currentStrainDetails.flavor}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-gray-300">{currentStrainDetails.description}</p>
                </div>
              </div>

              {/* Image placeholder */}
              <div className="mt-6 h-48 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Leaf className="w-16 h-16 text-primary/30" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StrainSelector;