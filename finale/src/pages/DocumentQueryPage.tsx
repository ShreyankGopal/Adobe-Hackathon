
// import React, { useState, useEffect, useRef } from 'react';
// import { motion } from 'framer-motion';
// import { usePDF } from '../context/PDFContext';
// import PdfCard from './PdfCard';
// import { useNavigate } from 'react-router-dom';
// import { Link } from 'react-router-dom';
// import RightPanel from './RightPanel'; // NEW: RightPanel import

// declare global {
//   interface Window {
//     AdobeDC: {
//       View: {
//         new (config: { clientId: string; divId: string }): AdobeDCView;
//         Enum: {
//           CallbackType: {
//             EVENT_LISTENER: string;
//           };
//         };
//       };
//     };
//   }
// }

// interface AdobeDCView {
//   previewFile(
//     fileConfig: {
//       content: {
//         location: {
//           url: string;
//         };
//       };
//       metaData: {
//         fileName: string;
//       };
//     },
//     viewerConfig: {
//       embedMode: string;
//       defaultViewMode: string;
//       showAnnotationTools: boolean;
//       enableSearchAPIs: boolean;
//       enableFilePreviewEvents: boolean;
//       enableTextSelectionEvent: boolean;
//     }
//   ): Promise<any>;

//   getAPIs(): Promise<{
//     gotoLocation: (location: { pageNumber: number }) => Promise<void>;
//     getSelectedContent?: () => Promise<any>;
//   }>;

//   registerCallback(
//     eventType: string,
//     callback: (event: any) => void,
//     options?: any
//   ): void;
// }

// const containerVariants = {
//   hidden: { opacity: 0 },
//   show: {
//     opacity: 1,
//     transition: {
//       staggerChildren: 0.1
//     }
//   }
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 20 },
//   show: { opacity: 1, y: 0 }
// };

// const PdfQueryPage: React.FC = () => {
//   const { pdfs, removePDF, isProcessing, getPDFByServerFilename } = usePDF();
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string>('');
//   const [selectedText, setSelectedText] = useState<string>('');
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const viewerRef = useRef<any>(null);
//   const [negativeResult, setNegativeResult] = useState<any>(null);
//   const navigate = useNavigate();
//   const [originalFilename, setOriginalFilename] = useState<string | null>(null);
//   const [showResults, setShowResults] = useState<boolean>(false);
//   const [isInsightsPanelOpen, setIsInsightsPanelOpen] = useState(false);
//   const [combinedInsights, setCombinedInsights] = useState<any>(null);

//   // sessionStorage keys
//   const STORAGE_KEYS = {
//     result: 'pdfQuery.result',
//     negative: 'pdfQuery.negativeResult',
//     selectedText: 'pdfQuery.selectedText',
//     showResults: 'pdfQuery.showResults'
//   };

//   // Restore persisted query (if any) on mount so results persist when navigating back
//   useEffect(() => {
//     try {
//       const storedShow = sessionStorage.getItem(STORAGE_KEYS.showResults);
//       if (storedShow === '1') {
//         const storedResult = sessionStorage.getItem(STORAGE_KEYS.result);
//         const storedNegative = sessionStorage.getItem(STORAGE_KEYS.negative);
//         const storedText = sessionStorage.getItem(STORAGE_KEYS.selectedText) || '';
//         if (storedResult) setResult(JSON.parse(storedResult));
//         if (storedNegative) setNegativeResult(JSON.parse(storedNegative));
//         setSelectedText(storedText);
//         setShowResults(true);

//         // Try to restore combinedInsights if present in storedResult/negative (best-effort)
//         try {
//           const parsedResult = storedResult ? JSON.parse(storedResult) : null;
//           const parsedNegative = storedNegative ? JSON.parse(storedNegative) : null;
//           if (parsedResult?.insights && parsedNegative?.insights) {
//             const combined = {
//               summary: `${parsedResult.insights.summary}\n\n${parsedNegative.insights.summary}`,
//               didYouKnow: `${parsedResult.insights.didYouKnow} Also, ${parsedNegative.insights.didYouKnow}`,
//               podcast: {
//                 script: `${parsedResult.insights.podcast.script}\n\n${parsedNegative.insights.podcast.script}`,
//                 audio_url: `http://localhost:5001/podcast?text=${encodeURIComponent(
//                   parsedResult.insights.podcast.script + '\n' + parsedNegative.insights.podcast.script
//                 )}`
//               }
//             };
//             setCombinedInsights(combined);
//           }
//         } catch (err) {
//           // ignore parsing issues
//         }
//       }
//     } catch (e) {
//       console.warn('Failed to restore persisted pdf query:', e);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleRemovePDF = (id: string | number) => {
//     removePDF(id as string);
//   };

