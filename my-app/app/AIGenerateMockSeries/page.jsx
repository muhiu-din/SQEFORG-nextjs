"use client";
import React, { useState, useEffect } from "react";
import { User, Question, MockExam } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, Lock, Layers, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];
const ALL_SUBJECTS = [...FLK1_SUBJECTS, ...FLK2_SUBJECTS].sort();
const SERIES_GENERATOR_SUBJECTS = ["FLK 1 (All Subjects)", "FLK 2 (All Subjects)", ...ALL_SUBJECTS];
// BATCH_SIZE is implicitly 1 now as we generate one scenario then one question for it.

// NEW: Timeout and Retry Logic
const invokeLLMWithRetry = async (params, retries = 2, delay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("AI generation timed out. Retrying..."));
        }, 28000); // 28-second timeout

        InvokeLLM(params)
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

// Updated prompt for more complex scenarios
const KAPLAN_STYLE_SCENARIO_PROMPT = `Generate a single, highly complex, multi-paragraph legal scenario suitable for a UK SQE1 exam question in the professional Kaplan/SRA/BARBRI standard.

REQUIREMENTS:
- Minimum 4-5 sentences presenting a realistic client situation
- Include specific details: client names, dates, amounts, locations
- Present multiple intertwined legal issues
- Create nuanced facts that require careful analysis
- Make it read like a real-world professional scenario

Follow this description: "{description}".
{subjectContext}

EXAMPLE STANDARD:
"Marcus Chen instructed Apex Solicitors LLP to act for him in a dispute with his former business partner, Diana Foster, regarding the dissolution of their partnership, 'Chen & Foster Legal Consultants', which was established on 1 June 2019. The partnership agreement, drafted hastily without legal advice, contained a clause stating that upon dissolution, all client files would become the 'exclusive property' of whichever partner secured the majority of the clients' continued instructions. By October 2024, when Marcus served notice of dissolution, Diana had already contacted 15 of their 20 clients, securing written agreements from 12 to continue with her new firm. Marcus claims this conduct breached her fiduciary duties as a partner. The partnership agreement is silent on what conduct is permissible during the notice period before dissolution is complete."

Do NOT write the question or options yet. Return only a JSON object with one key: "scenario_text".`;

const KAPLAN_STYLE_QUESTION_PROMPT = `Based on the following legal scenario, generate one single best answer SQE1-style multiple-choice question at Kaplan/SRA/BARBRI professional standard.

Scenario: """{scenarioText}"""

REQUIREMENTS:
- The question must test a key legal point from the scenario  
- Provide 5 sophisticated options (A-E) that avoid obviously wrong answers
- Each incorrect option should test a common misconception or requires ruling out plausible alternatives
- Provide a detailed explanation referencing specific legal principles, cases, or statutes
- Provide a subject for the question from: {subjectList}
- Provide an 'angoff_score' (0.0-1.0) for difficulty

Return a single JSON object with keys: "subject", "question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score".`;

