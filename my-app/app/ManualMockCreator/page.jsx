"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Edit, Loader2, CheckCircle, Lock, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import _ from 'lodash';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution", "Property Practice", 
  "Land Law", "Wills & Administration of Estates", "Trusts", "Criminal Law", "Criminal Practice", 
  "Solicitors Accounts", "Constitutional & Administrative Law", "EU Law", 
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

export default function ManualMockCreator() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const [title, setTitle] = useState('');
    const [examType, setExamType] = useState('FLK 1');
    const [customQuestions, setCustomQuestions] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    // Current question being created
    const [currentQuestion, setCurrentQuestion] = useState({
        subject: 'Contract Law',
        difficulty: 'medium',
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

    const [showQuestionForm, setShowQuestionForm] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            }
            setLoadingUser(false);
        };
        initialize();
    }, []);

    const handleAddQuestion = () => {
        if (!currentQuestion.question_text || !currentQuestion.option_a || !currentQuestion.option_b || 
            !currentQuestion.option_c || !currentQuestion.option_d || !currentQuestion.option_e || 
            !currentQuestion.explanation) {
            setError('Please fill in all fields for the question');
            return;
        }

        setCustomQuestions([...customQuestions, { ...currentQuestion, tempId: Date.now() }]);
        setCurrentQuestion({
            subject: 'Contract Law',
            difficulty: 'medium',
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
        setShowQuestionForm(false);
        setError('');
    };

    const handleRemoveQuestion = (tempId) => {
        setCustomQuestions(customQuestions.filter(q => q.tempId !== tempId));
    };

    const handleCreate = async () => {
        if (!title || customQuestions.length === 0) {
            setError('Title and at least one question are required.');
            return;
        }
        
        if (customQuestions.length < 10) {
            setError('Please create at least 10 questions for a valid mock exam.');
            return;
        }

        setIsCreating(true);
        setError('');
        setSuccess(false);

        try {
            // First, create all questions in the database
            const createdQuestions = await Promise.all(
                customQuestions.map(q => {
                    const { tempId, ...questionData } = q;
                    return base44.entities.Question.create(questionData);
                })
            );

            const questionIds = createdQuestions.map(q => q.id);

            // Then create the mock exam
            await base44.entities.MockExam.create({
                title,
                exam_type: examType,
                description: `Manually created mock exam with ${questionIds.length} custom MCQ questions`,
                question_ids: questionIds,
                time_limit_minutes: Math.round(questionIds.length * 1.75), // 1.75 mins per question (SQE standard)
                difficulty: 'medium'
            });
            
            setSuccess(true);
            setTimeout(() => router.push(createPageUrl('MockExams')), 2000);
        } catch (err) {
            console.error("Failed to create mock exam:", err);
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsCreating(false);
        }
    };

    if (loadingUser) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
                <Card className="max-w-md text-center p-8 border-none shadow-xl">
                    <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
                    <p className="text-slate-600 mt-2">This tool is for administrators only.</p>
                    <Link href={createPageUrl("Dashboard")}><Button variant="outline" className="mt-6">Return to Dashboard</Button></Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 text-center">
                    <Edit className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-slate-900">Manual MCQ Mock Creator</h1>
                    <p className="text-slate-600">Create custom mock exams by writing your own MCQ questions from scratch</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left: Mock Settings & Summary */}
                    <div className="lg:col-span-1">
                        <Card className="border-none shadow-xl sticky top-6">
                            <CardHeader>
                                <CardTitle>Mock Exam Settings</CardTitle>
                                <CardDescription>Configure your custom mock exam</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Exam Title</Label>
                                    <Input 
                                        id="title" 
                                        value={title} 
                                        onChange={e => setTitle(e.target.value)} 
                                        placeholder="e.g., Advanced Contract Law Mock" 
                                        className="mt-1" 
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="exam-type">Exam Type</Label>
                                    <Select value={examType} onValueChange={setExamType}>
                                        <SelectTrigger id="exam-type" className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FLK 1">FLK 1</SelectItem>
                                            <SelectItem value="FLK 2">FLK 2</SelectItem>
                                            <SelectItem value="Mixed">Mixed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-slate-700">Custom Questions</span>
                                        <Badge className="bg-slate-900 text-white">{customQuestions.length}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Time: {Math.round(customQuestions.length * 1.75)} minutes (SQE standard)
                                    </p>
                                    
                                    {customQuestions.length > 0 && (
                                        <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                                            {customQuestions.map(q => (
                                                <div key={q.tempId} className="flex items-start gap-2 p-2 bg-slate-50 rounded text-xs">
                                                    <button 
                                                        onClick={() => handleRemoveQuestion(q.tempId)}
                                                        className="text-red-600 hover:text-red-700 shrink-0 mt-0.5"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                    <div>
                                                        <Badge variant="outline" className="text-xs mb-1">{q.subject}</Badge>
                                                        <p className="text-slate-700 line-clamp-2">{q.question_text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                                {success && <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>Mock created successfully! Redirecting...</AlertDescription>
                                </Alert>}

                                <Button 
                                    onClick={handleCreate} 
                                    disabled={isCreating || customQuestions.length === 0} 
                                    className="w-full h-12 text-lg"
                                >
                                    {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : `Create Mock (${customQuestions.length} Questions)`}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Question Creation */}
                    <div className="lg:col-span-2">
                        <Card className="border-none shadow-xl mb-6">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Create Custom Questions</CardTitle>
                                        <CardDescription>Write MCQ questions from scratch for your mock exam</CardDescription>
                                    </div>
                                    <Button onClick={() => setShowQuestionForm(!showQuestionForm)} variant={showQuestionForm ? "outline" : "default"}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        {showQuestionForm ? 'Cancel' : 'Add Question'}
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>

                        {showQuestionForm && (
                            <Card className="border-blue-200 bg-blue-50 shadow-xl mb-6">
                                <CardContent className="p-6 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Subject</Label>
                                            <Select value={currentQuestion.subject} onValueChange={v => setCurrentQuestion({...currentQuestion, subject: v})}>
                                                <SelectTrigger className="mt-1 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ALL_SUBJECTS.map(s => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Difficulty</Label>
                                            <Select value={currentQuestion.difficulty} onValueChange={v => setCurrentQuestion({...currentQuestion, difficulty: v})}>
                                                <SelectTrigger className="mt-1 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="easy">Easy</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="hard">Hard</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Question Text (Include scenario if needed)</Label>
                                        <Textarea
                                            value={currentQuestion.question_text}
                                            onChange={e => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
                                            placeholder="Enter the full question text with any relevant scenario..."
                                            rows={4}
                                            className="mt-1 bg-white"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Answer Options</Label>
                                        {['A', 'B', 'C', 'D', 'E'].map(opt => (
                                            <div key={opt} className="flex items-center gap-2">
                                                <Badge className="w-8 h-8 flex items-center justify-center shrink-0">{opt}</Badge>
                                                <Input
                                                    value={currentQuestion[`option_${opt.toLowerCase()}`]}
                                                    onChange={e => setCurrentQuestion({...currentQuestion, [`option_${opt.toLowerCase()}`]: e.target.value})}
                                                    placeholder={`Option ${opt}...`}
                                                    className="bg-white"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <Label>Correct Answer</Label>
                                        <Select value={currentQuestion.correct_answer} onValueChange={v => setCurrentQuestion({...currentQuestion, correct_answer: v})}>
                                            <SelectTrigger className="mt-1 bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A">Option A</SelectItem>
                                                <SelectItem value="B">Option B</SelectItem>
                                                <SelectItem value="C">Option C</SelectItem>
                                                <SelectItem value="D">Option D</SelectItem>
                                                <SelectItem value="E">Option E</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Explanation</Label>
                                        <Textarea
                                            value={currentQuestion.explanation}
                                            onChange={e => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                                            placeholder="Explain why the correct answer is correct and why the others are wrong..."
                                            rows={3}
                                            className="mt-1 bg-white"
                                        />
                                    </div>

                                    <Button onClick={handleAddQuestion} className="w-full h-12 bg-slate-900 hover:bg-slate-800">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add This Question to Mock
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {customQuestions.length === 0 && !showQuestionForm ? (
                            <Card className="border-none shadow-xl">
                                <CardContent className="p-12 text-center">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-600 mb-4">No questions added yet. Click "Add Question" to start creating your custom mock exam.</p>
                                    <Button onClick={() => setShowQuestionForm(true)} className="bg-slate-900 hover:bg-slate-800">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create Your First Question
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : !showQuestionForm && (
                            <Card className="border-none shadow-xl">
                                <CardHeader>
                                    <CardTitle>Your Questions ({customQuestions.length})</CardTitle>
                                    <CardDescription>Review and manage your custom questions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="space-y-3">
                                        {customQuestions.map((question, index) => (
                                            <Card key={question.tempId} className="border-2">
                                                <AccordionItem value={`q-${question.tempId}`} className="border-none">
                                                    <AccordionTrigger className="hover:no-underline px-4 py-3">
                                                        <div className="flex items-center gap-3 w-full">
                                                            <Badge className="w-8 h-8 flex items-center justify-center">{index + 1}</Badge>
                                                            <div className="flex-1 text-left">
                                                                <p className="text-sm font-medium line-clamp-1">{question.question_text}</p>
                                                                <div className="flex gap-2 mt-1">
                                                                    <Badge variant="outline" className="text-xs">{question.subject}</Badge>
                                                                    <Badge className={
                                                                        question.difficulty === 'hard' ? 'bg-red-600' :
                                                                        question.difficulty === 'medium' ? 'bg-amber-600' :
                                                                        'bg-green-600'
                                                                    }>{question.difficulty}</Badge>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveQuestion(question.tempId);
                                                                }}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4">
                                                        <div className="space-y-3">
                                                            <div>
                                                                <p className="font-semibold text-slate-900 mb-2">Question:</p>
                                                                <p className="text-slate-700">{question.question_text}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 mb-2">Options:</p>
                                                                <div className="space-y-1">
                                                                    {['A', 'B', 'C', 'D', 'E'].map(opt => (
                                                                        <div key={opt} className={`flex items-start gap-2 p-2 rounded ${
                                                                            question.correct_answer === opt ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
                                                                        }`}>
                                                                            <Badge className={question.correct_answer === opt ? 'bg-green-600' : ''}>{opt}</Badge>
                                                                            <span className="text-sm">{question[`option_${opt.toLowerCase()}`]}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                                <p className="font-semibold text-slate-900 mb-1">Explanation:</p>
                                                                <p className="text-sm text-slate-700">{question.explanation}</p>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Card>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}