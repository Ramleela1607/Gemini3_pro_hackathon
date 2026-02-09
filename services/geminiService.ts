
import { GoogleGenAI, Type } from "@google/genai";
import { Category, AnalysisResult, LearningMode, AccessibilityPreference, AgeGroup, PracticeEvaluation } from "../types";

const API_KEY = process.env.API_KEY || "";

export const analyzeMistake = async (
  category: Category,
  question: string,
  studentAnswer: string,
  outputLanguage: string,
  learningMode: LearningMode,
  correctAnswer?: string,
  imageData?: string,
  previousMisconceptions: string[] = [],
  accPreference?: AccessibilityPreference,
  userName?: string,
  ageGroup?: AgeGroup,
  parentalConsent?: boolean,
  isFirstSessionResponse: boolean = false
): Promise<AnalysisResult> => {
  const isKidsMode = learningMode === LearningMode.KIDS;

  // STRICT PARENTAL CONSENT ENFORCEMENT
  if (isKidsMode && !parentalConsent) {
    return {
      learningStatus: "Consent Required",
      diagnosis: "Parental consent is required to continue. Please confirm to start learning.",
      rootCause: "Awaiting parent authorization.",
      correctReasoning: "Safety is our priority. Please ask a parent or guardian to check the consent box in your profile settings.",
      keyInsight: "Parental consent is needed to unlock full learning!",
      practiceQuestions: [
        "Is parental consent given? (True/False)",
        "Is safety important? (True/False)",
        "Ready to learn soon? (True/False)"
      ],
      followUpQuestion: "Can you ask a parent to verify the settings?",
      misconceptionTag: "Consent Required",
      confidence: 100,
      learningPoint: "Safety and Consent",
      detectedCategory: Category.GENERAL
    } as AnalysisResult;
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const isAudioMode = accPreference === AccessibilityPreference.AUDIO;

  const systemInstruction = `You are a world-class AI Learning Coach. 
  
  AUTOMATIC DOMAIN DETECTION RULE:
  You must automatically determine the segment the input belongs to based on the problem description.
  - Domains: Mathematics, Coding, Science, Writing, Logic/Reasoning, General Knowledge.
  - DO NOT assume coding by default. Plain natural language is non-coding.
  - Classify as "Coding" ONLY if clear programming signals exist (e.g., code blocks, syntax, keywords).
  - IF AMBIGUOUS: Default to "General Knowledge".
  - Return the detected domain in the "detectedCategory" field.

  FIRST RESPONSE BRANDING RULE:
  For the very first response of a new session (IsFirstSessionResponse: ${isFirstSessionResponse}):
  - You MUST begin your text content with EXACTLY these two lines:
    ⚡ Powered by Gemini 3
    Human-Centered AI Tutor
  - Followed immediately by: "Let’s get started."

  TEACHING STYLE - ${isKidsMode ? 'KIDS MODE' : 'STANDARD MODE'}:
  ${isKidsMode ? `
  - Tone: Warm, playful, extremely encouraging.
  - Language: Very simple words, short sentences. Child-friendly examples only.
  - Personalization: Address them as "${userName || 'friend'}".
  - Support: Reassure them ("It's okay!", "We're doing this together!").
  ` : `
  - Tone: Clear, standard educational, concise, professional.
  - Language: Use correct terminology correctly.
  - Focus: Independent reasoning.
  `}

  CORE FORMATTING RULE (1-6-1-3-1):
  1. Learning Status: 1 line.
  2. Diagnosis + Reasoning: COMBINED total of MAX 6 lines. Refer to the student's input as "How You Tried".
  3. Key Insight: 1 line.
  4. Quick Practice: EXACTLY 3 questions.
     ${isKidsMode ? '- KIDS MODE RULE: Questions must be Easy, concept-checks, and ONLY True/False format.' : '- STANDARD MODE RULE: Mixed difficulty. Do NOT restrict to True/False.'}
  5. Follow-up Question: 1 question.
  
  Format as JSON. Response language: ${outputLanguage === "Auto" ? "detected language" : outputLanguage}.`;

  const parts: any[] = [
    { text: `Student: ${userName || "Student"}, Problem Input: "${question}", Attempt: "${studentAnswer}", IsFirstSessionResponse: ${isFirstSessionResponse}` }
  ];

  if (imageData) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: imageData } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      temperature: 0.3,
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          learningStatus: { type: Type.STRING },
          diagnosis: { type: Type.STRING },
          rootCause: { type: Type.STRING },
          correctReasoning: { type: Type.STRING },
          learningPoint: { type: Type.STRING },
          misconceptionTag: { type: Type.STRING },
          confidence: { type: Type.INTEGER },
          keyInsight: { type: Type.STRING },
          practiceQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          followUpQuestion: { type: Type.STRING },
          moreDetails: { type: Type.STRING },
          voiceOnlyResponse: { type: Type.STRING },
          voicePromptLanguage: { type: Type.STRING },
          voicePromptContext: { type: Type.STRING },
          voicePromptAttempt: { type: Type.STRING },
          voiceReprompt: { type: Type.STRING },
          voiceFallback: { type: Type.STRING },
          detectedCategory: { type: Type.STRING },
          needsDomainClarification: { type: Type.BOOLEAN },
          clarificationQuestion: { type: Type.STRING }
        },
        required: ["learningStatus", "diagnosis", "rootCause", "correctReasoning", "keyInsight", "practiceQuestions", "followUpQuestion", "detectedCategory"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (error) {
    throw new Error("I couldn't format the coaching session. Please try again.");
  }
};

export const getAlternativeExplanation = async (
  originalProblem: string,
  originalMistake: string,
  previousDiagnosis: string,
  learningMode: LearningMode,
  language: string = "English",
  userName?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const isKidsMode = learningMode === LearningMode.KIDS;

  const systemInstruction = `You are a world-class AI Learning Coach. The student has asked for an alternative explanation.

STYLE SELECTION RULE:
Choose ONE of these styles that is DIFFERENT from the style used in the previous diagnosis:
- A real-life analogy.
- A simple, relatable story.
- Visual imagination (descriptive text that helps them "see" the concept).
- A clear step-by-step breakdown.

MODE RULES:
- ${isKidsMode ? 'KIDS MODE: Use very simple words, warm tone, address as ' + (userName || 'friend') + ', and child-friendly themes.' : 'STANDARD MODE: Professional, clear, and uses correct terminology.'}

Do NOT repeat the wording or structure of the previous diagnosis.
Respond directly with the new explanation. Respond in ${language}.`;

  const prompt = `
    Problem: ${originalProblem}
    Student's Attempt: ${originalMistake}
    Previous Diagnosis (DO NOT REPEAT): ${previousDiagnosis}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      temperature: 0.8,
      systemInstruction,
    }
  });

  return response.text || "I'm having trouble thinking of another way to explain this right now. Let's try reviewing the basics!";
};

export const getRealLifeExample = async (
  concept: string,
  learningMode: LearningMode,
  language: string = "English",
  userName?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const isKidsMode = learningMode === LearningMode.KIDS;

  const systemInstruction = `You are a world-class AI Learning Coach. 
  
  REAL-LIFE EXAMPLE RULE:
  Explain the provided concept using familiar, everyday examples like toys, fruits, school situations, or games.
  - Keep the explanation extremely concrete.
  - Avoid abstract or technical terms.
  - Tone: ${isKidsMode ? 'Warm, very simple, addresses as ' + (userName || 'friend') : 'Clear and relatable'}.
  
  Respond directly with the real-life example. Respond in ${language}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `The concept to explain with a real-life example is: ${concept}`,
    config: {
      temperature: 0.7,
      systemInstruction,
    }
  });

  return response.text || "I'm still thinking of the best real-life example. Why don't we try another quick practice while I work on it?";
};

export const evaluatePracticeAnswers = async (
  originalProblem: string,
  questions: string[],
  answers: string[],
  language: string = "English",
  learningMode: LearningMode = LearningMode.STANDARD,
  userName?: string
): Promise<PracticeEvaluation> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const isKidsMode = learningMode === LearningMode.KIDS;
  
  const systemInstruction = `You are evaluating a student's "Quick Practice" session.
  
  CONFIDENCE-AWARE RESPONSE TONE RULE:
  Adjust the emotional tone of the "performanceMessage" and "patternExplanation" based on the learner's score:
  - SCORE 0/3 or 1/3:
    - Tone: Use extra reassurance and patience.
    - Focus: Emphasize effort over correctness ("Great effort for trying!", "It's totally okay to find this tricky").
    - Style: Slow down explanations and be extremely supportive.
  - SCORE 2/3:
    - Tone: Encouraging, acknowledging progress.
    - Focus: Refine the last bit of understanding ("You're almost there!", "Just one small gap to fix!").
    - Style: Focused and positive.
  - SCORE 3/3:
    - Tone: Confident, affirmative, celebratory.
    - Focus: Reinforce mastery ("Excellent work!", "You've fully mastered this concept!").
    - Style: Affirming and suggests readiness for more.

  EVALUATION STYLE - ${isKidsMode ? 'KIDS MODE' : 'STANDARD MODE'}:
  ${isKidsMode ? `- Tone: Gentle, encouraging. Use "${userName || 'friend'}" in feedback.` : `- Tone: Informative, concise.`}

  Respond in ${language}. Format as JSON. 
  
  LEARNING SNAPSHOT RULE:
  You MUST generate a "learningSnapshot" array containing EXACTLY 3-4 bullet points summarizing the session:
  - The main misconception or mistake detected.
  - The most important concept the learner should remember.
  - The learner’s practice score (e.g. "Score: X / 3").
  - A brief readiness signal (e.g., “Almost there”, “Well understood”, “Needs one more try”).
  
  Use the term "Learning Check" for the performance summary.`;

  const prompt = `
    Context: ${originalProblem}
    Questions: ${JSON.stringify(questions)}
    Answers: ${JSON.stringify(answers)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      temperature: 0.1,
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          maxScore: { type: Type.INTEGER },
          performanceMessage: { type: Type.STRING },
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                isCorrect: { type: Type.BOOLEAN },
                feedback: { type: Type.STRING }
              },
              required: ["isCorrect", "feedback"]
            }
          },
          patternExplanation: { type: Type.STRING },
          learningSnapshot: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "maxScore", "performanceMessage", "results", "learningSnapshot"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as PracticeEvaluation;
  } catch (error) {
    throw new Error("I couldn't evaluate your answers. Please try again.");
  }
};
