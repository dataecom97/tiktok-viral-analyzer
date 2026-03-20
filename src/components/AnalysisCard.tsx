import React from 'react';
import { AnalysisResult } from '../types';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  MessageSquare, 
  Volume2, 
  Eye, 
  CheckCircle2, 
  Lightbulb,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalysisCardProps {
  result: AnalysisResult;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ result }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const scoreColorClass = getScoreColor(result.viralScore);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto space-y-8 pb-20"
    >
      {/* Header / Summary */}
      <div className="bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden">
        <div className="p-8 sm:p-12 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-100 rounded-full text-xs font-bold uppercase tracking-wider text-zinc-600">
              <TrendingUp className="w-3 h-3" />
              Phân Tích Hoàn Tất
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-tight">
              Tóm Tắt Tiềm Năng Viral
            </h1>
            <div className="prose prose-zinc max-w-none text-zinc-600">
              <ReactMarkdown>{result.summary}</ReactMarkdown>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-center gap-4">
            <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center shadow-inner ${scoreColorClass}`}>
              <span className="text-4xl font-black">{result.viralScore}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Điểm</span>
            </div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Điểm Viral Dự Kiến</p>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Content Analysis */}
        <AnalysisSection 
          icon={<MessageSquare className="w-5 h-5" />}
          title="Chiến Lược Nội Dung"
          color="bg-indigo-500"
          items={[
            { label: "Hook", value: result.content.hook },
            { label: "Thân bài", value: result.content.body },
            { label: "CTA", value: result.content.cta }
          ]}
          suggestions={result.content.suggestions}
        />

        {/* Audio Analysis */}
        <AnalysisSection 
          icon={<Volume2 className="w-5 h-5" />}
          title="Âm Thanh & Giọng Nói"
          color="bg-rose-500"
          items={[
            { label: "Nhịp độ", value: result.audio.pacing },
            { label: "Cảm xúc", value: result.audio.sentiment }
          ]}
          suggestions={result.audio.audioSuggestions}
        />

        {/* Visual Analysis */}
        <AnalysisSection 
          icon={<Eye className="w-5 h-5" />}
          title="Yếu Tố Hình Ảnh"
          color="bg-emerald-500"
          items={[
            { label: "Phân tích", value: result.visual.description }
          ]}
          suggestions={result.visual.visualSuggestions}
        />
      </div>
    </motion.div>
  );
};

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  items: { label: string; value: string }[];
  suggestions: string[];
}

const AnalysisSection: React.FC<SectionProps> = ({ icon, title, color, items, suggestions }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-zinc-200 flex flex-col h-full overflow-hidden">
      <div className={`${color} p-6 text-white flex items-center gap-3`}>
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      
      <div className="p-6 flex-1 space-y-6">
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {item.label}
              </span>
              <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-zinc-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 uppercase tracking-widest">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Mẹo Tối Ưu Hóa</span>
          </div>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-zinc-500 leading-relaxed">
                <ArrowRight className="w-3 h-3 shrink-0 mt-0.5 text-zinc-300" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
