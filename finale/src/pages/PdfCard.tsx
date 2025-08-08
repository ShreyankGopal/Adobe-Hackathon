// // src/components/PdfCard.tsx
// import React from 'react';
// import { X, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// type PDFType = {
//   id: string | number;
//   name: string;
//   size?: number;
//   uploadedAt?: Date;
//   serverFilename?: string;
//   processed?: boolean;
//   outline?: any;
// };

// interface Props {
//   pdf: PDFType;
//   onRemove?: (id: string | number) => void;
//   onClick?: (id: string | number) => void;
//   isProcessing?: (name: string) => boolean;
// }

// const formatFileSize = (bytes?: number) => {
//   if (!bytes) return '0 Bytes';
//   const k = 1024;
//   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// };

// const PdfCard: React.FC<Props> = ({ pdf, onRemove, onClick, isProcessing }) => {
//   return (
//     <div
//       onClick={() => onClick && onClick(pdf.id)}
//       className="group relative bg-white rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
//     >
//       <button
//         onClick={(e) => {
//           e.stopPropagation();
//           onRemove && onRemove(pdf.id);
//         }}
//         className="absolute top-3 right-3 z-10 w-8 h-8 bg-white border rounded-full flex items-center justify-center text-gray-600 hover:bg-red-600 hover:text-white transition-all duration-200"
//       >
//         <X className="w-4 h-4" />
//       </button>

//       <div className="absolute top-3 left-3 z-10">
//         {isProcessing && isProcessing(pdf.name) ? (
//           <div className="flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full border border-amber-200">
//             <Clock className="w-3 h-3 mr-1 animate-spin" />
//             Processing
//           </div>
//         ) : pdf.processed ? (
//           <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
//             <CheckCircle className="w-3 h-3 mr-1" />
//             Ready
//           </div>
//         ) : (
//           <div className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
//             <AlertCircle className="w-3 h-3 mr-1" />
//             Pending
//           </div>
//         )}
//       </div>

//       <div className="aspect-[3/4] bg-gradient-to-br from-red-50 to-orange-50 rounded-t-xl flex items-center justify-center relative overflow-hidden">
//         <div className="absolute inset-0 bg-gradient-to-br from-red-100/10 to-orange-100/10" />
//         <FileText className="w-16 h-16 text-red-500 relative z-10" />
//       </div>

//       <div className="p-4 space-y-2">
//         <h3 className="font-semibold text-gray-800 truncate text-sm" title={pdf.name}>
//           {pdf.name}
//         </h3>
//         <div className="flex items-center justify-between text-xs text-gray-500">
//           <span>{formatFileSize(pdf.size)}</span>
//           <span>{pdf.uploadedAt ? (pdf.uploadedAt as Date).toLocaleDateString() : ''}</span>
//         </div>
//         {pdf.outline && (
//           <p className="text-xs text-indigo-600 font-medium">
//             {Array.isArray(pdf.outline.outline) ? pdf.outline.outline.length : 0} headings found
//           </p>
//         )}
//         {pdf.outline && (pdf as any).sections && (
//           <p className="text-xs text-gray-500">
//             { (pdf as any).sections.length } sections extracted
//           </p>
//         )}
//         <div className="mt-2">
//           {pdf.serverFilename && (
//             <a
//               className="text-xs text-blue-600 underline"
//               href={`http://localhost:5001/uploads/${pdf.serverFilename}`}
//               target="_blank"
//               rel="noreferrer"
//             >
//               Open PDF
//             </a>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PdfCard;
import React from 'react';
import { X, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type PDFType = {
  id: string | number;
  name: string;
  size?: number;
  uploadedAt?: Date;
  serverFilename?: string;
  processed?: boolean;
  outline?: { outline: any[] } | null;
};

interface Props {
  pdf: PDFType;
  onRemove?: (id: string | number) => void;
  onClick?: (id: string | number) => void;
  isProcessing?: (name: string) => boolean;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const PdfCard: React.FC<Props> = ({ pdf, onRemove, onClick, isProcessing }) => {
  const processing = isProcessing ? isProcessing(pdf.name) : false;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="group relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer border border-gray-100 hover:shadow-xl transition-all duration-300"
      onClick={() => onClick && onClick(pdf.id)}
      layout
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove && onRemove(pdf.id);
        }}
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 shadow-lg"
        aria-label={`Remove ${pdf.name}`}
        title="Remove"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="absolute top-3 left-3 z-10">
        {processing ? (
          <div className="flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full border border-amber-200">
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </div>
        ) : pdf.processed ? (
          <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready
          </div>
        ) : (
          <div className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </div>
        )}
      </div>

      <div className="aspect-[3/4] bg-gradient-to-br from-red-50 via-orange-50 to-red-100 rounded-t-xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-orange-100/50" />
        <FileText className="w-16 h-16 text-red-500 relative z-10" />
        {processing && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-slow" />
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-800 truncate text-sm" title={pdf.name}>
          {pdf.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatFileSize(pdf.size)}</span>
          <span>{pdf.uploadedAt ? (pdf.uploadedAt as Date).toLocaleDateString() : ''}</span>
        </div>
        {pdf.outline && (
          <p className="text-xs text-primary-600 font-medium">
            {Array.isArray(pdf.outline.outline) ? pdf.outline.outline.length : 0} headings found
          </p>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-primary-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
    </motion.div>
  );
};

export default PdfCard;
