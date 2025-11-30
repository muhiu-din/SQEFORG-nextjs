"use client";
import React, { useState, useEffect } from 'react';
//call api entities here

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle, XCircle, Info, Lock, FileUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];
const User = {
  me: async () => ({
    id: "admin-001",
    name: "Admin User",
    email: "admin@test.com",
    role: "admin" // change to "student" to test blocking
  })
};

const Question = {
  bulkCreate: async (questions) => {
    return questions.map((q, i) => ({
      ...q,
      id: `q-${Date.now()}-${i}`
    }));
  }
};

const MockExam = {
  create: async (exam) => {
    return { id: `exam-${Date.now()}`, ...exam };
  }
};
export default function AIBulkExamImporter() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
        } catch (e) {
            setUser(null);
        }
        setLoadingUser(false);
    };
    fetchUser();
  }, []);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
        const files = Array.from(event.target.files);
        const fileSizeLimit = 20 * 1024 * 1024; // 20MB
        let localError = null;
        
        const validFiles = files.filter(file => {
            if (file.size > fileSizeLimit) {
                localError = localError ? `${localError} ${file.name} is over 20MB.` : `${file.name} is over 20MB.`;
                return false;
            }
            return true;
        });

        setError(localError);
        setSelectedFiles(validFiles);
        setResults(null); 
    }
  };
  
  const handleGenerate = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select one or more valid files.");
      return;
    }
    setGenerating(true);
    setError(null);
    setResults(null);
    setProgress(0);

    const successfulUploads = [];
    const failedUploads = [];

    const MAX_RETRIES = 3; // Max retries for LLM parsing
    const RETRY_DELAY_MS = 2000; // Delay between retries

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const baseStatus = `(${i + 1}/${selectedFiles.length}) Processing: ${file.name}`;
        setGenerationStatus(baseStatus);

        try {
            setGenerationStatus(`${baseStatus} - Uploading file...`);
            const uploadResult = await UploadPrivateFile({ file });
            
            setGenerationStatus(`${baseStatus} - Extracting text...`);
            const { signed_url } = await CreateFileSignedUrl({ file_uri: uploadResult.file_uri, expires_in: 300 });
            const extractionResult = await ExtractDataFromUploadedFile({
                file_url: signed_url,
                json_schema: { type: "object", properties: { text_content: { type: "string" } }, required: ["text_content"] }
            });

            if (extractionResult.status !== 'success' || !extractionResult.output?.text_content) {
                throw new Error(extractionResult.details || "Failed to extract text from file.");
            }
            const fileText = extractionResult.output.text_content;

            // --- CHUNKING LOGIC ---
            const CHUNK_SIZE = 10000; // Reduced from 14000 to prevent network errors
            const textChunks = [];
            let remainingText = fileText;

            while (remainingText.length > 0) {
                if (remainingText.length <= CHUNK_SIZE) {
                    textChunks.push(remainingText);
                    break;
                }
                
                let splitPos = remainingText.lastIndexOf('\n\n', CHUNK_SIZE);
                if (splitPos === -1 || splitPos === 0) { // If no double newline or it's at the start, just split at CHUNK_SIZE
                    splitPos = CHUNK_SIZE;
                }
                
                textChunks.push(remainingText.substring(0, splitPos));
                remainingText = remainingText.substring(splitPos);
            }
            // --- END CHUNKING LOGIC ---
            
            // Determine exam metadata based on file name before processing chunks
            const title = file.name.replace(/\.(pdf|txt)$/i, '');
            const examType = title.toLowerCase().includes('flk 1') ? 'FLK 1' : title.toLowerCase().includes('flk 2') ? 'FLK 2' : 'Mixed';
            const allSubjects = [...FLK1_SUBJECTS, ...FLK2_SUBJECTS];
            const matchedSubject = allSubjects.find(s => title.toLowerCase().includes(s.toLowerCase()));
            const subject = matchedSubject || 'Mixed';

            const allParsedQuestions = [];
            for (let chunkIndex = 0; chunkIndex < textChunks.length; chunkIndex++) {
                const chunk = textChunks[chunkIndex];
                let parsingResponse = null;
                let chunkParseSuccess = false;

                for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                    setGenerationStatus(`${baseStatus} - AI is parsing content chunk ${chunkIndex + 1} of ${textChunks.length} (Attempt ${attempt + 1}/${MAX_RETRIES})...`);
                    const parsePrompt = `You are an expert in parsing educational content for the UK Solicitor Qualifying Exam (SQE). Your task is to read the entire text provided below and extract every single multiple-choice question you can find.

For each question, you must extract:
1. The 'question_text'.
2. Five options: 'option_a', 'option_b', 'option_c', 'option_d', 'option_e'.
3. The 'correct_answer' letter (must be A, B, C, D, or E).
4. A detailed 'explanation' for why the correct answer is right.
5. An 'angoff_score' (a number between 0.0 and 1.0) representing the question's difficulty (e.g., 0.4 for hard, 0.8 for easy).

Return ONLY a single JSON object. DO NOT include any other text or formatting outside of the JSON object. The JSON object MUST have a top-level key "questions", which is an array of all the structured question objects you found in the text. Each question object MUST strictly adhere to the provided schema, including ALL required fields. If a question does not fit the schema (e.g., missing options, incorrect answer format), IGNORE that question and do not include it in the output. Prioritize quality and adherence to the schema over quantity. For the 'explanation', ensure it is comprehensive and clearly justifies the 'correct_answer'. For 'angoff_score', provide a thoughtful estimate based on the question's difficulty, ranging from 0.0 (very hard) to 1.0 (very easy). Try to parse as many valid questions as possible.

Here is the text to parse:
---
${chunk}
---`;
                    
                    try {
                        parsingResponse = await InvokeLLM({
                            prompt: parsePrompt,
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
                                            required: ["question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score"]
                                        }
                                    }
                                },
                                required: ["questions"]
                            }
                        });

                        if (parsingResponse && parsingResponse.questions && parsingResponse.questions.length > 0) {
                            // FIX: Filter out any non-object items from the AI response
                            const validQuestions = parsingResponse.questions.filter(q => typeof q === 'object' && q !== null && q.question_text);
                            if (validQuestions.length > 0) {
                                parsingResponse.questions = validQuestions; // Replace with filtered array
                                chunkParseSuccess = true;
                                break; // Exit retry loop on success
                            }
                        }
                    } catch (llmError) {
                        console.warn(`LLM parsing failed for chunk ${chunkIndex + 1} on attempt ${attempt + 1}:`, llmError.message);
                    }

                    if (attempt < MAX_RETRIES - 1) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS)); // Wait before retrying
                    }
                }

                if (chunkParseSuccess && parsingResponse.questions && parsingResponse.questions.length > 0) {
                    const questionsToPush = parsingResponse.questions.map(q => ({
                        ...q,
                        subject: subject,
                        difficulty: 'medium' // Default difficulty for bulk import
                    }));
                    allParsedQuestions.push(...questionsToPush);
                } else {
                    console.warn(`Failed to parse questions from chunk ${chunkIndex + 1} after ${MAX_RETRIES} attempts.`);
                }
            }


            if (allParsedQuestions.length === 0) {
                throw new Error("AI failed to parse any questions from the document. The document might be empty, poorly formatted, or a scanned image.");
            }

            setGenerationStatus(`${baseStatus} - Saving ${allParsedQuestions.length} questions...`);

            // questionsToCreate mapping is no longer needed as subject and difficulty are added during chunk processing
            const createdQuestions = await Question.bulkCreate(allParsedQuestions);
            const questionIds = createdQuestions.map(q => q.id);

            await MockExam.create({
                title,
                description: "",
                exam_type: examType,
                time_limit_minutes: 90, // Default time limit
                question_ids: questionIds
            });

            successfulUploads.push({ name: file.name, count: questionIds.length });

        } catch (err) {
            console.error(err);
            failedUploads.push({ name: file.name, reason: err.message || "An unknown error occurred." });
        }
        setProgress(((i + 1) / selectedFiles.length) * 100);
    }

    setGenerating(false);
    setGenerationStatus('');
    toast({
      title: "Import Complete",
      description: `${successfulUploads.length} exams created, ${failedUploads.length} failed.`,
    });
    setSelectedFiles([]);
    setResults({ successes: successfulUploads, failures: failedUploads });
  };
  
  if (loadingUser) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (user?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
            <div className="max-w-3xl mx-auto text-center">
                <Card className="border-none shadow-xl p-10">
                    <Lock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Admin Access Required</h1>
                    <p className="text-slate-600 mb-8">This tool is reserved for administrators.</p>
                     <Link href={createPageUrl("Dashboard")}>
                        <Button variant="outline">
                            Return to Dashboard
                        </Button>
                    </Link>
                </Card>
            </div>
      </div>
      )
  }


  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
            <FileUp className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Bulk Exam Importer</h1>
          <p className="text-slate-600 text-lg">Upload multiple files to mass-produce mock exams.</p>
        </div>
        <Card className="border-none shadow-lg">
            <CardHeader className="p-6">
                <CardTitle className="text-xl font-bold text-slate-900">Upload Exam Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                {results && (
                    <div className="mb-6 space-y-4">
                        <Alert>
                            <AlertTitle className="font-bold">Import Complete!</AlertTitle>
                            <AlertDescription>
                                {results.successes.length > 0 && 
                                    <div className="mb-2">
                                        <h5 className="font-semibold text-green-700">Successes:</h5>
                                        <ul className="list-disc pl-5 text-xs">
                                            {results.successes.map(s => <li key={s.name}><CheckCircle className="inline w-3 h-3 mr-1 text-green-600"/>{s.name} - {s.count} questions created.</li>)}
                                        </ul>
                                    </div>
                                }
                                {results.failures.length > 0 && 
                                    <div>
                                        <h5 className="font-semibold text-red-700">Failures:</h5>
                                        <ul className="list-disc pl-5 text-xs">
                                            {results.failures.map(f => <li key={f.name}><XCircle className="inline w-3 h-3 mr-1 text-red-600"/>{f.name} - {f.reason}</li>)}
                                        </ul>
                                    </div>
                                }
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-700" />
                    <AlertTitle className="text-blue-800">Important Naming Convention</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        For best results, name your files clearly. Include "FLK 1" or "FLK 2" in the filename to automatically categorize the exam. Example: <strong>FLK 1 Practice Exam 1.pdf</strong>
                    </AlertDescription>
                </Alert>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input 
                        type="file" 
                        multiple
                        onChange={handleFileChange} 
                        accept=".pdf,.txt"
                        className="flex-1 bg-white"
                        disabled={generating}
                    />
                    <Button onClick={handleGenerate} disabled={generating || selectedFiles.length === 0} className="bg-slate-800 hover:bg-slate-700 w-full sm:w-auto">
                    {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {generating ? "Importing..." : `Import ${selectedFiles.length} Exam(s)`}
                    </Button>
                </div>
                {generating && (
                    <div className="mt-4">
                        <p className="text-sm text-slate-700 font-medium mb-2">{generationStatus}</p>
                        <Progress value={progress} />
                    </div>
                )}
            <p className="text-xs text-slate-500 mt-2">Upload multiple PDF or TXT files (under 20MB each). Each file will be converted into one complete mock exam.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
