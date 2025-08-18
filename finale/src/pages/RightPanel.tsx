// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { X, Sparkles, Lightbulb, Headphones, Loader2 } from 'lucide-react';
// import ReactMarkdown from 'react-markdown';

// interface RightPanelProps {
//   visible: boolean;
//   onClose: () => void;
//   text: string;
//   feature: 'full' | 'contra' | 'simi' | 'insights';
// }

// const STORAGE_TYPES = ['summary', 'didYouKnow', 'podcast'] as const;
// type ContentType = typeof STORAGE_TYPES[number];

// const RightPanel: React.FC<RightPanelProps> = ({ visible, onClose, text, feature }) => {
//   const [loading, setLoading] = useState<ContentType | null>(null);
//   const [content, setContent] = useState<Record<string, any>>({});
//   const [displayedSummary, setDisplayedSummary] = useState<string>("");
//   const [triggeredSummary, setTriggeredSummary] = useState<boolean>(false); // 👈 new flag

//   // Load from sessionStorage for current feature
//   useEffect(() => {
//     const restoredContent: Record<string, any> = {};
//     STORAGE_TYPES.forEach(type => {
//       const key = `${feature}_${type}`;
//       const stored = sessionStorage.getItem(key);
//       if (stored) restoredContent[type] = JSON.parse(stored);
//     });
//     setContent(restoredContent);
//   }, [feature]);

//   // Typing effect for summary (only if explicitly triggered by click)
//   useEffect(() => {
//     if (!triggeredSummary) return;

//     const summaryData = content.summary?.summary;
//     if (!summaryData) return;

//     setDisplayedSummary(""); // reset before animation

//     const words = summaryData.split(" ");
//     let i = 0;

//     const interval = setInterval(() => {
//       if (i == words.length-1) {
//         clearInterval(interval);
//         return;
//       }
//       setDisplayedSummary(prev => prev + (i === 0 ? "" : " ") + words[i]);
//       i++;
//     }, 100);

//     return () => clearInterval(interval);
//   }, [content.summary, triggeredSummary]);

//   if (!visible) return null;

//   const handleGenerate = async (type: ContentType) => {
//     console.log(text);
//     setLoading(type);
//     try {
//       let endpoint = '';
//       if (type === 'summary') endpoint = 'http://localhost:5001/generate_summary';
//       else if (type === 'didYouKnow') endpoint = 'http://localhost:5001/generate_didyouknow';
//       else if (type === 'podcast') endpoint = 'http://localhost:5001/generate_podcast';

//       const resp = await fetch(endpoint, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text })
//       });

//       if (!resp.ok) {
//         const body = await resp.json().catch(() => null);
//         throw new Error(body?.error || `Request failed: ${resp.status}`);
//       }

//       const data = await resp.json();

//       // Save in state
//       setContent(prev => ({ ...prev, [type]: data }));

//       // Save in sessionStorage
//       const storageKey = `${feature}_${type}`;
//       sessionStorage.setItem(storageKey, JSON.stringify(data));

//       // 👇 Mark summary as triggered only when user clicks
//       if (type === "summary") {
//         setTriggeredSummary(true);
//       }

//     } catch (err) {
//       console.error(err);
//       setContent(prev => ({ ...prev, [type]: { error: 'Failed to generate content' } }));
//     } finally {
//       setLoading(null);
//     }
//   };

//   const renderContentBlock = (type: ContentType) => {
//     const data = content[type];

//     if (loading === type) {
//       return (
//         <div className="flex justify-center py-6">
//           <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
//         </div>
//       );
//     }

//     if (!data) return null;

//     if (data.error) {
//       return <p className="text-red-400">{data.error}</p>;
//     }

//     if (type === 'summary') {
//       return (
//         <div>
//           <h3 className="text-blue-400 font-bold mb-3 flex items-center">
//             <Sparkles className="w-5 h-5 mr-2" />
//             Summary
//           </h3>
//           <div className="text-gray-200 whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto">
//             <ReactMarkdown>{displayedSummary}</ReactMarkdown>
//           </div>
//         </div>
//       );
//     }

//     if (type === 'didYouKnow') {
//       return (
//         <div>
//           <h3 className="text-blue-400 font-bold mb-3 flex items-center">
//             <Lightbulb className="w-5 h-5 mr-2" />
//             Did You Know?
//           </h3>
//           <div className="text-gray-200 whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto">
//             <ReactMarkdown>{data.didYouKnow}</ReactMarkdown>
//           </div>
//         </div>
//       );
//     }

//     if (type === 'podcast') {
//       return (
//         <div>
//           <h3 className="text-blue-400 font-bold mb-4 flex items-center">
//             <Headphones className="w-5 h-5 mr-2" />
//             Podcast
//           </h3>
//           <audio
//             controls
//             src={data.audio_url}
//             className="audio-dark w-full mb-3"
//           />

//           <style jsx>{`
//             .audio-dark { color-scheme: dark; }
//             .audio-dark::-webkit-media-controls-panel {
//               background-color: #1a1a1a;
//             }
//             .audio-dark::-webkit-media-controls-enclosure {
//               background-color: #1a1a1a;
//               border-radius: 0.5rem;
//             }
//             .audio-dark::-webkit-media-controls-timeline,
//             .audio-dark::-webkit-media-controls-volume-slider {
//               filter: contrast(1.1) saturate(0.9);
//             }
//           `}</style>

//           <div className="text-gray-200 whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto">
//             <ReactMarkdown>{data.script}</ReactMarkdown>
//           </div>
//         </div>
//       );
//     }

//     return null;
//   };

//   return (
//     <motion.div
//       initial={{ x: '100%' }}
//       animate={{ x: 0 }}
//       exit={{ x: '100%' }}
//       transition={{ type: 'spring', damping: 25, stiffness: 300 }}
//       className="fixed inset-y-0 right-0 w-96 bg-black text-white shadow-2xl border-l border-gray-700 z-50 flex flex-col"
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
//         <h2 className="text-lg font-semibold text-blue-400">AI Insights Hub</h2>
//         <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
//           <X className="w-5 h-5 text-gray-400 hover:text-white" />
//         </button>
//       </div>
  
//       {/* Content */}
//       <div className="p-4 overflow-y-auto flex-1 space-y-6">
//         {/* Action buttons */}
//         <div className="flex flex-col gap-4">
//           {/* Summary */}
//           <button
//             onClick={() => handleGenerate('summary')}
//             className="w-full py-3 text-white font-bold rounded-lg bg-[#274060] hover:bg-[#1B263B] transition-all shadow-lg"
//           >
//             <Sparkles className="inline w-5 h-5 mr-2" />
//             Generate Summary
//           </button>
  
//           {/* Did You Know */}
//           <button
//             onClick={() => handleGenerate('didYouKnow')}
//             className="w-full py-3 text-white font-bold rounded-lg bg-[#274060] hover:bg-[#1B263B] transition-all shadow-lg"
//           >
//             <Lightbulb className="inline w-5 h-5 mr-2" />
//             Generate Did You Know
//           </button>
  
//           {/* Podcast */}
//           {feature !== 'insights' && (
//             <button
//               onClick={() => handleGenerate('podcast')}
//               className="w-full py-3 text-white font-bold rounded-lg bg-[#274060] hover:bg-[#1B263B] transition-all shadow-lg"
//             >
//               <Headphones className="inline w-5 h-5 mr-2" />
//               Generate Podcast
//             </button>
//           )}
//         </div>
  
//         {/* Results */}
//         <div className="space-y-6">
//           <div>{renderContentBlock('summary')}</div>
//           <div>{renderContentBlock('didYouKnow')}</div>
//           <div>{renderContentBlock('podcast')}</div>
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// export default RightPanel;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Lightbulb, Headphones, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Define the types for props to ensure type safety and clarity
interface SectionInsights {
  summary?: string;
  didYouKnow?: string;
}

interface LoadingInsights {
  summary: boolean;
  didYouKnow: boolean;
}

const STORAGE_TYPES = ['summary', 'didYouKnow', 'podcast'] as const;
type ContentType = typeof STORAGE_TYPES[number];

interface RightPanelProps {
  visible: boolean;
  onClose: () => void;
  pageType: 'query' | 'section';
  text?: string;
  
  // Props for the 'section' pageType
  sectionInsights?: SectionInsights;
  loadingInsights?: LoadingInsights;
  onInsightClick?: (type: 'summary' | 'didYouKnow') => void;
  isSummaryAnimated?: boolean; // FIX: New prop to check animation status
  onAnimationComplete?: () => void; // FIX: New prop to signal animation is done
}

const RightPanel: React.FC<RightPanelProps> = ({
  visible,
  onClose,
  pageType,
  text,
  sectionInsights,
  loadingInsights,
  onInsightClick,
  isSummaryAnimated,
  onAnimationComplete,
}) => {
  // State for 'query' pageType
  const [loading, setLoading] = useState<ContentType | null>(null);
  const [content, setContent] = useState<Record<string, any>>({});
  const [displayedQuerySummary, setDisplayedQuerySummary] = useState<string>("");
  const [triggeredQuerySummary, setTriggeredQuerySummary] = useState<boolean>(false);

  // State for 'section' pageType animation
  const [displayedSectionSummary, setDisplayedSectionSummary] = useState<string>('');

  useEffect(() => {
    if (pageType === 'query') {
      const restoredContent: Record<string, any> = {};
      STORAGE_TYPES.forEach(type => {
        const key = `query_page_${type}`;
        const stored = sessionStorage.getItem(key);
        if (stored) restoredContent[type] = JSON.parse(stored);
      });
      setContent(restoredContent);
    }
  }, [pageType, visible]);
  
  // Typing effect for QUERY summary
  useEffect(() => {
    if (pageType !== 'query' || !triggeredQuerySummary) return;
    const summaryData = content.summary?.summary;
    if (!summaryData) return;
    
    setDisplayedQuerySummary(""); 
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedQuerySummary(prev => prev + summaryData[i]);
      i++;
      if (i == summaryData.length-1) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [content.summary, triggeredQuerySummary, pageType]);
  
  useEffect(() => {
    if (pageType === 'query' && content.summary?.summary && !triggeredQuerySummary) {
      setDisplayedQuerySummary(content.summary.summary);
    }
  }, [content.summary, triggeredQuerySummary, pageType]);

  // --- FIX: Updated typing effect logic for SECTION summary ---
  useEffect(() => {
    const summary = sectionInsights?.summary;
    if (pageType === 'section' && summary) {
      // If it has NOT been animated before, run the animation.
      if (!isSummaryAnimated) {
        setDisplayedSectionSummary('');
        let i = 0;
        const interval = setInterval(() => {
          setDisplayedSectionSummary(prev => prev + summary[i]);
          i++;
          if (i == summary.length-1) {
            clearInterval(interval);
            onAnimationComplete?.(); // Tell the parent we are done!
          }
        }, 20);
        return () => clearInterval(interval);
      } else {
        // If it HAS been animated before, show it instantly.
        setDisplayedSectionSummary(summary);
      }
    } else if (pageType === 'section') {
      setDisplayedSectionSummary(''); // Clear if no summary
    }
  }, [sectionInsights?.summary, pageType, isSummaryAnimated, onAnimationComplete]);

  if (!visible) return null;

  const handleGenerate = async (type: ContentType) => {
    // ... (This function remains the same)
    if (!text) return;
    setLoading(type);
    try {
      let endpoint = '';
      if (type === 'summary') endpoint = 'http://localhost:5001/generate_summary';
      else if (type === 'didYouKnow') endpoint = 'http://localhost:5001/generate_didyouknow';
      else if (type === 'podcast') endpoint = 'http://localhost:5001/generate_podcast';

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);

      const data = await resp.json();
      setContent(prev => ({ ...prev, [type]: data }));
      sessionStorage.setItem(`query_page_${type}`, JSON.stringify(data));
      
      if (type === "summary") setTriggeredQuerySummary(true);
    } catch (err) {
      console.error(err);
      setContent(prev => ({ ...prev, [type]: { error: 'Failed to generate content' } }));
    } finally {
      setLoading(null);
    }
  };

  const renderQueryContentBlock = (type: ContentType) => {
      // ... (This function remains the same)
      const data = content[type];
      if (loading === type) return <div className="flex justify-center py-6"><Loader2 className="w-8 h-8 text-gray-300 animate-spin" /></div>;
      if (!data) return null;
      if (data.error) return <p className="text-red-400">{data.error}</p>;

      if (type === 'summary') {
          return <>
              <h3 className="text-blue-400 font-bold mb-3 flex items-center"><Sparkles className="w-5 h-5 mr-2" />Summary</h3>
              <div className="text-gray-200 whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto"><ReactMarkdown>{displayedQuerySummary}</ReactMarkdown></div>
          </>;
      }
      if (type === 'didYouKnow') {
          return <>
              <h3 className="text-blue-400 font-bold mb-3 flex items-center"><Lightbulb className="w-5 h-5 mr-2" />Did You Know?</h3>
              <div className="text-gray-200 whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto"><ReactMarkdown>{data.didYouKnow}</ReactMarkdown></div>
          </>;
      }
      if (type === 'podcast') {
        return <>
            <h3 className="text-blue-400 font-bold mb-4 flex items-center"><Headphones className="w-5 h-5 mr-2" />Podcast</h3>
            <audio controls src={data.audio_url} className="w-full mb-3" />
            <div className="text-gray-200 whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto"><ReactMarkdown>{data.script}</ReactMarkdown></div>
        </>;
      }
      return null;
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-y-0 right-0 w-96 bg-black text-white shadow-2xl border-l border-gray-700 z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
        <h2 className="text-lg font-semibold text-blue-400">AI Insights Hub</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
      </div>
  
      <div className="p-4 overflow-y-auto flex-1 space-y-6">
        {pageType === 'query' ? (
          <>
            <div className="flex flex-col gap-4">
              <button onClick={() => handleGenerate('summary')} disabled={loading !== null} className="w-full py-3 text-white font-bold rounded-lg bg-[#274060] hover:bg-[#1B263B] transition-all shadow-lg disabled:opacity-50"><Sparkles className="inline w-5 h-5 mr-2" />Generate Summary</button>
              <button onClick={() => handleGenerate('didYouKnow')} disabled={loading !== null} className="w-full py-3 text-white font-bold rounded-lg bg-[#274060] hover:bg-[#1B263B] transition-all shadow-lg disabled:opacity-50"><Lightbulb className="inline w-5 h-5 mr-2" />Generate Did You Know</button>
              <button onClick={() => handleGenerate('podcast')} disabled={loading !== null} className="w-full py-3 text-white font-bold rounded-lg bg-[#274060] hover:bg-[#1B263B] transition-all shadow-lg disabled:opacity-50"><Headphones className="inline w-5 h-5 mr-2" />Generate Podcast</button>
            </div>
            <div className="space-y-6">
              <div>{renderQueryContentBlock('summary')}</div>
              <div>{renderQueryContentBlock('didYouKnow')}</div>
              <div>{renderQueryContentBlock('podcast')}</div>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">Section Insights</h3>
            <div className="mb-4 p-4 bg-indigo-900/40 rounded-lg border border-indigo-700/60">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-indigo-300 mb-2 flex items-center"><Sparkles className="w-4 h-4 mr-2" />Summary</h4>
                <button onClick={() => onInsightClick?.('summary')} disabled={!text || loadingInsights?.summary} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">Generate</button>
              </div>
              {loadingInsights?.summary ? <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
               : sectionInsights?.summary ? <div className="text-sm text-indigo-200 mt-2 prose prose-invert max-w-none"><ReactMarkdown>{displayedSectionSummary}</ReactMarkdown></div>
               : <p className="text-sm text-gray-400 mt-2 italic">Click "Generate" to create a summary.</p>
              }
            </div>
            <div className="p-4 bg-purple-900/40 rounded-lg border border-purple-700/60">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center"><Lightbulb className="w-4 h-4 mr-2" />Did You Know?</h4>
                <button onClick={() => onInsightClick?.('didYouKnow')} disabled={!text || loadingInsights?.didYouKnow} className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50">Generate</button>
              </div>
              {loadingInsights?.didYouKnow ? <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 text-purple-400 animate-spin" /></div>
               : sectionInsights?.didYouKnow ? <div className="text-sm text-purple-200 mt-2 prose prose-invert max-w-none"><ReactMarkdown>{sectionInsights.didYouKnow}</ReactMarkdown></div>
               : <p className="text-sm text-gray-400 mt-2 italic">Click "Generate" to find interesting facts.</p>
              }
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default RightPanel;