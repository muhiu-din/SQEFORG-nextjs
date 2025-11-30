"use client";
import React, { useState, useEffect } from 'react';
import { ExamAttempt, Question, User, MockExam } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import Watermark from '../components/Watermark';
import ImprovementSuggestions from '../components/ImprovementSuggestions';

export default function ExamReview() {
  const router = useRouter();
  const urlParams = new URLSearchParams(window.location.search);
  const attemptId = urlParams.get("attemptId");

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadAttemptAndQuestions = async () => {
      setLoading(true);
      try {
        if (!attemptId) {
          setLoading(false);
          return;
        }

        const currentUser = await User.me();
        setUser(currentUser);

        const currentAttempt = await ExamAttempt.get(attemptId);
        setAttempt(currentAttempt);

        if (currentAttempt && currentAttempt.question_ids && currentAttempt.question_ids.length > 0) {
          const fetchedQuestions = await Question.filter({ id: { '$in': currentAttempt.question_ids } });
          // Add safety check
          const safeQuestions = Array.isArray(fetchedQuestions) ? fetchedQuestions : [];
          const questionMap = new Map(safeQuestions.map(q => [q.id, q]));
          const orderedQuestions = currentAttempt.question_ids.map(id => questionMap.get(id)).filter(Boolean);
          setQuestions(orderedQuestions);
        } else if (currentAttempt && currentAttempt.mock_exam_id) {
          const mock = await MockExam.get(currentAttempt.mock_exam_id);
          if (mock && mock.question_ids && mock.question_ids.length > 0) {
            const questionPromises = mock.question_ids.map(id => Question.get(id).catch(() => null));
            const fetchedQuestions = await Promise.all(questionPromises);
            setQuestions(fetchedQuestions.filter(q => q !== null));
          } else {
            console.warn("Mock exam found but has no question_ids.");
            setQuestions([]);
          }
        } else {
          if (currentAttempt && currentAttempt.answers) {
            const questionData = await Promise.all(
              Object.keys(currentAttempt.answers).map(qid => Question.get(qid).catch(() => null))
            );
            setQuestions(questionData.filter(q => q));
          } else {
            console.warn("Attempt has no question_ids, no associated mock_exam_id, and no answers to load questions from.");
            setQuestions([]);
          }
        }
      } catch (error) {
        console.error("Failed to load exam review:", error);
        setQuestions([]);
      }
      setLoading(false);
    };

    loadAttemptAndQuestions();
  }, [attemptId]);

  const difficultyColors = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800"
  };

  if (loading) {
    return <div className="p-10 text-center">Loading Review...</div>;
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-xl text-center">
            <CardHeader>
                <CardTitle>Attempt Not Found or Empty</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-slate-600 mb-4">
                    The exam attempt you are looking for could not be found or has no associated questions to review.
                </p>
                <Button onClick={() => router.push(createPageUrl("Results"))}>
                    Go to Results
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  const safeTotalQuestions = attempt.total_questions > 0 ? attempt.total_questions : 1;
  const scorePercentage = (attempt.score / safeTotalQuestions) * 100;
  const scaledScore = (scorePercentage / 100) * 500;

  const standardScaledPassMark = (attempt.standard_pass_score / safeTotalQuestions) * 500;
  const scaledScorePassMark = attempt.angoff_pass_score !== null && attempt.angoff_pass_score !== undefined
    ? (attempt.angoff_pass_score / safeTotalQuestions) * 500
    : null;

  // Ensure questions is always an array before mapping
  const safeQuestions = Array.isArray(questions) ? questions : [];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto relative">
        <Watermark user={user} />
        <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => router.push(createPageUrl("Results"))}>
                <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">Review: {attempt.mock_exam_title}</h1>
                <p className="text-slate-600">Your Score: {scaledScore.toFixed(0)}/500 ({scorePercentage.toFixed(0)}%)</p>
            </div>
        </div>
        
        <Card className="mb-6 border-none shadow-lg relative z-10 bg-white/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="font-semibold">Standard Pass Mark (Scaled)</h3>
                        <p className="text-2xl font-bold">{standardScaledPassMark.toFixed(0)}<span className="text-base font-normal"> / 500</span></p>
                        <p className={`font-bold ${attempt.score >= attempt.standard_pass_score ? 'text-green-600' : 'text-red-600'}`}>
                            {attempt.score >= attempt.standard_pass_score ? 'Pass' : 'Fail'}
                        </p>
                    </div>
                     {scaledScorePassMark !== null && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-semibold">Scaled Scoring</h3>
                            <p className="text-2xl font-bold">{scaledScorePassMark.toFixed(0)}<span className="text-base font-normal"> / 500</span></p>
                             <p className={`font-bold ${attempt.score >= attempt.angoff_pass_score ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.score >= attempt.angoff_pass_score ? 'Pass' : 'Fail'}
                            </p>
                        </div>
                     )}
                </div>
            </CardContent>
        </Card>

        <ImprovementSuggestions attempt={attempt} questions={safeQuestions} />

        <div className="space-y-6 relative z-10">
            {safeQuestions.map((question) => {
                if (!question) return null;
                const userAnswer = attempt.answers[question.id];
                const isCorrect = userAnswer === question.correct_answer;
                
                return (
                    <Card key={question.id} className="border-none shadow-lg bg-white/95 backdrop-blur-sm">
                        <CardHeader className="p-6 border-b border-slate-100">
                             <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline">{question.subject}</Badge>
                            </div>
                            <CardTitle className="text-base font-normal text-slate-800">{question.question_text}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                             <div className="space-y-2 text-sm mb-4">
                                {['A', 'B', 'C', 'D', 'E'].map(opt => {
                                    const isUserAnswer = userAnswer === opt;
                                    const isCorrectAnswer = question.correct_answer === opt;
                                    let variant = 'default';
                                    if (isUserAnswer && !isCorrectAnswer) variant = 'incorrect';
                                    if (isCorrectAnswer) variant = 'correct';

                                    return (
                                    <div key={opt} className={`flex items-start gap-3 p-3 rounded-lg border ${
                                        variant === 'correct' ? 'bg-green-50 border-green-200' : 
                                        variant === 'incorrect' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        {isCorrectAnswer ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0"/> : isUserAnswer ? <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0"/> : <div className="w-5 h-5 shrink-0" /> }
                                        <span className="font-bold">{opt}.</span>
                                        <span className="flex-1">{question[`option_${opt.toLowerCase()}`]}</span>
                                    </div>
                                    )
                                })}
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <h4 className="font-bold mb-2 text-slate-900">Explanation</h4>
                                <p className="text-sm text-slate-700">{question.explanation}</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
      </div>
    </div>
  );
}
