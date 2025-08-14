import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Plus, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, Link } from 'react-router-dom';
import { usePDF } from '../context/PDFContext';
import PdfCard from './PdfCard';

const UploadPage: React.FC = () => {
  const { pdfs, addPDF, removePDF, isProcessing, setProcessing } = usePDF();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shootingStars, setShootingStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }>>([]);

  // --- Enhanced particle background with shooting stars ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles: { x: number; y: number; r: number; dx: number; dy: number }[] = [];
    let shootingStarId = 0;
    const num = 80;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: num }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    // Create shooting stars periodically
    const createShootingStar = () => {
      if (Math.random() < 0.003) { // 0.3% chance per frame
        const newStar = {
          id: shootingStarId++,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.5, // Upper half of screen
          vx: (Math.random() - 0.5) * 8 + 4, // Horizontal velocity
          vy: Math.random() * 4 + 2, // Downward velocity
          life: 0,
          maxLife: 60 + Math.random() * 40, // 60-100 frames
        };
        setShootingStars(prev => [...prev.slice(-4), newStar]); // Keep max 5 shooting stars
      }
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw regular particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });

      // Update and draw shooting stars
      setShootingStars(prev => prev.map(star => {
        star.x += star.vx;
        star.y += star.vy;
        star.life++;
        
        // Draw shooting star trail
        const alpha = 1 - (star.life / star.maxLife);
        const trailLength = 8;
        
        for (let i = 0; i < trailLength; i++) {
          const trailAlpha = alpha * (1 - i / trailLength);
          const trailX = star.x - star.vx * i * 0.3;
          const trailY = star.y - star.vy * i * 0.3;
          
          ctx.fillStyle = `rgba(77, 163, 255, ${trailAlpha})`;
          ctx.beginPath();
          ctx.arc(trailX, trailY, (trailLength - i) * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw star core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        return star;
      }).filter(star => star.life < star.maxLife && star.x < canvas.width + 50 && star.y < canvas.height + 50));

      createShootingStar();
      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  // --- Drop handling ---
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
      'relative border-2 border-dashed rounded-2xl p-12 mb-8 transition-all duration-300 cursor-pointer backdrop-blur-md shadow-[0_0_30px_rgba(18,52,88,0.5)] overflow-hidden';
    if (isDragActive) {
      if (isDragAccept) base += ' border-[#4DA3FF] bg-[#0B1A2A]/60 scale-[1.02]';
      else if (isDragReject) base += ' border-red-500 bg-red-800/40';
      else base += ' border-[#4DA3FF] bg-[#0B1A2A]/60 scale-[1.02]';
    } else {
      base += ' border-[#4DA3FF]/40 bg-[#0B1A2A]/40 hover:border-[#4DA3FF] hover:bg-[#0B1A2A]/70 hover:shadow-[0_0_50px_rgba(77,163,255,0.5)]';
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
    <div className="relative min-h-screen bg-[#030303] text-white overflow-hidden">
      {/* Particle background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0"></canvas>

      {/* Navbar */}
      <nav className="relative z-10 bg-transparent p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">Home</Link>
          <Link to="/query" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">Role Based Query</Link>
          <Link to="/QueryDocument" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">Query Document</Link>
        </div>
      </nav>

      {/* Main Content */}
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Hero with enhanced gradient */}
        <motion.div variants={itemVariants} className="text-center mt-10 mb-12">
          <h1 className="text-5xl sm:text-6xl font-extrabold">
            <span 
              className="bg-gradient-to-r from-[#ff6ec4] via-[#7873f5] via-[#4DA3FF] to-[#4ade80] bg-clip-text text-transparent animate-pulse"
              style={{
                backgroundSize: '300% 100%',
                animation: 'gradientFlow 4s ease-in-out infinite',
              }}
            >
              PDF Analysis Tool
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mt-4 max-w-2xl mx-auto">
            Upload your PDFs for AI-powered analysis
          </p>
        </motion.div>

        {/* Dropzone with tracer border */}
        <motion.div variants={itemVariants}>
  <div className="relative max-w-3xl mx-auto">
    {/* Tracer border container */}
    <div className="absolute inset-0 rounded-2xl overflow-hidden">
      {/* Glowing tracer */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'conic-gradient(from 0deg, transparent 250deg, #00f7ff 280deg, #0fffc1 310deg, #00f7ff 340deg, transparent 360deg)',
          animation: 'spin 14s linear infinite',
          filter: 'drop-shadow(0 0 8px #00f7ff) drop-shadow(0 0 16px #0fffc1)',
        }}
      />
      {/* Dark inner background */}
      <div className="absolute inset-[4px] rounded-2xl bg-[#030303]" />
    </div>

    {/* Dropzone content */}
    <div {...getRootProps()} className={`${getDropzoneClassName()} relative z-10`}>
      <input {...getInputProps()} />
      <div className="text-center p-8">
        {isDragActive ? (
          isDragAccept ? (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-[#4DA3FF] mx-auto animate-bounce" />
              <p className="text-lg font-medium">Drop your PDFs here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <X className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
              <p className="text-lg font-medium text-red-400">Only PDF files are accepted</p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-[#4DA3FF] mx-auto transition-transform duration-200 hover:scale-110" />
            <p className="text-lg font-medium">Drag & drop PDFs here or click to upload</p>
            <p className="text-sm text-gray-400">Supports multiple PDFs (up to 50MB each)</p>
            <button className="mt-4 inline-flex items-center px-6 py-3 rounded-full bg-[#4DA3FF] text-[#030303] font-semibold shadow-lg hover:bg-[#89CFF0] hover:scale-105 transform transition-all duration-300 ease-out">
              <Plus className="w-5 h-5 mr-2" />
              Upload Files
            </button>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Keyframes for slow spin */}
  <style>{`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}</style>
        </motion.div>


        {/* Uploaded PDFs */}
        {pdfs.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-6 mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-semibold">Uploaded PDFs ({pdfs.length})</h2>
              <div className="text-lg text-gray-400">
                Total size: {formatFileSize(pdfs.reduce((sum, p) => sum + (p.size || 0), 0))}
              </div>
            </div>
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
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
              <div className="w-24 h-24 bg-[#4DA3FF]/20 border-4 border-[#4DA3FF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <FileText className="w-12 h-12 text-[#4DA3FF]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No PDFs uploaded yet</h3>
              <p className="text-gray-400">Upload your first PDF to get started with AI-powered document analysis</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* CSS-in-JS for custom animations */}
      <style jsx>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .gradient-text {
          background: linear-gradient(-45deg, #ff6ec4, #7873f5, #4DA3FF, #4ade80, #ff6ec4);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientFlow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default UploadPage;