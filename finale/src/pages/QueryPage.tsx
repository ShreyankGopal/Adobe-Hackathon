// import React, { useState } from 'react';
// import { usePDF } from '../context/PDFContext';
// import { FileText, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
// import { Link } from 'react-router-dom';

// const RoleQueryPage: React.FC = () => {
//   const { pdfs, isProcessing, removePDF } = usePDF();
//   const [role, setRole] = useState('');
//   const [task, setTask] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   const formatFileSize = (bytes: number) => {
//     if (!bytes) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     if (!role.trim() || !task.trim()) {
//       setError('Please fill both Role and Task');
//       return;
//     }

//     // Build payload using the outlines stored in context
//     const documentsPayload = pdfs.map(p => ({
//       filename: p.serverFilename,
//       outline: p.outline
//     }));

//     const payload = {
//       persona: { role: role.trim() },
//       job_to_be_done: { task: task.trim() },
//       documents: documentsPayload
//     };

//     setLoading(true);
//     setResult(null);
//     try {
//       const resp = await fetch('http://localhost:5001/role_query', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });

//       if (!resp.ok) {
//         const body = await resp.json().catch(() => null);
//         throw new Error(body?.error || `Request failed: ${resp.status}`);
//       }

//       const data = await resp.json();
//       setResult(data);
//     } catch (err: any) {
//       setError(err.message || 'Unknown error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
//       <nav className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 shadow-lg">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <Link
//             to="/"
//             className="text-white text-xl font-semibold hover:text-gray-200 transition-colors duration-200"
//           >
//             Home
//           </Link>
//           <Link
//             to="/query"
//             className="text-white text-xl font-semibold hover:text-gray-200 transition-colors duration-200"
//           >
//             Role Based Query
//           </Link>
//         </div>
//       </nav>

//       <div className="max-w-6xl mx-auto py-8 px-4">
//         <h1 className="text-3xl font-bold mb-4">Role Based Query</h1>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <form className="col-span-1 bg-white rounded-lg shadow p-6" onSubmit={handleSubmit}>
//             <label className="block mb-2 text-sm font-medium text-gray-700">Role</label>
//             <input
//               value={role}
//               onChange={(e) => setRole(e.target.value)}
//               className="w-full border rounded px-3 py-2 mb-4"
//               placeholder="e.g., Food Contractor"
//             />

//             <label className="block mb-2 text-sm font-medium text-gray-700">Task</label>
//             <input
//               value={task}
//               onChange={(e) => setTask(e.target.value)}
//               className="w-full border rounded px-3 py-2 mb-4"
//               placeholder="e.g., Prepare a vegetarian buffet-style dinner menu"
//             />

//             <button
//               type="submit"
//               className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
//               disabled={loading}
//             >
//               {loading ? 'Running query...' : 'Run Role-based Query'}
//             </button>

//             {error && <div className="mt-4 text-red-600">{error}</div>}
//           </form>

