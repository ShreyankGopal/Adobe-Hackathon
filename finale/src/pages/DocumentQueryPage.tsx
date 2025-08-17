import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePDF } from '../context/PDFContext';
import PdfCard from './PdfCard';
import { useNavigate, Link } from 'react-router-dom';
import RightPanel from './RightPanel';
import { Brain } from "lucide-react";

declare global {
  interface Window {
    AdobeDC: {
      View: {
        new (config: { clientId: string; divId: string }): AdobeDCView;
        Enum: {
          CallbackType: {
            EVENT_LISTENER: string;
          };
        };
      };
    };
  }
}

interface AdobeDCView {
  previewFile(
    fileConfig: {
      content: {
        location: {
          url: string;
        };
      };
      metaData: {
        fileName: string;
      };
    },
    viewerConfig: {
      embedMode: string;
      defaultViewMode: string;
      showAnnotationTools: boolean;
      enableSearchAPIs: boolean;
      enableFilePreviewEvents: boolean;
      enableTextSelectionEvent: boolean;
    }
  ): Promise<any>;

  getAPIs(): Promise<{
    gotoLocation: (location: { pageNumber: number }) => Promise<void>;
    getSelectedContent?: () => Promise<any>;
  }>;

  registerCallback(
    eventType: string,
    callback: (event: any) => void,
    options?: any
  ): void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

const PdfQueryPage: React.FC = () => {
  const { pdfs, removePDF, isProcessing } = usePDF();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [negativeResult, setNegativeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  // State for the AI Insights Hub
  const [isInsightsPanelOpen, setIsInsightsPanelOpen] = useState(false);
  const [combinedInsights, setCombinedInsights] = useState<any>(null);

  const STORAGE_KEYS = {
    positiveResult: 'pdfQuery.result',
    negativeResult: 'pdfQuery.negativeResult',
    selectedText: 'pdfQuery.selectedText',
    showResults: 'pdfQuery.showResults'
  };

  useEffect(() => {
    // This effect restores the entire state on page load/re-visit
    try {
      const storedShow = sessionStorage.getItem(STORAGE_KEYS.showResults);
      if (storedShow === '1') {
        const storedResult = sessionStorage.getItem(STORAGE_KEYS.result);
        const storedNegative = sessionStorage.getItem(STORAGE_KEYS.negative);
        const storedText = sessionStorage.getItem(STORAGE_KEYS.selectedText) || '';
        
        const parsedResult = storedResult ? JSON.parse(storedResult) : null;
        const parsedNegative = storedNegative ? JSON.parse(storedNegative) : null;

        setResult(parsedResult);
        setNegativeResult(parsedNegative);
        setSelectedText(storedText);
        setShowResults(true);

        // Also restore combined insights
        // if (parsedResult?.insights && parsedNegative?.insights) {
        //   setCombinedInsights({
        //     summary: `${parsedResult.insights.summary}\n\n${parsedNegative.insights.summary}`,
        //     didYouKnow: `${parsedResult.insights.didYouKnow}\n\n${parsedNegative.insights.didYouKnow}`,
        //     podcast: {
        //       script: `${parsedResult.insights.podcast.script}\n\n${parsedNegative.insights.podcast.script}`,
        //       audio_url: parsedResult.insights.podcast.audio_url // Or combine them if logic allows
        //     }
        //   });
        // }
      }
    } catch (e) {
      console.warn('Failed to restore persisted pdf query:', e);
    }
  }, []);

  const handleRemovePDF = (id: string | number) => {
    removePDF(id as string);
  };

  const handleSimilarityClick = () => {
    console.log("result", result);
    
    navigate('/similarity', { state: { result, selectedText } });
  };
  const handleContradictoryClick = () => {
    console.log("negativeResult", negativeResult);
    navigate('/contradictory', { state: { negativeResult, selectedText } });
  };
  const handlePDFClick = (id: string | number) => {
    navigate(`/document/${id}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      return;
    }

    setSelectedFile(file);
    setError(null);
    Object.values(STORAGE_KEYS).forEach(key => sessionStorage.removeItem(key));
    setShowResults(false);
    setResult(null);
    setNegativeResult(null);
    setCombinedInsights(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch(`http://localhost:5001/upload-only-file`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setUploadedPdfUrl(data.filename);
        setOriginalFilename(file.name);
      } else {
        setError(data.error || 'Failed to upload PDF');
      }
    } catch (err) {
      setError('Error uploading PDF');
    }
  };
  
  useEffect(() => {
    let adobeDCView: any;

    const initializeAdobePDFViewer = (serverFilename: string, originalName: string) => {
      if (window.AdobeDC) {
        adobeDCView = new window.AdobeDC.View({
          clientId: import.meta.env.VITE_ADOBE_CLIENT_ID, // Replace with your Adobe Client ID
          divId: "pdf-viewer",
        });

        const previewFilePromise = adobeDCView.previewFile(
          {
            content: { location: { url: `http://localhost:5001/uploads/${serverFilename}` } },
            metaData: { fileName: originalName },
          },
          {
            embedMode: "FULL_WINDOW",
            defaultViewMode: "FIT_PAGE",
            showAnnotationTools: true,
            enableSearchAPIs: true,
            enableFilePreviewEvents: true,
            enableTextSelectionEvent: true
          }
        );

        adobeDCView.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
          async (event: any) => {
            if (event.type === "PREVIEW_SELECTION_END") {
              try {
                const viewer = await previewFilePromise;
                const apis = await viewer.getAPIs?.();
                const selectedContent = await apis?.getSelectedContent?.();
                if (selectedContent?.data?.length) {
                  const text = Array.isArray(selectedContent.data)
                    ? selectedContent.data.map((i: any) => (i.text || '')).join(' ')
                    : String(selectedContent.data);
                  setSelectedText(text);
                }
              } catch (error) {
                console.error("Error handling text selection:", error);
              }
            }
          },
          { enableFilePreviewEvents: true }
        );
      }
    };

    if (uploadedPdfUrl && originalFilename) {
      initializeAdobePDFViewer(uploadedPdfUrl, originalFilename);
    }

  }, [uploadedPdfUrl, originalFilename]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedText.trim()) {
      setError('Please select text from the PDF to query');
      return;
    }
    
