
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface OutlineItem {
  level: string;
  text: string;
  page: number;
}

interface Outline {
  title: string;
  outline: OutlineItem[];
}

interface PDF {
  id: string;
  file: File;
  name: string;
  size: number;
  uploadedAt: Date;
  processed: boolean;
  serverFilename: string;
  outline: Outline | null;
}

interface PDFContextType {
  pdfs: PDF[];
  addPDF: (file: File, serverFilename: string, outline: Outline) => void;
  removePDF: (id: string) => void;
  getPDFById: (id: string) => PDF | undefined;
  isProcessing: (name: string) => boolean;
  setProcessing: (name: string, processing: boolean) => void;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pdfs, setPDFs] = useState<PDF[]>([]);
  const [processingPDFs, setProcessingPDFs] = useState<Set<string>>(new Set());

  const addPDF = (file: File, serverFilename: string, outline: Outline) => {
    const pdf: PDF = {
      id: uuidv4(),
      file,
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      processed: true,
      serverFilename,
      outline,
    };
    setPDFs(prev => [...prev, pdf]);
    setProcessingPDFs(prev => {
      const newSet = new Set(prev);
      newSet.delete(file.name);
      return newSet;
    });
  };

  const removePDF = (id: string) => {
    setPDFs(prev => prev.filter(pdf => pdf.id !== id));
  };

  const getPDFById = (id: string) => {
    return pdfs.find(pdf => pdf.id === id);
  };

  const isProcessing = (name: string) => {
    return processingPDFs.has(name);
  };

  const setProcessing = (name: string, processing: boolean) => {
    setProcessingPDFs(prev => {
      const newSet = new Set(prev);
      if (processing) {
        newSet.add(name);
      } else {
        newSet.delete(name);
      }
      return newSet;
    });
  };

  return (
    <PDFContext.Provider
      value={{ pdfs, addPDF, removePDF, getPDFById, isProcessing, setProcessing }}
    >
      {children}
    </PDFContext.Provider>
  );
};

export const usePDF = () => {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error('usePDF must be used within a PDFProvider');
  }
  return context;
};