//           <div className="col-span-2 space-y-6">
//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-lg font-semibold mb-4">Uploaded PDFs</h2>
//               {pdfs.length === 0 ? (
//                 <div className="text-sm text-gray-500">No uploaded PDFs</div>
//               ) : (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   {pdfs.map(pdf => (
//                     <div key={pdf.id} className="relative border rounded-lg p-4 bg-white">
//                       <div className="absolute top-3 right-3">
//                         <button
//                           onClick={() => removePDF(pdf.id)}
//                           className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
//                         >
//                           <X className="w-4 h-4" />
//                         </button>
//                       </div>
//                       <div className="flex items-start gap-4">
//                         <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
//                           <FileText className="w-6 h-6 text-gray-500" />
//                         </div>
//                         <div className="flex-1">
//                           <div className="font-medium text-gray-800 truncate">{pdf.name}</div>
//                           <div className="text-xs text-gray-500">
//                             {formatFileSize(pdf.size)} • {pdf.uploadedAt.toLocaleDateString()}
//                           </div>
//                           {pdf.outline && (
//                             <div className="mt-2 text-xs text-primary-600 font-medium">
//                               {pdf.outline.outline.length} headings
//                             </div>
//                           )}
//                           <div className="mt-2">
//                             <a
//                               className="text-xs text-blue-600 underline"
//                               href={`http://localhost:5001/uploads/${pdf.serverFilename}`}
//                               target="_blank"
//                               rel="noreferrer"
//                             >
//                               Open PDF
//                             </a>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-lg font-semibold mb-4">Query Result</h2>
//               {!result ? (
//                 <div className="text-sm text-gray-500">No result yet — run a query to see top sections.</div>
//               ) : (
//                 <div className="space-y-6">
//                   <div>
//                     <div className="text-sm text-gray-500">Processed at:</div>
//                     <div className="text-sm font-medium">{result?.metadata?.processing_timestamp}</div>
//                     <div className="text-sm text-gray-500 mt-2">
//                       Documents: {result?.metadata?.input_documents?.filter(Boolean).length || 0}
//                     </div>
//                   </div>

//                   <div>
//                     <h3 className="font-semibold mb-2">Top extracted sections</h3>
//                     <div className="grid grid-cols-1 gap-3">
//                       {result.extracted_sections?.map((s: any) => (
//                         <div key={`${s.document}-${s.section_title}`} className="p-3 border rounded">
//                           <div className="text-sm text-gray-500">Document</div>
//                           <div className="font-medium">{s.document}</div>
//                           <div className="text-sm text-gray-500 mt-1">Section</div>
//                           <div className="">{s.section_title}</div>
//                           <div className="text-xs text-gray-400 mt-1">Page: {s.page_number}</div>
//                           <div className="text-xs text-gray-400">Rank: {s.importance_rank}</div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   <div>
//                     <h3 className="font-semibold mb-2">Subsection analysis</h3>
//                     <div className="space-y-3">
//                       {result.subsection_analysis?.map((sa: any, idx: number) => (
//                         <div key={idx} className="p-3 border rounded">
//                           <div className="text-sm text-gray-500">Document</div>
//                           <div className="font-medium">{sa.document}</div>
//                           <div className="text-sm text-gray-500 mt-1">Refined text</div>
//                           <div className="text-sm">{sa.refined_text}</div>
//                           <div className="text-xs text-gray-400 mt-1">Page: {sa.page_number}</div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   <div className="mt-4">
//                     <details>
//                       <summary className="cursor-pointer text-xs text-gray-600">Raw JSON result</summary>
//                       <pre className="mt-2 max-h-72 overflow-auto text-xs bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
//                     </details>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RoleQueryPage;
// src/pages/RoleQueryPage.tsx

// import React, { useState } from 'react';
// import { usePDF } from '../context/PDFContext';
// import PdfCard from './PdfCard';
// import { motion } from 'framer-motion';
// import { Link } from 'react-router-dom';

// const containerVariants = {
//   hidden: { opacity: 0, y: 8 },
//   show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } }
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 8 },
//   show: { opacity: 1, y: 0 }
// };

// const RoleQueryPage: React.FC = () => {
//   const { pdfs, removePDF, isProcessing } = usePDF();
//   const [role, setRole] = useState('');
//   const [task, setTask] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   const handleRemovePDF = (id: string | number) => {
//     removePDF(id as string);
//   };

//   const handlePDFClick = (id: string | number) => {
//     const pdf = pdfs.find(p => p.id === id);
//     if (!pdf) return;
//     // open served file in new tab (adjust host/port if needed)
//     if (pdf.serverFilename) {
//       window.open(`http://localhost:5001/uploads/${pdf.serverFilename}`, '_blank');
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setResult(null);
//     if (!role.trim() || !task.trim()) {
//       setError('Please fill both Role and Task');
//       return;
//     }

//     const documentsPayload = pdfs.map(p => ({
//       filename: p.serverFilename,
//       outline: p.outline,
//       sections: (p as any).sections ?? undefined
//     }));

