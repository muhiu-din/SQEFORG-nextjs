"use client";
import React, { useState, useEffect } from "react";
//call api entities here
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, Lock, Files, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];

const CreditWorkaround = () => (
    <Card className="mt-8 bg-amber-50 border-amber-200 shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-amber-900">
                <AlertTriangle className="w-6 h-6" />
                AI Credits Required
            </CardTitle>
            <CardDescription className="text-amber-800">
                This feature requires AI credits to analyze your text automatically. Here is the 100% free workaround.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-800">
            <p className="font-bold">You can still create your exam for free in 2 simple steps:</p>
            <div>
                <h4 className="font-semibold text-lg">Step 1: Format Your Text (for free)</h4>
                <p className="mb-2">Go to a free tool like ChatGPT and paste the prompt below, adding your own questions at the end.</p>
                <div className="p-3 bg-slate-800 text-white rounded-lg text-sm font-mono">
                    <p>You are a data formatting expert. Take the raw text of the multiple-choice questions I provide and convert it into a single, raw JSON object. Your entire output MUST be only the JSON code. Do not add any other words, titles, or characters like ```json. The JSON must have a top-level key called "questions", which is an array of question objects. Each object must have these keys: "question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score". Use an "angoff_score" of 0.65. Here is the text to format: </p>
                    <p className="mt-2 text-amber-300">[PASTE YOUR TYPED-OUT QUESTIONS HERE]</p>
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-lg">Step 2: Import the Formatted Text</h4>
                <p className="mb-2">Copy the JSON output from the AI tool. Then, go to the credit-free importer, paste it into the "From Text" tab, and click import.</p>
                <Link href={createPageUrl("BulkQuestionImporter")}>
                    <Button variant="outline" className="bg-white hover:bg-slate-100">Go to Credit-Free Importer</Button>
                </Link>
            </div>
        </CardContent>
    </Card>
);

export default function AIGenerateExam() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState("FLK 1");
  const [textContent, setTextContent] = useState("");

  // General generation states
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showCreditWorkaround, setShowCreditWorkaround] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = {name: "Admin User", email: "admin@example.com", role: "admin"};
        setUser(currentUser);
      } catch (e) { setUser(null); }
      setLoadingUser(false);
    };
    fetchCurrentUser();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(false);
    setShowCreditWorkaround(false);

    const plainTextContent = textContent.replace(/(<([^>]+)>)/ig, '');
    if (!title.trim() || !examType.trim() || !plainTextContent.trim()) {
        setError("Please provide an Exam Title, select an Exam Type, and paste your question text.");
        setGenerating(false);
        return;
    }
    
    let subjectContextPrompt;
    if (examType === "FLK 1") {
        subjectContextPrompt = `For each question, you MUST assign a "subject" from the following list: ${FLK1_SUBJECTS.join(', ')}.`;
    } else {
        subjectContextPrompt = `For each question, you MUST assign a "subject" from the following list: ${FLK2_SUBJECTS.join(', ')}.`;
    }

    const prompt = `You are an expert in creating UK Solicitor Qualifying Exam (SQE) questions. Your primary goal is to extract pre-written multiple-choice questions from the text below. If the text does not contain questions, generate new ones based on the content.
      ${subjectContextPrompt}
      For each question, you MUST provide: "question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", and an "angoff_score".
      Return a JSON object with a single key "questions", which is an array of all the structured question objects you found or created.

      Here is the text content to parse:
      ---
      ${plainTextContent}
      ---
    `;

    try {
      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
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
                  angoff_score: {type: "number" },
                },
                required: ["subject", "question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score"]
              }
            }
          },
          required: ["questions"]
        }
      });

      if (!response || !response.questions || response.questions.length === 0) {
        throw new Error("The AI could not generate any questions from the provided content.");
      }

      const createdQuestions = await Question.bulkCreate(response.questions);
      const questionIds = createdQuestions.map(q => q.id);

      await MockExam.create({ title, exam_type: examType, time_limit_minutes: 90, question_ids: questionIds, description: "Generated from pasted text." });

      setSuccess(true);
      setTimeout(() => router.push(createPageUrl("MockExams")), 2000);

    } catch (err) {
      console.error(err);
      const errorMessage = err.message || "An unexpected error occurred.";
      if (errorMessage.toLowerCase().includes("credit") || errorMessage.toLowerCase().includes("payment") || errorMessage.toLowerCase().includes("quota")) {
        setError("This feature requires AI Credits to automatically analyze text.");
        setShowCreditWorkaround(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setGenerating(false);
    }
  };
  
  if (loadingUser) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }
  
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
        <Card className="border-none shadow-xl p-10 text-center max-w-md">
          <Lock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Admin Access Required</h1>
          <p className="text-slate-600 mb-8">This tool is reserved for administrators.</p>
          <Link href={createPageUrl("Dashboard")}><Button variant="outline">Return to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
            <Files className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Exam From Text</h1>
          <p className="text-slate-600 text-lg">Paste your typed-out questions and let the system build the exam.</p>
        </div>

        <Card className="border-none shadow-xl">
            <CardHeader className="p-8 border-b border-slate-100">
              <CardTitle className="text-2xl font-bold text-slate-900">Exam Details & Content</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="title">Exam Title *</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-2 h-12" placeholder="e.g., Complex Wills Mock"/>
                    </div>
                    <div>
                        <Label htmlFor="examType">Exam Type *</Label>
                        <Select value={examType} onValueChange={setExamType} required>
                            <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FLK 1">FLK 1</SelectItem>
                                <SelectItem value="FLK 2">FLK 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <Label>Paste Your Questions Here *</Label>
                    <ReactQuill 
                        theme="snow" 
                        value={textContent} 
                        onChange={setTextContent} 
                        placeholder="Paste your text here. The AI will extract or generate questions, options, and explanations from this content."
                        className="bg-white h-[300px] mt-2"
                        style={{ marginBottom: '4rem' }}
                    />
                </div>
              
              <Button onClick={handleGenerate} disabled={generating} className="w-full bg-slate-900 hover:bg-slate-800 h-14 text-lg">
                {generating ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                {generating ? "Analyzing & Generating..." : "Generate Exam"}
              </Button>
            </CardContent>
        </Card>
        
        {error && !showCreditWorkaround && <Alert variant="destructive" className="mt-6"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        {showCreditWorkaround && <CreditWorkaround />}
        {success && <Alert className="mt-6 bg-green-50 border-green-200"><CheckCircle2 className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800">Exam generated successfully! Redirecting...</AlertDescription></Alert>}

      </div>
    </div>
  );
}