//   const handleSimilarityClick = () => {
//     navigate('/similarity', { state: { result } });
//   };
//   const handleContradictoryClick = () => {
//     navigate('/contradictory', { state: { negativeResult } });
//   };
//   const handlePDFClick = (id: string | number) => {
//     navigate(`/document/${id}`);
//   };

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];

//     if (file && file.type === 'application/pdf') {
//       setSelectedFile(file);
//       setError(null);

//       // clear any previous persisted query because uploading a new file probably implies new work
//       try {
//         sessionStorage.removeItem(STORAGE_KEYS.result);
//         sessionStorage.removeItem(STORAGE_KEYS.negative);
//         sessionStorage.removeItem(STORAGE_KEYS.selectedText);
//         sessionStorage.removeItem(STORAGE_KEYS.showResults);
//       } catch (e) {
//         // ignore
//       }

//       const formData = new FormData();
//       formData.append('pdf', file); // backend expects "pdf"

//       try {
//         const response = await fetch(`http://localhost:5001/upload-only-file`, {
//           method: 'POST',
//           body: formData,
//         });

//         const data = await response.json();

//         if (response.ok) {
//           // Store server filename and original name for later use
//           setUploadedPdfUrl(data.filename);
//           setOriginalFilename(file.name);
//         } else {
//           setError(data.error || 'Failed to upload PDF');
//         }
//       } catch (err) {
//         setError('Error uploading PDF');
//         console.error('Upload error:', err);
//       }
//     } else {
//       setError('Please select a valid PDF file');
//     }
//   };

//   useEffect(() => {
//     let adobeDCView: any;

//     const initializeAdobePDFViewer = (serverFilename: string, originalName: string) => {
//       if (window.AdobeDC) {
//         adobeDCView = new window.AdobeDC.View({
//           clientId: "35466cb0881f4c34abe4f6c105cfcf90",
//           divId: "pdf-viewer",
//         });

//         const previewFilePromise = adobeDCView.previewFile(
//           {
//             content: { location: { url: `http://localhost:5001/uploads/${serverFilename}` } },
//             metaData: { fileName: originalName },
//           },
//           {
//             embedMode: "FULL_WINDOW",
//             defaultViewMode: "FIT_PAGE",
//             showAnnotationTools: true,
//             enableSearchAPIs: true,
//             enableFilePreviewEvents: true,
//             enableTextSelectionEvent: true
//           }
//         );

//         adobeDCView.registerCallback(
//           window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
//           async (event: any) => {
//             if (event.type === "PREVIEW_SELECTION_END") {
//               try {
//                 const viewer = await previewFilePromise;
//                 const apis = await viewer.getAPIs?.();
//                 const selectedContent = await apis?.getSelectedContent?.();
//                 if (selectedContent?.data?.length) {
//                   // join selected content pieces (the viewer returns array items)
//                   const text = Array.isArray(selectedContent.data)
//                     ? selectedContent.data.map((i: any) => (i.text || '')).join(' ')
//                     : String(selectedContent.data);
//                   setSelectedText(text);
//                 }
//               } catch (error) {
//                 console.error("Error handling text selection:", error);
//               }
//             }
//           },
//           { enableFilePreviewEvents: true }
//         );
//       }
//     };

//     if (uploadedPdfUrl && originalFilename) {
//       initializeAdobePDFViewer(uploadedPdfUrl, originalFilename);
//     }

