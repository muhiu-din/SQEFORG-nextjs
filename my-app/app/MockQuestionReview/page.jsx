"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
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

// Helper function to fetch questions in chunks
const fetchQuestionsInChunks = async (ids, chunkSize = 100) => {
  if (!ids || ids.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }
  const promises = chunks.map(chunk => Question.filter({ id: { '$in': chunk } }));
  const chunkedResults = await Promise.all(promises);
  return chunkedResults.flat();
};


export default function MockQuestionReview() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mockExams, setMockExams] = useState([]);
  const [selectedMock, setSelectedMock] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser.role === 'admin') {
          await loadMockExams();
        }
      } catch (error) {
        setUser(null);
      }
      setLoading(false);
    };
    initialize();
  }, []);

  const loadMockExams = async () => {
    const allMocks = await MockExam.list('-created_date');
    setMockExams(allMocks);
    // Load all questions by default after mocks are fetched
    await loadQuestionsForMock('all', allMocks);
  };

  const loadQuestionsForMock = async (mockId, currentMocks) => {
    const mocks = currentMocks || mockExams;
    setQuestionsLoading(true);
    setQuestions([]);
    try {
      let questionIds = new Set();
      if (mockId === 'all') {
        mocks.forEach(mock => {
          if (mock.question_ids) {
            mock.question_ids.forEach(id => questionIds.add(id));
          }
        });
      } else {
        const mock = mocks.find(m => m.id === mockId);
        if (mock && mock.question_ids) {
          mock.question_ids.forEach(id => questionIds.add(id));
        }
      }

      if (questionIds.size === 0) {
        setQuestions([]);
        setQuestionsLoading(false);
        return;
      }

      // **THE FIX**: Filter out any invalid IDs before making the API call
      const idArray = Array.from(questionIds).filter(id => /^[0-9a-fA-F]{24}$/.test(id));

      if (idArray.length === 0) {
        setQuestions([]);
        setQuestionsLoading(false);
        return;
      }

      const allQuestionsData = await fetchQuestionsInChunks(idArray);

      const processedQuestions = allQuestionsData.map(question => ({
        ...question,
        mockTitles: getMockTitlesForQuestion(question.id, mocks)
      }));

      setQuestions(processedQuestions);

    } catch (error) {
      console.error("Failed to load questions:", error);
      setQuestions([]); // Clear questions on error
    } finally {
      setQuestionsLoading(false);
    }
  };

  const getMockTitlesForQuestion = (questionId, allMocks) => {
    const mocks = allMocks || mockExams;
    return mocks
      .filter(mock => mock.question_ids && mock.question_ids.includes(questionId))
      .map(mock => mock.title);
  };

  const handleMockChange = async (mockId) => {
    setSelectedMock(mockId);
    await loadQuestionsForMock(mockId);
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      await Question.delete(questionToDelete.id);

      const mocksToUpdate = mockExams.filter(mock =>
        mock.question_ids && mock.question_ids.includes(questionToDelete.id)
      );

      for (const mock of mocksToUpdate) {
        const updatedQuestionIds = mock.question_ids.filter(id => id !== questionToDelete.id);
        await MockExam.update(mock.id, { question_ids: updatedQuestionIds });
      }

      // Reload data efficiently
      const reloadedMocks = await MockExam.list('-created_date');
      setMockExams(reloadedMocks);
      await loadQuestionsForMock(selectedMock, reloadedMocks);

    } catch (error) {
      console.error("Failed to delete question:", error);
    }

    setQuestionToDelete(null);
  };

  const toggleQuestionExpansion = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const isScenarioBased = (questionText) => {
    const sentences = questionText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.length >= 3 && questionText.length > 200;
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
          <Button variant="outline" className="mt-6"><Link href={createPageUrl("Dashboard")}>Return to Dashboard</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Mock Question Review</h1>
        <p className="text-slate-600 mb-8">Review and manage questions in your mock exams. Delete questions that aren't scenario-based enough.</p>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filter by Mock Exam</CardTitle>
              <div className="w-64">
                <Select value={selectedMock} onValueChange={handleMockChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mock exam..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Mock Exams</SelectItem>
                    {mockExams.map(mock => (
                      <SelectItem key={mock.id} value={mock.id}>
                        {mock.title} ({mock.question_ids?.length || 0} questions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" /></div>
            ) : questions.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No questions found for the selected mock exam.</p>
            ) : (
              <div className="space-y-4">
                {questions.map(question => {
                  if (!question) return null;
                  const isExpanded = expandedQuestions.has(question.id);
                  const scenarioBased = isScenarioBased(question.question_text);
                  const preview = question.question_text.substring(0, 150);

                  return (
                    <div key={question.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{question.subject}</Badge>
                          <Badge className={question.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {question.difficulty}
                          </Badge>
                          <Badge variant={scenarioBased ? "default" : "destructive"}>
                            {scenarioBased ? "Scenario-based" : "Too Simple"}
                          </Badge>
                          {question.mockTitles && question.mockTitles.map(title => (
                            <Badge key={title} variant="secondary" className="text-xs">
                              {title.length > 30 ? title.substring(0, 30) + '...' : title}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => toggleQuestionExpansion(question.id)}>
                            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setQuestionToDelete(question)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-slate-800">
                        {isExpanded ? (
                          <div>
                            <p className="whitespace-pre-wrap mb-4">{question.question_text}</p>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                              {['A', 'B', 'C', 'D', 'E'].map(opt => (
                                <div key={opt} className={`p-2 rounded border ${question.correct_answer === opt ? 'bg-green-50 border-green-200' : 'bg-slate-50'}`}>
                                  <span className="font-bold">{opt}.</span> {question[`option_${opt.toLowerCase()}`]}
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                              <p className="text-sm"><strong>Explanation:</strong> {question.explanation}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-600">
                            {preview}{question.question_text.length > 150 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!questionToDelete} onOpenChange={(isOpen) => !isOpen && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question and remove it from all mock exams that contain it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-red-600 hover:bg-red-700">
              Delete Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