//     const payload = {
//       persona: { role: role.trim() },
//       job_to_be_done: { task: task.trim() },
//       documents: documentsPayload
//     };

//     setLoading(true);
//     try {
//       const resp = await fetch('http://localhost:5001/role_query', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });

//       if (!resp.ok) {
//         const body = await resp.json().catch(() => null);
//         throw new Error(body?.error || `Request failed: ${resp.status}`);
//       }

//       const data = await resp.json();
//       setResult(data);
//     } catch (err: any) {
//       setError(err.message || 'Unknown error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50 p-6">
//       <nav className="bg-white/5 backdrop-blur-sm p-4 rounded-lg shadow-sm mb-6">
//         <div className="max-w-6xl mx-auto flex justify-between items-center">
//           <Link to="/" className="text-gray-800 font-semibold">Home</Link>
//           <Link to="/query" className="text-indigo-600 font-semibold">Role Based Query</Link>
//         </div>
//       </nav>

//       <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left: form & uploaded list */}
//         <div className="lg:col-span-1 bg-white rounded-xl shadow p-6">
//           <h2 className="text-xl font-semibold mb-2">Run Role-Based Query</h2>
//           <p className="text-sm text-gray-500 mb-4">Enter the role and task to find the most relevant sections across uploaded PDFs.</p>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Role</label>
//               <input
//                 className="mt-1 block w-full border rounded px-3 py-2"
//                 value={role}
//                 onChange={(e) => setRole(e.target.value)}
//                 placeholder="e.g., Hiring Manager"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Task</label>
//               <input
//                 className="mt-1 block w-full border rounded px-3 py-2"
//                 value={task}
//                 onChange={(e) => setTask(e.target.value)}
//                 placeholder="e.g., Identify sections about safety procedures"
//               />
//             </div>

//             <div>
//               <button
//                 type="submit"
//                 className="w-full py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
//                 disabled={loading}
//               >
//                 {loading ? 'Running query...' : 'Submit Role Query'}
//               </button>
//             </div>

//             {error && <div className="text-sm text-red-600">{error}</div>}
//           </form>

//           <div className="mt-6">
//             <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded PDFs</h3>

//             {/* Use the same grid + motion behavior as your snippet */}
//             {pdfs.length > 0 ? (
//               <motion.div variants={containerVariants} initial="hidden" animate="show">
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-4">
//                   {pdfs.map(pdf => (
//                     <motion.div key={pdf.id} variants={itemVariants}>
//                       <PdfCard
//                         pdf={pdf}
//                         onRemove={(id) => handleRemovePDF(id)}
//                         onClick={(id) => handlePDFClick(id)}
//                         isProcessing={(name) => isProcessing ? isProcessing(name) : false}
//                       />
//                     </motion.div>
//                   ))}
//                 </div>
//               </motion.div>
//             ) : (
//               <div className="text-xs text-gray-400">No PDFs uploaded yet</div>
//             )}
//           </div>
//         </div>

//         {/* Right: Results (large) */}
//         <div className="lg:col-span-2 space-y-6">
//           <div className="bg-white rounded-xl shadow p-6 min-h-[360px]">
//             <h3 className="text-lg font-semibold mb-3">Results</h3>

//             {!result && !loading && (
//               <div className="border border-dashed border-gray-200 rounded p-8 text-center text-gray-400">
//                 <div className="text-2xl mb-2">No query done yet</div>
//                 <div className="text-sm">Run a role-based query to see the top sections and subsection analysis here.</div>
//               </div>
//             )}

//             {loading && <div className="text-center text-gray-500">Running query — please wait...</div>}

//             {result && (
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <div className="text-xs text-gray-500">Processed at</div>
//                     <div className="font-medium">{result.metadata?.processing_timestamp}</div>
//                   </div>
//                   <div className="text-sm text-gray-600">Documents: {result.metadata?.input_documents?.length || 0}</div>
//                 </div>

