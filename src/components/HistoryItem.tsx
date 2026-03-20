import React from 'react';
import { AnalysisRecord } from '../types';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  FileVideo, 
  FileText, 
  Calendar,
  ChevronRight,
  Trash2
} from 'lucide-react';

interface HistoryItemProps {
  record: AnalysisRecord;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ record, onClick, onDelete }) => {
  const date = new Date(record.createdAt).toLocaleDateString();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="group relative flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-900 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
        {record.inputType === 'video' ? (
          <FileVideo className="w-6 h-6" />
        ) : (
          <FileText className="w-6 h-6" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getScoreColor(record.viralScore)}`}>
            {record.viralScore} Điểm
          </span>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            <Calendar className="w-3 h-3" />
            <span>{date}</span>
          </div>
        </div>
        <p className="text-sm font-bold text-zinc-900 truncate">
          {record.inputType === 'video' ? `Video: ${record.input}` : record.input.slice(0, 50) + '...'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onDelete}
          className="p-2 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
      </div>
    </motion.div>
  );
};
