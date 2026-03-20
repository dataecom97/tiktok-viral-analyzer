import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { auth, db, signIn, handleFirestoreError, OperationType } from './firebase';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { UploadArea } from './components/UploadArea';
import { AnalysisCard } from './components/AnalysisCard';
import { HistoryItem } from './components/HistoryItem';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnalysisResult, AnalysisRecord } from './types';
import { analyzeTranscript, analyzeVideo } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { History, LayoutDashboard, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [view, setView] = useState<'analyze' | 'history'>('analyze');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'analyses'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnalysisRecord[];
      setHistory(records);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'analyses');
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpload = async (inputs: (File | string)[], type: 'video' | 'transcript') => {
    if (!user) {
      signIn();
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentResult(null);

    try {
      for (const input of inputs) {
        let result: AnalysisResult;
        let inputData = '';

        if (type === 'video' && input instanceof File) {
          // Check file size (limit to ~15MB for base64 inlineData)
          if (input.size > 15 * 1024 * 1024) {
            throw new Error('Tệp video quá lớn. Vui lòng chọn tệp dưới 15MB.');
          }

          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.onerror = () => reject(new Error('Lỗi khi đọc tệp video.'));
          });
          reader.readAsDataURL(input);
          const base64 = await base64Promise;
          inputData = input.name;
          result = await analyzeVideo(base64, input.type);
        } else {
          inputData = input as string;
          result = await analyzeTranscript(inputData);
        }

        if (!result || typeof result.viralScore !== 'number') {
          throw new Error('Không thể phân tích nội dung. AI không trả về kết quả hợp lệ.');
        }

        // Save to Firestore
        try {
          await addDoc(collection(db, 'analyses'), {
            userId: user.uid,
            input: inputData,
            inputType: type,
            ...result,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.CREATE, 'analyses');
        }

        // Set the last one as current result
        setCurrentResult(result);
      }
      
      setView('analyze');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Lỗi khi phân tích nội dung. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'analyses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `analyses/${id}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-900 selection:text-white">
        <Navbar user={user} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!user ? (
            <Login />
          ) : (
            <div className="space-y-12">
              {/* View Switcher */}
              <div className="flex items-center justify-between">
                <div className="flex p-1 bg-zinc-200 rounded-2xl">
                  <button
                    onClick={() => setView('analyze')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      view === 'analyze' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Phân tích</span>
                  </button>
                  <button
                    onClick={() => setView('history')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      view === 'history' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Lịch sử</span>
                  </button>
                </div>

                {currentResult && view === 'analyze' && (
                  <button
                    onClick={() => setCurrentResult(null)}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Phân tích mới</span>
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {view === 'analyze' ? (
                  <motion.div
                    key="analyze-view"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-12"
                  >
                    {currentResult ? (
                      <AnalysisCard result={currentResult} />
                    ) : (
                      <UploadArea onUpload={handleUpload} isLoading={isLoading} />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="history-view"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="max-w-3xl mx-auto space-y-6"
                  >
                    <div className="space-y-2 mb-8">
                      <h2 className="text-3xl font-black text-zinc-900">Lịch sử của bạn</h2>
                      <p className="text-zinc-500">Xem lại các phân tích trước đó và theo dõi tiến trình của bạn.</p>
                    </div>

                    {history.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {history.map((record) => (
                          <HistoryItem
                            key={record.id}
                            record={record}
                            onClick={() => {
                              setCurrentResult(record);
                              setView('analyze');
                            }}
                            onDelete={(e) => handleDelete(record.id, e)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center bg-white rounded-3xl border border-zinc-200 border-dashed">
                        <History className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                        <p className="text-zinc-500 font-medium">Chưa có phân tích nào. Hãy bắt đầu bằng cách phân tích nội dung!</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </main>

        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="w-5 h-5" />
              <p className="font-bold">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