//                 <div>
//                   <h4 className="font-semibold">Top extracted sections</h4>
//                   <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
//                     {result.extracted_sections?.map((s: any) => (
//                       <div key={`${s.document}-${s.section_title}`} className="p-3 border rounded bg-gray-50">
//                         <div className="text-xs text-gray-500">Document</div>
//                         <div className="font-medium">{s.document}</div>
//                         <div className="text-xs text-gray-500 mt-2">Section</div>
//                         <div className="mt-1">{s.section_title}</div>
//                         <div className="text-xs text-gray-400 mt-2">Page: {s.page_number} • Rank: {s.importance_rank}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <h4 className="font-semibold">Subsection analysis</h4>
//                   <div className="mt-3 space-y-3">
//                     {result.subsection_analysis?.map((sa: any, idx: number) => (
//                       <div key={idx} className="p-3 border rounded bg-white">
//                         <div className="text-xs text-gray-500">Document</div>
//                         <div className="font-medium">{sa.document}</div>
//                         <div className="text-xs text-gray-500 mt-1">Refined text</div>
//                         <div className="mt-1 text-sm">{sa.refined_text}</div>
//                         <div className="text-xs text-gray-400 mt-1">Page: {sa.page_number}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <details className="mt-4">
//                   <summary className="text-sm text-gray-600 cursor-pointer">Show raw JSON</summary>
//                   <pre className="mt-2 max-h-60 overflow-auto text-xs bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
//                 </details>
//               </div>
//             )}
//           </div>

