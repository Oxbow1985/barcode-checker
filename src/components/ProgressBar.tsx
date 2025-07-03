import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  message?: string;
  className?: string;
}

export function ProgressBar({ progress, message, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progression</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-oxbow-500 to-oxbow-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      {message && (
        <motion.p 
          className="text-sm text-gray-600 dark:text-gray-400 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={message}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}