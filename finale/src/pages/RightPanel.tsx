import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Lightbulb, Headphones, Loader2 } from 'lucide-react';

interface PodcastData {
  script: string;
  audio_url: string;
}

interface Insights {
  summary: string;
  didYouKnow: string;
  podcast?: PodcastData;
}

interface SectionInsights {
  summary?: string;
  didYouKnow?: string;
}

interface LoadingInsights {
  summary: boolean;
  didYouKnow: boolean;
}

interface RightPanelProps {
  visible: boolean;
  onClose: () => void;
  insights?: Insights;
  pageType: 'query' | 'section'; // NEW: controls which layout to show
  text?: string;
  sectionInsights?: SectionInsights;
  loadingInsights?: LoadingInsights;
  onInsightClick?: (type: 'summary' | 'didYouKnow') => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  visible,
  onClose,
  insights,
  pageType,
  text,
  sectionInsights,
  loadingInsights,
  onInsightClick
}) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
        <h2 className="text-lg font-semibold text-gray-800">AI Insights Hub</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 overflow-y-auto flex-1 space-y-6">
        {/* SECTION-SPECIFIC INSIGHTS — shown only for section pages */}
        {pageType === 'section' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Section Insights</h3>

            {/* Summary */}
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-indigo-800 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Summary
                </h4>
                <button
                  onClick={() => onInsightClick?.('summary')}
                  disabled={!text || loadingInsights?.summary}
                  className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate
                </button>
              </div>
              {loadingInsights?.summary ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
              ) : sectionInsights?.summary ? (
                <p className="text-sm text-indigo-700 mt-2">{sectionInsights.summary}</p>
              ) : (
                <p className="text-sm text-gray-500 mt-2 italic">
                  No summary generated yet. Click "Generate" to create one.
                </p>
              )}
            </div>

            {/* Did You Know */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Did You Know?
                </h4>
                <button
                  onClick={() => onInsightClick?.('didYouKnow')}
                  disabled={!text || loadingInsights?.didYouKnow}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate
                </button>
              </div>
              {loadingInsights?.didYouKnow ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                </div>
              ) : sectionInsights?.didYouKnow ? (
                <p className="text-sm text-purple-700 mt-2">{sectionInsights.didYouKnow}</p>
              ) : (
                <p className="text-sm text-gray-500 mt-2 italic">
                  No interesting facts generated yet. Click "Generate" to create one.
                </p>
              )}
            </div>
          </div>
        )}

        {/* AI INSIGHTS HUB (Always Shown) */}
        {insights && (
          <>
            {/* Summary */}
            <div>
              <h3 className="font-medium text-purple-800 mb-2 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Summary
              </h3>
              <div className="text-sm text-purple-700 whitespace-pre-wrap bg-purple-50 p-3 rounded-lg border border-purple-200">
                {insights.summary}
              </div>
            </div>

            {/* Did You Know */}
            <div>
              <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Did You Know?
              </h3>
              <div className="text-sm text-yellow-700 whitespace-pre-wrap bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                {insights.didYouKnow}
              </div>
            </div>

            {/* Podcast */}
            {insights.podcast && (
              <div>
                <h3 className="font-medium text-green-800 mb-2 flex items-center">
                  <Headphones className="w-5 h-5 mr-2" />
                  Podcast
                </h3>
                <audio controls src={insights.podcast.audio_url} className="w-full mb-2" />
                <div className="text-sm text-green-700 whitespace-pre-wrap bg-green-50 p-3 rounded-lg border border-green-200">
                  {insights.podcast.script}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default RightPanel;
// import React from 'react';
// import { motion } from 'framer-motion';
// import { X, Sparkles, Lightbulb, Headphones, Loader2 } from 'lucide-react';

// interface PodcastData {
//   script: string;
//   audio_url: string;
// }

// interface Insights {
//   summary: string;
//   didYouKnow: string;
//   podcast?: PodcastData;
// }

// interface SectionInsights {
//   summary?: string;
//   didYouKnow?: string;
// }

// interface LoadingInsights {
//   summary?: boolean;
//   didYouKnow?: boolean;
// }

// interface RightPanelProps {
//   visible: boolean;
//   onClose: () => void;
//   text?: string;
//   insights?: Insights;
//   sectionInsights?: SectionInsights;
//   loadingInsights?: LoadingInsights;
//   onInsightClick?: (type: 'summary' | 'didYouKnow') => void;
//   pageType?: 'query' | 'section' | 'combined' | 'similarity' | 'contradiction';
// }

// const RightPanel: React.FC<RightPanelProps> = ({
//   visible,
//   onClose,
//   text,
//   insights,
//   sectionInsights,
//   loadingInsights,
//   onInsightClick,
//   pageType = 'query'
// }) => {
//   if (!visible) return null;

//   return (
//     <motion.div
//       initial={{ x: '100%' }}
//       animate={{ x: 0 }}
//       exit={{ x: '100%' }}
//       transition={{ type: 'spring', damping: 25, stiffness: 300 }}
//       className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col"
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
//         <h2 className="text-lg font-semibold text-gray-800">AI Insights Hub</h2>
//         <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
//           <X className="w-5 h-5" />
//         </button>
//       </div>

//       {/* Scrollable Content */}
//       <div className="p-4 overflow-y-auto flex-1 space-y-6">
//         {/* SECTION-SPECIFIC INSIGHTS — only for section pages */}
//         {pageType === 'section' && (
//           <div>
//             <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Section Insights</h3>

//             {/* Summary */}
//             <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
//               <div className="flex justify-between items-start">
//                 <h4 className="font-semibold text-indigo-800 mb-2 flex items-center">
//                   <Sparkles className="w-4 h-4 mr-2" />
//                   Summary
//                 </h4>
//                 <button
//                   onClick={() => onInsightClick?.('summary')}
//                   disabled={!text || loadingInsights?.summary}
//                   className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   Generate
//                 </button>
//               </div>
//               {loadingInsights?.summary ? (
//                 <div className="flex items-center justify-center py-4">
//                   <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
//                 </div>
//               ) : sectionInsights?.summary ? (
//                 <p className="text-sm text-indigo-700 mt-2">{sectionInsights.summary}</p>
//               ) : (
//                 <p className="text-sm text-gray-500 mt-2 italic">
//                   No summary generated yet. Click "Generate" to create one.
//                 </p>
//               )}
//             </div>

//             {/* Did You Know */}
//             <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
//               <div className="flex justify-between items-start">
//                 <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
//                   <Lightbulb className="w-4 h-4 mr-2" />
//                   Did You Know?
//                 </h4>
//                 <button
//                   onClick={() => onInsightClick?.('didYouKnow')}
//                   disabled={!text || loadingInsights?.didYouKnow}
//                   className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   Generate
//                 </button>
//               </div>
//               {loadingInsights?.didYouKnow ? (
//                 <div className="flex items-center justify-center py-4">
//                   <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
//                 </div>
//               ) : sectionInsights?.didYouKnow ? (
//                 <p className="text-sm text-purple-700 mt-2">{sectionInsights.didYouKnow}</p>
//               ) : (
//                 <p className="text-sm text-gray-500 mt-2 italic">
//                   No interesting facts generated yet. Click "Generate" to create one.
//                 </p>
//               )}
//             </div>
//           </div>
//         )}

//         {/* GENERAL AI INSIGHTS HUB — always shown if insights exist */}
//         {insights && (
//           <>
//             {/* Summary */}
//             <div>
//               <h3 className="font-medium text-purple-800 mb-2 flex items-center">
//                 <Sparkles className="w-5 h-5 mr-2" />
//                 Summary
//               </h3>
//               <div className="text-sm text-purple-700 whitespace-pre-wrap bg-purple-50 p-3 rounded-lg border border-purple-200">
//                 {insights.summary}
//               </div>
//             </div>

//             {/* Did You Know */}
//             <div>
//               <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
//                 <Lightbulb className="w-5 h-5 mr-2" />
//                 Did You Know?
//               </h3>
//               <div className="text-sm text-yellow-700 whitespace-pre-wrap bg-yellow-50 p-3 rounded-lg border border-yellow-200">
//                 {insights.didYouKnow}
//               </div>
//             </div>

//             {/* Podcast */}
//             {insights.podcast && (
//               <div>
//                 <h3 className="font-medium text-green-800 mb-2 flex items-center">
//                   <Headphones className="w-5 h-5 mr-2" />
//                   Podcast
//                 </h3>
//                 <audio controls src={insights.podcast.audio_url} className="w-full mb-2" />
//                 <div className="text-sm text-green-700 whitespace-pre-wrap bg-green-50 p-3 rounded-lg border border-green-200">
//                   {insights.podcast.script}
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </motion.div>
//   );
// };

// export default RightPanel;
