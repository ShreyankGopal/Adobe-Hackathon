
// import React, { createContext, useContext, useState, ReactNode } from 'react';
// import { v4 as uuidv4 } from 'uuid';

// interface OutlineItem {
//   level: string;
//   text: string;
//   page: number;
// }

// interface Outline {
//   title: string;
//   outline: OutlineItem[];
// }

// interface PDF {
//   id: string;
//   file: File;
//   name: string;
//   size: number;
//   uploadedAt: Date;
//   processed: boolean;
//   serverFilename: string;
//   outline: Outline | null;
// }

// interface PDFContextType {
//   pdfs: PDF[];
//   addPDF: (file: File, serverFilename: string, outline: Outline) => void;
//   removePDF: (id: string) => void;
//   getPDFById: (id: string) => PDF | undefined;
//   isProcessing: (name: string) => boolean;
//   setProcessing: (name: string, processing: boolean) => void;
// }

// const PDFContext = createContext<PDFContextType | undefined>(undefined);

// export const PDFProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [pdfs, setPDFs] = useState<PDF[]>([]);
//   const [processingPDFs, setProcessingPDFs] = useState<Set<string>>(new Set());

//   const addPDF = (file: File, serverFilename: string, outline: Outline) => {
//     const pdf: PDF = {
//       id: uuidv4(),
//       file,
//       name: file.name,
//       size: file.size,
//       uploadedAt: new Date(),
//       processed: true,
//       serverFilename,
//       outline,
//     };
//     setPDFs(prev => [...prev, pdf]);
//     setProcessingPDFs(prev => {
//       const newSet = new Set(prev);
//       newSet.delete(file.name);
//       return newSet;
//     });
//   };

//   const removePDF = (id: string) => {
//     setPDFs(prev => prev.filter(pdf => pdf.id !== id));
//   };

//   const getPDFById = (id: string) => {
//     return pdfs.find(pdf => pdf.id === id);
//   };

//   const isProcessing = (name: string) => {
//     return processingPDFs.has(name);
//   };

//   const setProcessing = (name: string, processing: boolean) => {
//     setProcessingPDFs(prev => {
//       const newSet = new Set(prev);
//       if (processing) {
//         newSet.add(name);
//       } else {
//         newSet.delete(name);
//       }
//       return newSet;
//     });
//   };

//   return (
//     <PDFContext.Provider
//       value={{ pdfs, addPDF, removePDF, getPDFById, isProcessing, setProcessing }}
//     >
//       {children}
//     </PDFContext.Provider>
//   );
// };

// export const usePDF = () => {
//   const context = useContext(PDFContext);
//   if (!context) {
//     throw new Error('usePDF must be used within a PDFProvider');
//   }
//   return context;
// };
// src/context/PDFContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface OutlineItem {
  level?: string;
  text: string;
  page?: number;
}

interface SectionItem {
  heading: string;
  text: string;
  page?: number;
}

interface Outline {
  title?: string;
  outline: OutlineItem[];
}

interface PDF {
  id: string;
  name: string;
  size?: number;
  uploadedAt: Date;
  serverFilename?: string;
  processed?: boolean;
  outline?: Outline;
  sections?: SectionItem[];
}

interface PDFContextShape {
  pdfs: PDF[];
  addPDF: (file: File, serverFilename: string, outline: Outline | null, sections?: SectionItem[]) => void;
  removePDF: (id: string) => void;
  getPDFById: (id: string) => PDF | undefined;
  getPDFByServerFilename: (serverFilename: string) => PDF | undefined;
  isProcessing: (name: string) => boolean;
  setProcessing: (name: string, val: boolean) => void;
}

const PDFContext = createContext<PDFContextShape | null>(null);

export const PDFProvider = ({ children }: { children: ReactNode }) => {
  const [pdfs, setPDFs] = useState<PDF[]>([]);
  const [processing, setProc] = useState<Record<string, boolean>>({});

  const addPDF = (file: File, serverFilename: string, outline: Outline | null, sections?: SectionItem[]) => {
    const pdf: PDF = {
      id: uuidv4(),
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      serverFilename,
      processed: true,
      outline: outline ?? { title: file.name, outline: [] },
      sections: sections ?? []
    };
    setPDFs(prev => [pdf, ...prev]);
  };

  const removePDF = (id: string) => {
    setPDFs(prev => prev.filter(p => p.id !== id));
  };
  const getPDFByServerFilename = (serverFilename: string) => pdfs.find(p => p.serverFilename === serverFilename);
  const getPDFById = (id: string) => pdfs.find(p => p.id === id);

  const isProcessing = (name: string) => !!processing[name];
  const setProcessing = (name: string, val: boolean) => setProc(prev => ({ ...prev, [name]: val }));

  return (
    <PDFContext.Provider
      value={{
        pdfs,
        addPDF,
        removePDF,
        getPDFById,
        getPDFByServerFilename,
        isProcessing,
        setProcessing
      }}
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
