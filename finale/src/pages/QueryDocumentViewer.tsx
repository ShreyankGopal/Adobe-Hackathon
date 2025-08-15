// import React, { useEffect, useState, useRef } from 'react';
// import { useLocation, useParams, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import RightPanel from "./RightPanel";
// import {
//   ArrowLeft,
//   Menu,
//   X,
//   FileText,
//   BookOpen,
//   Eye,
//   EyeOff,
//   Search,
//   Hash,
//   Loader2
// } from 'lucide-react';
// import { usePDF } from '../context/PDFContext';

// declare global {
//   interface Window {
//     AdobeDC: {
//       View: {
//         new (config: { clientId: string; divId: string }): any;
//         Enum: {
//           CallbackType: {
//             EVENT_LISTENER: string;
//           };
//         };
//       };
//     };
//   }
// }

// interface ExtractedSection {
//   document: string;
//   importance_rank: number;
//   page_number: number;
//   section_title: string;
//   rects?: any[];
// }

// interface SubsectionAnalysis {
//   document: string;
//   page_number: number;
//   refined_text: string;
// }

// declare global {
//   interface QueryResult {
//     extracted_sections: ExtractedSection[];
//     subsection_analysis?: SubsectionAnalysis[];
//     metadata?: {
//       input_documents?: string[];
//       job_to_be_done?: string;
//       persona?: string;
//       processing_timestamp?: string;
//       annotated_files?: { [original: string]: string };
//       llm_input: string;
//     };
//   };
// };

// const QueryDocumentViewer: React.FC = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { getPDFById, getPDFByServerFilename, pdfs } = usePDF();
//   const [selectedSectionText, setSelectedSectionText] = useState<string>('');
//   const [isPanelOpen, setIsPanelOpen] = useState(false);

//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
//   const [requestedPage, setRequestedPage] = useState<number | null>(null);
//   const [initialSectionKey, setInitialSectionKey] = useState<string | null>(null);

//   const [queryType, setQueryType] = useState<'similarity' | 'contradiction' | null>(null);
//   const [selectedText, setSelectedText] = useState('');

//   const [result, setResult] = useState<QueryResult | undefined>(
//     (location.state as any)?.result
//   );

//   const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null);
//   const [sectionInsights, setSectionInsights] = useState<{ [key: string]: { summary?: string; didYouKnow?: string; } }>({});
//   const [loadingInsights, setLoadingInsights] = useState<{ [key: string]: { summary: boolean; didYouKnow: boolean; } }>({});

//   const viewerRef = useRef<any>(null);

//   const urlParams = new URLSearchParams(location.search);
//   const requestedPageFromUrl = parseInt(urlParams.get('page') || '0', 10) || null;

//   const currentPDF = id
//     ? getPDFById(id)
//     : selectedDocument
//     ? getPDFByServerFilename(selectedDocument)
//     : pdfs[0];

//   const getCleanDocumentName = (document: string) => {
//     const parts = document.split('_');
//     return parts.length > 1 ? parts.slice(1).join('_') : document;
//   };

//   const getSectionsByDocument = (): { [key: string]: ExtractedSection[] } => {
//     if (!result?.extracted_sections) return {};
//     return result.extracted_sections.reduce((acc: any, section) => {
//       if (!acc[section.document]) acc[section.document] = [];
//       acc[section.document].push(section);
//       return acc;
//     }, {});
//   };

//   useEffect(() => {
//     if (location.state) {
//       setResult(location.state.result);
//       setQueryType(location.state.queryType);
//       setSelectedText(location.state.selectedText || '');
      
//       if (location.state.selectedSectionKey) {
//         setSelectedSectionKey(location.state.selectedSectionKey);
//         setInitialSectionKey(location.state.selectedSectionKey);
//       }
      
//       if (location.state.selectedSection) {
//         const section = location.state.selectedSection;
//         setSelectedDocument(section.document);
//         setRequestedPage(section.page_number);
        
//         // Set initial section text
//         const matchingAnalysis = location.state.result?.subsection_analysis?.find(
//           (a: any) => 
//             a.document === section.document && 
//             a.page_number === section.page_number
//         );
//         if (matchingAnalysis) {
//           setSelectedSectionText(matchingAnalysis.refined_text);
//         }
//       }
//     } else {
//       try {
//         const stored = sessionStorage.getItem('lastQueryResult');
//         if (!result && stored) {
//           const parsed = JSON.parse(stored);
//           setResult(parsed);
//           if (parsed.extracted_sections?.[0]?.document) {
//             setSelectedDocument(parsed.extracted_sections[0].document);
//           }
//         }
//       } catch (e) {
//         console.warn('Failed to parse persisted query result in viewer', e);
//       }
//     }
    
//     if (requestedPageFromUrl) {
//       setRequestedPage(requestedPageFromUrl);
//     }
//   }, [location.state]);

//   useEffect(() => {
//     if (result?.extracted_sections && !selectedDocument) {
//       const first = result.extracted_sections[0]?.document;
//       if (first) setSelectedDocument(first);
//     }
//   }, [result, selectedDocument]);

//   const attemptGoto = async (pageNumber: number, retries = 12, delayMs = 300): Promise<boolean> => {
//     const pn = Math.max(1, Math.floor(Number(pageNumber) || 1));
//     for (let i = 0; i < retries; i++) {
//       try {
//         if (viewerRef.current && typeof viewerRef.current.getAPIs === 'function') {
//           const apis = await viewerRef.current.getAPIs();
//           if (apis && typeof apis.gotoLocation === 'function') {
//             await apis.gotoLocation(pn, 0, 0);
//             return true;
//           }
//         }
//       } catch {
//         // retry
//       }
//       await new Promise((r) => setTimeout(r, delayMs));
//     }
//     return false;
//   };

//   useEffect(() => {
//     if (!currentPDF || !currentPDF.serverFilename) return;
//     if (!window.AdobeDC) {
//       console.warn('AdobeDC not available on window.');
//       return;
//     }

//     const container = document.getElementById('pdf-viewer');
//     if (container) container.innerHTML = '';

//     const adobeDCView = new window.AdobeDC.View({
//       clientId: '35466cb0881f4c34abe4f6c105cfcf90',
//       divId: 'pdf-viewer'
//     });

//     const annotatedFiles = result?.metadata?.annotated_files || {};
//     const annotatedForThis = annotatedFiles ? annotatedFiles[currentPDF.serverFilename] : null;
//     const ts = result?.metadata?.processing_timestamp
//       ? encodeURIComponent(result.metadata.processing_timestamp)
//       : Date.now();

//     const filenameToLoad = annotatedForThis || currentPDF.serverFilename;
//     const url = `http://localhost:5001/uploads/${filenameToLoad}?t=${ts}`;

//     adobeDCView
//       .previewFile(
//         {
//           content: { location: { url } },
//           metaData: { fileName: currentPDF.name }
//         },
//         {
//           embedMode: 'FULL_WINDOW',
//           defaultViewMode: 'FIT_PAGE',
//           showAnnotationTools: true,
//           enableSearchAPIs: true
//         }
//       )
//       .then((viewer: any) => {
//         viewerRef.current = viewer;
//         try {
//           viewer.registerCallback(
//             window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
//             (event: any) => {
//               if (event.type === 'PAGE_VIEW') {
//                 setCurrentPage(event.data.pageNumber);
//               }
//             },
//             { enablePageChangeEvents: true }
//           );
//         } catch {}
        
//         if (requestedPage) {
//           setTimeout(() => {
//             attemptGoto(requestedPage);
//           }, 500);
//         }
//       })
//       .catch((err: any) => {
//         console.error('Adobe previewFile error:', err);
//       });

//     return () => {
//       viewerRef.current = null;
//     };
//   }, [currentPDF, result?.metadata?.annotated_files, result?.metadata?.processing_timestamp, requestedPage]);

//   const handleSectionClick = (section: ExtractedSection) => {
//     const matchingAnalysis = result?.subsection_analysis?.find(
//       (analysis) =>
//         analysis.document === section.document &&
//         analysis.page_number === section.page_number
//     );
//     if (matchingAnalysis) {
//       setSelectedSectionText(matchingAnalysis.refined_text);
//     } else {
//       setSelectedSectionText('');
//     }
//     setCurrentPage(section.page_number);

//     const key = `${section.document}_${section.page_number}_${section.section_title}`.replace(/\s+/g, '_');
//     setSelectedSectionKey(key);

//     if (!sectionInsights[key]) {
//       setSectionInsights(prev => ({ ...prev, [key]: {} }));
//       setLoadingInsights(prev => ({ ...prev, [key]: { summary: false, didYouKnow: false } }));
//     }

//     const targetPage = Math.max(1, Math.floor(Number(section.page_number) || 1));
//     const targetPDF = getPDFByServerFilename(section.document);
//     if (!targetPDF) return;

//     const samePdfLoaded =
//       (currentPDF && currentPDF.serverFilename === targetPDF.serverFilename) ||
//       selectedDocument === section.document ||
//       (!id && !selectedDocument && pdfs.length > 0 && pdfs[0].serverFilename === targetPDF.serverFilename);

//     if (samePdfLoaded) {
//       setSelectedDocument(section.document);
//       setRequestedPage(targetPage);
//       attemptGoto(targetPage).then((ok) => {
//         if (!ok) console.warn('Failed to navigate to page', targetPage);
//       });
//       return;
//     }

//     setSelectedDocument(section.document);
//     setRequestedPage(targetPage);
//     navigate(`/query/${targetPDF.id}?page=${targetPage}`, { 
//       state: { 
//         result, 
//         selectedSection: section,
//         selectedSectionKey: key
//       }, 
//       replace: true 
//     });
//   };

//   const handleInsightClick = async (type: 'summary' | 'didYouKnow') => {
//     if (!selectedSectionKey || !selectedSectionText) return;

//     setLoadingInsights(prev => ({
//       ...prev,
//       [selectedSectionKey]: { ...prev[selectedSectionKey], [type]: true }
//     }));

//     try {
//       const endpoint = type === 'didYouKnow' ? 'did-you-know' : 'summarize';
//       const res = await fetch(`http://localhost:5001/${endpoint}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ prompt: selectedSectionText }),
//       });
//       const data = await res.json();
//       setSectionInsights(prev => ({
//         ...prev,
//         [selectedSectionKey]: { ...prev[selectedSectionKey], [type]: data.response }
//       }));
//     } catch (err) {
//       console.error('Error generating insight:', err);
//     } finally {
//       setLoadingInsights(prev => ({
//         ...prev,
//         [selectedSectionKey]: { ...prev[selectedSectionKey], [type]: false }
//       }));
//     }
//   };

//   if (!result) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
//           <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h2 className="text-2xl font-semibold text-gray-800 mb-2">No query results found</h2>
//           <p className="text-gray-600 mb-6">Please run a query first to view results.</p>
//           <button onClick={() => navigate('/query')} className="btn-primary">
//             <ArrowLeft className="w-5 h-5 mr-2" />
//             Back to Query
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   if (!currentPDF) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
//           <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h2 className="text-2xl font-semibold text-gray-800 mb-2">PDF not found</h2>
//           <p className="text-gray-600 mb-6">The requested document could not be found.</p>
//           <button onClick={() => navigate('/query')} className="btn-primary">
//             <ArrowLeft className="w-5 h-5 mr-2" />
//             Back to Query
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   const sectionsByDocument = getSectionsByDocument();

