import React, { useEffect, useState, useRef } from 'react';

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
      
      enableSearchAPIs: boolean, 
      
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
  ChevronDown, 
  ChevronRight, 
  ArrowLeft, 
  Menu, 
  X, 
  FileText, 
  BookOpen,
  Eye,
  EyeOff
} from 'lucide-react';
import { usePDF } from '../context/PDFContext';

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPDFById } = usePDF();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState(new Set(['Title', 'H1']));
  const [currentPage, setCurrentPage] = useState(1);

  const viewerRef = useRef<any>(null);
  const pdf = id ? getPDFById(id) : undefined;

  useEffect(() => {
    if (pdf && pdf.serverFilename && window.AdobeDC) {
      const adobeDCView = new window.AdobeDC.View({
        clientId: "35466cb0881f4c34abe4f6c105cfcf90",
        divId: "pdf-viewer",
      });

      adobeDCView.previewFile({
        content: {
          location: {
            url: `http://localhost:5001/uploads/${pdf.serverFilename}`,
          },
        },
        metaData: {
          fileName: pdf.name,
        },
      }, {
        embedMode: "FULL_WINDOW",
        defaultViewMode: "FIT_PAGE",
        showAnnotationTools: true,
        enableSearchAPIs: true, 
          
           // This enables search functionality in the viewer
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
  }, [pdf]);

  if (!pdf) {
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
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Upload
          </button>
        </motion.div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleHeadingClick = async (page: number, text: string) => {
    //console.log("Navigating to heading:", text, "on page:", page);
    console.log(page)
    if (!viewerRef.current) {
      console.error('Viewer not initialized');
      return;
    }

    try {
      const apis = await viewerRef.current.getAPIs();
      await apis.gotoLocation(page);
      console.log(`Successfully navigated to page ${page}`);
      // await apis.gotoLocation({ pageNumber: page });
      // console.log(`Successfully navigated to page ${page}`);
      
      // Now, perform the search to highlight the text
      const searchResult = await apis.search(text);

      searchResult.onResultsUpdate = (result) => {
          if (result.numMatches === 0) {
              console.warn(`No matches found for "${text}" on page ${page}`);
          } else {
              console.log(`Found ${result.numMatches} matches for "${text}". Highlighting enabled.`);
          }
      };
      
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error during navigation or search:', error);
    }
  };

  interface HeadingItem {
    text: string;
    page: number;
  }

  type GroupedHeadings = {
    [key: string]: HeadingItem[];
  };

  const groupHeadings = () => {
    const grouped: GroupedHeadings = {
      Title: [],
      H1: [],
      H2: [],
      H3: [],
    };
    if (pdf.outline) {
      grouped.Title.push({ text: pdf.outline.title, page: pdf.outline.outline[0]?.page || 1 });
      pdf.outline.outline.forEach(item => {
        if (grouped[item.level]) {
          grouped[item.level].push({ text: item.text, page: item.page });
        }
      });
    }
    return grouped;
  };

  const renderSection = (section: string, items: HeadingItem[]) => {
    const isExpanded = expandedSections.has(section);
    return (
      <div key={section} className="mb-2">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center py-3 px-4 rounded-lg cursor-pointer bg-primary-50 hover:bg-primary-100 transition-all duration-200"
          onClick={() => toggleSection(section)}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="mr-2"
          >
            <ChevronDown className="w-5 h-5 text-primary-600" />
          </motion.div>
          <span className="font-semibold text-gray-800">{section}</span>
          <span className="ml-2 text-sm text-gray-500">({items.length})</span>
        </motion.div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden ml-4"
            >
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center py-2 px-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200 ${
                    currentPage === item.page ? 'bg-primary-100' : ''
                  }`}
                  onClick={() => handleHeadingClick(item.page, item.text)}
                >
                  <span className="flex-1 truncate text-gray-700">{item.text}</span>
                  <span className="text-sm text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded">
                    p.{item.page}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const groupedHeadings = groupHeadings();

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
                  <BookOpen className="w-6 h-6 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Document Outline</h2>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 truncate font-medium" title={pdf.name}>
                {pdf.name}
              </p>
              {pdf.outline && (
                <p className="text-xs text-primary-600 mt-1">
                  {pdf.outline.outline.length} headings detected
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[60vh]">
              {Object.entries(groupedHeadings).map(([section, items]) =>
                items.length > 0 && renderSection(section, items)
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
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Upload
              </button>
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="btn-secondary lg:hidden"
                >
                  <Menu className="w-5 h-5 mr-2" />
                  Show Outline
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
                    Hide Outline
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    Show Outline
                  </>
                )}
              </button>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                Page {currentPage}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto h-full">
            <div
              id="pdf-viewer"
              className="w-full h-full max-h-[70vh] bg-white rounded-2xl shadow-xl"
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

export default DocumentViewer;