export default function AIGenerateMockSeries() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesDescription, setSeriesDescription] = useState("");
  const [numberOfExams, setNumberOfExams] = useState(3);
  const [questionsPerExam, setQuestionsPerExam] = useState(90);
  const [subject, setSubject] = useState("");
  const [timeLimit, setTimeLimit] = useState(153);

  // Generation State
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
  
  useEffect(() => {
    const minsPerQuestion = 153 / 90; // Standard SQE1 timing for 90 questions
    setTimeLimit(Math.ceil(questionsPerExam * minsPerQuestion));
  }, [questionsPerExam]);

  // Helper function to map angoff_score to difficulty
  const mapAngoffToDifficulty = (angoffScore) => {
    if (angoffScore <= 0.4) {
      return 'hard';
    } else if (angoffScore <= 0.75) {
      return 'medium';
    } else {
      return 'easy';
    }
  };

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
        let subjectContext;
        let subjectList; // Define subjectList here
        if (subject === "FLK 1 (All Subjects)") {
            subjectContext = `The scenario can be from any of the following FLK 1 subjects: ${FLK1_SUBJECTS.join(', ')}.`;
            subjectList = FLK1_SUBJECTS.join(', ');
        } else if (subject === "FLK 2 (All Subjects)") {
            subjectContext = `The scenario can be from any of the following FLK 2 subjects: ${FLK2_SUBJECTS.join(', ')}.`;
            subjectList = FLK2_SUBJECTS.join(', ');
        } else {
            subjectContext = `The main subject for the scenario is: ${subject}.`;
            subjectList = subject;
        }
        
        try {
          // --- STAGE 1: Generate the complex scenario ---
          setGenerationStatus(`Exam ${i}/${numberOfExams}: Crafting complex scenario for question ${allQuestionsForExam.length + 1}/${questionsPerExam}...`);
          
          const scenarioPrompt = KAPLAN_STYLE_SCENARIO_PROMPT
            .replace('{description}', seriesDescription)
            .replace('{subjectContext}', subjectContext);

          const scenarioResponse = await invokeLLMWithRetry({
            prompt: scenarioPrompt,
            response_json_schema: {
              type: "object",
              properties: { scenario_text: { type: "string" } },
              required: ["scenario_text"]
            }
          });

          if (!scenarioResponse || !scenarioResponse.scenario_text || scenarioResponse.scenario_text.trim() === "") {
            console.warn("AI failed to generate a scenario or returned an empty one. Retrying current question...");
            continue; // Retry if AI returns nothing or invalid structure
          }
          const { scenario_text } = scenarioResponse;

          // --- STAGE 2: Generate the question from the scenario ---
          setGenerationStatus(`Exam ${i}/${numberOfExams}: Building professional-grade question ${allQuestionsForExam.length + 1}/${questionsPerExam}...`);
          
          const questionPrompt = KAPLAN_STYLE_QUESTION_PROMPT
            .replace('{scenarioText}', scenario_text)
            .replace('{subjectList}', subjectList);

          const questionResponse = await invokeLLMWithRetry({
            prompt: questionPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
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
              required: ["subject", "question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score"]
            }
          });

          // --- NEW: Stricter Validation Step ---
          const requiredKeys = ["subject", "question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation"];
          const missingKeys = requiredKeys.filter(key => !questionResponse[key] || (typeof questionResponse[key] === 'string' && !questionResponse[key].trim()));

          // Ensure questionResponse is a valid object and all required keys are present and not empty
          if (!questionResponse || typeof questionResponse !== 'object' || Array.isArray(questionResponse) || missingKeys.length > 0 || typeof questionResponse.angoff_score !== 'number') {
            console.warn(`AI failed to generate a complete question object. Missing or invalid structure. Missing keys: ${missingKeys.join(', ')}. Angoff score type: ${typeof questionResponse?.angoff_score}. Retrying current question...`);
            continue; // Discard this question and try to generate another one
          }

          // Combine the scenario with the generated question text
          const finalQuestionText = `${scenario_text}\n\n${questionResponse.question_text}`;

          const questionWithDifficulty = { 
            ...questionResponse, 
            question_text: finalQuestionText, // Update with combined text
            difficulty: mapAngoffToDifficulty(questionResponse.angoff_score) 
          };

          allQuestionsForExam.push(questionWithDifficulty);

          // Update progress based on the total number of questions generated so far across all exams
          const questionsDoneBeforeThisExam = (i - 1) * questionsPerExam;
          const totalQuestionsGenerated = questionsDoneBeforeThisExam + allQuestionsForExam.length;
          setProgress(Math.round((totalQuestionsGenerated / totalQuestionsToGenerate) * 100));

        } catch (err) {
          console.error(err);
          setError(`Failed on Exam ${i} at question ${allQuestionsForExam.length + 1} (Stage 1 or 2): ${err.message}. Any previous full exams were saved. Aborting.`);
          setIsGenerating(false);
          return;
        }
      }
      
      const finalQuestionsForExam = allQuestionsForExam.slice(0, questionsPerExam); // Ensure we don't exceed questionsPerExam if retries generated extras

      try {
        setGenerationStatus(`Saving Exam ${i} of ${numberOfExams}...`);

        const createdQuestions = await Question.bulkCreate(finalQuestionsForExam);
        const questionIds = createdQuestions.map((q) => q.id);
        
        let examType = "Mixed";
        if (subject.includes("FLK 1") || FLK1_SUBJECTS.includes(subject)) {
            examType = "FLK 1";
        } else if (subject.includes("FLK 2") || FLK2_SUBJECTS.includes(subject)) {
            examType = "FLK 2";
        }

        await MockExam.create({
          title: `${seriesTitle}: Exam ${i}`,
          description: `Part of the "${seriesTitle}" series (Kaplan-standard). ${seriesDescription}`,
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
    setGenerationStatus(`Successfully generated ${numberOfExams} professional-grade exams!`);
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
            <Link to={createPageUrl("Dashboard")}>
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
            <Layers className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">AI Mock Series Generator</h1>
          <p className="text-slate-600 text-lg">Generate Kaplan/SRA-standard exams with complex, multi-issue scenarios in a consistent series.</p>
        </div>

        <Card className="border-none shadow-xl">
          <form onSubmit={handleGenerate}>
            <CardContent className="p-8 space-y-6">
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-700" />
                <AlertTitle className="text-blue-800">Professional Standard</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Questions generate with 4-5 sentence scenarios, realistic names/dates/amounts, and sophisticated answer options - matching Kaplan/SRA/BARBRI professional exam standards.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="seriesTitle">Series Title *</Label>
                  <Input id="seriesTitle" value={seriesTitle} onChange={(e) => setSeriesTitle(e.target.value)} required placeholder="e.g., Final Sprint Revision Series" className="mt-2 h-12" />
                </div>
                 <div>
                  <Label htmlFor="subject">Main Subject / Area *</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger className="mt-2 h-12"><SelectValue placeholder="Select a subject or area..." /></SelectTrigger>
                    <SelectContent>{SERIES_GENERATOR_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="seriesDescription">Series Description *</Label>
                <Textarea id="seriesDescription" value={seriesDescription} onChange={(e) => setSeriesDescription(e.target.value)} required placeholder="Describe the question style, e.g., 'Complex partnership disputes with multiple fiduciary duty breaches...'" className="mt-2 h-32" />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="numberOfExams">No. of Exams *</Label>
                  <Input id="numberOfExams" type="number" min="1" value={numberOfExams} onChange={e => setNumberOfExams(parseInt(e.target.value))} required className="mt-2 h-12" />
                </div>
                <div>
                  <Label htmlFor="questionsPerExam">Qs per Exam *</Label>
                  <Input id="questionsPerExam" type="number" min="1" value={questionsPerExam} onChange={e => setQuestionsPerExam(parseInt(e.target.value))} required className="mt-2 h-12" />
                </div>
                 <div>
                  <Label htmlFor="timeLimit">Time Limit (mins)</Label>
                  <Input id="timeLimit" type="number" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value))} required className="mt-2 h-12" />
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

              <Button type="submit" disabled={isGenerating || !seriesTitle || !subject || !seriesDescription} className="w-full h-14 text-lg mt-6 bg-slate-900 hover:bg-slate-800">
                {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Series...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Series</>}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
