
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
          result: result, // Pass the contradictory results
          queryType: 'contradiction',
          selectedText,
          selectedSection: section,
          selectedSectionKey: sectionKey,
        }
      });
    }
  };

  const goBack = () => navigate(-1);

  const insightsText = selectedText + (result?.sections_formatted || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2A0A2A] to-black">
      <nav className="relative z-10 bg-transparent p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-white">
          <Link to="/" className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">Home</Link>
          <button onClick={goBack} className="text-lg font-semibold hover:text-[#4DA3FF] transition-colors">Back to Query</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[calc(100vh-120px)]">
        <div className="lg:col-span-1 bg-[#1a1a1a]/95 backdrop-blur-sm rounded-xl shadow-xl border border-purple-900/50 p-4 flex flex-col">
          <div className="flex-shrink-0">
            <h2 className="text-lg font-bold text-purple-200 mb-1">Contradiction Analysis</h2>
            <p className="text-xs text-purple-400/80 mb-3">Conflicting information found.</p>
          </div>

          <div className="mb-4 flex-shrink-0">
            <label className="block text-xs font-semibold text-purple-300 mb-2">Original Text</label>
            <div className="max-h-32 border border-purple-900/50 rounded-lg p-3 text-sm bg-[#2A0A2A]/80 overflow-y-auto text-gray-200">
              {selectedText}
            </div>
          </div>

          <div className="mt-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-purple-300 mb-2">Source PDFs ({pdfs.length})</h3>
            <div className="flex-1 overflow-y-auto pr-2">
              <motion.div variants={containerVariants} initial="hidden" animate="show">
                {pdfs.map(pdf => (
                  <motion.div key={pdf.id} variants={itemVariants} className="mb-2">
                    <PdfCard pdf={pdf} onRemove={handleRemovePDF} onClick={handlePDFClick} isProcessing={isProcessing} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#1a1a1a]/95 backdrop-blur-sm rounded-xl shadow-xl border border-purple-900/50 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-purple-200">Contradiction Results</h3>
            <button
              onClick={() => setIsInsightsPanelOpen(true)}
              className="bg-gradient-to-r from-red-600 to-orange-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              AI Insights Hub
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {result?.extracted_sections?.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {result.extracted_sections.map((s: any, idx: number) => (
                  <div
                    key={`${s.document}-${idx}`}
                    onClick={() => handleExtractedSectionClick(s)}
                    className="bg-[#2A0A2A]/80 border border-purple-900/50 rounded-lg p-3 hover:border-red-600/60 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="text-xs text-purple-400">Document</div>
                    <div className="font-semibold text-sm mb-2 text-gray-200 truncate">{s.document}</div>
                    <div className="text-xs text-purple-400">Section</div>
                    <div className="text-sm text-gray-300 mb-2 line-clamp-2">{s.section_title}</div>
                    <div className="flex justify-between items-center text-xs text-purple-500">
                      <span>Page {s.page_number}</span>
                      <span className="bg-red-900/50 text-red-300 px-2 py-1 rounded-full font-medium">
                        Rank #{s.importance_rank}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-purple-400/70 p-12 border-2 border-dashed border-purple-900/50 rounded-lg">
                No contradictory sections found.
              </div>
            )}

            <div className="mt-6">
              <h4 className="font-bold text-purple-200 mb-3 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Detailed Analysis
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {result?.subsection_analysis?.map((sa: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-[#2A0A2A]/80 border border-purple-900/50 rounded-lg p-4 shadow-sm hover:border-red-600/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs text-purple-400 font-medium">Document</div>
                        <div className="font-semibold text-gray-200 text-sm">{sa.document}</div>
                      </div>
                      <div className="text-xs text-purple-400 bg-black/40 px-2 py-1 rounded">
                        Page {sa.page_number}
                      </div>
                    </div>
                    <div className="text-xs text-purple-400 font-medium mb-1">Analysis</div>
                    <div className="text-sm text-gray-300 leading-relaxed">{sa.refined_text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <RightPanel
        visible={isInsightsPanelOpen}
        onClose={() => setIsInsightsPanelOpen(false)}
        pageType="query"
        storageKeyPrefix="contradiction_page"
        text={insightsText}
      />
    </div>
  );
};

export default ContradictoryPage;