//     return () => {
//       // cleanup reference
//       viewerRef.current = null;
//       adobeDCView = null;
//     };
//   }, [uploadedPdfUrl, originalFilename]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     // clear previous results in memory (and persistences) before making new call
//     setResult(null);
//     setNegativeResult(null);
//     setShowResults(false);
//     setCombinedInsights(null); // NEW: clear previous combined insights
//     setIsInsightsPanelOpen(false); // close insights panel if open
//     try {
//       sessionStorage.removeItem(STORAGE_KEYS.result);
//       sessionStorage.removeItem(STORAGE_KEYS.negative);
//       sessionStorage.removeItem(STORAGE_KEYS.selectedText);
//       sessionStorage.removeItem(STORAGE_KEYS.showResults);
//     } catch (err) {
//       // ignore
//     }

//     if (!selectedText.trim()) {
//       setError('Please select text to query');
//       return;
//     }

//     const documentsPayload = pdfs.map(p => ({
//       filename: p.serverFilename,
//       outline: p.outline,
//       sections: (p as any).sections ?? undefined
//     }));

//     const payload = {
//       documents: documentsPayload,
//       selectedText: selectedText
//     };

//     setLoading(true);
//     try {
//       const [resp1, resp2] = await Promise.all([
//         fetch('http://localhost:5001/pdf_query', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload)
//         }),
//         fetch('http://localhost:5001/pdf_query_negative', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload)
//         })
//       ]);

//       if (!resp1.ok || !resp2.ok) {
//         const body1 = await resp1.json().catch(() => null);
//         const body2 = await resp2.json().catch(() => null);
//         throw new Error(body1?.error || body2?.error || 'One of the requests failed');
//       }

//       const data1 = await resp1.json();
//       const data2 = await resp2.json();

//       setResult(data1);
//       setNegativeResult(data2);
//       setShowResults(true);

//       // Persist results so they survive navigation
//       try {
//         sessionStorage.setItem(STORAGE_KEYS.result, JSON.stringify(data1));
//         sessionStorage.setItem(STORAGE_KEYS.negative, JSON.stringify(data2));
//         sessionStorage.setItem(STORAGE_KEYS.selectedText, selectedText);
//         sessionStorage.setItem(STORAGE_KEYS.showResults, '1');
//       } catch (e) {
//         console.warn('Failed to persist pdf query result', e);
//       }

//       // NEW: Combine insights (if available in both responses)
//       try {
//         if (data1.insights && data2.insights) {
//           const combined = {
//             summary: `${data1.insights.summary}\n\n${data2.insights.summary}`,
//             didYouKnow: `${data1.insights.didYouKnow} Also, ${data2.insights.didYouKnow}`,
//             podcast: {
//               script: `${data1.insights.podcast.script}\n\n${data2.insights.podcast.script}`,
//               audio_url: `http://localhost:5001/podcast?text=${encodeURIComponent(
//                 data1.insights.podcast.script + '\n' + data2.insights.podcast.script
//               )}`
//             }
//           };
//           setCombinedInsights(combined);
//         } else {
//           setCombinedInsights(null);
//         }
//       } catch (err) {
//         console.warn('Failed to build combined insights', err);
//         setCombinedInsights(null);
//       }

//     } catch (err: any) {
//       setError(err.message || 'Unknown error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
//       <nav className="relative z-10 bg-transparent p-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <Link to="/" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">
//             Home
//           </Link>
//           <Link to="/query" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">
//             Role Based Query
//           </Link>
//           <Link to="/QueryDocument" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">
//             Query Document
//           </Link>
//         </div>
//       </nav>

//       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
//         {/* Left Sidebar - Upload Component */}
//         <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full">
//           <div className="flex-shrink-0">
//             <h2 className="text-lg font-bold text-slate-800 mb-1">PDF Query</h2>
//             <p className="text-xs text-slate-600 mb-3">Upload PDF and select text to query</p>
//           </div>

//           <div className="space-y-4 flex-shrink-0">
//             {/* File Upload */}
//             <div>
//               <label className="block text-xs font-semibold text-slate-700 mb-2">Upload PDF</label>
//               <div className="relative">
//                 <input
//                   type="file"
//                   accept=".pdf"
//                   onChange={handleFileUpload}
//                   className="hidden"
//                   id="pdf-upload"
//                 />
//                 <label
//                   htmlFor="pdf-upload"
//                   className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
//                 >
//                   {selectedFile ? (
//                     <div className="text-sm">
//                       <div className="text-indigo-600 font-medium">{selectedFile.name}</div>
//                       <div className="text-slate-500 text-xs">Click to change</div>
//                     </div>
//                   ) : (
//                     <div className="text-sm text-slate-500">
//                       <div className="text-2xl mb-1">📄</div>
//                       <div>Click to upload PDF</div>
//                     </div>
//                   )}
//                 </label>
//               </div>
//             </div>

//             {/* Selected Text Display */}
//             <div>
//               <label className="block text-xs font-semibold text-slate-700 mb-2">
//                 Selected Text
//               </label>
//               <div className="min-h-[80px] max-h-32 border border-slate-200 rounded-lg p-3 text-sm bg-slate-50 overflow-y-auto">
//                 {selectedText}
//               </div>
//             </div>

//             {!showResults ? (
//               <button
//                 onClick={handleSubmit}
//                 className="w-full py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
//                 disabled={loading || !selectedFile || !selectedText}
//               >
//                 {loading ? (
//                   <span className="flex items-center justify-center">
//                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Processing...
//                   </span>
//                 ) : 'Submit Query'}
//               </button>
//             ) : (
//               <div className="flex gap-3">
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center"
//                   onClick={handleSimilarityClick}
//                 >
//                   Similarity
//                 </motion.button>
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-center"
//                   onClick={handleContradictoryClick}
//                 >
//                   Contradictory
//                 </motion.button>
//               </div>
//             )}

//             {/* NEW: AI Insights Hub button */}
//             {showResults && (
//               <div className="mt-4">
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   className="w-full py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
//                   onClick={() => setIsInsightsPanelOpen(true)}
//                 >
//                   AI Insights Hub
//                 </motion.button>
//               </div>
//             )}

//             {/* Uploaded PDFs section */}
//             <div className="mt-4 flex-1 min-h-0 flex flex-col">
//               <h3 className="text-sm font-semibold text-slate-700 mb-2 flex-shrink-0">
//                 Uploaded PDFs ({pdfs.length})
//               </h3>

//               <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent max-h-[calc(62vh-200px)]">
//                 {pdfs.length > 0 ? (
//                   <motion.div variants={containerVariants} initial="hidden" animate="show">
//                     <div className="space-y-2">
//                       {pdfs.map(pdf => (
//                         <motion.div key={pdf.id} variants={itemVariants}>
//                           <PdfCard
//                             pdf={pdf}
//                             onRemove={(id) => handleRemovePDF(id)}
//                             onClick={(id) => handlePDFClick(id)}
//                             isProcessing={(name) => isProcessing ? isProcessing(name) : false}
//                           />
//                         </motion.div>
//                       ))}
//                     </div>
//                   </motion.div>
//                 ) : (
//                   <div className="text-xs text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
//                     No PDFs uploaded yet
//                   </div>
//                 )}
//               </div>
//             </div>

//             {error && (
//               <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
//                 {error}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Center - PDF Viewer */}
//         <div className="lg:col-span-3 flex-1 bg-gradient-to-br from-gray-100 to-gray-200 p-4 lg:p-8 rounded-xl order-2 lg:order-2">
//           <div className="max-w-5xl mx-auto h-full">
//             {selectedFile && uploadedPdfUrl ? (
//               <div
//                 id="pdf-viewer"
//                 className="w-full h-full max-h-[90vh] bg-white rounded-2xl shadow-xl"
//               />
//             ) : (
//               <div className="h-full flex flex-col justify-center items-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white shadow-xl">
//                 <div className="text-6xl mb-4">📄</div>
//                 <div className="text-xl font-semibold mb-2">No PDF Selected</div>
//                 <div className="text-sm">Upload a PDF file to view and query it</div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Results Section */}
//       {/* The RightPanel (insights drawer) is mounted here so it overlays the page when visible */}
//       <RightPanel
//         visible={isInsightsPanelOpen}
//         onClose={() => setIsInsightsPanelOpen(false)}
//         text={selectedText}
//         insights={combinedInsights}
//         pageType="query"
//       />
//     </div>
//   );
// };

// export default PdfQueryPage;
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePDF } from '../context/PDFContext';
import PdfCard from './PdfCard';
import { useNavigate, Link } from 'react-router-dom';
import RightPanel from './RightPanel';

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
    result: 'pdfQuery.result',
    negative: 'pdfQuery.negativeResult',
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
        if (parsedResult?.insights && parsedNegative?.insights) {
          setCombinedInsights({
            summary: `${parsedResult.insights.summary}\n\n${parsedNegative.insights.summary}`,
            didYouKnow: `${parsedResult.insights.didYouKnow}\n\n${parsedNegative.insights.didYouKnow}`,
            podcast: {
              script: `${parsedResult.insights.podcast.script}\n\n${parsedNegative.insights.podcast.script}`,
              audio_url: parsedResult.insights.podcast.audio_url // Or combine them if logic allows
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to restore persisted pdf query:', e);
    }
  }, []);

  const handleRemovePDF = (id: string | number) => {
    removePDF(id as string);
  };

  const handleSimilarityClick = () => {
    navigate('/similarity', { state: { result, selectedText } });
  };
  const handleContradictoryClick = () => {
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
          clientId: "35466cb0881f4c34abe4f6c105cfcf90", // Replace with your Adobe Client ID
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
      const [respPositive, respNegative] = await Promise.all([
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

      const dataPositive = await respPositive.json();
      const dataNegative = await respNegative.json();

      if (!respPositive.ok || !respNegative.ok) {
        throw new Error(dataPositive?.error || dataNegative?.error || 'One of the requests failed');
      }

      setResult(dataPositive);
      setNegativeResult(dataNegative);
      setShowResults(true);

      sessionStorage.setItem(STORAGE_KEYS.result, JSON.stringify(dataPositive));
      sessionStorage.setItem(STORAGE_KEYS.negative, JSON.stringify(dataNegative));
      sessionStorage.setItem(STORAGE_KEYS.selectedText, selectedText);
      sessionStorage.setItem(STORAGE_KEYS.showResults, '1');

      if (dataPositive.insights && dataNegative.insights) {
        setCombinedInsights({
          summary: `${dataPositive.insights.summary}\n\n${dataNegative.insights.summary}`,
          didYouKnow: `${dataPositive.insights.didYouKnow}\n\n${dataNegative.insights.didYouKnow}`,
          podcast: {
            script: `${dataPositive.insights.podcast.script}\n\n${dataNegative.insights.podcast.script}`,
            audio_url: dataPositive.insights.podcast.audio_url 
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <nav className="relative z-10 bg-transparent p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">
            Home
          </Link>
          <Link to="/query" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">
            Role Based Query
          </Link>
          <Link to="/QueryDocument" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">
            Query Document
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
        <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full">
          <div className="flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Document Query</h2>
            <p className="text-xs text-slate-600 mb-3">Select text from an uploaded PDF to analyze.</p>
          </div>

          <div className="space-y-4 flex-shrink-0">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Selected Text
              </label>
              <div className="min-h-[80px] max-h-32 border border-slate-200 rounded-lg p-3 text-sm bg-slate-50 overflow-y-auto">
                {selectedText}
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              {!showResults ? (
                <button
                  onClick={handleSubmit}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !selectedFile || !selectedText}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </span>
                  ) : 'Submit Query'}
                </button>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-3 text-center">
                   <p className="text-sm font-semibold text-slate-700">Query Complete!</p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                      onClick={handleSimilarityClick}
                    >
                      Similarities
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white"
                      onClick={handleContradictoryClick}
                    >
                      Contradictions
                    </motion.button>
                  </div>
                   <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="w-full py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      onClick={() => setIsInsightsPanelOpen(true)}
                    >
                      AI Insights Hub
                    </motion.button>
                </div>
              )}
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}
          </div>
          
          <div className="mt-4 flex-1 min-h-0 flex flex-col">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex-shrink-0">
                Source PDFs ({pdfs.length})
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent max-h-[calc(62vh-200px)]">
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
        </div>

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
      
      <RightPanel
        visible={isInsightsPanelOpen}
        onClose={() => setIsInsightsPanelOpen(false)}
        text={selectedText}
        insights={combinedInsights}
        pageType="query"
      />
    </div>
  );
};

export default PdfQueryPage;