//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 flex">
//       <AnimatePresence>
//         {sidebarOpen && (
//           <motion.div
//             initial={{ x: -400, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             exit={{ x: -400, opacity: 0 }}
//             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
//             className="w-80 lg:w-96 bg-white shadow-xl border-r border-gray-200 flex flex-col relative z-20"
//           >
//             <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center space-x-2">
//                   <Search className="w-6 h-6 text-primary-600" />
//                   <h2 className="text-lg font-semibold text-gray-800">
//                     {queryType === 'similarity' ? 'Similarity' : queryType === 'contradiction' ? 'Contradiction' : 'Query'} Results
//                   </h2>
//                 </div>
//                 <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors">
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//               {selectedText && (
//                 <div className="text-sm text-gray-600 mb-3">
//                   <p className="font-medium">Selected Text:</p>
//                   <div className="text-xs bg-gray-100 p-2 rounded mt-1 max-h-20 overflow-y-auto">
//                     {selectedText}
//                   </div>
//                 </div>
//               )}
//               {result?.metadata?.persona && (
//                 <div className="text-sm text-gray-600">
//                   <p className="font-medium">Role: {result.metadata.persona}</p>
//                   <p>Task: {result.metadata.job_to_be_done}</p>
//                 </div>
//               )}
//               <p className="text-xs text-primary-600 mt-2">{result.extracted_sections.length} sections found</p>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[80vh]">
//               {Object.entries(sectionsByDocument).map(([document, sections]) => (
//                 <div key={document} className="space-y-2">
//                   <div className="sticky top-0 bg-white z-10 p-2 border-b border-gray-100">
//                     <h3 className="font-semibold text-gray-800 text-sm flex items-center">
//                       <FileText className="w-4 h-4 mr-2 text-primary-600" />
//                       {getCleanDocumentName(document)}
//                       {selectedDocument === document && <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Current</span>}
//                     </h3>
//                   </div>
//                   {sections.map((section, idx) => {
//                     const sectionKey = `${section.document}_${section.page_number}_${section.section_title}`.replace(/\s+/g, '_');
//                     const isSelected = selectedSectionKey === sectionKey || 
//                                       (initialSectionKey === sectionKey && !selectedSectionKey);
//                     return (
//                       <motion.div
//                         key={sectionKey}
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: idx * 0.05 }}
//                         className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
//                           isSelected ? 'bg-primary-100 border-primary-300 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
//                         }`}
//                         onClick={() => handleSectionClick(section)}
//                       >
//                         <div className="flex items-start justify-between">
//                           <div className="flex-1 min-w-0">
//                             <h4 className="font-medium text-gray-800 text-sm truncate" title={section.section_title}>
//                               {section.section_title}
//                             </h4>
//                             <div className="flex items-center space-x-3 mt-2 text-xs">
//                               <span className="flex items-center text-primary-600">
//                                 <BookOpen className="w-3 h-3 mr-1" />
//                                 Page {section.page_number}
//                               </span>
//                               <span className="flex items-center text-orange-600">
//                                 <Hash className="w-3 h-3 mr-1" />
//                                 Rank {section.importance_rank}
//                               </span>
//                             </div>
//                           </div>
//                           <div className="flex-shrink-0 ml-2">
//                             <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">#{section.importance_rank}</span>
//                           </div>
//                         </div>
//                       </motion.div>
//                     );
//                   })}
//                 </div>
//               ))}
//               {result.subsection_analysis && result.subsection_analysis.length > 0 && (
//                 <div className="mt-6 pt-4 border-t border-gray-200">
//                   <h3 className="font-semibold text-gray-800 mb-3 text-sm">Detailed Analysis</h3>
//                   <div className="space-y-2">
//                     {result.subsection_analysis.map((analysis, idx) => (
//                       <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
//                         <div className="font-medium text-blue-800 mb-1">{getCleanDocumentName(analysis.document)} - Page {analysis.page_number}</div>
//                         <p className="text-blue-700 line-clamp-3">{analysis.refined_text}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="flex-1 flex flex-col">
//         <div className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6 relative z-10">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <button onClick={() => navigate(-1)} className="btn-secondary">
//                 <ArrowLeft className="w-5 h-5 mr-2" />
//                 Back to Results
//               </button>
//               {!sidebarOpen && (
//                 <button onClick={() => setSidebarOpen(true)} className="btn-secondary lg:hidden">
//                   <Menu className="w-5 h-5 mr-2" />
//                   Show Results
//                 </button>
//               )}
//             </div>
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => setIsPanelOpen(!isPanelOpen)}
//                 className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
//               >
//                 AI Insights Hub
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 p-4 lg:p-8">
//           <div className="max-w-5xl mx-auto h-full">
//             <div id="pdf-viewer" className="w-full h-full max-h-[90vh] bg-white rounded-2xl shadow-xl" />
//           </div>
//         </div>
//       </div>

//       {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />}

//       <RightPanel
//         visible={isPanelOpen}
//         onClose={() => setIsPanelOpen(false)}
//         text={selectedSectionText}
//         sectionInsights={sectionInsights[selectedSectionKey || '']}
//         loadingInsights={loadingInsights[selectedSectionKey || '']}
//         onInsightClick={handleInsightClick}
//         pageType='section'
//       />
//     </motion.div>
//   );
// };

// export default QueryDocumentViewer;
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RightPanel from "./RightPanel";
import {
  ArrowLeft,
  Menu,
  X,
  FileText,
  BookOpen,
  Search,
  Hash
} from 'lucide-react';
import { usePDF } from '../context/PDFContext';

declare global {
  interface Window {
    AdobeDC: {
      View: {
        new (config: { clientId: string; divId: string }): any;
        Enum: {
          CallbackType: {
            EVENT_LISTENER: string;
          };
        };
      };
    };
  }
}

interface ExtractedSection {
  document: string;
  importance_rank: number;
  page_number: number;
  section_title: string;
  rects?: any[];
}

interface SubsectionAnalysis {
  document: string;
  page_number: number;
  refined_text: string;
}

declare global {
  interface QueryResult {
    extracted_sections: ExtractedSection[];
    subsection_analysis?: SubsectionAnalysis[];
    metadata?: {
      input_documents?: string[];
      job_to_be_done?: string;
      persona?: string;
      processing_timestamp?: string;
      annotated_files?: { [original: string]: string };
      llm_input: string;
    };
    insights?: any; // Ensure insights can be received
  };
}

