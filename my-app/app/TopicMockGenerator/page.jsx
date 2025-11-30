"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Sparkles, Loader2, CheckCircle2, Lock, AlertCircle, Brain, Shield, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FLK1_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Constitutional & Administrative Law", "EU Law",
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const FLK2_SUBJECTS = [
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts"
];

const hashString = (str) => {
    if (!str) return '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
};

const TIER_CONFIG = {
    starter: { mocks: 1, questionsPerMock: 90, label: "Starter Tier (1 Mock)" },
    pro: { mocks: 3, questionsPerMock: 90, label: "Pro Tier (3 Mocks)" },
    ultimate: { mocks: 5, questionsPerMock: 90, label: "Ultimate Tier (5 Mocks)" }
};

export default function TopicMockGenerator() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedTier, setSelectedTier] = useState('starter');
    const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const generateMockForSubject = async () => {
        if (!selectedSubject) return;
        setIsGenerating(true);
        setResults([]);
        setError(null);

        const config = TIER_CONFIG[selectedTier];
        const totalQuestions = config.mocks * config.questionsPerMock;
        
        setProgress({ current: 0, total: totalQuestions, status: 'Initializing...' });

        try {
            // Get existing questions for duplicate checking
            const existingQuestions = await base44.entities.Question.filter({ subject: selectedSubject });
            const existingHashes = new Set();
            if (existingQuestions) {
                existingQuestions.forEach(q => {
                    if (q.question_text) existingHashes.add(hashString(q.question_text));
                });
            }

            for (let mockIdx = 0; mockIdx < config.mocks; mockIdx++) {
                const mockQuestions = [];
                const mockNumber = mockIdx + 1;
                
                setProgress(prev => ({ ...prev, status: `Generating Mock ${mockNumber}/${config.mocks}...` }));

                // Generate questions in batches
                const BATCH_SIZE = 5; // Smaller batch for high quality
                const batches = Math.ceil(config.questionsPerMock / BATCH_SIZE);

                for (let batch = 0; batch < batches; batch++) {
                    const count = Math.min(BATCH_SIZE, config.questionsPerMock - mockQuestions.length);
                    
                    const prompt = `Generate ${count} EXTREMELY HARD, SCENARIO-BASED SQE1 MCQs for "${selectedSubject}".
                    
                    CRITICAL REQUIREMENTS:
                    1. SCENARIO: 150-200 word realistic client scenario. Complex facts, dates, multiple parties.
                    2. DIFFICULTY: EXTREMELY HARD (Angoff 0.2-0.3). Test obscure exceptions, complex applications, or multi-step reasoning.
                    3. OPTIONS: 5 options (A-E). All must be legally plausible. Distractors must be sophisticated.
                    4. EXPLANATION: detailed legal reasoning citing cases/statutes.
                    
                    Format: JSON array of objects with keys: question_text, option_a, option_b, option_c, option_d, option_e, correct_answer (A-E), explanation, difficulty (hard).`;

                    const response = await base44.integrations.Core.InvokeLLM({
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
                                            difficulty: { type: "string" }
                                        },
                                        required: ["question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation"]
                                    }
                                }
                            },
                            required: ["questions"]
                        }
                    });

                    const newQuestions = response.questions || [];
                    
                    // Save questions to DB
                    for (const q of newQuestions) {
                        if (!q.question_text) continue;
                        
                        const qHash = hashString(q.question_text);
                        if (existingHashes.has(qHash)) {
                            console.log('Duplicate question skipped');
                            continue;
                        }

                        // Enforce HARD difficulty regardless of AI output
                        const savedQ = await base44.entities.Question.create({
                            ...q,
                            subject: selectedSubject,
                            difficulty: 'hard', 
                            angoff_score: 0.3,
                            tags: ['scenario-based', 'mock-exam', selectedTier]
                        });
                        
                        mockQuestions.push(savedQ);
                        existingHashes.add(qHash);
                    }
                    
                    setProgress(prev => ({ 
                        ...prev, 
                        current: (mockIdx * config.questionsPerMock) + mockQuestions.length 
                    }));
                }

                // Create Mock Exam Entity
                const mockTitle = `${selectedSubject} - Expert Mock ${mockNumber} (${selectedTier})`;
                await base44.entities.MockExam.create({
                    title: mockTitle,
                    description: `Extremely hard, scenario-based mock exam for ${selectedSubject}. Generated for ${selectedTier} tier.`,
                    exam_type: FLK1_SUBJECTS.includes(selectedSubject) ? 'FLK 1' : 'FLK 2',
                    difficulty: 'hard',
                    time_limit_minutes: Math.ceil(config.questionsPerMock * 1.7), // ~1.7 mins per question
                    question_ids: mockQuestions.map(q => q.id)
                });

                setResults(prev => [...prev, { title: mockTitle, count: mockQuestions.length }]);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        }

        setIsGenerating(false);
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <Card className="max-w-md text-center p-8 border-none shadow-xl">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Admin Access Required</h1>
                    <Link href={createPageUrl("Dashboard")}><Button variant="outline" className="mt-6">Return to Dashboard</Button></Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Topic Mock Generator</h1>
                    <p className="text-slate-600 text-lg">Generate extremely hard, scenario-based mock exams per topic</p>
                </div>

                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle>Generation Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <Label className="mb-2 block">Subject</Label>
                                <Select value={selectedSubject || ""} onValueChange={setSelectedSubject} disabled={isGenerating}>
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select Subject..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-96">
                                        <SelectGroup>
                                            <SelectLabel>FLK 1</SelectLabel>
                                            {FLK1_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectGroup>
                                        <SelectGroup>
                                            <SelectLabel>FLK 2</SelectLabel>
                                            {FLK2_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-2 block">Target Tier</Label>
                                <Select value={selectedTier} onValueChange={setSelectedTier} disabled={isGenerating}>
                                    <SelectTrigger className="h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="starter">Starter (1 Mock of 90 Qs)</SelectItem>
                                        <SelectItem value="pro">Pro (3 Mocks of 90 Qs)</SelectItem>
                                        <SelectItem value="ultimate">Ultimate (5 Mocks of 90 Qs)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Alert className="bg-red-50 border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertTitle className="text-red-900 font-bold">Difficulty Warning</AlertTitle>
                            <AlertDescription className="text-red-800">
                                These mocks are generated with <strong>"Extremely Hard"</strong> difficulty settings. 
                                <br/>• Complex scenario-based questions
                                <br/>• Multi-step legal reasoning
                                <br/>• Designed for high-tier subscribers
                            </AlertDescription>
                        </Alert>

                        {isGenerating && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>{progress.status}</span>
                                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                </div>
                                <Progress value={(progress.current / progress.total) * 100} />
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {results.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" /> Generation Complete
                                </h3>
                                <ul className="space-y-1 text-sm text-green-800">
                                    {results.map((r, i) => (
                                        <li key={i}>• Created <strong>{r.title}</strong> ({r.count} questions)</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <Button 
                            onClick={generateMockForSubject} 
                            disabled={isGenerating || !selectedSubject}
                            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-lg"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                            Generate {TIER_CONFIG[selectedTier].mocks} Topic Mocks
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}