"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Server, Loader2, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import _ from 'lodash';
import Link from 'next/link';
import { createPageUrl } from '@/utils';

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];
const CREATION_BATCH_SIZE = 10;

export default function BulkMockGenerator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState([]);
  const [aiCredits, setAiCredits] = useState({ available: 0, used: 0 });
  
  // Form State
  const [numberOfExams, setNumberOfExams] = useState(10);
  const [questionsPerExam, setQuestionsPerExam] = useState(90);
  const [examArea, setExamArea] = useState("FLK 1");
  // Enforcing HARD difficulty only - removed difficultyFocus state
  const [allowReuse, setAllowReuse] = useState(true); // CHANGED: Default to true for safer generation
  const [availableQuestions, setAvailableQuestions] = useState(0);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const currentUser =  {name: "Admin User", email: "admin@example.com", role: "admin"}; // Mock admin user
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
            setLoading(false);
            return;
        }
        const questions = await Question.list();
        setAllQuestions(questions);
        
        // Get AI credit info
        if (currentUser.role === 'admin') {
          const logs = await base44.entities.AICreditLog.list();
          const totalUsed = logs.reduce((sum, log) => {
            const credits = log.credits_added || 0;
            return credits < 0 ? sum + Math.abs(credits) : sum;
          }, 0);
          setAiCredits({ available: 10000, used: totalUsed });
        }
      } catch (e) {
        console.error("Failed to load initial data", e);
        setError("Could not load necessary data. Please refresh the page.");
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // REAL-TIME VALIDATION: Update available questions count and check for errors
  useEffect(() => {
    if (!allQuestions || allQuestions.length === 0) return;

    const subjectsToFilter = examArea === 'FLK 1' ? FLK1_SUBJECTS : FLK2_SUBJECTS;
    // Filter for subjects AND enforce 'hard' difficulty
    let filteredPool = allQuestions.filter(q => 
      subjectsToFilter.includes(q.subject) && 
      (q.difficulty === 'hard' || q.difficulty === 'hard') // Redundant check for clarity/future-proofing
    );
    
    // Explicitly filter out easy/medium to align with vision
    filteredPool = filteredPool.filter(q => q.difficulty !== 'easy' && q.difficulty !== 'medium');

    setAvailableQuestions(filteredPool.length);
    
    const totalQuestionsNeeded = numberOfExams * questionsPerExam;
    
    if (!allowReuse && filteredPool.length < totalQuestionsNeeded) {
        setError(`Not enough unique questions. You need ${totalQuestionsNeeded}, but only ${filteredPool.length} are available for this filter.`);
    } else {
        setError(''); // Clear error if valid
    }

  }, [allQuestions, examArea, numberOfExams, questionsPerExam, allowReuse]);


  const handleGenerateMocks = async () => { // RENAMED FUNCTION
    setIsGenerating(true);
    setSuccessMessage('');
    setProgress(0);
    setGenerationStatus('Preparing question pool...');

    try {
        const subjectsToFilter = examArea === 'FLK 1' ? FLK1_SUBJECTS : FLK2_SUBJECTS;
        // Strict filter for HARD questions only
        let questionPool = allQuestions.filter(q => 
            subjectsToFilter.includes(q.subject) && 
            q.difficulty === 'hard'
        );

        const totalExams = parseInt(numberOfExams, 10);
        let createdCount = 0;

        for (let i = 0; i < totalExams; i++) {
            setGenerationStatus(`Generating exam ${i + 1} of ${totalExams}...`);
            
            let examQuestions;
            if (allowReuse) {
                examQuestions = _.sampleSize(questionPool, questionsPerExam);
            } else {
                // If not allowing reuse, ensure we have enough questions left
                if (questionPool.length < questionsPerExam) {
                  throw new Error(`Not enough unique questions left to create exam ${i + 1}. Consider allowing reuse.`);
                }
                // Take from the start of the shuffled pool and don't put back
                examQuestions = questionPool.splice(0, questionsPerExam);
            }
            
            const questionIds = examQuestions.map(q => q.id);
            
            await MockExam.create({
                title: `${examArea} Hard Mock #${i + 1}`,
                description: `Bulk generated mock. Difficulty: HARD.`,
                exam_type: examArea,
                time_limit_minutes: Math.ceil(questionsPerExam * (153/90)), // SQE time per question
                question_ids: questionIds
            });
            
            createdCount++;
            setProgress(Math.round((createdCount / totalExams) * 100)); // Round progress for cleaner display
        }

        setSuccessMessage(`${createdCount} mock exams have been successfully generated!`);

    } catch (err) {
        console.error("Failed to generate mocks:", err);
        setError(err.message || 'An unknown error occurred during generation.');
    } finally {
        setIsGenerating(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-slate-600 mt-2">This page is for administrators only.</p>
          <Link href={createPageUrl("Dashboard")}><Button variant="outline" className="mt-6">Return to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }
  
  const isGenerateDisabled = !!error || isGenerating; // NEW VARIABLE

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-4xl mx-auto"> {/* CHANGED max-w-2xl to max-w-4xl */}
        <div className="mb-8 text-center">
          <Server className="w-12 h-12 text-slate-800 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Bulk Mock Generator</h1>
          <p className="text-slate-600">Create a large number of mock exams from your existing question bank.</p>
          {user?.role === 'admin' && (
            <div className="mt-4 inline-flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <div className="text-center">
                <p className="text-xs text-blue-600 font-semibold">AI Credits Available</p>
                <p className="text-2xl font-bold text-blue-900">{(aiCredits.available - aiCredits.used).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600 font-semibold">Used</p>
                <p className="text-2xl font-bold text-slate-900">{aiCredits.used.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Generation Settings</CardTitle> {/* CHANGED CardTitle */}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="num-exams">Number of Exams</Label>
                <Input id="num-exams" type="number" value={numberOfExams} onChange={e => setNumberOfExams(e.target.value)} min="1" max="100" required disabled={isGenerating} />
              </div>
              <div>
                <Label htmlFor="num-questions">Questions per Exam</Label>
                <Input id="num-questions" type="number" value={questionsPerExam} onChange={e => setQuestionsPerExam(e.target.value)} min="1" max="180" required disabled={isGenerating} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exam-area">Exam Area</Label>
                <Select value={examArea} onValueChange={setExamArea} disabled={isGenerating}>
                  <SelectTrigger id="exam-area"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLK 1">FLK 1</SelectItem>
                    <SelectItem value="FLK 2">FLK 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div> {/* NEW STRUCTURE for Question Reusability */}
                <Label>Question Reusability</Label>
                <div className="flex items-center space-x-4 p-4 border rounded-lg mt-2 bg-slate-50">
                    <Switch
                        id="allow-reuse"
                        checked={allowReuse}
                        onCheckedChange={setAllowReuse}
                        disabled={isGenerating}
                    />
                    <div className="flex-1">
                        <Label htmlFor="allow-reuse" className="font-semibold cursor-pointer">Allow question reuse across different exams</Label>
                        <p className="text-sm text-slate-500">Recommended. Allows the same questions to be used in multiple mocks, shuffled randomly. Turn this off only if you have enough unique questions for each exam.</p>
                    </div>
                </div>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col items-stretch">
            {error && (
              <Alert variant="destructive" className="mb-4 text-center"> {/* ADDED text-center */}
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="bg-slate-100 p-3 rounded-lg text-center mb-4"> {/* NEW AVAILABLE QUESTIONS DISPLAY */}
              <p className="text-sm text-slate-600">Available questions for these settings: <span className="font-bold text-slate-800">{availableQuestions}</span></p>
            </div>
            <Button onClick={handleGenerateMocks} disabled={isGenerateDisabled} className="w-full h-12 text-lg"> {/* UPDATED BUTTON */}
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Server className="w-5 h-5 mr-2" />} {/* UPDATED ICON SIZES */}
              {isGenerating ? `Generating... (${progress}%)` : `Generate ${numberOfExams} Mocks`} {/* UPDATED BUTTON TEXT */}
            </Button>
          </CardFooter>
        </Card>

        {isGenerating && (
            <Card className="mt-6">
                <CardContent className="p-6 text-center">
                    <p className="font-semibold mb-2">{generationStatus}</p>
                    <Progress value={progress} />
                </CardContent>
            </Card>
        )}

        {successMessage && !isGenerating && ( /* Success message only when not generating */
            <Card className="mt-6">
                <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <p className="font-semibold">{successMessage}</p>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}