const QueryDocumentViewer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getPDFById, getPDFByServerFilename, pdfs } = usePDF();

  const [selectedSectionText, setSelectedSectionText] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [requestedPage, setRequestedPage] = useState<number | null>(null);
  const [initialSectionKey, setInitialSectionKey] = useState<string | null>(null);

  const [queryType, setQueryType] = useState<'similarity' | 'contradiction' | null>(null);
  const [selectedText, setSelectedText] = useState('');

  const [result, setResult] = useState<QueryResult | undefined>(
    (location.state as any)?.result
  );

  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null);

  // === CORRECTED: State definitions with nested structure ===
  const [sectionInsights, setSectionInsights] = useState<{ [key: string]: { summary?: string; didYouKnow?: string; } }>({});
  const [loadingInsights, setLoadingInsights] = useState<{ [key: string]: { summary: boolean; didYouKnow: boolean; } }>({});

  const viewerRef = useRef<any>(null);

  const urlParams = new URLSearchParams(location.search);
  const requestedPageFromUrl = parseInt(urlParams.get('page') || '0', 10) || null;

  const currentPDF = id
    ? getPDFById(id)
    : selectedDocument
    ? getPDFByServerFilename(selectedDocument)
    : pdfs[0];

  const getCleanDocumentName = (document: string) => {
    const parts = document.split('_');
    return parts.length > 1 ? parts.slice(1).join('_') : document;
  };

  const getSectionsByDocument = (): { [key: string]: ExtractedSection[] } => {
    if (!result?.extracted_sections) return {};
    return result.extracted_sections.reduce((acc: any, section) => {
      if (!acc[section.document]) acc[section.document] = [];
      acc[section.document].push(section);
      return acc;
    }, {});
  };

  useEffect(() => {
    if (location.state) {
      setResult((location.state as any).result);
      setQueryType((location.state as any).queryType);
      setSelectedText((location.state as any).selectedText || '');

      if ((location.state as any).selectedSectionKey) {
        setSelectedSectionKey((location.state as any).selectedSectionKey);
        setInitialSectionKey((location.state as any).selectedSectionKey);
      }

      if ((location.state as any).selectedSection) {
        const section = (location.state as any).selectedSection as ExtractedSection;
        setSelectedDocument(section.document);
        setRequestedPage(section.page_number);

        const matchingAnalysis = (location.state as any).result?.subsection_analysis?.find(
          (a: any) =>
            a.document === section.document &&
            a.page_number === section.page_number
        );
        if (matchingAnalysis) {
          setSelectedSectionText(matchingAnalysis.refined_text);
        }
      }
    } else {
      try {
        const stored = sessionStorage.getItem('lastQueryResult');
        if (!result && stored) {
          const parsed = JSON.parse(stored);
          setResult(parsed);
          if (parsed.extracted_sections?.[0]?.document) {
            setSelectedDocument(parsed.extracted_sections[0].document);
          }
        }
      } catch (e) {
        console.warn('Failed to parse persisted query result in viewer', e);
      }
    }

    if (requestedPageFromUrl) {
      setRequestedPage(requestedPageFromUrl);
    }
  }, [location.state, result]);

  useEffect(() => {
    if (result?.extracted_sections && !selectedDocument) {
      const first = result.extracted_sections[0]?.document;
      if (first) setSelectedDocument(first);
    }
  }, [result, selectedDocument]);

  const attemptGoto = async (pageNumber: number, retries = 12, delayMs = 300): Promise<boolean> => {
    const pn = Math.max(1, Math.floor(Number(pageNumber) || 1));
    for (let i = 0; i < retries; i++) {
      try {
        if (viewerRef.current && typeof viewerRef.current.getAPIs === 'function') {
          const apis = await viewerRef.current.getAPIs();
          if (apis && typeof apis.gotoLocation === 'function') {
            await apis.gotoLocation(pn, 0, 0);
            return true;
          }
        }
      } catch {
        // retry silently
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return false;
  };

  useEffect(() => {
    if (!currentPDF || !currentPDF.serverFilename) return;
    if (!(window as any).AdobeDC) {
      console.warn('AdobeDC not available on window.');
      return;
    }

    const container = document.getElementById('pdf-viewer');
    if (container) container.innerHTML = '';

    const adobeDCView = new window.AdobeDC.View({
      clientId: '35466cb0881f4c34abe4f6c105cfcf90',
      divId: 'pdf-viewer'
    });

    const annotatedFiles = result?.metadata?.annotated_files || {};
    const annotatedForThis = annotatedFiles ? annotatedFiles[currentPDF.serverFilename] : null;
    const ts = result?.metadata?.processing_timestamp
      ? encodeURIComponent(result.metadata.processing_timestamp)
      : Date.now();

    const filenameToLoad = annotatedForThis || currentPDF.serverFilename;
    const url = `http://localhost:5001/uploads/${filenameToLoad}?t=${ts}`;

    adobeDCView
      .previewFile(
        {
          content: { location: { url } },
          metaData: { fileName: currentPDF.name }
        },
        {
          embedMode: 'FULL_WINDOW',
          defaultViewMode: 'FIT_PAGE',
          showAnnotationTools: true,
          enableSearchAPIs: true
        }
      )
      .then((viewer: any) => {
        viewerRef.current = viewer;
        try {
          viewer.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
            (event: any) => {
              if (event.type === 'PAGE_VIEW') {
                setCurrentPage(event.data.pageNumber);
              }
            },
            { enablePageChangeEvents: true }
          );
        } catch { /* no-op */ }

        if (requestedPage) {
          setTimeout(() => {
            attemptGoto(requestedPage);
          }, 500);
        }
      })
      .catch((err: any) => {
        console.error('Adobe previewFile error:', err);
      });

    return () => {
      viewerRef.current = null;
    };
  }, [currentPDF, result?.metadata?.annotated_files, result?.metadata?.processing_timestamp, requestedPage]);
  
  // === CORRECTED: State initialization in handler ===
  const handleSectionClick = (section: ExtractedSection) => {
    const matchingAnalysis = result?.subsection_analysis?.find(
      (analysis) =>
        analysis.document === section.document &&
        analysis.page_number === section.page_number
    );
    setSelectedSectionText(matchingAnalysis?.refined_text || '');
    setCurrentPage(section.page_number);

    const key = `${section.document}_${section.page_number}_${section.section_title}`.replace(/\s+/g, '_');
    setSelectedSectionKey(key);

    if (!sectionInsights[key]) {
      setSectionInsights(prev => ({ ...prev, [key]: {} }));
      setLoadingInsights(prev => ({ ...prev, [key]: { summary: false, didYouKnow: false } }));
    }

    const targetPage = Math.max(1, Math.floor(Number(section.page_number) || 1));
    const targetPDF = getPDFByServerFilename(section.document);
    if (!targetPDF) return;

    const samePdfLoaded =
      (currentPDF && currentPDF.serverFilename === targetPDF.serverFilename) ||
      selectedDocument === section.document ||
      (!id && !selectedDocument && pdfs.length > 0 && pdfs[0].serverFilename === targetPDF.serverFilename);

    if (samePdfLoaded) {
      setSelectedDocument(section.document);
      setRequestedPage(targetPage);
      attemptGoto(targetPage).then((ok) => {
        if (!ok) console.warn('Failed to navigate to page', targetPage);
      });
      return;
    }

    setSelectedDocument(section.document);
    setRequestedPage(targetPage);
    navigate(`/query/${targetPDF.id}?page=${targetPage}`, {
      state: {
        result,
        selectedSection: section,
        selectedSectionKey: key
      },
      replace: true
    });
  };

  // === CORRECTED: API handler with nested state updates ===
  const handleInsightClick = async (type: 'summary' | 'didYouKnow') => {
    if (!selectedSectionKey || !selectedSectionText) return;

    setLoadingInsights(prev => ({
      ...prev,
      [selectedSectionKey]: { ...prev[selectedSectionKey], [type]: true }
    }));

    const endpoint = type === 'summary' ? 'summarize' : 'did-you-know';

    try {
      const response = await fetch(`http://localhost:5001/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: selectedSectionText }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();

      setSectionInsights(prev => ({
        ...prev,
        [selectedSectionKey]: {
          ...prev[selectedSectionKey],
          [type]: data.response,
        },
      }));

    } catch (err) {
      console.error(`Failed to get insight for type '${type}':`, err);
    } finally {
      setLoadingInsights(prev => ({
        ...prev,
        [selectedSectionKey]: { ...prev[selectedSectionKey], [type]: false }
      }));
    }
  };

  if (!result) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No query results found</h2>
            <p className="text-gray-600 mb-6">Please run a query first to view results.</p>
            <button onClick={() => navigate('/query')} className="btn-primary">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Query
            </button>
            </motion.div>
        </div>
    );
  }

  if (!currentPDF) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">PDF not found</h2>
            <p className="text-gray-600 mb-6">The requested document could not be found.</p>
            <button onClick={() => navigate('/query')} className="btn-primary">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Query
            </button>
            </motion.div>
        </div>
    );
  }

  const sectionsByDocument = getSectionsByDocument();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 lg:w-96 bg-white shadow-xl border-r border-gray-200 flex flex-col relative z-20"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Search className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    {queryType === 'similarity' ? 'Similarity' : queryType === 'contradiction' ? 'Contradiction' : 'Query'} Results
                  </h2>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedText && (
                <div className="text-sm text-gray-600 mb-3">
                  <p className="font-medium">Selected Text:</p>
                  <div className="text-xs bg-gray-100 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                    {selectedText}
                  </div>
                </div>
              )}
              <p className="text-xs text-indigo-600 mt-2">{result.extracted_sections.length} sections found</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {Object.entries(sectionsByDocument).map(([document, sections]) => (
                <div key={document} className="space-y-2">
                  <div className="sticky top-0 bg-white z-10 p-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                      {getCleanDocumentName(document)}
                      {selectedDocument === document && <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Current</span>}
                    </h3>
                  </div>
                  {sections.map((section, idx) => {
                    const sectionKey = `${section.document}_${section.page_number}_${section.section_title}`.replace(/\s+/g, '_');
                    const isSelected = selectedSectionKey === sectionKey ||
                      (initialSectionKey === sectionKey && !selectedSectionKey);
                    return (
                      <motion.div
                        key={sectionKey}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                          isSelected ? 'bg-indigo-100 border-indigo-300 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleSectionClick(section)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-800 text-sm truncate" title={section.section_title}>
                              {section.section_title}
                            </h4>
                            <div className="flex items-center space-x-3 mt-2 text-xs">
                              <span className="flex items-center text-indigo-600">
                                <BookOpen className="w-3 h-3 mr-1" />
                                Page {section.page_number}
                              </span>
                              <span className="flex items-center text-orange-600">
                                <Hash className="w-3 h-3 mr-1" />
                                Rank {section.importance_rank}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate(-1)} className="btn-secondary">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="btn-secondary lg:hidden">
                  <Menu className="w-5 h-5 mr-2" />
                  Menu
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPanelOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                AI Insights Hub
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 p-4">
          <div className="w-full h-full">
            <div id="pdf-viewer" className="w-full h-full bg-white rounded-lg shadow-xl" />
          </div>
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* === CORRECTED: Simplified and correct props === */}
      <RightPanel
        visible={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        pageType="section"
        text={selectedSectionText}
        onInsightClick={handleInsightClick}
        sectionInsights={sectionInsights[selectedSectionKey || '']}
        loadingInsights={loadingInsights[selectedSectionKey || '']}
      />
    </motion.div>
  );
};

export default QueryDocumentViewer;
// import React, { useEffect, useState, useRef } from 'react';
// import { useLocation, useParams, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import RightPanel from "./RightPanel";
// import {
//   ArrowLeft,
//   Menu,
//   X,
//   FileText,
//   BookOpen,
//   Search,
//   Hash
// } from 'lucide-react';
// import { usePDF } from '../context/PDFContext';

// declare global {
//   interface Window {
//     AdobeDC: {
//       View: {
//         new (config: { clientId: string; divId: string }): any;
//         Enum: {
//           CallbackType: {
//             EVENT_LISTENER: string;
//           };
//         };
//       };
//     };
//   }
// }

// interface ExtractedSection {
//   document: string;
//   importance_rank: number;
//   page_number: number;
//   section_title: string;
//   rects?: any[];
// }

// interface SubsectionAnalysis {
//   document: string;
//   page_number: number;
//   refined_text: string;
// }

// declare global {
//   interface QueryResult {
//     extracted_sections: ExtractedSection[];
//     subsection_analysis?: SubsectionAnalysis[];
//     metadata?: {
//       input_documents?: string[];
//       job_to_be_done?: string;
//       persona?: string;
//       processing_timestamp?: string;
//       annotated_files?: { [original: string]: string };
//       llm_input: string;
//     };
//   };
// }

// const QueryDocumentViewer: React.FC = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { getPDFById, getPDFByServerFilename, pdfs } = usePDF();

//   const [selectedSectionText, setSelectedSectionText] = useState<string>('');
//   const [isPanelOpen, setIsPanelOpen] = useState(false);

//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
//   const [requestedPage, setRequestedPage] = useState<number | null>(null);
//   const [initialSectionKey, setInitialSectionKey] = useState<string | null>(null);

//   const [queryType, setQueryType] = useState<'similarity' | 'contradiction' | null>(null);
//   const [selectedText, setSelectedText] = useState('');

//   const [result, setResult] = useState<QueryResult | undefined>(
//     (location.state as any)?.result
//   );

//   const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null);

//   // === Integrated state (generic per-section insights and loading) ===
//   const [sectionInsights, setSectionInsights] = useState<{ [key: string]: any }>({});
//   const [loadingInsights, setLoadingInsights] = useState<{ [key: string]: boolean }>({});

//   const viewerRef = useRef<any>(null);

//   const urlParams = new URLSearchParams(location.search);
//   const requestedPageFromUrl = parseInt(urlParams.get('page') || '0', 10) || null;

//   const currentPDF = id
//     ? getPDFById(id)
//     : selectedDocument
//     ? getPDFByServerFilename(selectedDocument)
//     : pdfs[0];

//   const getCleanDocumentName = (document: string) => {
//     const parts = document.split('_');
//     return parts.length > 1 ? parts.slice(1).join('_') : document;
//   };

//   const getSectionsByDocument = (): { [key: string]: ExtractedSection[] } => {
//     if (!result?.extracted_sections) return {};
//     return result.extracted_sections.reduce((acc: any, section) => {
//       if (!acc[section.document]) acc[section.document] = [];
//       acc[section.document].push(section);
//       return acc;
//     }, {});
//   };

//   useEffect(() => {
//     if (location.state) {
//       setResult((location.state as any).result);
//       setQueryType((location.state as any).queryType);
//       setSelectedText((location.state as any).selectedText || '');

//       if ((location.state as any).selectedSectionKey) {
//         setSelectedSectionKey((location.state as any).selectedSectionKey);
//         setInitialSectionKey((location.state as any).selectedSectionKey);
//       }

//       if ((location.state as any).selectedSection) {
//         const section = (location.state as any).selectedSection as ExtractedSection;
//         setSelectedDocument(section.document);
//         setRequestedPage(section.page_number);

//         // Set initial section text
//         const matchingAnalysis = (location.state as any).result?.subsection_analysis?.find(
//           (a: any) =>
//             a.document === section.document &&
//             a.page_number === section.page_number
//         );
//         if (matchingAnalysis) {
//           setSelectedSectionText(matchingAnalysis.refined_text);
//         }
//       }
//     } else {
//       try {
//         const stored = sessionStorage.getItem('lastQueryResult');
//         if (!result && stored) {
//           const parsed = JSON.parse(stored);
//           setResult(parsed);
//           if (parsed.extracted_sections?.[0]?.document) {
//             setSelectedDocument(parsed.extracted_sections[0].document);
//           }
//         }
//       } catch (e) {
//         console.warn('Failed to parse persisted query result in viewer', e);
//       }
//     }

//     if (requestedPageFromUrl) {
//       setRequestedPage(requestedPageFromUrl);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [location.state]);

//   useEffect(() => {
//     if (result?.extracted_sections && !selectedDocument) {
//       const first = result.extracted_sections[0]?.document;
//       if (first) setSelectedDocument(first);
//     }
//   }, [result, selectedDocument]);

//   const attemptGoto = async (pageNumber: number, retries = 12, delayMs = 300): Promise<boolean> => {
//     const pn = Math.max(1, Math.floor(Number(pageNumber) || 1));
//     for (let i = 0; i < retries; i++) {
//       try {
//         if (viewerRef.current && typeof viewerRef.current.getAPIs === 'function') {
//           const apis = await viewerRef.current.getAPIs();
//           if (apis && typeof apis.gotoLocation === 'function') {
//             await apis.gotoLocation(pn, 0, 0);
//             return true;
//           }
//         }
//       } catch {
//         // retry silently
//       }
//       await new Promise((r) => setTimeout(r, delayMs));
//     }
//     return false;
//   };

//   useEffect(() => {
//     if (!currentPDF || !currentPDF.serverFilename) return;
//     if (!(window as any).AdobeDC) {
//       console.warn('AdobeDC not available on window.');
//       return;
//     }

//     const container = document.getElementById('pdf-viewer');
//     if (container) container.innerHTML = '';

//     const adobeDCView = new window.AdobeDC.View({
//       clientId: '35466cb0881f4c34abe4f6c105cfcf90',
//       divId: 'pdf-viewer'
//     });

//     const annotatedFiles = result?.metadata?.annotated_files || {};
//     const annotatedForThis = annotatedFiles ? annotatedFiles[currentPDF.serverFilename] : null;
//     const ts = result?.metadata?.processing_timestamp
//       ? encodeURIComponent(result.metadata.processing_timestamp)
//       : Date.now();

//     const filenameToLoad = annotatedForThis || currentPDF.serverFilename;
//     const url = `http://localhost:5001/uploads/${filenameToLoad}?t=${ts}`;

//     adobeDCView
//       .previewFile(
//         {
//           content: { location: { url } },
//           metaData: { fileName: currentPDF.name }
//         },
//         {
//           embedMode: 'FULL_WINDOW',
//           defaultViewMode: 'FIT_PAGE',
//           showAnnotationTools: true,
//           enableSearchAPIs: true
//         }
//       )
//       .then((viewer: any) => {
//         viewerRef.current = viewer;
//         try {
//           viewer.registerCallback(
//             window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
//             (event: any) => {
//               if (event.type === 'PAGE_VIEW') {
//                 setCurrentPage(event.data.pageNumber);
//               }
//             },
//             { enablePageChangeEvents: true }
//           );
//         } catch { /* no-op */ }

//         if (requestedPage) {
//           setTimeout(() => {
//             attemptGoto(requestedPage);
//           }, 500);
//         }
//       })
//       .catch((err: any) => {
//         console.error('Adobe previewFile error:', err);
//       });

//     return () => {
//       viewerRef.current = null;
//     };
//   }, [currentPDF, result?.metadata?.annotated_files, result?.metadata?.processing_timestamp, requestedPage]);

//   const handleSectionClick = (section: ExtractedSection) => {
//     const matchingAnalysis = result?.subsection_analysis?.find(
//       (analysis) =>
//         analysis.document === section.document &&
//         analysis.page_number === section.page_number
//     );
//     if (matchingAnalysis) {
//       setSelectedSectionText(matchingAnalysis.refined_text);
//     } else {
//       setSelectedSectionText('');
//     }
//     setCurrentPage(section.page_number);

//     const key = `${section.document}_${section.page_number}_${section.section_title}`.replace(/\s+/g, '_');
//     setSelectedSectionKey(key);

//     // Prepare state containers for this section key if missing
//     if (sectionInsights[key] === undefined) {
//       setSectionInsights(prev => ({ ...prev, [key]: null }));
//     }
//     if (loadingInsights[key] === undefined) {
//       setLoadingInsights(prev => ({ ...prev, [key]: false }));
//     }

//     const targetPage = Math.max(1, Math.floor(Number(section.page_number) || 1));
//     const targetPDF = getPDFByServerFilename(section.document);
//     if (!targetPDF) return;

//     const samePdfLoaded =
//       (currentPDF && currentPDF.serverFilename === targetPDF.serverFilename) ||
//       selectedDocument === section.document ||
//       (!id && !selectedDocument && pdfs.length > 0 && pdfs[0].serverFilename === targetPDF.serverFilename);

//     if (samePdfLoaded) {
//       setSelectedDocument(section.document);
//       setRequestedPage(targetPage);
//       attemptGoto(targetPage).then((ok) => {
//         if (!ok) console.warn('Failed to navigate to page', targetPage);
//       });
//       return;
//     }

//     setSelectedDocument(section.document);
//     setRequestedPage(targetPage);
//     navigate(`/query/${targetPDF.id}?page=${targetPage}`, {
//       state: {
//         result,
//         selectedSection: section,
//         selectedSectionKey: key
//       },
//       replace: true
//     });
//   };

//   // === Integrated handler: generic insights endpoint ===
//   // In QueryDocumentViewer.tsx

//   const handleInsightClick = async (type: 'summary' | 'didYouKnow') => {
//     if (!selectedSectionKey || !selectedSectionText) return;

//     // Use a more specific loading state key
//     const loadingKey = `${selectedSectionKey}_${type}`;
//     setLoadingInsights(prev => ({ ...prev, [loadingKey]: true }));

//     // Determine the correct API endpoint based on the type
//     const endpoint = type === 'summary' ? '/summarize' : '/did-you-know';

//     try {
//       const response = await fetch(`http://localhost:5001${endpoint}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         // Use the correct 'prompt' key in the body
//         body: JSON.stringify({ prompt: selectedSectionText }),
//       });

//       if (!response.ok) {
//         throw new Error(`API request failed with status ${response.status}`);
//       }
      
//       const data = await response.json();

//       // Store the result under the correct type for the section
//       setSectionInsights(prev => ({
//         ...prev,
//         [selectedSectionKey]: {
//           ...prev[selectedSectionKey],
//           [type]: data.response, // The backend returns the text in a 'response' key
//         },
//       }));

//     } catch (err) {
//       console.error(`Failed to get insight for type '${type}':`, err);
//     } finally {
//       setLoadingInsights(prev => ({ ...prev, [loadingKey]: false }));
//     }
//   };
//   // const handleInsightClick = async (sectionKey: string) => {
//   //   if (!sectionKey || !selectedSectionText) return;

//   //   setLoadingInsights(prev => ({ ...prev, [sectionKey]: true }));

//   //   try {
//   //     const response = await fetch('http://localhost:5001/insights', {
//   //       method: 'POST',
//   //       headers: { 'Content-Type': 'application/json' },
//   //       body: JSON.stringify({ text: selectedSectionText })
//   //     });

//   //     const data = await response.json();
//   //     setSectionInsights(prev => ({ ...prev, [sectionKey]: data }));
//   //   } catch (err) {
//   //     console.error('Failed to get insights:', err);
//   //   } finally {
//   //     setLoadingInsights(prev => ({ ...prev, [sectionKey]: false }));
//   //   }
//   // };

//   if (!result) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
//           <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h2 className="text-2xl font-semibold text-gray-800 mb-2">No query results found</h2>
//           <p className="text-gray-600 mb-6">Please run a query first to view results.</p>
//           <button onClick={() => navigate('/query')} className="btn-primary">
//             <ArrowLeft className="w-5 h-5 mr-2" />
//             Back to Query
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   if (!currentPDF) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
//           <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h2 className="text-2xl font-semibold text-gray-800 mb-2">PDF not found</h2>
//           <p className="text-gray-600 mb-6">The requested document could not be found.</p>
//           <button onClick={() => navigate('/query')} className="btn-primary">
//             <ArrowLeft className="w-5 h-5 mr-2" />
//             Back to Query
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   const sectionsByDocument = getSectionsByDocument();

//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 flex">
//       <AnimatePresence>
//         {sidebarOpen && (
//           <motion.div
//             initial={{ x: -400, opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             exit={{ x: -400, opacity: 0 }}
//             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
//             className="w-80 lg:w-96 bg-white shadow-xl border-r border-gray-200 flex flex-col relative z-20"
//           >
//             <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center space-x-2">
//                   <Search className="w-6 h-6 text-primary-600" />
//                   <h2 className="text-lg font-semibold text-gray-800">
//                     {queryType === 'similarity' ? 'Similarity' : queryType === 'contradiction' ? 'Contradiction' : 'Query'} Results
//                   </h2>
//                 </div>
//                 <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors">
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//               {selectedText && (
//                 <div className="text-sm text-gray-600 mb-3">
//                   <p className="font-medium">Selected Text:</p>
//                   <div className="text-xs bg-gray-100 p-2 rounded mt-1 max-h-20 overflow-y-auto">
//                     {selectedText}
//                   </div>
//                 </div>
//               )}
//               {result?.metadata?.persona && (
//                 <div className="text-sm text-gray-600">
//                   <p className="font-medium">Role: {result.metadata.persona}</p>
//                   <p>Task: {result.metadata.job_to_be_done}</p>
//                 </div>
//               )}
//               <p className="text-xs text-primary-600 mt-2">{result.extracted_sections.length} sections found</p>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[80vh]">
//               {Object.entries(sectionsByDocument).map(([document, sections]) => (
//                 <div key={document} className="space-y-2">
//                   <div className="sticky top-0 bg-white z-10 p-2 border-b border-gray-100">
//                     <h3 className="font-semibold text-gray-800 text-sm flex items-center">
//                       <FileText className="w-4 h-4 mr-2 text-primary-600" />
//                       {getCleanDocumentName(document)}
//                       {selectedDocument === document && <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Current</span>}
//                     </h3>
//                   </div>
//                   {sections.map((section, idx) => {
//                     const sectionKey = `${section.document}_${section.page_number}_${section.section_title}`.replace(/\s+/g, '_');
//                     const isSelected = selectedSectionKey === sectionKey ||
//                       (initialSectionKey === sectionKey && !selectedSectionKey);
//                     return (
//                       <motion.div
//                         key={sectionKey}
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: idx * 0.05 }}
//                         className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
//                           isSelected ? 'bg-primary-100 border-primary-300 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
//                         }`}
//                         onClick={() => handleSectionClick(section)}
//                       >
//                         <div className="flex items-start justify-between">
//                           <div className="flex-1 min-w-0">
//                             <h4 className="font-medium text-gray-800 text-sm truncate" title={section.section_title}>
//                               {section.section_title}
//                             </h4>
//                             <div className="flex items-center space-x-3 mt-2 text-xs">
//                               <span className="flex items-center text-primary-600">
//                                 <BookOpen className="w-3 h-3 mr-1" />
//                                 Page {section.page_number}
//                               </span>
//                               <span className="flex items-center text-orange-600">
//                                 <Hash className="w-3 h-3 mr-1" />
//                                 Rank {section.importance_rank}
//                               </span>
//                             </div>
//                           </div>
//                           <div className="flex-shrink-0 ml-2">
//                             <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">#{section.importance_rank}</span>
//                           </div>
//                         </div>
//                       </motion.div>
//                     );
//                   })}
//                 </div>
//               ))}
//               {result.subsection_analysis && result.subsection_analysis.length > 0 && (
//                 <div className="mt-6 pt-4 border-t border-gray-200">
//                   <h3 className="font-semibold text-gray-800 mb-3 text-sm">Detailed Analysis</h3>
//                   <div className="space-y-2">
//                     {result.subsection_analysis.map((analysis, idx) => (
//                       <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
//                         <div className="font-medium text-blue-800 mb-1">{getCleanDocumentName(analysis.document)} - Page {analysis.page_number}</div>
//                         <p className="text-blue-700 line-clamp-3">{analysis.refined_text}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="flex-1 flex flex-col">
//         <div className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6 relative z-10">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <button onClick={() => navigate(-1)} className="btn-secondary">
//                 <ArrowLeft className="w-5 h-5 mr-2" />
//                 Back to Results
//               </button>
//               {!sidebarOpen && (
//                 <button onClick={() => setSidebarOpen(true)} className="btn-secondary lg:hidden">
//                   <Menu className="w-5 h-5 mr-2" />
//                   Show Results
//                 </button>
//               )}
//             </div>
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => setIsPanelOpen(!isPanelOpen)}
//                 className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
//               >
//                 AI Insights Hub
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 p-4 lg:p-8">
//           <div className="max-w-5xl mx-auto h-full">
//             <div id="pdf-viewer" className="w-full h-full max-h-[90vh] bg-white rounded-2xl shadow-xl" />
//           </div>
//         </div>
//       </div>

//       {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />}

//       {/* <RightPanel
//         visible={isPanelOpen}
//         onClose={() => setIsPanelOpen(false)}
//         text={selectedSectionText}
//         sectionInsights={sectionInsights[selectedSectionKey || '']}
//         loadingInsights={loadingInsights[selectedSectionKey || ''] || false}
//         onInsightClick={() => handleInsightClick(selectedSectionKey || '')}
//         pageType="section"
//       /> */}
      

// <RightPanel
//     visible={isPanelOpen}
//     onClose={() => setIsPanelOpen(false)}
//     pageType="section"
//     text={selectedSectionText}
//     // Pass the handler directly
//     onInsightClick={handleInsightClick}
//     // Read the insights from the nested state object
//     sectionInsights={sectionInsights[selectedSectionKey || '']}
//     // Update loading state check
//     loadingInsights={{
//         summary: loadingInsights[`${selectedSectionKey}_summary`] || false,
//         didYouKnow: loadingInsights[`${selectedSectionKey}_didYouKnow`] || false,
//     }}
// />
//     </motion.div>
//   );
// };

// export default QueryDocumentViewer;