    setError(null);
    setLoading(true);
    setShowResults(false);
    setCombinedInsights(null);

    const documentsPayload = pdfs.map(p => ({
      filename: p.serverFilename,
      outline: p.outline,
      sections: (p as any).sections ?? undefined
    }));
    const payload = { documents: documentsPayload, selectedText };

    try {
      const respPositive = await fetch('http://localhost:5001/pdf_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await respPositive.json();
      console.log(data);
      if (!respPositive.ok) {
        throw new Error(data?.error || 'One of the requests failed');
      }

      setResult(data.Positive);
      setNegativeResult(data.Negative);
      setShowResults(true);

      sessionStorage.setItem(STORAGE_KEYS.positiveResult, JSON.stringify(data.Positive));
      sessionStorage.setItem(STORAGE_KEYS.negativeResult, JSON.stringify(data.Negative));
      sessionStorage.setItem(STORAGE_KEYS.selectedText, selectedText);
      sessionStorage.setItem(STORAGE_KEYS.showResults, '1');

     
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303]">
  <nav className="relative z-10 bg-transparent p-4 text-white mb-4">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <Link
        to="/"
        className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors transform transition-transform duration-200 hover:scale-110"
      >
        Home
      </Link>
      <Link
        to="/query"
        className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors transform transition-transform duration-200 hover:scale-110"
      >
        Role Based Query
      </Link>
      <Link
        to="/QueryDocument"
        className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors transform transition-transform duration-200 hover:scale-110"
      >
        Query Document
      </Link>
    </div>
  </nav>

  <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[calc(100vh-120px)]">
    {/* Sidebar */}
    <div className="lg:col-span-1 bg-[#2A0A2A]/90 rounded-xl shadow-xl border border-purple-900/40 p-4 flex flex-col max-h-full">
      <div className="flex-shrink-0">
        <h2 className="text-lg font-bold text-white mb-1">Document Query</h2>
        <p className="text-xs text-gray-300 mb-5">
          Select text from an uploaded PDF to analyze.
        </p>
      </div>

      <div className="space-y-4 flex-shrink-0">
        {/* Upload PDF */}
        <div>
          <label className="block text-xs font-semibold text-gray-200 mb-2">
            Upload PDF
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="w-full rounded-xl border border-dashed border-purple-800/60 
                         bg-[#111] hover:bg-purple-900/30 
                         p-6 flex flex-col items-center justify-center text-center 
                         cursor-pointer transition-all duration-300 ease-in-out
                         hover:border-purple-500/70"
            >
              {selectedFile ? (
                <div className="text-sm">
                  <div className="text-gray-400 text-xs">Click to change</div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-sm">Click to upload PDF</div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Selected Text */}
        <div>
          <label className="block text-xs font-semibold text-gray-200 mb-2">
            Selected Text
          </label>
          <div className="min-h-[80px] max-h-32 border border-purple-800/40 rounded-lg p-3 text-sm bg-[#2A0A2A]/90 text-gray-100 overflow-y-auto">
            {selectedText}
          </div>
        </div>

        {/* Submit + Results */}
        <div className="space-y-3 pt-2">
          {!showResults ? (
            <button
              onClick={handleSubmit}
              className="w-full py-2.5 text-sm font-semibold rounded-lg 
                         bg-purple-600 text-white 
                         hover:from-indigo-700 hover:to-purple-700 
                         transition-all shadow-lg hover:shadow-xl 
                         disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !selectedFile || !selectedText}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 
                         0 5.373 0 12h4zm2 5.291A7.962 
                         7.962 0 014 12H0c0 3.042 1.135 
                         5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Submit Query"
              )}
            </button>
          ) : (
            <div className="bg-[#2A0A2A]/90 border border-purple-800/40 p-3 rounded-lg space-y-3 
                flex flex-col items-center justify-center text-center">

              <p className="text-sm font-semibold text-white">
                Query Complete!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
  <motion.button
    whileHover={{ scale: 1.05 }}
    className="flex-1 py-3 sm:py-2 text-sm font-semibold rounded-xl 
               bg-emerald-800 text-white shadow-md"
    onClick={handleSimilarityClick}
  >
    Similarities
  </motion.button>
  <motion.button
    whileHover={{ scale: 1.05 }}
    className="flex-1 py-3 sm:py-2 text-sm font-semibold rounded-xl 
               bg-rose-800 text-white shadow-md"
    onClick={handleContradictoryClick}
  >
    Contradictions
  </motion.button>
</div>

<button
  onClick={() => setIsInsightsPanelOpen(!isInsightsPanelOpen)}
  className="relative px-3 py-2 rounded-xl font-semibold text-white transition-all duration-500
             bg-gradient-to-r from-fuchsia-500 via-indigo-600 to-violet-600
             bg-[length:300%_300%] animate-gradientMove
             shadow-md hover:shadow-lg
             overflow-hidden group mb-2 flex items-center gap-2 text-sm"
>
  {/* Shine effect */}
  <span
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent 
               -translate-x-[200%] group-hover:translate-x-[200%]
               transition-transform duration-700 ease-in-out"
  ></span>

  <span className="relative z-10 flex items-center gap-1">
    <Brain className="w-4 h-4" />
    AI Insights
  </span>
</button>

            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-900/40 p-2 rounded-lg border border-red-800">
            {error}
          </div>
        )}
      </div>

      {/* PDF List */}
      <div className="mt-4 flex-1 min-h-0 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-200 mb-2 flex-shrink-0">
          Source PDFs ({pdfs.length})
        </h3>
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-transparent max-h-[calc(62vh-200px)]">
          {pdfs.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <div className="space-y-2">
                {pdfs.map((pdf) => (
                  <motion.div key={pdf.id} variants={itemVariants}>
                    <PdfCard
                      pdf={pdf}
                      onRemove={(id) => handleRemovePDF(id)}
                      onClick={(id) => handlePDFClick(id)}
                      isProcessing={(name) =>
                        isProcessing ? isProcessing(name) : false
                      }
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="text-xs text-gray-400 text-center py-8 border-2 border-dashed border-purple-800/40 rounded-lg">
              No PDFs uploaded yet
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Main PDF Viewer */}
    <div className="lg:col-span-3 flex-1 bg-[#2A0A2A]/90 rounded-xl border border-purple-900/40 p-4 lg:p-8 order-2 lg:order-2">
      <div className="max-w-5xl mx-auto h-full">
        {selectedFile && uploadedPdfUrl ? (
          <div
            id="pdf-viewer"
            className="w-full h-full max-h-[90vh] bg-[#111] rounded-2xl border border-purple-900/40 shadow-xl"
          />
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-gray-400 border-2 border-dashed border-purple-800/40 rounded-2xl bg-[#111] shadow-xl">
            <div className="text-6xl mb-4">📄</div>
            <div className="text-xl font-semibold mb-2 text-white">
              No PDF Selected
            </div>
            <div className="text-sm text-gray-300">
              Upload a PDF file to view and query it
            </div>
          </div>
        )}
      </div>
    </div>
  </div>

  <RightPanel
    visible={isInsightsPanelOpen}
    onClose={() => setIsInsightsPanelOpen(false)}
    text={selectedText+result?.sections_formatted+negativeResult?.sections_formatted}
    feature="full"
  />
</div>

  );
};

export default PdfQueryPage;