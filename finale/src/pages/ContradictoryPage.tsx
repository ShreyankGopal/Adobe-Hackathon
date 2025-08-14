import React, { useState, useEffect } from 'react';
import { usePDF } from '../context/PDFContext';
import PdfCard from './PdfCard';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

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
  
  // Only keep the state that's actually used
  const [result, setResult] = useState<any>(null);

  // Fix infinite re-rendering by using useEffect
  useEffect(() => {
    if (location.state?.negativeResult) {
      setResult(location.state.negativeResult);
    }
  }, [location.state?.negativeResult]);

  const handleRemovePDF = (id: string | number) => {
    removePDF(id as string);
  };

  const handlePDFClick = (id: string | number) => {
    navigate(`/document/${id}`);
  };

  const handleExtractedSectionClick = (idx: string | number) => {
    console.log(idx);
    const pdf = getPDFByServerFilename(idx as string);
    navigate(`/query/${pdf?.id}`, { state: { result } });
  };

  // Remove the unused handleSubmit function since there's no form

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Enhanced Navigation */}
      <nav className="bg-[#002147] backdrop-blur-md border border-[#002147]/20 p-3 rounded-xl shadow-lg mb-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-white font-semibold transition-all duration-200 ease-in-out hover:scale-105">
            Home
          </Link>
          <Link to="/query" className="text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-lg">
            Role Based Query
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
        {/* Main Results Area with Overflow */}
        <div className="lg:col-span-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full overflow-hidden">
          <h3 className="text-xl font-bold text-slate-800 mb-3 flex-shrink-0">Query Results</h3>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {result ? (
              <div className="space-y-4 pb-4">
                {/* Metadata Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-xs text-slate-600">Processed at</div>
                      <div className="font-semibold text-slate-800">{result.metadata?.processing_timestamp}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-600">Documents</div>
                      <div className="font-semibold text-slate-800">{result.metadata?.input_documents?.length || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Top Extracted Sections */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    Top Extracted Sections
                  </h4>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                    {result.extracted_sections?.map((s: any, idx: number) => (
                      <div 
                        key={`${s.document}-${s.section_title}-${idx}`} 
                        className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer" 
                        onClick={() => handleExtractedSectionClick(s.document)}
                      >
                        <div className="text-xs text-slate-500 font-medium">Document</div>
                        <div className="font-semibold text-slate-800 text-sm mb-2 truncate" title={s.document}>
                          {s.document}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Section</div>
                        <div className="text-sm text-slate-700 mb-2 line-clamp-2">{s.section_title}</div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>Page {s.page_number}</span>
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
                            Rank #{s.importance_rank}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subsection Analysis */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Detailed Analysis
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {result.subsection_analysis?.map((sa: any, idx: number) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-xs text-slate-500 font-medium">Document</div>
                            <div className="font-semibold text-slate-800 text-sm">{sa.document}</div>
                          </div>
                          <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                            Page {sa.page_number}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mb-1">Analysis</div>
                        <div className="text-sm text-slate-700 leading-relaxed">{sa.refined_text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw JSON Toggle */}
                <details className="bg-slate-50 rounded-lg border border-slate-200">
                  <summary className="text-sm text-slate-600 cursor-pointer p-3 hover:bg-slate-100 transition-colors font-medium">
                    Show Raw JSON Data
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto text-xs bg-slate-800 text-green-400 p-4 rounded-b-lg font-mono">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No results to display
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContradictoryPage;