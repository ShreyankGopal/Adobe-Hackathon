import React, { useState, useEffect } from 'react';
import { usePDF } from '../context/PDFContext';
import PdfCard from './PdfCard';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RightPanel from './RightPanel';

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
};

const ContradictoryPage: React.FC = () => {
  const { pdfs, removePDF, isProcessing, getPDFByServerFilename } = usePDF();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState<any>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isInsightsPanelOpen, setIsInsightsPanelOpen] = useState(false);

  useEffect(() => {
    if (location.state?.negativeResult) {
      setResult(location.state.negativeResult);
      setSelectedText(location.state.selectedText || location.state.negativeResult.metadata?.selected_text || '');
    } else {
      try {
        const stored = sessionStorage.getItem('pdfQuery.negativeResult');
        const storedText = sessionStorage.getItem('pdfQuery.selectedText') || '';
        if (stored) {
          setResult(JSON.parse(stored));
          setSelectedText(storedText);
        }
      } catch (e) {
        console.warn('Failed to restore contradictory result from sessionStorage', e);
      }
    }
  }, [location.state]);

  const handleRemovePDF = (id: string | number) => removePDF(id as string);
  const handlePDFClick = (id: string | number) => navigate(`/document/${id}`);

  const handleExtractedSectionClick = (section: any) => {
    const pdf = getPDFByServerFilename(section.document);
    if (pdf) {
      const sectionKey = `${section.document}_${section.page_number}_${section.section_title}`.replace(/\s+/g, '_');
      navigate(`/query/${pdf.id}?page=${section.page_number}`, {
        state: {
          result,
          queryType: 'contradiction',
          selectedText,
          selectedSection: section,
          selectedSectionKey: sectionKey,
        }
      });
    }
  };

  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 p-4">
      <nav className="relative z-10 bg-transparent p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-lg font-semibold hover:text-[#4DA3FF]">Home</Link>
          <button onClick={goBack} className="text-lg font-semibold hover:text-[#4DA3FF]">Back to Query</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
        {/* Left Panel */}
        <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border p-4 flex flex-col">
          <div className="flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Contradiction Analysis</h2>
            <p className="text-xs text-slate-600 mb-3">Conflicting information found.</p>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Original Text</label>
            <div className="max-h-32 border rounded-lg p-3 text-sm bg-slate-50 overflow-y-auto">
              {selectedText}
            </div>
          </div>
          <div className="mt-4 flex-1 min-h-0 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Source PDFs ({pdfs.length})</h3>
            <div className="flex-1 overflow-y-auto pr-2">
              <motion.div variants={containerVariants} initial="hidden" animate="show">
                {pdfs.map(pdf => (
                  <motion.div key={pdf.id} variants={itemVariants} className="mb-2">
                    <PdfCard pdf={pdf} onRemove={handleRemovePDF} onClick={handlePDFClick} isProcessing={isProcessing}/>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Panel (Results) */}
        <div className="lg:col-span-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-slate-800">Contradiction Results</h3>
            {result?.insights && (
              <button onClick={() => setIsInsightsPanelOpen(true)} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg">
                AI Insights Hub
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {result?.extracted_sections?.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {result.extracted_sections.map((s: any, idx: number) => (
                  <div key={`${s.document}-${idx}`} onClick={() => handleExtractedSectionClick(s)}
                    className="bg-gradient-to-br from-white to-red-50 border-red-200 border rounded-lg p-3 hover:shadow-md cursor-pointer">
                    <div className="text-xs text-slate-500">Document</div>
                    <div className="font-semibold text-sm mb-2 truncate">{s.document}</div>
                    <div className="text-xs text-slate-500">Section</div>
                    <div className="text-sm text-slate-700 mb-2 line-clamp-2">{s.section_title}</div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Page {s.page_number}</span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                        Rank #{s.importance_rank}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 p-12 border-2 border-dashed rounded-lg">No contradictory sections found.</div>
            )}
          </div>
        </div>
      </div>
      
      <RightPanel visible={isInsightsPanelOpen} onClose={() => setIsInsightsPanelOpen(false)} insights={result?.insights} pageType="query"/>
    </div>
  );
};

export default ContradictoryPage;
// import React, { useState, useEffect } from 'react';
// import { usePDF } from '../context/PDFContext';
// import PdfCard from './PdfCard';
// import { motion } from 'framer-motion';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import RightPanel from './RightPanel';

// const containerVariants = {
//   hidden: { opacity: 0, y: 8 },
//   show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } }
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 8 },
//   show: { opacity: 1, y: 0 }
// };

// const ContradictoryPage: React.FC = () => {
//   const { pdfs, removePDF, isProcessing, getPDFByServerFilename } = usePDF();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [result, setResult] = useState<any>(null);
//   const [selectedText, setSelectedText] = useState('');
//   const [isInsightsPanelOpen, setIsInsightsPanelOpen] = useState(false);

//   useEffect(() => {
//     if (location.state?.negativeResult) {
//       setResult(location.state.negativeResult);
//       setSelectedText(location.state.negativeResult.metadata?.selected_text || '');
//     } else {
//       try {
//         const stored = sessionStorage.getItem('pdfQuery.negativeResult');
//         const storedText = sessionStorage.getItem('pdfQuery.selectedText') || '';
//         if (stored) {
//           setResult(JSON.parse(stored));
//           setSelectedText(storedText);
//         }
//       } catch (e) {
//         console.warn('Failed to restore negative result from sessionStorage', e);
//       }
//     }
//   }, [location.state]);

//   const handleRemovePDF = (id: string | number) => {
//     removePDF(id as string);
//   };

//   const handlePDFClick = (id: string | number) => {
//     navigate(`/document/${id}`);
//   };

//   const handleExtractedSectionClick = (documentId: string, pageNumber: number) => {
//     const pdf = getPDFByServerFilename(documentId);
//     if (pdf) {
//       navigate(`/query/${pdf.id}?page=${pageNumber}`, {
//         state: {
//           result,
//           queryType: 'contradiction',
//           selectedText
//         }
//       });
//     }
//   };

//   const goBackToQuery = () => {
//     if (window.history.length > 1) {
//       navigate(-1);
//     } else {
//       navigate('/QueryDocument');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 p-4">
//       <nav className="bg-[#002147] backdrop-blur-md border border-[#002147]/20 p-3 rounded-xl shadow-lg mb-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <Link to="/" className="text-white font-semibold transition-all duration-200 ease-in-out hover:scale-105">
//             Home
//           </Link>
//           <button
//             onClick={goBackToQuery}
//             className="text-white font-semibold transition-all duration-200 ease-in-out hover:scale-105"
//           >
//             Back to Query
//           </button>
//         </div>
//       </nav>

//       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
//         {/* Left Panel */}
//         <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full overflow-hidden">
//           <div className="flex-shrink-0">
//             <h2 className="text-lg font-bold text-slate-800 mb-1">Contradiction Analysis</h2>
//             <p className="text-xs text-slate-600 mb-3">Finding conflicting information.</p>
//           </div>

//           <div className="mb-4">
//             <label className="block text-xs font-semibold text-slate-700 mb-2">Original Text</label>
//             <div className="min-h-[80px] max-h-32 border border-slate-200 rounded-lg p-3 text-sm bg-slate-50 overflow-y-auto">
//               {selectedText}
//             </div>
//           </div>

//           <div className="mt-4 flex-1 min-h-0 flex flex-col">
//             <h3 className="text-sm font-semibold text-slate-700 mb-2 flex-shrink-0">
//               Source PDFs ({pdfs.length})
//             </h3>
//             <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
//               {pdfs.length > 0 ? (
//                 <motion.div variants={containerVariants} initial="hidden" animate="show">
//                   <div className="space-y-2">
//                     {pdfs.map(pdf => (
//                       <motion.div key={pdf.id} variants={itemVariants}>
//                         <PdfCard
//                           pdf={pdf}
//                           onRemove={handleRemovePDF}
//                           onClick={handlePDFClick}
//                           isProcessing={isProcessing}
//                         />
//                       </motion.div>
//                     ))}
//                   </div>
//                 </motion.div>
//               ) : (
//                 <div className="text-xs text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
//                   No PDFs found.
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Main Results Area */}
//         <div className="lg:col-span-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full overflow-hidden">
//           <div className="flex justify-between items-center mb-3">
//             <h3 className="text-xl font-bold text-slate-800 flex-shrink-0">Contradiction Results</h3>
//             <button
//               onClick={() => setIsInsightsPanelOpen(true)}
//               className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
//             >
//               AI Insights Hub
//             </button>
//           </div>

//           <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
//             {result ? (
//               <div className="space-y-4 pb-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {result.extracted_sections?.map((s: any, idx: number) => (
//                     <div
//                       key={`${s.document}-${s.section_title}-${idx}`}
//                       className="bg-white border border-red-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
//                       onClick={() => handleExtractedSectionClick(s.document, s.page_number)}
//                     >
//                       <div className="flex-1">
//                         <div className="flex justify-between items-start">
//                           <p className="text-xs text-slate-500 mb-2">
//                             {s.document.split('_').slice(1).join('_')}
//                           </p>
//                           <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium text-xs">
//                             Rank #{s.importance_rank}
//                           </span>
//                         </div>
//                         <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">{s.section_title}</h4>
//                       </div>
//                       <div className="text-xs text-slate-400 border-t border-slate-100 pt-2 mt-2">
//                         Page {s.page_number}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-center justify-center h-full text-slate-500">
//                 No results to display.
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
      
//       <RightPanel
//         visible={isInsightsPanelOpen}
//         onClose={() => setIsInsightsPanelOpen(false)}
//         insights={result?.insights}
//         pageType="query"
//       />
//     </div>
//   );
// };

// export default ContradictoryPage;
// import React, { useState, useEffect } from 'react';
// import { usePDF } from '../context/PDFContext';
// import PdfCard from './PdfCard';
// import { motion } from 'framer-motion';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import RightPanel from './RightPanel'; // ✅ make sure this exists

// const containerVariants = {
//   hidden: { opacity: 0, y: 8 },
//   show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } }
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 8 },
//   show: { opacity: 1, y: 0 }
// };

// const ContradictoryPage: React.FC = () => {
//   const { pdfs, removePDF, isProcessing, getPDFByServerFilename } = usePDF();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [result, setResult] = useState<any>(null);
//   const [selectedText, setSelectedText] = useState('');
//   const [isInsightsPanelOpen, setIsInsightsPanelOpen] = useState(false); // ✅ added state

//   useEffect(() => {
//     if (location.state?.negativeResult) {
//       setResult(location.state.negativeResult);
//       setSelectedText(location.state.negativeResult.metadata?.selected_text || '');
//     } else {
//       try {
//         const stored = sessionStorage.getItem('pdfQuery.negativeResult');
//         const storedText = sessionStorage.getItem('pdfQuery.selectedText') || '';
//         if (stored) {
//           setResult(JSON.parse(stored));
//           setSelectedText(storedText);
//         }
//       } catch (e) {
//         console.warn('Failed to restore negative result from sessionStorage', e);
//       }
//     }
//   }, [location.state]);

//   const handleRemovePDF = (id: string | number) => {
//     removePDF(id as string);
//   };

//   const handlePDFClick = (id: string | number) => {
//     navigate(`/document/${id}`);
//   };

//   const handleExtractedSectionClick = (documentId: string) => {
//     const pdf = getPDFByServerFilename(documentId);
//     navigate(`/query/${pdf?.id}`, {
//       state: {
//         result,
//         queryType: 'contradiction',
//         selectedText
//       }
//     });
//   };

//   const goBackToQuery = () => {
//     if (window.history.length > 1) {
//       navigate(-1);
//     } else {
//       navigate('/QueryDocument');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
//       <nav className="bg-[#002147] backdrop-blur-md border border-[#002147]/20 p-3 rounded-xl shadow-lg mb-4">
//         <div className="max-w-6xl mx-auto flex justify-between items-center">
//           <Link to="/" className="text-white font-semibold transition-all duration-200 ease-in-out hover:scale-105">
//             Home
//           </Link>
//           <button
//             onClick={goBackToQuery}
//             className="text-white font-semibold transition-all duration-200 ease-in-out hover:scale-105"
//           >
//             Back to Query
//           </button>
//         </div>
//       </nav>

//       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
//         {/* Left Panel */}
//         <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full overflow-hidden">
//           <div className="flex-shrink-0">
//             <h2 className="text-lg font-bold text-slate-800 mb-1">Contradiction Analysis</h2>
//             <p className="text-xs text-slate-600 mb-3">Finding contradictory content</p>
//           </div>

//           {/* Selected Text */}
//           <div className="mb-4">
//             <label className="block text-xs font-semibold text-slate-700 mb-2">Selected Text</label>
//             <div className="min-h-[80px] max-h-32 border border-slate-200 rounded-lg p-3 text-sm bg-slate-50 overflow-y-auto">
//               {selectedText}
//             </div>
//           </div>

//           {/* Uploaded PDFs section */}
//           <div className="mt-4 flex-1 min-h-0 flex flex-col">
//             <h3 className="text-sm font-semibold text-slate-700 mb-2 flex-shrink-0">
//               Uploaded PDFs ({pdfs.length})
//             </h3>
//             <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
//               {pdfs.length > 0 ? (
//                 <motion.div variants={containerVariants} initial="hidden" animate="show">
//                   <div className="space-y-2">
//                     {pdfs.map(pdf => (
//                       <motion.div key={pdf.id} variants={itemVariants}>
//                         <PdfCard
//                           pdf={pdf}
//                           onRemove={(id) => handleRemovePDF(id)}
//                           onClick={(id) => handlePDFClick(id)}
//                           isProcessing={(name) => isProcessing ? isProcessing(name) : false}
//                         />
//                       </motion.div>
//                     ))}
//                   </div>
//                 </motion.div>
//               ) : (
//                 <div className="text-xs text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
//                   No PDFs uploaded yet
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Main Results Area */}
//         <div className="lg:col-span-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full overflow-hidden">
//           {/* ✅ New header with AI Insights Hub button */}
//           <div className="flex justify-between items-center mb-3">
//             <h3 className="text-xl font-bold text-slate-800 flex-shrink-0">Contradiction Results</h3>
//             <button
//               onClick={() => setIsInsightsPanelOpen(true)}
//               className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
//             >
//               AI Insights Hub
//             </button>
//           </div>

//           <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
//             {result ? (
//               <div className="space-y-4 pb-4">
//                 {/* Metadata Section */}
//                 <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
//                   <div className="flex items-center justify-between text-sm">
//                     <div>
//                       <div className="text-xs text-slate-600">Processed at</div>
//                       <div className="font-semibold text-slate-800">{result.metadata?.processing_timestamp}</div>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-xs text-slate-600">Documents</div>
//                       <div className="font-semibold text-slate-800">{result.metadata?.input_documents?.length || 0}</div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Top Extracted Sections */}
//                 <div>
//                   <h4 className="font-bold text-slate-800 mb-3 flex items-center">
//                     <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
//                     Top Extracted Sections
//                   </h4>
//                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
//                     {result.extracted_sections?.map((s: any, idx: number) => (
//                       <div
//                         key={`${s.document}-${s.section_title}-${idx}`}
//                         className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
//                         onClick={() => handleExtractedSectionClick(s.document)}
//                       >
//                         <div className="text-xs text-slate-500 font-medium">Document</div>
//                         <div className="font-semibold text-slate-800 text-sm mb-2 truncate" title={s.document}>
//                           {s.document}
//                         </div>
//                         <div className="text-xs text-slate-500 font-medium">Section</div>
//                         <div className="text-sm text-slate-700 mb-2 line-clamp-2">{s.section_title}</div>
//                         <div className="flex justify-between items-center text-xs text-slate-400">
//                           <span>Page {s.page_number}</span>
//                           <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
//                             Rank #{s.importance_rank}
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Subsection Analysis */}
//                 <div>
//                   <h4 className="font-bold text-slate-800 mb-3 flex items-center">
//                     <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
//                     Detailed Analysis
//                   </h4>
//                   <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
//                     {result.subsection_analysis?.map((sa: any, idx: number) => (
//                       <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
//                         <div className="flex justify-between items-start mb-2">
//                           <div>
//                             <div className="text-xs text-slate-500 font-medium">Document</div>
//                             <div className="font-semibold text-slate-800 text-sm">{sa.document}</div>
//                           </div>
//                           <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
//                             Page {sa.page_number}
//                           </div>
//                         </div>
//                         <div className="text-xs text-slate-500 font-medium mb-1">Analysis</div>
//                         <div className="text-sm text-slate-700 leading-relaxed">{sa.refined_text}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <details className="bg-slate-50 rounded-lg border border-slate-200">
//                   <summary className="text-sm text-slate-600 cursor-pointer p-3 hover:bg-slate-100 transition-colors font-medium">
//                     Show Raw JSON Data
//                   </summary>
//                   <pre className="mt-2 max-h-40 overflow-auto text-xs bg-slate-800 text-green-400 p-4 rounded-b-lg font-mono">
//                     {JSON.stringify(result, null, 2)}
//                   </pre>
//                 </details>
//               </div>
//             ) : (
//               <div className="flex items-center justify-center h-full text-slate-500">
//                 No results to display
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ✅ Insights Panel */}
//       <RightPanel
//         visible={isInsightsPanelOpen}
//         onClose={() => setIsInsightsPanelOpen(false)}
//         text={selectedText}
//         insights={result?.insights}
//         pageType="contradiction"
//       />
//     </div>
//   );
// };

// export default ContradictoryPage;
