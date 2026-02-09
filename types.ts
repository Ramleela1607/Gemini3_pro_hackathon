
export enum Category {
  AUTO = 'Auto-Detect',
  CODING = 'Coding',
  MATH = 'Mathematics',
  WRITING = 'Writing',
  LOGIC = 'Logic/Reasoning',
  SCIENCE = 'Science',
  GENERAL = 'General Knowledge',
  OTHER = 'Other'
}

export enum LearningMode {
  STANDARD = 'Standard',
  KIDS = 'Kids Mode',
  ACCESSIBILITY = 'Accessibility Mode'
}

export enum AccessibilityPreference {
  AUDIO = 'Audio Mode',
  TEXT = 'Text Mode'
}

export type AgeGroup = '6–9' | '10–12' | '13–15' | '16–17' | '18+';

export const SUPPORTED_LANGUAGES = [
  { label: 'Auto (Detect)', value: 'Auto' },
  { label: 'English', value: 'English' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Korean', value: 'Korean' },
  { label: 'Portuguese', value: 'Portuguese' },
  { label: 'Italian', value: 'Italian' }
];

export interface AnalysisSource {
  title: string;
  uri: string;
}

export interface AnalysisResult {
  transcription?: string;
  learningStatus: string;
  diagnosis: string;
  rootCause: string;
  correctReasoning: string;
  learningPoint: string;
  misconceptionTag: string;
  confidence: number;
  practiceQuestions: string[];
  keyInsight: string;
  followUpQuestion: string;
  moreDetails?: string;
  detectedCategory?: Category;
  needsDomainClarification?: boolean;
  clarificationQuestion?: string;
  // Conditional Audio Scripts
  voiceOnlyResponse?: string;
  voicePromptLanguage?: string;
  voicePromptContext?: string;
  voicePromptAttempt?: string;
  voiceReprompt?: string;
  voiceFallback?: string;
  sources?: AnalysisSource[];
}

export interface PracticeEvaluation {
  score: number;
  maxScore: number;
  performanceMessage: string;
  results: {
    isCorrect: boolean;
    feedback: string;
  }[];
  patternExplanation?: string;
  learningSnapshot?: string[];
}

export interface MistakeEntry {
  id: string;
  category: Category;
  question: string;
  studentAnswer: string;
  correctAnswer?: string;
  imagePreview?: string;
  outputLanguage: string;
  learningMode: LearningMode;
  accessibilityPreference?: AccessibilityPreference;
  analysis?: AnalysisResult;
  timestamp: number;
}

export interface UserProfile {
  userName?: string;
  ageGroup?: AgeGroup;
  parentalConsent?: boolean;
  totalDiagnostics: number;
  misconceptionCounts: Record<string, number>;
  categoryStats: Record<string, number>;
  lastActive: number;
  joinedDate: number;
  streak: number;
}
