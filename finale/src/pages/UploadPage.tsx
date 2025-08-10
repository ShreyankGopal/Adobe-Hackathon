import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Plus, X as XIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, Link } from 'react-router-dom';
import { usePDF } from '../context/PDFContext';
import PdfCard from './PdfCard';

const UploadPage: React.FC = () => {
  const { pdfs, addPDF, removePDF, isProcessing, setProcessing } = usePDF();
  const navigate = useNavigate();

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
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
              const body = await response.json().catch(() => null);
              throw new Error(body?.error || 'Failed to upload PDF');
            }

            const result = await response.json();
            if (result.success) {
              addPDF(file, result.filename, result.outline, result.sections);
            } else {
              throw new Error(result.error || 'Unknown error');
            }
          } catch (error) {
            console.error('Error uploading PDF:', error);
          } finally {
            setProcessing(file.name, false);
          }
        } else {
          console.warn('Rejected non-pdf file: ', file.name);
        }
      }

      if (rejectedFiles.length > 0) {
        console.warn('Some files were rejected:', rejectedFiles);
      }
    },
    [addPDF, setProcessing]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    maxSize: 50 * 1024 * 1024,
  });

  const handlePDFClick = (id: string) => navigate(`/document/${id}`);
  const handleRemovePDF = (id: string | number) => removePDF(id as string);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDropzoneClassName = () => {
    let base =
      'border-2 border-dashed rounded-2xl p-12 mb-8 transition-all duration-300 cursor-pointer backdrop-blur-sm shadow-md';
    if (isDragActive) {
      if (isDragAccept) base += ' border-mint-400 bg-mint-100 scale-[1.02]';
      else if (isDragReject) base += ' border-red-400 bg-red-50/80';
      else base += ' border-sailor-400 bg-sailor-50/80 scale-[1.02]';
    } else {
      base += ' border-sailor-200 bg-white/80 hover:border-mint-400 hover:bg-mint-50/70 hover:shadow-lg';
    }
    return base;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003366] via-[#004080] to-[#66FFCC]">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-[#001F33] to-[#00334D] p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-white text-xl font-semibold hover:text-gray-200 transition-colors duration-200"
          >
            Home
          </Link>
          <Link
            to="/query"
            className="text-white text-xl font-semibold hover:text-gray-200 transition-colors duration-200"
          >
            Role Based Query
          </Link>
        </div>
      </nav>

      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto mb-8">
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-md">
              PDF Analysis Tool
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Upload your PDFs for AI-powered analysis
            </p>
          </motion.div>
        </div>

        {/* Dropzone */}
        <motion.div variants={itemVariants}>
        <div
          {...getRootProps()}
          className={`${getDropzoneClassName()} max-w-3xl mx-auto rounded-2xl shadow-lg border-2 border-dashed border-red-500 bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-xl hover:border-mint-300 transition-all duration-300`}
        >
            <input {...getInputProps()} />
            <div className="text-center p-8">
              {isDragActive ? (
                isDragAccept ? (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-mint-500 mx-auto animate-bounce" />
                    <p className="text-lg font-medium text-mint-700">Drop your PDFs here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <XIcon className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                    <p className="text-lg font-medium text-red-600">Only PDF files are accepted</p>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-mint-500 mx-auto transition-transform duration-200 hover:scale-110" />
                  <p className="text-lg font-medium text-gray-800">
                    Drag & drop PDFs here or click to upload
                  </p>
                  <p className="text-sm text-gray-600">
                    Supports multiple PDFs (up to 50MB each)
                  </p>
                  <button
                    className="mt-4 inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-300 via-mint-400 to-emerald-300 text-sailor-900 font-semibold shadow-lg hover:from-mint-300 hover:via-mint-200 hover:to-mint-300 hover:scale-105 transform transition-all duration-300 ease-out"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Upload Files
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>



        {/* Uploaded PDFs grid */}
        {pdfs.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">Uploaded PDFs ({pdfs.length})</h2>
              <div className="text-lg text-white">
                Total size: {formatFileSize(pdfs.reduce((sum, p) => sum + (p.size || 0), 0))}
              </div>
            </div>

            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 max-w-5xl">
                {pdfs.map((pdf, index) => (
                  <motion.div
                    key={pdf.id}
                    initial={{ scale: 0.98, opacity: 0, y: 8 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
                  >
                    <PdfCard
                      pdf={pdf}
                      onRemove={(id) => handleRemovePDF(id)}
                      onClick={(id) => handlePDFClick(id)}
                      isProcessing={(name) => Boolean(isProcessing && isProcessing(name))}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Empty state */}
        {pdfs.length === 0 && (
          <motion.div variants={itemVariants} className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-mint-100 to-sailor-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <FileText className="w-12 h-12 text-mint-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No PDFs uploaded yet</h3>
              <p className="text-mint-200">Upload your first PDF to get started with AI-powered document analysis</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadPage;
