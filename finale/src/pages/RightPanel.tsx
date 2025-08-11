import React, { useState } from 'react';
import { X, Lightbulb, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RightPanelProps {
  visible: boolean;
  onClose: () => void;
  text: string;
}

const RightPanel: React.FC<RightPanelProps> = ({ visible, onClose, text }) => {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'didYouKnow' | 'summary' | null>(null);

  const callAPI = async (endpoint: string, inputText: string) => {
    console.log(endpoint)
    const res = await fetch(`http://localhost:5001/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: inputText }), // match backend
    });
    const data = await res.json();
    return data.response;
  };
  
  const handleClick = async (type: 'didYouKnow' | 'summary') => {
    setLoading(true);
    setActiveTab(type);
    try {
      const result = await callAPI(
        type === 'didYouKnow' ? 'did-you-know' : 'summarize',
        text
      );
      setOutput(result);
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
      <div className="flex justify-around p-4 border-b">
        <button
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'didYouKnow' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => handleClick('didYouKnow')}
        >
          <Lightbulb className="w-5 h-5 mr-2" />
          Did You Know
        </button>
        <button
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'summary' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => handleClick('summary')}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Summary
        </button>
      </div>

      {/* Output */}
      <div className="p-4 overflow-y-auto max-h-[calc(100%-130px)]">
        {loading && <p className="text-gray-500 italic">Loading...</p>}
        {!loading && output && (
          <div className="prose max-w-none">
            <ReactMarkdown>{output}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
