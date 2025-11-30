"use client";
import React, { useState, useEffect } from "react";
import { MockExam, User, ExamAttempt } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Clock, FileText, Plus, Play, Sparkles, Loader2, Trash2, SlidersHorizontal, Package, Edit, CheckCircle2, AlertTriangle } from "lucide-react"; // Added AlertTriangle import
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription } from "@/components/ui/alert"; // Added Alert and AlertDescription import
import CustomMockDialog from '@/components/CustomMockDialog';
import { useToast } from "@/components/ui/use-toast";

export default function MockExams() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [mockExams, setMockExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [completedExamIds, setCompletedExamIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);

  const fetchData = async () => {
      setLoading(true);
      let currentUser = null;
      try {
          currentUser = await User.me();
          setUser(currentUser);
          
          const userAttempts = await ExamAttempt.filter({ 
              created_by: currentUser.email, 
              completed: true 
          });
          const completedIds = new Set(userAttempts.map(attempt => attempt.mock_exam_id));
          setCompletedExamIds(completedIds);
          
      } catch(e) {
          setUser({ subscription_tier: 'starter', mock_exam_credits: 0, role: 'guest' });
          setCompletedExamIds(new Set());
      }

      try {
          const exams = await MockExam.list('-created_date');
          // FILTER TO HARD ONLY
          let hardExams = exams.filter(e => e.difficulty === 'hard');
          
          // Apply tier limits: Starter=4 mocks, Pro=15 mocks, Ultimate=unlimited
          if (currentUser && currentUser.role !== 'admin') {
              const tier = currentUser.subscription_tier || 'starter';
              const mockLimits = { starter: 4, pro: 15, ultimate: Infinity };
              const limit = mockLimits[tier] || 4;
              
              if (limit !== Infinity) {
                  // Distribute equally across FLK types
                  const flk1 = hardExams.filter(e => e.exam_type === 'FLK 1');
                  const flk2 = hardExams.filter(e => e.exam_type === 'FLK 2');
                  const mixed = hardExams.filter(e => e.exam_type === 'Mixed' || !e.exam_type);
                  
                  const perType = Math.floor(limit / 3);
                  const remainder = limit % 3;
                  
                  hardExams = [
                      ...flk1.slice(0, perType + (remainder > 0 ? 1 : 0)),
                      ...flk2.slice(0, perType + (remainder > 1 ? 1 : 0)),
                      ...mixed.slice(0, perType)
                  ];
              }
          }
          
          setMockExams(hardExams);
          setFilteredExams(hardExams);
      } catch (error) {
          console.error("Failed to load mock exams:", error);
      }
      setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let tempExams = [...mockExams];

    if (searchTerm) {
        tempExams = tempExams.filter(exam =>
            exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (filterType !== "all") {
        tempExams = tempExams.filter(exam => exam.exam_type === filterType);
    }

    if (!showCompleted) {
        tempExams = tempExams.filter(exam => !completedExamIds.has(exam.id));
    }

    setFilteredExams(tempExams);
  }, [mockExams, searchTerm, filterType, showCompleted, completedExamIds]);

  const handleDeleteClick = (exam) => {
    setExamToDelete(exam);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    try {
        await MockExam.delete(examToDelete.id);
        setExamToDelete(null);
        setDeleteConfirmOpen(false);
        await fetchData(); // Reload exams after deletion
        toast({
            title: "Exam deleted successfully",
            description: `"${examToDelete.title}" has been removed.`,
        });
    } catch (error) {
        console.error("Failed to delete exam:", error);
        toast({
            title: "Error deleting exam",
            description: `Failed to delete "${examToDelete.title}". Please try again.`,
            variant: "destructive",
        });
        setExamToDelete(null);
        setDeleteConfirmOpen(false);
    }
  };

  const formatTimeLimit = (minutes) => {
    if (!minutes) return "Not set";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Mock Exams</h1>
            <p className="text-slate-600">Full timed practice exams</p>
            {user?.role !== 'admin' && (
              <p className="text-sm text-slate-500 mt-2">
                Your {user?.subscription_tier || 'starter'} plan: {
                  user?.subscription_tier === 'ultimate' ? 'Unlimited mocks' : 
                  user?.subscription_tier === 'pro' ? '15 mock exams' : 
                  '4 mock exams (2 FLK1 + 2 FLK2)'
                }
              </p>
            )}
          </div>
          {user?.role === 'admin' && (
            <div className="flex gap-2">
                <Link href={createPageUrl("ManualMockCreator")}>
                    <Button variant="outline" className="h-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Create Manual Mock
                    </Button>
                </Link>
                <CustomMockDialog />
                <Link href={createPageUrl("AIGenerateExamPack")}>
                    <Button className="bg-slate-900 hover:bg-slate-800 gap-2 h-full">
                        <Package className="w-4 h-4" />
                        Generate Exam Pack
                    </Button>
                </Link>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 items-center">
            <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                className={filterType === "all" ? "bg-slate-900 text-white" : ""}
            >
                All Exams ({mockExams.length})
            </Button>
            <Button
                variant={filterType === "FLK 1" ? "default" : "outline"}
                onClick={() => setFilterType("FLK 1")}
                className={filterType === "FLK 1" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
                FLK 1 ({mockExams.filter(e => e.exam_type === 'FLK 1').length})
            </Button>
            <Button
                variant={filterType === "FLK 2" ? "default" : "outline"}
                onClick={() => setFilterType("FLK 2")}
                className={filterType === "FLK 2" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
            >
                FLK 2 ({mockExams.filter(e => e.exam_type === 'FLK 2').length})
            </Button>
            
            <div className="ml-auto flex items-center gap-2">
                <Button
                    variant={showCompleted ? "outline" : "default"}
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={!showCompleted ? "bg-slate-900 text-white" : ""}
                >
                    {showCompleted ? "Hide Completed" : "Show All"}
                </Button>
            </div>
        </div>

        {filteredExams.length === 0 && !loading ? (
            <p className="text-center text-slate-500 py-10">No mock exams found matching your criteria.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => {
                  const questionCount = exam.question_ids?.length || 0;
                  const isStandardLength = questionCount === 90;
                  const isCompleted = completedExamIds.has(exam.id);

                  return (
                      <Card 
                          key={exam.id} 
                          className={`border-none shadow-lg hover:shadow-xl transition-shadow ${isCompleted ? 'border-2 border-green-500' : ''}`}
                      >
                          <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                      <CardTitle className="text-lg line-clamp-2">{exam.title}</CardTitle>
                                      {isCompleted && (
                                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                      )}
                                  </div>
                                  {user?.role === 'admin' && (
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteClick(exam)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </Button>
                                  )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={
                                      exam.exam_type === "FLK 1" ? "bg-blue-100 text-blue-800" :
                                      exam.exam_type === "FLK 2" ? "bg-purple-100 text-purple-800" :
                                      "bg-slate-100 text-slate-800"
                                  }>
                                      {exam.exam_type || 'General'}
                                  </Badge>
                                  {isStandardLength && (
                                      <Badge className="bg-green-100 text-green-800">Official Length</Badge>
                                  )}
                                  {isCompleted && (
                                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                                  )}
                              </div>
                          </CardHeader>
                          <CardContent>
                              {exam.description && (
                                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{exam.description}</p>
                              )}
                              <div className="space-y-2 mb-4 text-sm">
                                  <div className="flex items-center gap-2 text-slate-700">
                                      <FileText className="w-4 h-4" />
                                      <span>{questionCount} {questionCount === 1 ? 'Question' : 'Questions'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-700">
                                      <Clock className="w-4 h-4" />
                                      <span>{formatTimeLimit(exam.time_limit_minutes)}</span>
                                      {exam.time_limit_minutes === 153 && questionCount === 90 && (
                                          <Badge variant="outline" className="text-xs">SQE Official</Badge>
                                      )}
                                  </div>
                              </div>
                              <Button
                                  onClick={() => router.push(createPageUrl("TakeExam") + `?examId=${exam.id}`)}
                                  className={`w-full ${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                              >
                                  <Play className="w-4 h-4 mr-2" />
                                  {isCompleted ? 'Retake Exam' : 'Start Exam'}
                              </Button>
                          </CardContent>
                      </Card>
                  );
              })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the exam titled "{examToDelete?.title}".
                All of its questions and associated user attempt data will also be lost.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Yes, delete exam
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}