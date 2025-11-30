"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, CheckCircle2, Lock, AlertCircle, Gavel, Shield, Pencil } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ALL_SUBJECTS = [
  "Business Law & Practice",
  "Contract Law",
  "Tort Law",
  "Dispute Resolution",
  "Property Practice",
  "Land Law",
  "Wills & Administration of Estates",
  "Trusts",
  "Criminal Law",
  "Criminal Practice",
  "Solicitors Accounts",
  "Constitutional & Administrative Law",
  "EU Law",
  "The Legal System of England & Wales",
  "Legal Services",
  "Ethics & Professional Conduct"
];

const questionSchema = {
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
};

// Simple hash function for duplicate detection
const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
};

export default function AdminBLLGenerator() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [error, setError] = useState(null);
    const [duplicatesFound, setDuplicatesFound] = useState(0);
    
    // Form state
    const [subject, setSubject] = useState("Contract Law");
    const [difficulty, setDifficulty] = useState("medium");
    const [topicFocus, setTopicFocus] = useState("");
    const [numToGenerate, setNumToGenerate] = useState(10);
    const [progressMessage, setProgressMessage] = useState("");
    const [batchId, setBatchId] = useState("");
    const [activeTab, setActiveTab] = useState("ai"); // 'ai' or 'manual'
    const [aiCredits, setAiCredits] = useState({ available: 10000, used: 0 });
    
    // Manual entry state
    const [manualQuestion, setManualQuestion] = useState({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        option_e: '',
        correct_answer: 'A',
        explanation: '',
        angoff_score: 0.6
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
                
                // Load AI credits
                if (currentUser.role === 'admin') {
                    const logs = await base44.entities.AICreditLog.list();
                    const totalUsed = logs.reduce((sum, log) => {
                        const credits = log.credits_added || 0;
                        return credits < 0 ? sum + Math.abs(credits) : sum;
                    }, 0);
                    setAiCredits({ available: 10000, used: totalUsed });
                }
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedQuestions([]);
        setDuplicatesFound(0);
        setProgressMessage("");
        
        const newBatchId = `bll_${Date.now()}`;
        setBatchId(newBatchId);
        const newQuestions = [];
        let duplicates = 0;

        // Angoff score mapping
        const angoffMap = { easy: 0.8, medium: 0.6, hard: 0.4 };
        const targetAngoff = angoffMap[difficulty] || 0.6;

        for (let i = 0; i < numToGenerate; i++) {
            setProgressMessage(`Generating Black Letter Law question ${i + 1} of ${numToGenerate}...`);
            
            try {
                const prompt = `You are an expert in UK law and SQE Black Letter Law questions. Generate a high-quality, scenario-based multiple-choice question for the SQE exam.

CRITICAL REQUIREMENTS:
1. Create a realistic legal scenario with specific facts
2. The question MUST test pure legal knowledge (statutes, case law, legal principles)
3. ALL 5 OPTIONS (A-E) MUST BE SIMILAR IN STRUCTURE, LENGTH, AND PLAUSIBILITY
   - Each option should be a complete, professional legal conclusion or statement
   - All options must sound equally correct at first glance
   - Avoid obvious wrong answers like "None of the above" or clearly incorrect statements
   - Make each distractor based on common legal misconceptions or related principles
4. SINGLE BEST ANSWER FORMAT:
   - Only ONE option is the correct/best answer
   - Other 4 options should be plausible but incorrect for specific legal reasons
   - Each wrong answer should represent a realistic mistake a student might make
5. NO plagiarism - create original scenarios and facts
6. Include case names or statutory references where appropriate
7. The explanation must cite relevant law (cases/statutes) and explain why each wrong answer is incorrect

Subject: ${subject}
Difficulty: ${difficulty}
${topicFocus ? `Specific topic focus: ${topicFocus}` : ''}
Target Angoff score: ${targetAngoff}

Generate question ${i + 1} with unique facts. Ensure it's different from any previous questions in this batch.`;

                const response = await base44.integrations.Core.InvokeLLM({ 
                    prompt: prompt, 
                    response_json_schema: questionSchema 
                });

                // Generate hash to check for duplicates
                const questionHash = hashString(response.question_text);
                
                // Check if this hash already exists
                const existingQuestions = await base44.entities.BlackLetterQuestion.filter({
                    question_hash: questionHash
                });

                if (existingQuestions && existingQuestions.length > 0) {
                    duplicates++;
                    setDuplicatesFound(duplicates);
                    console.log(`Duplicate detected for question ${i + 1}, skipping...`);
                    continue;
                }

                const newQuestionData = { 
                    ...response, 
                    subject, 
                    difficulty,
                    question_hash: questionHash,
                    generation_batch: newBatchId
                };

                const createdQuestion = await base44.entities.BlackLetterQuestion.create(newQuestionData);
                newQuestions.push(createdQuestion);
                setGeneratedQuestions([...newQuestions]);

            } catch (err) {
                console.error(`Error generating question ${i + 1}:`, err);
                setError(`Failed to generate question ${i + 1}: ${err.message}`);
                setIsGenerating(false);
                setProgressMessage("");
                return;
            }
        }
        
        setProgressMessage(`Successfully generated ${newQuestions.length} questions! ${duplicates > 0 ? `(${duplicates} duplicates skipped)` : ''}`);
        setIsGenerating(false);
    };

    const handleManualSubmit = async () => {
        if (!manualQuestion.question_text || !manualQuestion.option_a || !manualQuestion.option_b || 
            !manualQuestion.option_c || !manualQuestion.option_d || !manualQuestion.option_e || 
            !manualQuestion.explanation) {
            setError("Please fill in all required fields");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedQuestions([]);
        setDuplicatesFound(0);
        setProgressMessage("");

        try {
            const questionHash = hashString(manualQuestion.question_text);
            
            // Check for duplicates
            const existingQuestions = await base44.entities.BlackLetterQuestion.filter({
                question_hash: questionHash
            });

            if (existingQuestions && existingQuestions.length > 0) {
                setError("This question already exists in the database (duplicate detected)");
                setIsGenerating(false);
                return;
            }

            const questionData = {
                ...manualQuestion,
                subject, // Use the shared subject state
                difficulty, // Use the shared difficulty state
                question_hash: questionHash,
                generation_batch: `manual_${Date.now()}`
            };

            const createdQuestion = await base44.entities.BlackLetterQuestion.create(questionData);
            setGeneratedQuestions([createdQuestion]);
            
            // Reset form
            setManualQuestion({
                question_text: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                option_e: '',
                correct_answer: 'A',
                explanation: '',
                angoff_score: 0.6
            });

            setProgressMessage("Question successfully created!");

        } catch (err) {
            console.error("Error creating manual question:", err);
            setError(`Failed to create question: ${err.message}`);
        }

        setIsGenerating(false);
    };
    
    if (loading) {
        return (
            <div className="p-10 text-center">
                <Loader2 className="animate-spin w-8 h-8 mx-auto" />
            </div>
        );
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <Card className="max-w-md text-center p-8 border-none shadow-xl">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Admin Access Required</h1>
                    <p className="text-slate-600 mt-2">This tool is for administrators only.</p>
                    <Link to={createPageUrl("Dashboard")}>
                        <Button variant="outline" className="mt-6">Return to Dashboard</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center">
                        <Gavel className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Black Letter Law Generator</h1>
                    <p className="text-slate-600 text-lg">Generate EQUAL amounts per subject for fair distribution</p>
                    <div className="flex gap-2 mt-2">
                        <Badge className="bg-blue-600">Duplicate Detection Enabled</Badge>
                        <Badge className="bg-green-600">⚖️ Equal Distribution</Badge>
                    </div>
                </div>

                <Card className="mb-6 border-2 border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">AI Credits Status</h3>
                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-sm text-slate-600">Available</p>
                                        <p className="text-3xl font-bold text-green-900">{(aiCredits.available - aiCredits.used).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Used</p>
                                        <p className="text-3xl font-bold text-slate-900">{aiCredits.used.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">This Generation</p>
                                        <p className="text-2xl font-bold text-amber-900">~{numToGenerate} credits</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-6xl font-bold text-blue-900">
                                    {Math.round(((aiCredits.available - aiCredits.used) / aiCredits.available) * 100)}%
                                </div>
                                <p className="text-sm text-slate-600 mt-1">Remaining</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900 font-bold">Quality Assurance & Cost</AlertTitle>
                    <AlertDescription className="text-blue-800">
                        This generator creates original, scenario-based questions with:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Realistic legal scenarios with specific facts</li>
                            <li>Case law and statutory references</li>
                            <li>Plausible distractors testing legal knowledge</li>
                            <li>Detailed explanations citing relevant law</li>
                            <li>Automatic duplicate detection via hash matching</li>
                        </ul>
                        <p className="mt-3 font-semibold">💡 Cost: ~1 AI credit per question • Manual entry uses 0 credits</p>
                    </AlertDescription>
                </Alert>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ai">
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI Generation
                        </TabsTrigger>
                        <TabsTrigger value="manual">
                            <Pencil className="w-4 h-4 mr-2" />
                            Manual Entry
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ai">
                        <Card className="border-none shadow-xl">
                            <CardHeader>
                                <CardTitle>AI Generation Parameters</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Select 
                                            id="subject" 
                                            value={subject} 
                                            onValueChange={setSubject} 
                                            disabled={isGenerating}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent className="max-h-96">
                                                {ALL_SUBJECTS.map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="difficulty">Difficulty *</Label>
                                        <Select 
                                            id="difficulty" 
                                            value={difficulty} 
                                            onValueChange={setDifficulty} 
                                            disabled={isGenerating}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="easy">Easy (Angoff: 0.8)</SelectItem>
                                                <SelectItem value="medium">Medium (Angoff: 0.6)</SelectItem>
                                                <SelectItem value="hard">Hard (Angoff: 0.4)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                <div>
                                    <Label htmlFor="topic-focus">Specific Topic/Area (Optional)</Label>
                                    <Textarea
                                        id="topic-focus"
                                        placeholder="e.g., 'misrepresentation and undue influence', 'directors' duties under Companies Act 2006', 'negligence in professional context'"
                                        value={topicFocus}
                                        onChange={e => setTopicFocus(e.target.value)}
                                        disabled={isGenerating}
                                        rows={3}
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="num-to-generate">Number of Questions</Label>
                                    <Input 
                                        id="num-to-generate" 
                                        type="number" 
                                        value={numToGenerate} 
                                        onChange={e => setNumToGenerate(parseInt(e.target.value) || 1)} 
                                        min="1" 
                                        max="50" 
                                        disabled={isGenerating} 
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Recommended: Start with 10 questions and review quality before generating more
                                    </p>
                                </div>
                                
                                <Button 
                                    onClick={handleGenerate} 
                                    disabled={isGenerating} 
                                    className="w-full h-12 bg-slate-900 hover:bg-slate-800"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2"/>
                                    ) : (
                                        <Sparkles className="w-5 h-5 mr-2" />
                                    )}
                                    {isGenerating ? 'Generating...' : `Generate ${numToGenerate} Question(s)`}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="manual">
                        <Card className="border-none shadow-xl">
                            <CardHeader>
                                <CardTitle>Manual Question Entry</CardTitle>
                                <p className="text-sm text-slate-600 mt-2">Create BLL questions manually without using AI credits</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="manual-subject">Subject *</Label>
                                        <Select 
                                            id="manual-subject"
                                            value={subject} 
                                            onValueChange={setSubject}
                                            disabled={isGenerating}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent className="max-h-96">
                                                {ALL_SUBJECTS.map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="manual-difficulty">Difficulty *</Label>
                                        <Select 
                                            id="manual-difficulty"
                                            value={difficulty} 
                                            onValueChange={setDifficulty}
                                            disabled={isGenerating}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="easy">Easy</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="hard">Hard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="manual-question">Question Text *</Label>
                                    <Textarea
                                        id="manual-question"
                                        value={manualQuestion.question_text}
                                        onChange={e => setManualQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                                        placeholder="Enter the scenario-based question..."
                                        rows={4}
                                        disabled={isGenerating}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label>Answer Options *</Label>
                                    {['A', 'B', 'C', 'D', 'E'].map(letter => (
                                        <div key={letter} className="flex items-start gap-2">
                                            <div className="w-8 h-10 flex items-center justify-center font-bold text-slate-700">
                                                {letter}.
                                            </div>
                                            <Textarea
                                                value={manualQuestion[`option_${letter.toLowerCase()}`]}
                                                onChange={e => setManualQuestion(prev => ({ 
                                                    ...prev, 
                                                    [`option_${letter.toLowerCase()}`]: e.target.value 
                                                }))}
                                                placeholder={`Option ${letter}`}
                                                rows={2}
                                                disabled={isGenerating}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <Label htmlFor="manual-correct">Correct Answer *</Label>
                                    <Select 
                                        id="manual-correct"
                                        value={manualQuestion.correct_answer}
                                        onValueChange={val => setManualQuestion(prev => ({ ...prev, correct_answer: val }))}
                                        disabled={isGenerating}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">A</SelectItem>
                                            <SelectItem value="B">B</SelectItem>
                                            <SelectItem value="C">C</SelectItem>
                                            <SelectItem value="D">D</SelectItem>
                                            <SelectItem value="E">E</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="manual-explanation">Explanation *</Label>
                                    <Textarea
                                        id="manual-explanation"
                                        value={manualQuestion.explanation}
                                        onChange={e => setManualQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                                        placeholder="Explain why the correct answer is right and why others are wrong. Include case law or statutory references..."
                                        rows={5}
                                        disabled={isGenerating}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="manual-angoff">Angoff Score (0.0 - 1.0)</Label>
                                    <Input
                                        id="manual-angoff"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        value={manualQuestion.angoff_score}
                                        onChange={e => setManualQuestion(prev => ({ 
                                            ...prev, 
                                            angoff_score: parseFloat(e.target.value) || 0.6 
                                        }))}
                                        disabled={isGenerating}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Probability a minimally competent candidate would answer correctly (default: 0.6)
                                    </p>
                                </div>

                                <Button 
                                    onClick={handleManualSubmit}
                                    disabled={isGenerating}
                                    className="w-full h-12 bg-slate-900 hover:bg-slate-800"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2"/>
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                    )}
                                    {isGenerating ? 'Creating...' : 'Create Question'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                
                {isGenerating && progressMessage && (
                    <div className="mb-6">
                        <p className="text-slate-700 font-medium text-center mb-2">{progressMessage}</p>
                        <Progress 
                            value={(generatedQuestions.length / numToGenerate) * 100} 
                            className="w-full h-3" 
                        />
                        {duplicatesFound > 0 && (
                            <p className="text-amber-600 text-sm text-center mt-2">
                                {duplicatesFound} duplicate(s) detected and skipped
                            </p>
                        )}
                    </div>
                )}
                
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {generatedQuestions.length > 0 && (
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                Generated Questions ({generatedQuestions.length})
                                {batchId && (
                                    <Badge variant="outline" className="ml-2">
                                        Batch: {batchId}
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {generatedQuestions.map((q, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-white">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-slate-900">Question {index + 1}</h3>
                                        <div className="flex gap-2">
                                            <Badge>{q.difficulty}</Badge>
                                            <Badge variant="outline">{q.subject}</Badge>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-slate-800 mb-3">{q.question_text}</p>
                                    
                                    <div className="space-y-1 mb-3 text-sm">
                                        <p className={q.correct_answer === 'A' ? 'text-green-700 font-semibold' : ''}>
                                            A: {q.option_a}
                                        </p>
                                        <p className={q.correct_answer === 'B' ? 'text-green-700 font-semibold' : ''}>
                                            B: {q.option_b}
                                        </p>
                                        <p className={q.correct_answer === 'C' ? 'text-green-700 font-semibold' : ''}>
                                            C: {q.option_c}
                                        </p>
                                        <p className={q.correct_answer === 'D' ? 'text-green-700 font-semibold' : ''}>
                                            D: {q.option_d}
                                        </p>
                                        <p className={q.correct_answer === 'E' ? 'text-green-700 font-semibold' : ''}>
                                            E: {q.option_e}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-2">
                                        <p className="text-sm text-green-900">
                                            <strong>Correct Answer: {q.correct_answer}</strong>
                                        </p>
                                    </div>
                                    
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                        <p className="text-sm text-blue-900">
                                            <strong>Explanation:</strong> {q.explanation}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-3">
                                        <Badge variant="outline">Angoff: {q.angoff_score}</Badge>
                                        <Badge variant="outline">Hash: {q.question_hash}</Badge>
                                    </div>
                                </div>
                            ))}
                            
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    Questions saved to database. Students can now practice them via Black Letter Law Practice.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}