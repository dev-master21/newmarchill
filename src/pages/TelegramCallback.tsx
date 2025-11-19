import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import AnimatedBackground from '../components/common/AnimatedBackground';
import toast from 'react-hot-toast';
import { Loader, Send, User, UserCircle } from 'lucide-react';

const TelegramCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { telegramAuthCallback, registerTelegram } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      toast.error('Authorization token is missing');
      navigate('/login');
      return;
    }

    handleTelegramAuth(token);
  }, [searchParams]);

  const handleTelegramAuth = async (token: string) => {
    try {
      setIsLoading(true);
      await telegramAuthCallback(token);
      toast.success('Authorization successful!');
      navigate('/');
    } catch (error: any) {
      // If user not found, show registration form
      if (error.response?.status === 404) {
        setNeedsRegistration(true);
        setTelegramToken(token);
        setIsLoading(false);
      } else {
        toast.error(error.response?.data?.message || 'Authorization failed');
        navigate('/login');
      }
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error('Username can only contain letters, numbers and _');
      return;
    }

    if (!formData.first_name.trim()) {
      toast.error('Please enter your first name');
      return;
    }

    setIsLoading(true);

    try {
      await registerTelegram({
        token: telegramToken,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name || undefined
      });
      
      toast.success('Registration successful!');
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || 
                          error.response?.data?.message || 
                          'Registration failed';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  if (isLoading && !needsRegistration) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center relative"
      >
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Loader className="w-full h-full text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold gradient-text">Authorizing...</h2>
          <p className="text-gray-400 mt-2">Please wait</p>
        </div>
      </motion.div>
    );
  }

  if (needsRegistration) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center relative p-4"
      >
        <AnimatedBackground />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="glass-dark p-8 rounded-3xl">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <Send className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">Complete Registration</h1>
              <p className="text-gray-400 mt-2">Fill in additional information</p>
            </motion.div>

            <form onSubmit={handleRegistration} className="space-y-6">
              {/* Username */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="your_username"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">At least 3 characters, only letters, numbers and _</p>
              </motion.div>

              {/* First Name */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="John"
                    required
                  />
                </div>
              </motion.div>

              {/* Last Name */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name (optional)
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-4 gradient-primary text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    Complete Registration
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return null;
};

export default TelegramCallback;