
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PDFProvider } from './context/PDFContext';
import UploadPage from './pages/UploadPage';
import DocumentViewer from './pages/DocumentViewer';
import QueryPage from './pages/QueryPage';
import QueryDocumentViewer from './pages/QueryDocumentViewer';

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
          <Route path="/query" element={<QueryPage />}/>
          <Route path="/document/:id" element={<DocumentViewer />} />
          <Route path="/query/:id" element={<QueryDocumentViewer />} />
        </Routes>
      </Router>
    </PDFProvider>
  );
};

export default App;