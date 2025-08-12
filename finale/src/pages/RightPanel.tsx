import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Sparkles, Headphones } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';

interface RightPanelProps {
  visible: boolean;
  onClose: () => void;
  text: string;
}

interface PodcastData {
  script: string;
  audio_url: string;
}

const RightPanel: React.FC<RightPanelProps> = ({ visible, onClose, text }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [podcastData, setPodcastData] = useState('');
  const [podcastAudioUrl, setPodcastAudioUrl] = useState<string | null>(null);
  const [podcastLoaded, setPodcastLoaded] = useState(false); // track if it's been loaded before
  const [activeTab, setActiveTab] = useState<'didYouKnow' | 'summary' | 'podcast' | null>(null);

  const result: QueryResult | undefined = (location.state as any)?.result;

  const handlePodcastMode = async () => {
    // If already loading or loaded, do nothing
  
    if (!result?.metadata?.llm_prompt) return;
  
    setLoading(true);
    setActiveTab('podcast');

    if (loading || podcastLoaded) {
      setLoading(false);
      setOutput(podcastData);
      setTimeout(() => {
        document.getElementById('podcastPlayer')?.play();
      }, 300);
      return;
    }
  
    try {
      const data: PodcastData = await callAPI('podcast', result.metadata.llm_prompt);
      setPodcastAudioUrl(data.audio_url);
      setPodcastData(data.script);
      setPodcastLoaded(true);
      setOutput(data.script); // don't show script
      setTimeout(() => {
        document.getElementById('podcastPlayer')?.play();
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  const callAPI = async (endpoint: string, inputText: string) => {
    const res = await fetch(`http://localhost:5001/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: inputText }),
    });
    return res.json();
  };

  const handleClick = async (type: 'didYouKnow' | 'summary') => {
    setLoading(true);
    setActiveTab(type);
    try {
      const data = await callAPI(
        type === 'didYouKnow' ? 'did-you-know' : 'summarize',
        result.metadata.llm_prompt
      );
      setOutput(data.response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
        <h2 className="text-lg font-semibold text-gray-800">AI Assistant</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 p-4 border-b items-center">
        <button
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition w-4/5 justify-center ${
            activeTab === 'didYouKnow' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => handleClick('didYouKnow')}
        >
          <Lightbulb className="w-5 h-5 mr-2" />
          Did You Know
        </button>
        <button
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition w-4/5 justify-center ${
            activeTab === 'summary' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => handleClick('summary')}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Summary
        </button>
        <button
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition w-4/5 justify-center ${
            activeTab === 'podcast' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={handlePodcastMode}
        >
          <Headphones className="w-5 h-5 mr-2" />
          Podcast Mode
        </button>
      </div>

      {/* Output */}
      <div className="p-4 overflow-y-auto max-h-[calc(100%-200px)]">
        {loading && <p className="text-gray-500 italic">Loading...</p>}
        {!loading && activeTab !== 'podcast' && output && (
          <div
          style={{
            textAlign: 'left',
            fontSize: '0.95rem',
            lineHeight: '1.5',
            color: '#333',
            whiteSpace: 'pre-wrap',
            // Remove border, background, padding to avoid box appearance
          }}
        >
          {output}
        </div>
        )}

        {/* Podcast Audio Player */}
        {activeTab === 'podcast' && podcastAudioUrl && (
          <div style={{ paddingTop: '10px', textAlign: 'center', paddingBottom: '40px' }}>
            <audio
              id="podcastPlayer"
              controls
              src={podcastAudioUrl}
              style={{
                width: '100%',
                maxWidth: '600px',
                height: '40px',
              }}
            />
            {/* Show raw script text */}
            {output && (
              <div
                style={{
                  marginTop: '20px',
                  textAlign: 'left',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                  // Remove border, background, padding to avoid box appearance
                }}
              >
                {output}
              </div>
            )}
          </div>
        )}


      </div>

    </div>
  );
};

export default RightPanel;
