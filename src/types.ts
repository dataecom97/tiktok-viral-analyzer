export interface AnalysisResult {
  content: {
    hook: string;
    body: string;
    cta: string;
    suggestions: string[];
  };
  audio: {
    pacing: string;
    sentiment: string;
    audioSuggestions: string[];
  };
  visual: {
    description: string;
    visualSuggestions: string[];
  };
  viralScore: number;
  summary: string;
}

export interface AnalysisRecord extends AnalysisResult {
  id: string;
  userId: string;
  input: string;
  inputType: 'transcript' | 'video';
  createdAt: string;
}