//           {/* Display the same grid of PDF cards below results as well (optional, helpful) */}
//           {pdfs.length > 0 && (
//             <div className="bg-white rounded-xl shadow p-6">
//               <h4 className="font-semibold mb-4">Documents used in this query</h4>
//               <motion.div variants={containerVariants} initial="hidden" animate="show">
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                   {pdfs.map(pdf => (
//                     <motion.div key={pdf.id} variants={itemVariants}>
//                       <PdfCard
//                         pdf={pdf}
//                         onRemove={(id) => handleRemovePDF(id)}
//                         onClick={(id) => handlePDFClick(id)}
//                         isProcessing={(name) => isProcessing ? isProcessing(name) : false}
//                       />
//                     </motion.div>
//                   ))}
//                 </div>
//               </motion.div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RoleQueryPage;

// import React, { useState } from 'react';
// import { usePDF } from '../context/PDFContext';
// import PdfCard from './PdfCard';
// import { Link } from 'react-router-dom';

// const RoleQueryPage: React.FC = () => {
//   const { pdfs, removePDF, isProcessing } = usePDF();
//   const [role, setRole] = useState('');
//   const [task, setTask] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setResult(null);
//     if (!role.trim() || !task.trim()) {
//       setError('Please fill both Role and Task');
//       return;
//     }

//     const documentsPayload = pdfs.map(p => ({
//       filename: p.serverFilename,
//       outline: p.outline,
//       sections: (p as any).sections ?? undefined
//     }));

//     const payload = {
//       persona: { role: role.trim() },
//       job_to_be_done: { task: task.trim() },
//       documents: documentsPayload
//     };

//     setLoading(true);
//     try {
//       const resp = await fetch('http://localhost:5001/role_query', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });

//       if (!resp.ok) {
//         const body = await resp.json().catch(() => null);
//         throw new Error(body?.error || `Request failed: ${resp.status}`);
//       }

//       const data = await resp.json();
//       setResult(data);
//     } catch (err: any) {
//       setError(err.message || 'Unknown error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50 p-6">
//       <nav className="bg-white/5 backdrop-blur-sm p-4 rounded-lg shadow-sm mb-6">
//         <div className="max-w-6xl mx-auto flex justify-between items-center">
//           <Link to="/" className="text-gray-800 font-semibold">Home</Link>
//           <Link to="/query" className="text-indigo-600 font-semibold">Role Based Query</Link>
//         </div>
//       </nav>

//       <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left column: Form */}
//         <div className="lg:col-span-1 bg-white rounded-xl shadow p-6">
//           <h2 className="text-xl font-semibold mb-2">Run Role-Based Query</h2>
//           <p className="text-sm text-gray-500 mb-4">Enter the role and task to find the most relevant sections across uploaded PDFs.</p>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Role</label>
//               <input
//                 className="mt-1 block w-full border rounded px-3 py-2"
//                 value={role}
//                 onChange={(e) => setRole(e.target.value)}
//                 placeholder="e.g., Hiring Manager"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Task</label>
//               <input
//                 className="mt-1 block w-full border rounded px-3 py-2"
//                 value={task}
//                 onChange={(e) => setTask(e.target.value)}
//                 placeholder="e.g., Identify sections about safety procedures"
//               />
//             </div>

//             <div>
//               <button
//                 type="submit"
//                 className="w-full py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
//                 disabled={loading}
//               >
//                 {loading ? 'Running query...' : 'Submit Role Query'}
//               </button>
//             </div>

//             {error && <div className="text-sm text-red-600">{error}</div>}
//           </form>

//           <div className="mt-6">
//             <h3 className="text-sm font-medium text-gray-700">Uploaded PDFs</h3>
//             <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
//               {pdfs.length === 0 ? (
//                 <div className="text-xs text-gray-400">No PDFs uploaded yet</div>
//               ) : (
//                 pdfs.map(pdf => (
//                   <PdfCard
//                     key={pdf.id}
//                     pdf={pdf}
//                     onRemove={(id) => removePDF(id)}
//                     isProcessing={(name) => Boolean(isProcessing && isProcessing(name))}
//                   />
//                 ))
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Right column: Result area (large) */}
//         <div className="lg:col-span-2 space-y-6">
//           <div className="bg-white rounded-xl shadow p-6 min-h-[360px]">
//             <h3 className="text-lg font-semibold mb-3">Results</h3>

//             {/* Initially show placeholder */}
//             {!result && !loading && (
//               <div className="border border-dashed border-gray-200 rounded p-8 text-center text-gray-400">
//                 <div className="text-2xl mb-2">No query done yet</div>
//                 <div className="text-sm">Run a role-based query to see the top sections and subsection analysis here.</div>
//               </div>
//             )}

//             {/* Loading */}
//             {loading && (
//               <div className="text-center text-gray-500">Running query — please wait...</div>
//             )}

//             {/* Result */}
//             {result && (
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <div className="text-xs text-gray-500">Processed at</div>
//                     <div className="font-medium">{result.metadata?.processing_timestamp}</div>
//                   </div>
//                   <div className="text-sm text-gray-600">Documents: {result.metadata?.input_documents?.length || 0}</div>
//                 </div>

//                 <div>
//                   <h4 className="font-semibold">Top extracted sections</h4>
//                   <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
//                     {result.extracted_sections?.map((s: any) => (
//                       <div key={`${s.document}-${s.section_title}`} className="p-3 border rounded bg-gray-50">
//                         <div className="text-xs text-gray-500">Document</div>
//                         <div className="font-medium">{s.document}</div>
//                         <div className="text-xs text-gray-500 mt-2">Section</div>
//                         <div className="mt-1">{s.section_title}</div>
//                         <div className="text-xs text-gray-400 mt-2">Page: {s.page_number} • Rank: {s.importance_rank}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <h4 className="font-semibold">Subsection analysis</h4>
//                   <div className="mt-3 space-y-3">
//                     {result.subsection_analysis?.map((sa: any, idx: number) => (
//                       <div key={idx} className="p-3 border rounded bg-white">
//                         <div className="text-xs text-gray-500">Document</div>
//                         <div className="font-medium">{sa.document}</div>
//                         <div className="text-xs text-gray-500 mt-1">Refined text</div>
//                         <div className="mt-1 text-sm">{sa.refined_text}</div>
//                         <div className="text-xs text-gray-400 mt-1">Page: {sa.page_number}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <details className="mt-4">
//                   <summary className="text-sm text-gray-600 cursor-pointer">Show raw JSON</summary>
//                   <pre className="mt-2 max-h-60 overflow-auto text-xs bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
//                 </details>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RoleQueryPage;

// src/pages/RoleQueryPage.tsx
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
  const { pdfs, removePDF, isProcessing } = usePDF();
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemovePDF = (id: string | number) => {
    removePDF(id as string);
  };

  // <-- updated: navigate to the DocumentViewer route -->
  const handlePDFClick = (id: string | number) => {
    navigate(`/document/${id}`);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50 p-6">
      <nav className="bg-white/5 backdrop-blur-sm p-4 rounded-lg shadow-sm mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-gray-800 font-semibold">Home</Link>
          <Link to="/query" className="text-indigo-600 font-semibold">Role Based Query</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form & uploaded list */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Run Role-Based Query</h2>
          <p className="text-sm text-gray-500 mb-4">Enter the role and task to find the most relevant sections across uploaded PDFs.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <input
                className="mt-1 block w-full border rounded px-3 py-2"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Hiring Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Task</label>
              <input
                className="mt-1 block w-full border rounded px-3 py-2"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g., Identify sections about safety procedures"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
                disabled={loading}
              >
                {loading ? 'Running query...' : 'Submit Role Query'}
              </button>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </form>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded PDFs</h3>

            {pdfs.length > 0 ? (
              <motion.div variants={containerVariants} initial="hidden" animate="show">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-4">
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
              <div className="text-xs text-gray-400">No PDFs uploaded yet</div>
            )}
          </div>
        </div>

        {/* Right: Results (large) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow p-6 min-h-[360px]">
            <h3 className="text-lg font-semibold mb-3">Results</h3>

            {!result && !loading && (
              <div className="border border-dashed border-gray-200 rounded p-8 text-center text-gray-400">
                <div className="text-2xl mb-2">No query done yet</div>
                <div className="text-sm">Run a role-based query to see the top sections and subsection analysis here.</div>
              </div>
            )}

            {loading && <div className="text-center text-gray-500">Running query — please wait...</div>}

            {result && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Processed at</div>
                    <div className="font-medium">{result.metadata?.processing_timestamp}</div>
                  </div>
                  <div className="text-sm text-gray-600">Documents: {result.metadata?.input_documents?.length || 0}</div>
                </div>

                <div>
                  <h4 className="font-semibold">Top extracted sections</h4>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.extracted_sections?.map((s: any) => (
                      <div key={`${s.document}-${s.section_title}`} className="p-3 border rounded bg-gray-50">
                        <div className="text-xs text-gray-500">Document</div>
                        <div className="font-medium">{s.document}</div>
                        <div className="text-xs text-gray-500 mt-2">Section</div>
                        <div className="mt-1">{s.section_title}</div>
                        <div className="text-xs text-gray-400 mt-2">Page: {s.page_number} • Rank: {s.importance_rank}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Subsection analysis</h4>
                  <div className="mt-3 space-y-3">
                    {result.subsection_analysis?.map((sa: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded bg-white">
                        <div className="text-xs text-gray-500">Document</div>
                        <div className="font-medium">{sa.document}</div>
                        <div className="text-xs text-gray-500 mt-1">Refined text</div>
                        <div className="mt-1 text-sm">{sa.refined_text}</div>
                        <div className="text-xs text-gray-400 mt-1">Page: {sa.page_number}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer">Show raw JSON</summary>
                  <pre className="mt-2 max-h-60 overflow-auto text-xs bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>

          {/* Display the same grid of PDF cards below results as well */}
          {pdfs.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h4 className="font-semibold mb-4">Documents used in this query</h4>
              <motion.div variants={containerVariants} initial="hidden" animate="show">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleQueryPage;
