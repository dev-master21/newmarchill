import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, User, Sparkles, Send } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import AnimatedBackground from '../components/common/AnimatedBackground';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'login' | 'telegram'>('login');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      toast.error('Please enter your username');
      return;
    }

    if (!formData.password) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || 
                          error.response?.data?.message || 
                          'Login failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get Telegram bot URL from environment or construct it
  const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'your_bot_username';
  const telegramBotUrl = `https://t.me/${telegramBotUsername}?start=auth`;

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
          {/* Logo */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <img
              src="/logo.svg"
              alt="Chillium"
              className="w-20 h-20 mx-auto mb-4 filter drop-shadow-[0_0_20px_rgba(35,192,219,0.5)]"
            />
            <h1 className="text-3xl font-bold gradient-text">Sign In</h1>
            <p className="text-gray-400 mt-2">Welcome to Chillium Market</p>
          </motion.div>

          {/* Auth Method Tabs */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-2 mb-6"
          >
            <button
              onClick={() => setAuthMethod('login')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                authMethod === 'login'
                  ? 'gradient-primary text-white shadow-[0_0_20px_rgba(35,192,219,0.3)]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <User className="w-5 h-5 inline-block mr-2" />
              Username
            </button>
            <button
              onClick={() => setAuthMethod('telegram')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                authMethod === 'telegram'
                  ? 'gradient-primary text-white shadow-[0_0_20px_rgba(35,192,219,0.3)]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Send className="w-5 h-5 inline-block mr-2" />
              Telegram
            </button>
          </motion.div>

          <AnimatePresence mode="wait">
            {authMethod === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Username */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
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
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
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
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="telegram-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center py-8"
                >
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <Send className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Sign In via Telegram</h3>
                  <p className="text-gray-400 mb-6">
                    Click the button below to authorize via Telegram bot
                  </p>
                  
                  
                   <a href={telegramBotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 gradient-primary text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(35,192,219,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Open Telegram
                  </a>

                  <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-gray-400">
                      <strong className="text-white">How it works:</strong>
                      <br />
                      1. Click "Open Telegram" button
                      <br />
                      2. Share your contact in the bot
                      <br />
                      3. Bot will verify channel subscription
                      <br />
                      4. Click "Authorize" in the bot
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Register Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-primary/80 transition-colors font-semibold">
                Sign Up
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;