"use client";
import React, { useState, useEffect } from 'react';
import { User, MockExam, Question } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock, Loader2, Wand2, CheckCircle, AlertCircle, Gavel, Trash2, Pencil, FileEdit } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import EditMockDialog from '@/components/admin/EditMockDialog';
import _ from 'lodash';

const TARGET_QUESTION_COUNT = 90;
const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];
const TARGET_MOCK_PAPERS = 40; // 20 full mocks * 2 papers each


export default function AdminMockStandardizer() {
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);
    const [processingId, setProcessingId] = useState(null);
    const [examToDelete, setExamToDelete] = useState(null);
    const [examToEdit, setExamToEdit] = useState(null);
    const [mockCounts, setMockCounts] = useState({ flk1: 0, flk2: 0 });
    const [isRenaming, setIsRenaming] = useState(false);
    const [isAssigningDifficulty, setIsAssigningDifficulty] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                if (currentUser.role === 'admin') {
                    await loadExams();
                }
            } catch (error) {
                setUser(null);
            }
            setLoading(false);
        };
        initialize();
    }, []);

    const loadExams = async () => {
        const allExams = await MockExam.list('-created_date');
        setExams(allExams);
        const flk1 = allExams.filter(e => e.exam_type === 'FLK 1').length;
        const flk2 = allExams.filter(e => e.exam_type === 'FLK 2').length;
        setMockCounts({ flk1, flk2 });
    };

    const handleEditSuccess = (updatedExam) => {
        setExams(prevExams => prevExams.map(ex => ex.id === updatedExam.id ? updatedExam : ex));
    };
    
    const handleConfirmDelete = async () => {
        if (!examToDelete) return;
        try {
            if (examToDelete.question_ids && examToDelete.question_ids.length > 0) {
                for (const questionId of examToDelete.question_ids) {
                    try {
                        await Question.delete(questionId);
                    } catch (error) {
                        const isNotFoundError = (error.response && error.response.status === 404) || 
                                                (error.message && error.message.toLowerCase().includes('not found'));

                        if (isNotFoundError) {
                            console.warn(`Question ${questionId} not found, skipping deletion.`);
                        } else {
                            throw error; // Re-throw other errors
                        }
                    }
                }
            }
            await MockExam.delete(examToDelete.id);
            toast({ title: "Success!", description: `"${examToDelete.title}" has been deleted.` });
        } catch (error) {
             console.error("Failed to delete exam:", error);
             toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        } finally {
            setExamToDelete(null);
            await loadExams();
        }
    };

    const handleStandardize = async (exam) => {
        setProcessingId(exam.id);
        
        try {
             // Re-validate user session before starting a long process
            await User.me();
        } catch (authError) {
            toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Your session may have expired. Please refresh the page and try again.",
            });
            setProcessingId(null);
            return;
        }

        const currentCount = exam.question_ids?.length || 0;
        const difference = TARGET_QUESTION_COUNT - currentCount;

        try {
            if (difference > 0) {
                // ADD questions logic with BATCHING to prevent network timeouts
                const BATCH_SIZE = 5; // Reduced from 10 for better reliability
                const allNewQuestions = [];
                
                // Fetch only the questions for the current exam to get context
                const existingQuestionIds = exam.question_ids || [];
                let existingQuestions = [];
                if (existingQuestionIds.length > 0) {
                    // Fetch existing questions in one go using the $in operator
                    existingQuestions = await Question.filter({ id: { '$in': existingQuestionIds } });
                }

                // Determine subject pool based on existing questions or default FLK subjects
                const subjectPool = existingQuestions.length > 0
                    ? _.uniq(existingQuestions.map(q => q.subject))
                    : (exam.exam_type === 'FLK 1' ? FLK1_SUBJECTS : FLK2_SUBJECTS);
                
                // Get example questions for context
                let exampleQuestionsText = "";
                const MAX_EXAMPLES = 5;
                if (existingQuestions.length > 0) {
                    const examples = existingQuestions.slice(0, MAX_EXAMPLES).map(q => `- Example Question: ${q.question_text}\n  - Subject: ${q.subject}`);
                    if (examples.length > 0) {
                        exampleQuestionsText = `
Here are some examples of questions already in this exam. Generate new questions that are thematically and stylistically similar to these, focusing on the same narrow topics if possible:
${examples.join('\n\n')}
`;
                    }
                }

                const numBatches = Math.ceil(difference / BATCH_SIZE);

                for (let i = 0; i < numBatches; i++) {
                    const isLastBatch = i === numBatches - 1;
                    const numQuestionsInBatch = isLastBatch ? difference - (i * BATCH_SIZE) : BATCH_SIZE;

                    if (numQuestionsInBatch <= 0) continue;

                    toast({ title: "Standardizing...", description: `Generating batch ${i + 1} of ${numBatches}...` });

                    const prompt = `
                        Generate exactly ${numQuestionsInBatch} UK SQE1-style single best answer multiple-choice questions.
                        - The questions MUST be scenario-based and of medium difficulty.
                        - The new questions MUST be on a subject from this list: ${subjectPool.join(', ')}.
                        ${exampleQuestionsText}
                        - For each question, provide a "subject" from the provided list.
                        - For each question, provide an 'angoff_score' between 0.0 and 1.0.
                        - Return a single JSON object with a key "questions", which is an array of question objects. Each object must have keys: "subject", "question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", and "angoff_score".
                    `;

                    const response = await base44.integrations.Core.InvokeLLM({
                        prompt,
                        response_json_schema: {
                            type: "object",
                            properties: { questions: { type: "array", items: {
                                type: "object",
                                properties: {
                                    subject: { type: "string" },
                                    question_text: { type: "string" }, option_a: { type: "string" }, option_b: { type: "string" }, option_c: { type: "string" }, option_d: { type: "string" }, option_e: { type: "string" }, correct_answer: { type: "string", enum: ["A", "B", "C", "D", "E"] }, explanation: { type: "string" }, angoff_score: { type: "number" }
                                }, required: ["subject", "question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score"]
                            }}}, required: ["questions"]
                        }
                    });

                    if (!response.questions || response.questions.length === 0) {
                        throw new Error(`AI failed to generate questions for batch ${i + 1}.`);
                    }
                    allNewQuestions.push(...response.questions);
                }

                if (allNewQuestions.length > 0) {
                    const questionsToCreate = allNewQuestions.map(q => ({...q, difficulty: 'medium'}));
                    const createdQuestions = await Question.bulkCreate(questionsToCreate);
                    const newQuestionIds = createdQuestions.map(q => q.id);

                    await MockExam.update(exam.id, { question_ids: [...(exam.question_ids || []), ...newQuestionIds] });
                    toast({ title: "Success!", description: `Added ${allNewQuestions.length} questions to "${exam.title}".` });
                }

            } else if (difference < 0) {
                // REMOVE questions by splitting them into a new exam
                const mainQuestionIds = exam.question_ids.slice(0, TARGET_QUESTION_COUNT);
                const extraQuestionIds = exam.question_ids.slice(TARGET_QUESTION_COUNT);

                // 1. Update the original exam to have exactly 90 questions.
                await MockExam.update(exam.id, { question_ids: mainQuestionIds });

                // 2. Create a new "Extras" mock exam with the remaining questions.
                if (extraQuestionIds.length > 0) {
                    const timeForExtras = Math.ceil(extraQuestionIds.length * (153 / 90));
                    await MockExam.create({
                        title: `[Extras] from ${exam.title}`,
                        description: `Contains ${extraQuestionIds.length} extra questions split from "${exam.title}" during standardization.`,
                        exam_type: exam.exam_type,
                        time_limit_minutes: timeForExtras,
                        question_ids: extraQuestionIds
                    });
                }
                
                toast({ title: "Exam Split Successfully!", description: `"${exam.title}" is now ${TARGET_QUESTION_COUNT} questions. ${extraQuestionIds.length} extra questions moved to a new exam.` });
            }
            
            await loadExams();

        } catch (error) {
            console.error("Standardization failed:", error);
            toast({ variant: "destructive", title: "Standardization Failed", description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    // Bulk rename function
    const handleBulkRename = async () => {
        setIsRenaming(true);
        try {
            const allExams = await MockExam.list('-created_date');
            
            const flk1Exams = allExams.filter(e => e.exam_type === 'FLK 1').sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
            const flk2Exams = allExams.filter(e => e.exam_type === 'FLK 2').sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
            
            let renamed = 0;
            
            // Rename FLK 1 exams
            for (let i = 0; i < flk1Exams.length; i++) {
                const newTitle = `FLK 1 Mock #${i + 1}`;
                if (flk1Exams[i].title !== newTitle) {
                    await MockExam.update(flk1Exams[i].id, { title: newTitle });
                    renamed++;
                }
            }
            
            // Rename FLK 2 exams
            for (let i = 0; i < flk2Exams.length; i++) {
                const newTitle = `FLK 2 Mock #${i + 1}`;
                if (flk2Exams[i].title !== newTitle) {
                    await MockExam.update(flk2Exams[i].id, { title: newTitle });
                    renamed++;
                }
            }
            
            toast({ 
                title: "Success!", 
                description: `Renamed ${renamed} mock exams to standard format.` 
            });
            
            await loadExams();
        } catch (error) {
            console.error("Bulk rename failed:", error);
            toast({ 
                variant: "destructive", 
                title: "Rename Failed", 
                description: error.message 
            });
        } finally {
            setIsRenaming(false);
        }
    };

    // FIXED: Auto-assign difficulty - now processes ALL exams
    const handleAutoAssignDifficulty = async () => {
        setIsAssigningDifficulty(true);
        
        try {
            const allExams = await MockExam.list();
            
            if (allExams.length === 0) {
                toast({ title: "No Exams Found", description: "There are no mock exams to process." });
                setIsAssigningDifficulty(false);
                return;
            }

            let assigned = 0;
            let skippedIndividualExams = 0; // Renamed to avoid confusion with results.skipped
            const results = { easy: 0, medium: 0, hard: 0, skipped: 0 }; // 'skipped' here means validIds.length === 0 or questions.length === 0

            for (const exam of allExams) {
                try {
                    if (!exam.question_ids || exam.question_ids.length === 0) {
                        await MockExam.update(exam.id, { difficulty: 'medium' });
                        results.medium++;
                        assigned++;
                        continue;
                    }
                    
                    // Filter out invalid ObjectIds before fetching
                    const validIds = exam.question_ids.filter(id => {
                        return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
                    });

                    if (validIds.length === 0) {
                        console.warn(`Exam "${exam.title}" (${exam.id}) has no valid question IDs. Defaulting to 'medium' difficulty.`);
                        await MockExam.update(exam.id, { difficulty: 'medium' });
                        results.medium++;
                        results.skipped++;
                        assigned++;
                        continue;
                    }

                    // Fetch all questions for this exam with valid IDs
                    let questions = [];
                    try {
                        questions = await Question.filter({ id: { '$in': validIds } });
                    } catch (fetchError) {
                        console.warn(`Failed to fetch questions for exam "${exam.title}" (${exam.id}):`, fetchError);
                        await MockExam.update(exam.id, { difficulty: 'medium' });
                        results.medium++;
                        results.skipped++;
                        assigned++;
                        continue;
                    }
                    
                    if (questions.length === 0) {
                        console.warn(`No questions found for exam "${exam.title}" (${exam.id}) with valid IDs. Defaulting to 'medium' difficulty.`);
                        await MockExam.update(exam.id, { difficulty: 'medium' });
                        results.medium++;
                        results.skipped++;
                        assigned++;
                        continue;
                    }
                    
                    // Calculate average difficulty
                    const difficultyScores = { easy: 1, medium: 2, hard: 3 };
                    let totalScore = 0;
                    let counted = 0;
                    
                    questions.forEach(q => {
                        if (q.difficulty && difficultyScores[q.difficulty]) {
                            totalScore += difficultyScores[q.difficulty];
                            counted++;
                        }
                    });
                    
                    if (counted === 0) {
                        console.warn(`No questions with specified difficulty for exam "${exam.title}" (${exam.id}). Defaulting to 'medium' difficulty.`);
                        await MockExam.update(exam.id, { difficulty: 'medium' });
                        results.medium++;
                        assigned++;
                        continue;
                    }
                    
                    const avgScore = totalScore / counted;
                    
                    // Assign difficulty based on average
                    let examDifficulty = 'medium';
                    if (avgScore <= 1.4) {
                        examDifficulty = 'easy';
                    } else if (avgScore >= 2.6) {
                        examDifficulty = 'hard';
                    }
                    
                    await MockExam.update(exam.id, { difficulty: examDifficulty });
                    results[examDifficulty]++;
                    assigned++;
                    
                } catch (examError) {
                    console.error(`Failed to process exam ${exam.title}:`, examError);
                    skippedIndividualExams++;
                }
            }
            
            const successDescription = `✅ Processed ${assigned} mocks: ${results.easy} Easy, ${results.medium} Medium, ${results.hard} Hard` +
                `${results.skipped > 0 ? ` (${results.skipped} exams defaulted to medium due to question issues)` : ''}` +
                `${skippedIndividualExams > 0 ? ` (${skippedIndividualExams} exams encountered unhandled errors)` : ''}`;
            
            toast({ 
                title: "Difficulty Assignment Complete!", 
                description: successDescription,
                duration: 5000
            });
            
            // Force reload exams to show changes
            await loadExams();
        } catch (error) {
            console.error("Auto-assign difficulty failed:", error);
            toast({ 
                variant: "destructive", 
                title: "Assignment Failed", 
                description: error.message || "An unexpected error occurred. Please try again."
            });
        } finally {
            setIsAssigningDifficulty(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    }

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

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <Gavel className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Mock Exam Management</h1>
                    <p className="text-slate-600">Standardize question counts, edit details, and monitor creation goals.</p>
                </div>
                
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Mock Paper Creation Goals</CardTitle>
                        <p className="text-sm text-slate-500">Target: {TARGET_MOCK_PAPERS} papers per FLK (for 20 full mocks).</p>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-100 rounded-lg">
                            <h3 className="font-semibold text-slate-800">FLK 1 Papers</h3>
                            <p className="text-2xl font-bold">{mockCounts.flk1} / {TARGET_MOCK_PAPERS}</p>
                            <p className="text-sm text-green-600 font-medium">{Math.max(0, TARGET_MOCK_PAPERS - mockCounts.flk1)} more needed</p>
                        </div>
                        <div className="p-4 bg-slate-100 rounded-lg">
                            <h3 className="font-semibold text-slate-800">FLK 2 Papers</h3>
                            <p className="text-2xl font-bold">{mockCounts.flk2} / {TARGET_MOCK_PAPERS}</p>
                            <p className="text-sm text-green-600 font-medium">{Math.max(0, TARGET_MOCK_PAPERS - mockCounts.flk2)} more needed</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>All Mock Papers ({exams.length})</CardTitle>
                        <div className="flex gap-2">
                            <Button 
                                onClick={handleBulkRename} 
                                disabled={isRenaming || isAssigningDifficulty}
                                variant="outline"
                                className="gap-2"
                            >
                                {isRenaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileEdit className="w-4 h-4" />}
                                Rename All
                            </Button>
                            <Button 
                                onClick={handleAutoAssignDifficulty} 
                                disabled={isAssigningDifficulty || isRenaming}
                                className="gap-2 bg-purple-600 hover:bg-purple-700"
                            >
                                {isAssigningDifficulty ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Auto-Assign Difficulty
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {exams.map(exam => {
                                const qCount = exam.question_ids?.length || 0;
                                const isStandard = qCount === TARGET_QUESTION_COUNT;
                                
                                const difficultyColors = {
                                    easy: "bg-green-100 text-green-800",
                                    medium: "bg-yellow-100 text-yellow-800",
                                    hard: "bg-red-100 text-red-800"
                                };
                                
                                return (
                                    <div key={exam.id} className="flex items-center justify-between p-4 rounded-lg border bg-white gap-4">
                                        <div>
                                            <p className="font-medium text-slate-800">{exam.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={isStandard ? "default" : "destructive"}>
                                                    {qCount} Questions
                                                </Badge>
                                                {exam.difficulty ? (
                                                    <Badge className={difficultyColors[exam.difficulty]}>
                                                        {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-amber-700 border-amber-400">
                                                        No Difficulty
                                                    </Badge>
                                                )}
                                                {isStandard ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isStandard && (
                                                <Button size="sm" onClick={() => handleStandardize(exam)} disabled={processingId === exam.id || isRenaming || isAssigningDifficulty}>
                                                    {processingId === exam.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                                                    {qCount > TARGET_QUESTION_COUNT ? 'Split to 90' : 'Fill to 90'}
                                                </Button>
                                            )}
                                            <Button variant="outline" size="icon" onClick={() => setExamToEdit(exam)} disabled={processingId === exam.id || isRenaming || isAssigningDifficulty}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setExamToDelete(exam)} disabled={processingId === exam.id || isRenaming || isAssigningDifficulty}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <EditMockDialog 
                exam={examToEdit} 
                open={!!examToEdit} 
                onOpenChange={(isOpen) => !isOpen && setExamToEdit(null)}
                onSuccess={handleEditSuccess}
            />

            <AlertDialog open={!!examToDelete} onOpenChange={(isOpen) => !isOpen && setExamToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the mock exam titled "{examToDelete?.title}" and all of its associated questions.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setExamToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                        Yes, delete exam
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
