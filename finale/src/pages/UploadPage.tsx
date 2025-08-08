
import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { usePDF } from '../context/PDFContext';

const UploadPage: React.FC = () => {
  const { pdfs, addPDF, removePDF, isProcessing, setProcessing } = usePDF();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    for (const file of acceptedFiles) {
      if (file.type === 'application/pdf') {
        setProcessing(file.name, true);

        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch('http://localhost:5001/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload PDF');
          }

          const result = await response.json();
          if (result.success) {
            addPDF(file, result.filename, result.outline);
          } else {
            throw new Error(result.error || 'Unknown error');
          }
        } catch (error) {
          console.error('Error uploading PDF:', error);
        } finally {
          setProcessing(file.name, false);
        }
      }
    }

    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles);
    }
  }, [addPDF, setProcessing]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024,
    noClick: false,
    noKeyboard: false
  });

  const handlePDFClick = (id: string) => {
    navigate(`/document/${id}`);
  };

  const handleRemovePDF = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removePDF(id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDropzoneClassName = () => {
    let baseClasses = "border-2 border-dashed rounded-2xl p-12 mb-8 transition-all duration-300 cursor-pointer bg-white/70 backdrop-blur-sm";
    if (isDragActive) {
      if (isDragAccept) {
        baseClasses += " border-green-400 bg-green-50/80 scale-[1.02]";
      } else if (isDragReject) {
        baseClasses += " border-red-400 bg-red-50/80";
      } else {
        baseClasses += " border-primary-400 bg-primary-50/80 scale-[1.02]";
      }
    } else {
      baseClasses += " border-gray-300 hover:border-primary-400 hover:bg-primary-25/50";
    }
    return baseClasses;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto mb-8">
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-primary-800 to-secondary-700 bg-clip-text text-transparent mb-4">
            PDF Analysis Tool
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload your PDFs to extract and navigate through document structure with AI-powered heading detection
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={itemVariants}
          {...getRootProps()}
          className={getDropzoneClassName()}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <motion.div
              animate={{ 
                scale: isDragActive ? 1.1 : 1,
                rotate: isDragActive ? 5 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mb-6 shadow-lg"
            >
              {isDragActive ? (
                <Plus className="w-10 h-10 text-primary-600" />
              ) : (
                <Upload className="w-10 h-10 text-primary-600" />
              )}
            </motion.div>
            
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              {isDragActive 
                ? isDragAccept 
                  ? 'Drop PDFs here' 
                  : 'Invalid file type'
                : 'Upload PDF Files'
              }
            </h3>
            
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {isDragActive
                ? 'Release to upload your PDF files'
                : 'Drag and drop your PDF files here, or click to select files'
              }
            </p>
            
            <button
              type="button"
              className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Upload className="w-6 h-6 mr-3" />
              Choose Files
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Supports PDF files up to 50MB each
            </p>
          </div>
        </motion.div>

        {pdfs.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">
                Uploaded PDFs ({pdfs.length})
              </h2>
              <div className="text-sm text-gray-500">
                Total size: {formatFileSize(pdfs.reduce((sum, pdf) => sum + pdf.size, 0))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pdfs.map((pdf, index) => (
                <motion.div
                  key={pdf.id}
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                  onClick={() => handlePDFClick(pdf.id)}
                  className="relative card card-hover cursor-pointer group overflow-hidden"
                >
                  <button
                    onClick={(e) => handleRemovePDF(e, pdf.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="absolute top-3 left-3 z-10">
                    {isProcessing(pdf.name) ? (
                      <div className="flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                        Processing
                      </div>
                    ) : pdf.processed ? (
                      <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </div>
                    ) : (
                      <div className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending
                      </div>
                    )}
                  </div>

                  <div className="aspect-[3/4] bg-gradient-to-br from-red-50 via-orange-50 to-red-100 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-orange-100/50" />
                    <FileText className="w-16 h-16 text-red-500 relative z-10" />
                    {isProcessing(pdf.name) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-slow" />
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-gray-800 truncate text-sm" title={pdf.name}>
                      {pdf.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(pdf.size)}</span>
                      <span>{pdf.uploadedAt.toLocaleDateString()}</span>
                    </div>
                    {pdf.outline && (
                      <p className="text-xs text-primary-600 font-medium">
                        {pdf.outline.outline.length} headings found
                      </p>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-primary-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {pdfs.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="text-center py-12"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No PDFs uploaded yet
              </h3>
              <p className="text-gray-500">
                Upload your first PDF to get started with AI-powered document analysis
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default UploadPage;