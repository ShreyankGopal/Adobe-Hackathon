import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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

import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Menu, 
  X, 
  FileText, 
  BookOpen,
  Eye,
  EyeOff,
  Search,
  Hash
} from 'lucide-react';
import { usePDF } from '../context/PDFContext';

interface ExtractedSection {
  document: string;
  importance_rank: number;
  page_number: number;
  section_title: string;
}

interface SubsectionAnalysis {
  document: string;
  page_number: number;
  refined_text: string;
}

interface QueryResult {
  extracted_sections: ExtractedSection[];
  subsection_analysis: SubsectionAnalysis[];
  metadata: {
    input_documents: string[];
    job_to_be_done: string;
    persona: string;
    processing_timestamp: string;
  };
}

const QueryDocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPDFById, getPDFByServerFilename, pdfs } = usePDF();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const viewerRef = useRef<any>(null);
  const location = useLocation();
  const result: QueryResult = location.state?.result;
  
  // Get current PDF or default to first PDF if none selected
  const currentPDF = id ? getPDFById(id) : (selectedDocument ? getPDFByServerFilename(selectedDocument) : pdfs[0]);

  // Extract clean document name (remove prefix before first underscore)
  const getCleanDocumentName = (document: string): string => {
    const parts = document.split('_');
    return parts.length > 1 ? parts.slice(1).join('_') : document;
  };

  // Get unique documents from results
  const getUniqueDocuments = (): string[] => {
    if (!result?.extracted_sections) return [];
    const documents = new Set(result.extracted_sections.map(section => section.document));
    return Array.from(documents);
  };

  // Group sections by document
  const getSectionsByDocument = (): { [key: string]: ExtractedSection[] } => {
    if (!result?.extracted_sections) return {};
    return result.extracted_sections.reduce((acc, section) => {
      if (!acc[section.document]) {
        acc[section.document] = [];
      }
      acc[section.document].push(section);
      return acc;
    }, {} as { [key: string]: ExtractedSection[] });
  };

  // Initialize with first document if available
  useEffect(() => {
    if (result?.extracted_sections && !selectedDocument) {
      const firstDoc = result.extracted_sections[0]?.document;
      if (firstDoc) {
        setSelectedDocument(firstDoc);
      }
    }
  }, [result, selectedDocument]);

  useEffect(() => {
    if (currentPDF && currentPDF.serverFilename && window.AdobeDC) {
      // Clear previous viewer
      const viewerContainer = document.getElementById('pdf-viewer');
      if (viewerContainer) {
        viewerContainer.innerHTML = '';
      }

      const adobeDCView = new window.AdobeDC.View({
        clientId: "35466cb0881f4c34abe4f6c105cfcf90",
        divId: "pdf-viewer",
      });

      adobeDCView.previewFile({
        content: {
          location: {
            url: `http://localhost:5001/uploads/${currentPDF.serverFilename}`,
          },
        },
        metaData: {
          fileName: currentPDF.name,
        },
      }, {
        embedMode: "FULL_WINDOW",
        defaultViewMode: "FIT_PAGE",
        showAnnotationTools: true,
        enableSearchAPIs: true,
      }).then((viewer: any) => {
        viewerRef.current = viewer;

        viewer.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
          (event: any) => {
            if (event.type === "PAGE_VIEW") {
              setCurrentPage(event.data.pageNumber);
            }
          },
          { enablePageChangeEvents: true }
        );
      });

      return () => {
        viewerRef.current = null;
      };
    }
  }, [currentPDF]);

  const handleSectionClick = (section: ExtractedSection) => {
    const targetPDF = getPDFByServerFilename(section.document);
  
    if (!targetPDF) return;
  
    if (selectedDocument === section.document) {
      // Same PDF → just go to the location
      if (viewerRef.current) {
        viewerRef.current.getAPIs()
          .then(apis => apis.gotoLocation( section.page_number ))
          .catch(error => console.error('Error navigating to page:', error));
      }
    } else {
      // Different PDF → navigate, set selection, then jump to page
      navigate(`/query/${targetPDF.id}`, { 
        state: { result },
        replace: true 
      });
  
      setSelectedDocument(section.document);
  
      setTimeout(async () => {
        if (viewerRef.current) {
          try {
            const apis = await viewerRef.current.getAPIs();
            await apis.gotoLocation({ pageNumber: section.page_number });
          } catch (error) {
            console.error('Error navigating to page:', error);
          }
        }
      }, 1000); // Allow PDF to load before jumping
    }
  };
  

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No query results found</h2>
          <p className="text-gray-600 mb-6">Please run a query first to view results.</p>
          <button
            onClick={() => navigate('/query')}
            className="btn-primary"
          >
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">PDF not found</h2>
          <p className="text-gray-600 mb-6">The requested document could not be found.</p>
          <button
            onClick={() => navigate('/query')}
            className="btn-primary"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Query
          </button>
        </motion.div>
      </div>
    );
  }

  const sectionsByDocument = getSectionsByDocument();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 flex"
    >
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 lg:w-96 bg-white shadow-xl border-r border-gray-200 flex flex-col relative z-20"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Search className="w-6 h-6 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Query Results</h2>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Role: {result.metadata.persona}</p>
                <p>Task: {result.metadata.job_to_be_done}</p>
              </div>
              <p className="text-xs text-primary-600 mt-2">
                {result.extracted_sections.length} sections found
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[80vh]">
              {Object.entries(sectionsByDocument).map(([document, sections]) => (
                <div key={document} className="space-y-2">
                  <div className="sticky top-0 bg-white z-10 p-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-primary-600" />
                      {getCleanDocumentName(document)}
                      {selectedDocument === document && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </h3>
                  </div>
                  
                  {sections.map((section, idx) => (
                    <motion.div
                      key={`${document}-${section.section_title}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                        selectedDocument === document
                          ? 'bg-primary-100 border-primary-300 shadow-md'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSectionClick(section)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 text-sm truncate" title={section.section_title}>
                            {section.section_title}
                          </h4>
                          <div className="flex items-center space-x-3 mt-2 text-xs">
                            <span className="flex items-center text-primary-600">
                              <BookOpen className="w-3 h-3 mr-1" />
                              Page {section.page_number}
                            </span>
                            <span className="flex items-center text-orange-600">
                              <Hash className="w-3 h-3 mr-1" />
                              Rank {section.importance_rank}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                            #{section.importance_rank}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}

              {result.subsection_analysis && result.subsection_analysis.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Detailed Analysis</h3>
                  <div className="space-y-2">
                    {result.subsection_analysis.map((analysis, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs"
                      >
                        <div className="font-medium text-blue-800 mb-1">
                          {getCleanDocumentName(analysis.document)} - Page {analysis.page_number}
                        </div>
                        <p className="text-blue-700 line-clamp-3">{analysis.refined_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/query')}
                className="btn-secondary"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Query
              </button>
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="btn-secondary lg:hidden"
                >
                  <Menu className="w-5 h-5 mr-2" />
                  Show Results
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex btn-secondary"
              >
                {sidebarOpen ? (
                  <>
                    <EyeOff className="w-5 h-5 mr-2" />
                    Hide Results
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    Show Results
                  </>
                )}
              </button>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                {currentPDF ? getCleanDocumentName(currentPDF.name) : 'Loading...'} • Page {currentPage}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto h-full">
            <div
              id="pdf-viewer"
              className="w-full h-full max-h-[90vh] bg-white rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </motion.div>
  );
};

export default QueryDocumentViewer;