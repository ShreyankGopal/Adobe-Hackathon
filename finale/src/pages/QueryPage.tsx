import React, { useState } from 'react';
import { usePDF } from '../context/PDFContext';
import PdfCard from './PdfCard';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
};

const RoleQueryPage: React.FC = () => {
  const { pdfs, removePDF, isProcessing, getPDFByServerFilename } = usePDF();
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemovePDF = (id: string | number) => {
    removePDF(id as string);
  };

  const handlePDFClick = (id: string | number) => {
    navigate(`/document/${id}`);
  };

  const handleExtractedSectionClick = (idx: string | number) => {
    const pdf = getPDFByServerFilename(idx as string);
    navigate(`/query/${pdf?.id}`, { state: { result } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!role.trim() || !task.trim()) {
      setError('Please fill both Role and Task');
      return;
    }

    const documentsPayload = pdfs.map(p => ({
      filename: p.serverFilename,
      outline: p.outline,
      sections: (p as any).sections ?? undefined
    }));

    const payload = {
      persona: { role: role.trim() },
      job_to_be_done: { task: task.trim() },
      documents: documentsPayload
    };

    setLoading(true);
    try {
      const resp = await fetch('http://localhost:5001/role_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `Request failed: ${resp.status}`);
      }

      const data = await resp.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Enhanced Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-lg mb-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-slate-800 font-semibold hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <Link to="/query" className="text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-lg">
            Role Based Query
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
        {/* Left Sidebar - Fixed height with overflow */}
        <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full overflow-hidden">
          <div className="flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Role-Based Query</h2>
            <p className="text-xs text-slate-600 mb-3">Find relevant sections across your PDFs</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 flex-shrink-0">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Hiring Manager"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Task</label>
              <textarea
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g., Identify sections about safety procedures"
                rows={2}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Submit Query'}
            </button>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}
          </form>

          {/* PDF List with Overflow */}
          <div className="mt-4 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex-shrink-0">
              Uploaded PDFs ({pdfs.length})
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {pdfs.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                  <div className="space-y-2">
                    {pdfs.map(pdf => (
                      <motion.div key={pdf.id} variants={itemVariants}>
                        <PdfCard
                          pdf={pdf}
                          onRemove={(id) => handleRemovePDF(id)}
                          onClick={(id) => handlePDFClick(id)}
                          isProcessing={(name) => isProcessing ? isProcessing(name) : false}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="text-xs text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                  No PDFs uploaded yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Results Area with Overflow */}
        <div className="lg:col-span-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 flex flex-col max-h-full overflow-hidden">
          <h3 className="text-xl font-bold text-slate-800 mb-3 flex-shrink-0">Query Results</h3>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {!result && !loading && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400 h-full flex flex-col justify-center">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-xl font-semibold mb-2">No Query Executed</div>
                <div className="text-sm">Run a role-based query to see relevant sections and analysis</div>
              </div>
            )}

            {loading && (
              <div className="text-center text-slate-500 h-full flex flex-col justify-center">
                <div className="text-3xl mb-3">⏳</div>
                <div className="text-lg font-semibold">Processing Query...</div>
                <div className="text-sm">Analyzing documents for relevant sections</div>
              </div>
            )}

            {result && (
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
                      <div key={`${s.document}-${s.section_title}-${idx}`} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow" onClick={()=>handleExtractedSectionClick(s.document)}>
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
            )}
          </div>
        </div>
      </div>

      {/* Bottom Documents Section - Only show if PDFs exist and results are shown */}
      {pdfs.length > 0 && result && (
        <div className="max-w-7xl mx-auto mt-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Documents Used in Query
            </h4>
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {pdfs.map(pdf => (
                  <motion.div key={pdf.id} variants={itemVariants}>
                    <PdfCard
                      pdf={pdf}
                      onRemove={(id) => handleRemovePDF(id)}
                      onClick={(id) => handlePDFClick(id)}
                      isProcessing={(name) => isProcessing ? isProcessing(name) : false}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleQueryPage;