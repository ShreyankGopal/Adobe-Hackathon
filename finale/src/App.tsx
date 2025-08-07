// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AnimatePresence } from 'framer-motion';
// import UploadPage from './pages/UploadPage';
// import DocumentViewer from './pages/DocumentViewer';
// import { PDFProvider } from './PDFContext';

// function App() {
//   return (
//     <PDFProvider>
//       <Router>
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//           <AnimatePresence mode="wait">
//             <Routes>
//               <Route path="/" element={<UploadPage />} />
//               <Route path="/document/:id" element={<DocumentViewer />} />
//             </Routes>
//           </AnimatePresence>
//         </div>
//       </Router>
//     </PDFProvider>
//   );
// }

// export default App;
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PDFProvider } from './context/PDFContext';
import UploadPage from './pages/UploadPage';
import DocumentViewer from './pages/DocumentViewer';

const App: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://documentcloud.adobe.com/view-sdk/main.js';
    script.async = true;
    document.body.appendChild(script);
    script.onload = () => {
      console.log('Adobe PDF Embed API script loaded');
    };
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <PDFProvider>
      <Router>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/document/:id" element={<DocumentViewer />} />
        </Routes>
      </Router>
    </PDFProvider>
  );
};

export default App;