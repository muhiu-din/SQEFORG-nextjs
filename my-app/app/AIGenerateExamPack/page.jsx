"use client";
import React, { useState, useEffect } from "react";
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, Lock, Package, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import {useRouter} from "next/navigation";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];
const ALL_SUBJECTS = [...FLK1_SUBJECTS, ...FLK2_SUBJECTS].sort();
const PACK_GENERATOR_SUBJECTS = ["FLK 1 (All Subjects)", "FLK 2 (All Subjects)", ...ALL_SUBJECTS];
const BATCH_SIZE = 1; // Reduced to 1 for maximum reliability

// --- NEW: Timeout and Retry Logic ---
const invokeLLMWithRetry = async (params, retries = 2, delay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("AI generation timed out. Retrying..."));
        }, 28000); // 28-second timeout

        base44.integrations.Core.InvokeLLM(params)
          .then(result => {
            clearTimeout(timeout);
            resolve(result);
          })
          .catch(err => {
            clearTimeout(timeout);
            reject(err);
          });
      });
      return response;
    } catch (error) {
      if (i === retries) {
        throw error; // Last retry failed, throw the error
      }
      console.warn(`Attempt ${i + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

// Updated prompt template for more complex scenarios
const KAPLAN_STYLE_PROMPT = `Generate exactly {numQuestions} UK SQE1-style single best answer multiple-choice questions.

CRITICAL REQUIREMENTS FOR KAPLAN/SRA STANDARD:
1. Each question MUST begin with a detailed, multi-paragraph scenario (minimum 3-5 sentences)
2. Scenarios must present COMPLEX situations with multiple legal issues intertwined
3. Include realistic client names, dates, amounts, and specific factual details
4. Present nuanced fact patterns that require careful analysis
5. Options should be sophisticated - avoid obviously wrong answers
6. Each incorrect option should have plausible reasoning that tests common misconceptions

{subjectPrompt}
- Difficulty: {difficulty}
- Style: Professional exam standard (Kaplan/SRA/BARBRI level)

EXAMPLE OF REQUIRED COMPLEXITY:
"Sarah instructed her solicitor, James, to act for her in the purchase of a freehold property for £450,000 on 15 March 2024. On 20 March, James received the draft contract from the seller's solicitors. The contract contained a special condition requiring completion within 14 days of exchange, which was unusual for this type of transaction. Sarah had also mentioned to James in passing that she intended to use part of the property for her new business venture, though this was not documented in writing. On 25 March, James exchanged contracts without fully explaining the implications of the 14-day completion clause to Sarah, as he assumed she understood standard conveyancing timelines. Sarah is now unable to complete within 14 days due to a delay in her mortgage offer.

Which of the following best describes James's professional position?"

Return only a JSON object with key "questions" as an array. Each question needs: "question_text" (with full scenario), "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer" (A-E), "explanation", "angoff_score".`;

export default function AIGenerateExamPack() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [packTitle, setPackTitle] = useState("");
  const [numberOfExams, setNumberOfExams] = useState(4);
  const [questionsPerExam, setQuestionsPerExam] = useState(90); // Default to 90 as requested
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState(157.5); // Default to official SQE timing per session

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);
  
  // Update timeLimit when questionsPerExam changes (based on SQE standard: 1.75 mins per question)
  useEffect(() => {
    const minsPerQuestion = 1.75; // Official SQE timing: 157.5 mins / 90 questions = 1.75 mins/question
    setTimeLimit(Math.ceil(questionsPerExam * minsPerQuestion * 10) / 10); // Round to 1 decimal place
  }, [questionsPerExam]);


  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    const totalQuestionsToGenerate = numberOfExams * questionsPerExam;

    for (let i = 1; i <= numberOfExams; i++) {
      const allQuestionsForExam = [];

      while(allQuestionsForExam.length < questionsPerExam) {
        const remainingNeeded = questionsPerExam - allQuestionsForExam.length;
        const numQuestionsInThisBatch = Math.min(BATCH_SIZE, remainingNeeded);

        let subjectPrompt;
        if (subject === "FLK 1 (All Subjects)") {
            subjectPrompt = `The questions can be from any of the following FLK 1 subjects: ${FLK1_SUBJECTS.join(', ')}. Ensure a good mix of subjects.`;
        } else if (subject === "FLK 2 (All Subjects)") {
            subjectPrompt = `The questions can be from any of the following FLK 2 subjects: ${FLK2_SUBJECTS.join(', ')}. Ensure a good mix of subjects.`;
        } else {
            subjectPrompt = `- Main Subject: ${subject}`;
        }
        
        const prompt = KAPLAN_STYLE_PROMPT
            .replace('{numQuestions}', numQuestionsInThisBatch)
            .replace('{subjectPrompt}', subjectPrompt)
            .replace('{difficulty}', difficulty);

        try {
           if (i > 1 || allQuestionsForExam.length > 0) {
            setGenerationStatus(`Exam ${i}/${numberOfExams}: Generating complex scenarios... (${allQuestionsForExam.length}/${questionsPerExam})`);
           }
          const response = await invokeLLMWithRetry({
            prompt,
            response_json_schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question_text: { type: "string" },
                      option_a: { type: "string" },
                      option_b: { type: "string" },
                      option_c: { type: "string" },
                      option_d: { type: "string" },
                      option_e: { type: "string" },
                      correct_answer: { type: "string", enum: ["A", "B", "C", "D", "E"] },
                      explanation: { type: "string" },
                      angoff_score: { type: "number" }
                    },
                    required: ["question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score"],
                  },
                },
              },
              required: ["questions"],
            },
          });

          if (!response || !Array.isArray(response.questions) || response.questions.length === 0) {
            console.warn("AI returned no questions for this batch, retrying...");
            continue;
          }

          // FIX: Filter out any non-object items from the AI response, and ensure essential fields exist
          const validQuestions = response.questions.filter(q => 
            typeof q === 'object' && q !== null && q.question_text && q.correct_answer
          );

          if (validQuestions.length === 0) {
            console.warn("AI response contained no valid question objects, retrying...");
            continue;
          }

          const questionsToPush = validQuestions.map((q) => ({
            ...q,
            subject: subject === "FLK 1 (All Subjects)" || subject === "FLK 2 (All Subjects)" ? "Mixed" : subject,
            difficulty: difficulty,
          }));

          allQuestionsForExam.push(...questionsToPush);
          
          const questionsDoneBeforeThisExam = (i - 1) * questionsPerExam;
          const totalQuestionsGenerated = questionsDoneBeforeThisExam + allQuestionsForExam.length;
          setProgress(Math.round((totalQuestionsGenerated / totalQuestionsToGenerate) * 100));

        } catch (err) {
          console.error(err);
          setError(`Failed on Exam ${i}: ${err.message}. Any previous full exams were saved. Aborting.`);
          setIsGenerating(false);
          return;
        }
      }
      
      const finalQuestionsForExam = allQuestionsForExam.slice(0, questionsPerExam);

      try {
        setGenerationStatus(`Saving Exam ${i} of ${numberOfExams} with ${finalQuestionsForExam.length} questions...`);

        const createdQuestions = await Question.bulkCreate(finalQuestionsForExam);
        const questionIds = createdQuestions.map((q) => q.id);
        
        let examType = "Mixed";
        if (subject === "FLK 1 (All Subjects)" || FLK1_SUBJECTS.includes(subject)) {
            examType = "FLK 1";
        } else if (subject === "FLK 2 (All Subjects)" || FLK2_SUBJECTS.includes(subject)) {
            examType = "FLK 2";
        }

        await MockExam.create({
          title: `${packTitle}: Exam ${i} of ${numberOfExams}`,
          description: "Professional-grade exam with complex, multi-issue scenarios (Kaplan standard)",
          exam_type: examType,
          time_limit_minutes: timeLimit,
          question_ids: questionIds,
        });

      } catch (saveErr) {
        console.error(saveErr);
        setError(`Failed to save the completed Exam ${i}: ${saveErr.message}. Aborting.`);
        setIsGenerating(false);
        return;
      }
    }

    setProgress(100);
    setSuccess(true);
    setGenerationStatus(`Successfully generated ${numberOfExams} Kaplan-standard exams!`);
    setIsGenerating(false);
  };

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
        <div className="max-w-3xl mx-auto text-center">
          <Card className="border-none shadow-xl p-10">
            <Lock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Admin Access Required</h1>
            <p className="text-slate-600 mb-8">This tool is reserved for administrators.</p>
            <Link href={createPageUrl("Dashboard")}>
              <Button variant="outline">Return to Dashboard</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Exam Pack Generator</h1>
          <p className="text-slate-600 text-lg">Generate professional-grade exams with complex, multi-issue scenarios (Kaplan/SRA standard)</p>
        </div>

        <Card className="border-none shadow-xl">
          <form onSubmit={handleGenerate}>
            <CardContent className="p-8 space-y-6">
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-700" />
                <AlertTitle className="text-blue-800">Official SQE Timing</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Questions now generate with detailed 3-5 sentence scenarios at official SQE timing: <strong>1.75 minutes per question</strong> (90 questions in 157.5 minutes per session, 180 questions in 315 minutes total - matching SRA/Kaplan standards).
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="packTitle">Pack Title *</Label>
                <Input id="packTitle" value={packTitle} onChange={(e) => setPackTitle(e.target.value)} required placeholder="e.g., FLK 1 Intensive, Criminal Law Deep Dive" className="mt-2 h-12" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="subject">Main Subject / Area *</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger className="mt-2 h-12"><SelectValue placeholder="Select a subject or area..." /></SelectTrigger>
                    <SelectContent className="max-h-96">{PACK_GENERATOR_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="numberOfExams">No. of Exams *</Label>
                  <Input id="numberOfExams" type="number" value={numberOfExams} onChange={e => setNumberOfExams(parseInt(e.target.value))} required className="mt-2 h-12" />
                </div>
                <div>
                  <Label htmlFor="questionsPerExam">Qs per Exam *</Label>
                  <Input id="questionsPerExam" type="number" value={questionsPerExam} onChange={e => setQuestionsPerExam(parseInt(e.target.value))} required className="mt-2 h-12" />
                  <p className="text-xs text-slate-500 mt-1">Official SQE: 90 per session</p>
                </div>
                 <div>
                  <Label htmlFor="timeLimit">Time Limit (mins) *</Label>
                  <Input id="timeLimit" type="number" step="0.1" value={timeLimit} onChange={e => setTimeLimit(parseFloat(e.target.value))} required className="mt-2 h-12" />
                  <p className="text-xs text-slate-500 mt-1">Auto-calculated at 1.75 min/Q</p>
                </div>
              </div>

              {isGenerating && (
                <div className="pt-4">
                  <p className="text-sm text-center font-medium text-slate-700 mb-2">{generationStatus}</p>
                  <Progress value={progress} />
                </div>
              )}
              {error && <Alert variant="destructive" className="mt-6"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              {success && <Alert className="mt-6 bg-green-50 border-green-200"><CheckCircle2 className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800">{generationStatus}</AlertDescription></Alert>}

              <Button type="submit" disabled={isGenerating || !packTitle || !subject} className="w-full h-14 text-lg mt-6 bg-slate-900 hover:bg-slate-800">
                {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Pack...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Exam Pack</>}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
