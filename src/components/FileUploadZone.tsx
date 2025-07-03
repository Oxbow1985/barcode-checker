import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ValidationError } from '../types';
import { validateFileSignature } from '../utils/fileValidation';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept: string;
  maxSize: number;
  title: string;
  description: string;
  file?: File;
  errors?: ValidationError[];
  className?: string;
  isProcessing?: boolean;
}

export function FileUploadZone({
  onFileSelect,
  accept,
  maxSize,
  title,
  description,
  file,
  errors = [],
  className = '',
  isProcessing = false
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      toast.error(`Fichier rejeté: ${error.message}`);
      return;
    }

    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setIsValidating(true);

      try {
        // Validate file signature for security
        const fileType = accept.includes('pdf') ? 'pdf' : 'excel';
        const isValidSignature = await validateFileSignature(selectedFile, fileType);
        
        if (!isValidSignature) {
          toast.error('Format de fichier non valide ou corrompu');
          return;
        }

        onFileSelect(selectedFile);
        toast.success(`Fichier ${selectedFile.name} sélectionné avec succès`);
      } catch (error) {
        toast.error('Erreur lors de la validation du fichier');
      } finally {
        setIsValidating(false);
      }
    }
  }, [onFileSelect, accept]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxSize,
    multiple: false,
    disabled: isProcessing,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const hasErrors = errors.length > 0;
  const isSuccess = file && !hasErrors;

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null as any);
    toast.success('Fichier supprimé');
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive || dragActive
            ? 'border-oxbow-400 bg-oxbow-50 dark:bg-oxbow-900/20 scale-[1.02]'
            : hasErrors
            ? 'border-error-300 bg-error-50 dark:bg-error-900/20 hover:border-error-400'
            : isSuccess
            ? 'border-success-300 bg-success-50 dark:bg-success-900/20 hover:border-success-400'
            : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-oxbow-300 hover:bg-oxbow-50 dark:hover:bg-oxbow-900/20'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        whileHover={!isProcessing ? { scale: 1.01 } : {}}
        whileTap={!isProcessing ? { scale: 0.99 } : {}}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <motion.div 
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${hasErrors
                ? 'bg-error-100 dark:bg-error-900/30'
                : isSuccess
                ? 'bg-success-100 dark:bg-success-900/30'
                : 'bg-gray-100 dark:bg-slate-700'
              }
            `}
            animate={isValidating ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isValidating ? Infinity : 0 }}
          >
            {isValidating ? (
              <div className="w-8 h-8 border-2 border-oxbow-200 border-t-oxbow-500 rounded-full animate-spin" />
            ) : hasErrors ? (
              <AlertCircle className="w-8 h-8 text-error-500" />
            ) : isSuccess ? (
              <CheckCircle className="w-8 h-8 text-success-500" />
            ) : (
              <Upload className={`w-8 h-8 ${isDragActive ? 'text-oxbow-500' : 'text-gray-400 dark:text-gray-500'}`} />
            )}
          </motion.div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
            
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div 
                  className="flex items-center justify-center space-x-2 text-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <File className="w-4 h-4" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  {!isProcessing && (
                    <button
                      onClick={removeFile}
                      className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.p 
                  className="text-sm text-gray-500 dark:text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Glissez-déposez votre fichier ici ou cliquez pour sélectionner
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div 
            className="mt-3 space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {errors.map((error, index) => (
              <motion.p 
                key={index} 
                className="text-sm text-error-600 dark:text-error-400 flex items-center space-x-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AlertCircle className="w-4 h-4" />
                <span>{error.message}</span>
              </motion.p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}