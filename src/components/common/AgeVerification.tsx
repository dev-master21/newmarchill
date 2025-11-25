import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface AgeVerificationProps {
  onVerify: () => void;
}

const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerify }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleVerify = () => {
    setIsExiting(true);
    setTimeout(onVerify, 500);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-darker flex items-center justify-center z-50 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="glass-dark p-8 md:p-12 max-w-md w-full text-center"
          >
            {/* Logo */}
            <motion.img
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              src="/logo.svg"
              alt="Chillium"
              className="w-20 h-20 mx-auto mb-6 filter drop-shadow-[0_0_20px_rgba(35,192,219,0.5)]"
            />
            
            {/* Title */}
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-2 glow-text"
            >
              Age Verification
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mb-8"
            >
              You must be 21+ to enter
            </motion.p>
            
            {/* Warning */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center space-x-2 mb-8 text-sm text-gray-500"
            >
              <AlertCircle className="w-4 h-4" />
              <span>This website contains adult content</span>
            </motion.div>
            
            {/* Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <button
                onClick={handleVerify}
                className="w-full py-4 gradient-primary text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] transition-all duration-300 transform hover:scale-105"
              >
                I am 21 or older
              </button>
              
              <button
                onClick={() => window.location.href = 'https://google.com'}
                className="w-full py-4 bg-gray-800 text-gray-400 font-semibold rounded-xl hover:bg-gray-700 transition-all duration-300"
              >
                I am under 21
              </button>
            </motion.div>
            
            {/* Legal text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-xs text-gray-600"
            >
              By entering this site, you agree to our Terms of Service and Privacy Policy
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgeVerification;