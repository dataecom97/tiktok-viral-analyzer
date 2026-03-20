import React, { useCallback, useState } from 'react';
import { Upload, FileVideo, FileText, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UploadAreaProps {
  onUpload: (files: (File | string)[], type: 'video' | 'transcript') => void;
  isLoading: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
      setTranscript('');
      setError(null);
    } else {
      setError('Vui lòng thả các tệp video hợp lệ.');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      const videoFiles = selectedFiles.filter(f => f.type.startsWith('video/'));
      if (videoFiles.length > 0) {
        setFiles(prev => [...prev, ...videoFiles]);
        setTranscript('');
        setError(null);
      } else {
        setError('Vui lòng chọn các tệp video hợp lệ.');
      }
    }
  };

  const handleSubmit = () => {
    if (files.length > 0) {
      onUpload(files, 'video');
    } else if (transcript.trim()) {
      onUpload([transcript], 'transcript');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900">Phân Tích Nội Dung</h2>
            <p className="text-zinc-500">Tải lên video TikTok hoặc dán bản ghi để nhận thông tin chi tiết về viral.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Upload */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-4 text-center",
                isDragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400",
                files.length > 0 ? "bg-zinc-50 border-zinc-900" : ""
              )}
            >
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isLoading}
              />
              
              <AnimatePresence mode="popLayout">
                {files.length > 0 ? (
                  <motion.div
                    key="files-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full space-y-2 z-20"
                  >
                    <div className="flex flex-col items-center gap-2 mb-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg">
                        <FileVideo className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-bold text-zinc-900">Đã chọn {files.length} video</p>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded-lg text-left">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileVideo className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="text-xs font-medium text-zinc-700 truncate">{f.name}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeFile(i);
                            }}
                            className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-rose-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                      <Upload className="w-8 h-8 text-zinc-400 group-hover:text-zinc-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-900">Tải lên Video</p>
                      <p className="text-xs text-zinc-500">Kéo & thả hoặc nhấp để chọn (có thể chọn nhiều)</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Transcript Input */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <FileText className="w-4 h-4" />
                <span>Dán Bản Ghi</span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  if (e.target.value) setFiles([]);
                }}
                placeholder="Dán bản ghi video vào đây..."
                className="flex-1 min-h-[160px] w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all resize-none"
                disabled={isLoading || files.length > 0}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || (files.length === 0 && !transcript.trim())}
            className={cn(
              "w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3",
              isLoading 
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                : "bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-xl"
            )}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                <span>Đang Phân Tích...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Phân Tích Tiềm Năng Viral</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Zap = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
