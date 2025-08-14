import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePDF } from '../context/PDFContext';
import PdfCard from './PdfCard';
import { useNavigate } from 'react-router-dom';
import { output } from 'framer-motion/client';
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
  }>;
  
  registerCallback(
    eventType: string,
    callback: (event: any) => void,
    options: { enablePageChangeEvents: boolean }
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
  const { pdfs, removePDF, isProcessing, getPDFByServerFilename } = usePDF();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string>('');
  const [selectedText, setSelectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const viewerRef = useRef<any>(null);
  const [negativeResult, setNegativeResult] = useState<any>(null);
  const navigate = useNavigate();
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);
  const handleRemovePDF = (id: string | number) => {
    removePDF(id as string);
  };
  // ------------------- handling the similarity click -----------//
  const handleSimilarityClick = () => {
    // Assuming you have access to the output object that contains the extracted sections
    // and subsection analysis from your state or props
    
    navigate('/similarity', { state: { result } });
  };
  const handleContradictoryClick = () => {
    // Assuming you have access to the output object that contains the extracted sections
    // and subsection analysis from your state or props
    
    navigate('/contradictory', { state: { negativeResult } });
  };
  const handlePDFClick = (id: string | number) => {
    navigate(`/document/${id}`);
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
  
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
  
      const formData = new FormData();
      formData.append('pdf', file); // backend expects "pdf"
  
      try {
        const response = await fetch(`http://localhost:5001/upload-only-file`, {
          method: 'POST',
          body: formData,
        });
  
        const data = await response.json();
  
        if (response.ok) {
          // Store server filename and original name for later use
          setUploadedPdfUrl(data.filename);
          setOriginalFilename(file.name);
        } else {
          setError(data.error || 'Failed to upload PDF');
        }
      } catch (err) {
        setError('Error uploading PDF');
        console.error('Upload error:', err);
      }
    } else {
      setError('Please select a valid PDF file');
    }
  };
  
  // Run Adobe viewer only when file info is ready AND div is rendered
  useEffect(() => {
    if (uploadedPdfUrl && originalFilename) {
      initializeAdobePDFViewer(uploadedPdfUrl, originalFilename);
    }
  }, [uploadedPdfUrl, originalFilename]);

  const initializeAdobePDFViewer = (serverFilename: string, originalName: string) => {
    if (window.AdobeDC) {
      const adobeDCView = new window.AdobeDC.View({
        clientId: "35466cb0881f4c34abe4f6c105cfcf90",
        divId: "pdf-viewer",
      });

      adobeDCView
        .previewFile(
          {
            content: {
              location: { url: `http://localhost:5001/uploads/${serverFilename}` },
            },
            metaData: { fileName: originalName },
          },
          {
            embedMode: "FULL_WINDOW",
            defaultViewMode: "FIT_PAGE",
            showAnnotationTools: true,
            enableSearchAPIs: true,
            enableTextSelectionEvent: true,
          }
        )
        .then((viewer: any) => {
          viewerRef.current = viewer;

          // ✅ Ensure file preview events are enabled
          viewer.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
            async (event: any) => {
              if (event.type === "PAGE_VIEW") {
                setCurrentPage(event.data.pageNumber);
              }

              if (event.type === "PREVIEW_SELECTION_END") {
                try {
                  const apis = await viewer.getAPIs();
                  const selectedContent = await apis.getSelectedContent();
                  if (selectedContent?.length) {
                    const text = selectedContent.map((item: any) => item.text).join(" ");
                    console.log("Selected text:", text);
                    setSelectedText(text);
                  }
                } catch (error) {
                  console.error("Error getting selected content:", error);
                }
              }
            },
            { enablePageViewEvents: true, enableFilePreviewEvents: true } // ✅ key change
          );
        });
    }
  };
  
  // Initialize Adobe PDF viewer after file upload
  // Removed useEffect - now handled directly in handleFileUpload

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setNegativeResult(null); // for the second API
    if (!selectedText.trim()) {
      setError('Please select text to query');
      return;
    }
  
    const documentsPayload = pdfs.map(p => ({
      filename: p.serverFilename,
      outline: p.outline,
      sections: (p as any).sections ?? undefined
    }));
  
    const payload = {
      documents: documentsPayload,
      selectedText: selectedText
    };
  
    setLoading(true);
    try {
      const [resp1, resp2] = await Promise.all([
        fetch('http://localhost:5001/pdf_query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }),
        fetch('http://localhost:5001/pdf_query_negative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      ]);
  
      if (!resp1.ok || !resp2.ok) {
        const body1 = await resp1.json().catch(() => null);
        const body2 = await resp2.json().catch(() => null);
        throw new Error(body1?.error || body2?.error || 'One of the requests failed');
      }
  
      const data1 = await resp1.json();
      const data2 = await resp2.json();
  
      setResult(data1);
      setNegativeResult(data2);
  
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Navigation */}
      <nav className="bg-[#002147] backdrop-blur-md border border-[#002147]/20 p-3 rounded-xl shadow-lg mb-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="/" className="text-white font-semibold transition-all duration-200 ease-in-out hover:scale-105">
            Home
          </a>
          <div className="flex gap-4">
            <a href="/query" className="text-white font-semibold transition-all duration-200 ease-in-out hover:scale-105">
              Role Based Query
            </a>
            <a href="/pdf-query" className="text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-lg">
              PDF Query
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
        {/* Left Sidebar - Upload Component */}
        <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full overflow-hidden order-1 lg:order-1">
          <div className="flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800 mb-1">PDF Query</h2>
            <p className="text-xs text-slate-600 mb-3">Upload PDF and select text to query</p>
          </div>

          <div  className="space-y-4 flex-shrink-0">
            {/* File Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Upload PDF</label>
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
                  className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                >
                  {selectedFile ? (
                    <div className="text-sm">
                      <div className="text-indigo-600 font-medium">{selectedFile.name}</div>
                      <div className="text-slate-500 text-xs">Click to change</div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      <div className="text-2xl mb-1">📄</div>
                      <div>Click to upload PDF</div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Selected Text Display */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Selected Text</label>
              <div className="min-h-[80px] border border-slate-200 rounded-lg p-3 text-sm bg-slate-50">
                {selectedText ? (
                  <div className="text-slate-700">{selectedText}</div>
                ) : (
                  <input
                    type="text"
                    placeholder="Select text from the PDF to query"
                    className="text-slate-400 italic border border-slate-300 rounded px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                  />
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              type="submit"
              className="w-full py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !selectedFile || !selectedText}
            >
              {loading ? 'Processing...' : 'Submit Query'}
            </button>
            {/* Uploaded PDFs section */}
            <div className="mt-4 flex-1 min-h-0 overflow-hidden flex flex-col">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex-shrink-0">
                Uploaded PDFs ({pdfs.length})
              </h3>

              <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {pdfs.length > 0 ? (
                  <motion.div variants={containerVariants} initial="hidden" animate="show">
                    <div className="space-y-2">
                    {pdfs.map(pdf => (
                      <motion.div key={pdf.id} variants={itemVariants}>
                        <PdfCard
                          pdf={pdf}
                          onRemove={(id) => handleRemovePDF(id)}
                          onClick={(id) => handlePDFClick(id)}
                          isProcessing={(name) => isProcessing ? isProcessing(name) : false}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                ) : (
                <div className="text-xs text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                  No PDFs uploaded yet
                </div>
                )}
              </div>
            </div>

        
            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Center - PDF Viewer */}
        <div className="lg:col-span-3 flex-1 bg-gradient-to-br from-gray-100 to-gray-200 p-4 lg:p-8 rounded-xl order-2 lg:order-2">
          <div className="max-w-5xl mx-auto h-full">
            {selectedFile && uploadedPdfUrl ? (
              <div
                id="pdf-viewer"
                className="w-full h-full max-h-[90vh] bg-white rounded-2xl shadow-xl"
                
              />
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white shadow-xl">
                <div className="text-6xl mb-4">📄</div>
                <div className="text-xl font-semibold mb-2">No PDF Selected</div>
                <div className="text-sm">Upload a PDF file to view and query it</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="max-w-7xl mx-auto mt-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Query Results</h3>
            
            

            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-2 mt-6">
              <motion.button
                whileHover={{ scale: 1.05, brightness: 1.1 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-l-full hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                onClick={() => handleSimilarityClick()}
              >
                Similarity
              </motion.button>
              
              <div className="px-3 py-3 bg-slate-300 text-slate-600 font-medium text-sm">
                or
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05, brightness: 1.1 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-r-full hover:from-red-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl"
                onClick={() => handleContradictoryClick()}
              >
                Contradictory
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfQueryPage;