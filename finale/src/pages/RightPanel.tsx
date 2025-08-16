import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Lightbulb, Headphones, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RightPanelProps {
  visible: boolean;
  onClose: () => void;
  text: string;
  feature: 'full' | 'contra' | 'simi' | 'insights'; // 👈 new prop
}

const STORAGE_TYPES = ['summary', 'didYouKnow', 'podcast'] as const;
type ContentType = typeof STORAGE_TYPES[number];

const RightPanel: React.FC<RightPanelProps> = ({ visible, onClose, text, feature }) => {
  //console.log('Text to be printed in right panel ', text);
  const [loading, setLoading] = useState<ContentType | null>(null);
  const [content, setContent] = useState<Record<string, any>>({});

  // Load from sessionStorage for current feature
  useEffect(() => {
    const restoredContent: Record<string, any> = {};
    STORAGE_TYPES.forEach(type => {
      const key = `${feature}_${type}`;
      const stored = sessionStorage.getItem(key);
      if (stored) restoredContent[type] = JSON.parse(stored);
    });
    setContent(restoredContent);
  }, [feature]);

  if (!visible) return null;

  const handleGenerate = async (type: ContentType) => {
    console.log(text)
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

      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `Request failed: ${resp.status}`);
      }

      const data = await resp.json();

      // Save in state
      setContent(prev => ({ ...prev, [type]: data }));

      // Save in sessionStorage with feature prefix
      const storageKey = `${feature}_${type}`;
      sessionStorage.setItem(storageKey, JSON.stringify(data));

    } catch (err) {
      console.error(err);
      setContent(prev => ({ ...prev, [type]: { error: 'Failed to generate content' } }));
    } finally {
      setLoading(null);
    }
  };

  const renderContentBlock = (type: ContentType) => {
    const data = content[type];

    if (loading === type) {
      return (
        <div className="flex justify-center py-6">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
      );
    }

    if (!data) return null;

    if (data.error) {
      return <p className="text-red-400">{data.error}</p>;
    }

    if (type === 'summary') {
      return (
        <div>
          <h3 className="text-pink-400 font-bold mb-2 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Summary
          </h3>
          <div className="text-gray-200 whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto">
            <ReactMarkdown>{data.summary}</ReactMarkdown>
          </div>
        </div>
      );
    }

    if (type === 'didYouKnow') {
      return (
        <div>
          <h3 className="text-yellow-400 font-bold mb-2 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Did You Know?
          </h3>
          <div className="text-gray-200 whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto">
            <ReactMarkdown>{data.didYouKnow}</ReactMarkdown>
          </div>
        </div>
      );
    }

    if (type === 'podcast') {
      return (
        <div>
          <h3 className="text-blue-400 font-bold mb-2 flex items-center">
            <Headphones className="w-5 h-5 mr-2" />
            Podcast
          </h3>
          <audio controls src={data.audio_url} className="w-full mb-3" />
          <div className="text-gray-200 whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto">
            <ReactMarkdown>{data.script}</ReactMarkdown>
          </div>
        </div>
      );
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
        <h2 className="text-lg font-semibold">AI Insights Hub</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
          <X className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1 space-y-6">
        {/* Action buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleGenerate('summary')}
            className="w-full py-3 text-white font-bold rounded-lg bg-pink-600 hover:bg-pink-700 transition-all shadow-lg hover:shadow-pink-500/50"
          >
            <Sparkles className="inline w-5 h-5 mr-2" />
            Generate Summary
          </button>
          <button
            onClick={() => handleGenerate('didYouKnow')}
            className="w-full py-3 text-black font-bold rounded-lg bg-yellow-400 hover:bg-yellow-500 transition-all shadow-lg hover:shadow-yellow-400/50"
          >
            <Lightbulb className="inline w-5 h-5 mr-2" />
            Generate Did You Know
          </button>
          {feature !== 'insights' && (
            <button
              onClick={() => handleGenerate('podcast')}
              className="w-full py-3 text-white font-bold rounded-lg bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/50"
            >
              <Headphones className="inline w-5 h-5 mr-2" />
            Generate Podcast
          </button>
          )}
        </div>

        {/* Results */}
        {renderContentBlock('summary')}
        {renderContentBlock('didYouKnow')}
        {renderContentBlock('podcast')}
      </div>
    </motion.div>
  );
};

export default RightPanel;
