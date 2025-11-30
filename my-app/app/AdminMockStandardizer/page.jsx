"use client";
import React, { useState, useEffect } from 'react';

/* ===========================
   ✅ SAFE MOCK BACKEND
=========================== */
const mockDB = {
  user: { id: "admin-1", name: "Admin", role: "admin" },
  exams: Array.from({ length: 12 }).map((_, i) => ({
    id: `exam-${i + 1}`,
    title: `FLK ${i % 2 === 0 ? "1" : "2"} Mock #${i + 1}`,
    exam_type: i % 2 === 0 ? "FLK 1" : "FLK 2",
    created_date: new Date(Date.now() - i * 86400000).toISOString(),
    question_ids: Array.from({ length: Math.floor(Math.random() * 120) + 50 }).map(
      () => crypto.randomUUID()
    ),
    difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)]
  })),
};

const User = {
  me: async () => mockDB.user,
};

const MockExam = {
  list: async () => JSON.parse(JSON.stringify(mockDB.exams)),
  update: async (id, data) => {
    const exam = mockDB.exams.find(e => e.id === id);
    if (exam) Object.assign(exam, data);
    return exam;
  },
  delete: async (id) => {
    mockDB.exams = mockDB.exams.filter(e => e.id !== id);
  },
  create: async (data) => {
    mockDB.exams.push({ id: crypto.randomUUID(), ...data });
  }
};

const Question = {
  delete: async () => {},
  filter: async () => [{ difficulty: "medium" }, { difficulty: "medium" }],
  bulkCreate: async (qs) => qs.map(q => ({ ...q, id: crypto.randomUUID() }))
};

const base44 = {
  integrations: {
    Core: {
      InvokeLLM: async () => ({
        questions: Array.from({ length: 5 }).map((_, i) => ({
          subject: "Contract Law",
          question_text: `Generated question ${i + 1}`,
          option_a: "A",
          option_b: "B",
          option_c: "C",
          option_d: "D",
          option_e: "E",
          correct_answer: "A",
          explanation: "Mock explanation",
          angoff_score: 0.55,
        })),
      }),
    },
  },
};

/* ===========================
   ✅ UI IMPORTS (UNCHANGED)
=========================== */
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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

/* ===========================
   ✅ CONSTANTS (UNCHANGED)
=========================== */
const TARGET_QUESTION_COUNT = 90;
const TARGET_MOCK_PAPERS = 40;

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
    const init = async () => {
      const u = await User.me();
      setUser(u);
      if (u.role === "admin") await loadExams();
      setLoading(false);
    };
    init();
  }, []);

  const loadExams = async () => {
    const all = await MockExam.list();
    setExams(all);
    setMockCounts({
      flk1: all.filter(e => e.exam_type === "FLK 1").length,
      flk2: all.filter(e => e.exam_type === "FLK 2").length,
    });
  };

  const handleEditSuccess = (updated) => {
    setExams(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  /* ===========================
     ✅ STANDARDIZE (SAFE)
  ============================ */
  const handleStandardize = async (exam) => {
    setProcessingId(exam.id);

    const current = exam.question_ids?.length || 0;
    const diff = TARGET_QUESTION_COUNT - current;

    await new Promise(r => setTimeout(r, 1000));

    if (diff > 0) {
      const response = await base44.integrations.Core.InvokeLLM();
      const created = await Question.bulkCreate(response.questions);
      const ids = created.map(q => q.id);
      await MockExam.update(exam.id, { question_ids: [...exam.question_ids, ...ids] });
      toast({ title: "Success", description: "Questions added (mocked)." });
    } else if (diff < 0) {
      const main = exam.question_ids.slice(0, TARGET_QUESTION_COUNT);
      const extra = exam.question_ids.slice(TARGET_QUESTION_COUNT);
      await MockExam.update(exam.id, { question_ids: main });
      await MockExam.create({
        title: `[Extras] ${exam.title}`,
        exam_type: exam.exam_type,
        question_ids: extra,
        time_limit_minutes: 60,
      });
      toast({ title: "Split Complete", description: "Extra questions moved." });
    }

    await loadExams();
    setProcessingId(null);
  };

  /* ===========================
     ✅ BULK RENAME (SAFE)
  ============================ */
  const handleBulkRename = async () => {
    setIsRenaming(true);
    const all = await MockExam.list();
    let count = 0;

    const flk1 = all.filter(e => e.exam_type === "FLK 1");
    const flk2 = all.filter(e => e.exam_type === "FLK 2");

    for (let i = 0; i < flk1.length; i++) {
      const title = `FLK 1 Mock #${i + 1}`;
      if (flk1[i].title !== title) {
        await MockExam.update(flk1[i].id, { title });
        count++;
      }
    }

    for (let i = 0; i < flk2.length; i++) {
      const title = `FLK 2 Mock #${i + 1}`;
      if (flk2[i].title !== title) {
        await MockExam.update(flk2[i].id, { title });
        count++;
      }
    }

    toast({ title: "Renamed", description: `${count} mocks renamed.` });
    await loadExams();
    setIsRenaming(false);
  };

  /* ===========================
     ✅ AUTO ASSIGN DIFFICULTY
  ============================ */
  const handleAutoAssignDifficulty = async () => {
    setIsAssigningDifficulty(true);
    const all = await MockExam.list();

    for (const exam of all) {
      await MockExam.update(exam.id, { difficulty: "medium" });
    }

    toast({ title: "Difficulty Assigned", description: `${all.length} exams updated.` });
    await loadExams();
    setIsAssigningDifficulty(false);
  };

  /* ===========================
     ✅ DELETE (SAFE)
  ============================ */
  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    await MockExam.delete(examToDelete.id);
    toast({ title: "Deleted", description: `"${examToDelete.title}" removed.` });
    setExamToDelete(null);
    await loadExams();
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
          <Link href={createPageUrl("Dashboard")}>
            <Button variant="outline" className="mt-6">Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  /* ===========================
     ✅ YOUR UI BELOW — UNTOUCHED
  ============================ */

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
