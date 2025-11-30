"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Flag, CheckCircle2, XCircle, AlertCircle, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Watermark from '@/components/Watermark';
import ScoreVisualization from '@/components/ScoreVisualization';
import { processSessionRewards } from '@/components/GamificationHelper';
import GamificationToast from '@/components/GamificationToast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CustomMockSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [isTimed, setIsTimed] = useState(true);
  const [gamificationRewards, setGamificationRewards] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const questionIds = params.get('questions')?.split(',') || [];
    const timeLimit = parseInt(params.get('timeLimit')) || 0;
    const title = params.get('title') || 'Custom Practice';
    const timed = params.get('timed') !== 'false';

    setExamTitle(title);
    setIsTimed(timed);
    if (timed && timeLimit > 0) {
      setTimeRemaining(timeLimit * 60);
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const allQuestions = await base44.entities.Question.list();
        const sessionQuestions = allQuestions.filter(q => questionIds.includes(q.id));
        setQuestions(sessionQuestions);
      } catch (error) {
        console.error("Failed to load session:", error);
      }
      setLoading(false);
    };

    loadData();
  }, [searchParams.toString()]);

  useEffect(() => {
    if (!isTimed || timeRemaining === null || timeRemaining <= 0 || isFinished) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isFinished, isTimed]);

  const handleAnswerSelect = (answerKey) => {
    if (isFinished) return;
    setSelectedAnswer(answerKey);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null) return;
    
    const currentQuestion = questions[currentIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selected: selectedAnswer,
        correct: selectedAnswer === currentQuestion.correct_answer
      }
    }));

    // Auto-advance to next question
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      const prevQuestion = questions[currentIndex - 1];
      const prevAnswer = answers[prevQuestion?.id];
      setSelectedAnswer(prevAnswer?.selected || null);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      const nextQuestion = questions[currentIndex + 1];
      const nextAnswer = answers[nextQuestion?.id];
      setSelectedAnswer(nextAnswer?.selected || null);
    }
  };

  const toggleFlag = () => {
    const currentQuestion = questions[currentIndex];
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  const handleFinish = async () => {
    setIsFinished(true);
    
    // Calculate score
    let score = 0;
    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer && answer.correct) {
        score++;
      }
    });

    // Save attempt
    try {
      await base44.entities.ExamAttempt.create({
        mock_exam_id: 'custom-session',
        mock_exam_title: examTitle,
        answers: Object.fromEntries(Object.entries(answers).map(([qId, ans]) => [qId, ans.selected])),
        score,
        total_questions: questions.length,
        time_taken_minutes: isTimed && timeRemaining !== null ? Math.round((questions.length * 1.7 * 60 - timeRemaining) / 60) : 0,
        completed: true,
        question_ids: questions.map(q => q.id),
        flagged_question_ids: Array.from(flaggedQuestions),
        is_timed: isTimed
      });

      // Award gamification points
      const rewards = await processSessionRewards(user, score, questions.length, true);
      setGamificationRewards(rewards);
    } catch (error) {
      console.error("Failed to save attempt:", error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!loading && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8">
          <Shield className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-slate-600 mb-6">
            Custom mock creation is only available to administrators.
          </p>
          <Link href={createPageUrl('MockExams')}>
            <Button className="bg-slate-900">View Available Mocks</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Questions Found</h2>
          <p className="text-slate-600 mb-6">Unable to load questions for this session.</p>
          <Button onClick={() => router.push(createPageUrl('Dashboard'))}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    const score = Object.values(answers).filter(a => a.correct).length;
    const percentage = (score / questions.length * 100).toFixed(1);
    
    // Analyze weak subjects
    const subjectPerformance = {};
    questions.forEach(q => {
      if (!subjectPerformance[q.subject]) {
        subjectPerformance[q.subject] = { correct: 0, total: 0 };
      }
      subjectPerformance[q.subject].total++;
      if (answers[q.id]?.correct) {
        subjectPerformance[q.subject].correct++;
      }
    });

    const weakSubjects = Object.entries(subjectPerformance)
      .filter(([_, stats]) => (stats.correct / stats.total) < 0.6)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));

    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <Watermark />
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-none shadow-2xl">
              <CardHeader className="bg-linear-to-r from-slate-900 to-slate-700 text-white p-8">
                <CardTitle className="text-3xl font-bold text-center">
                  {examTitle} - Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <ScoreVisualization score={score} total={questions.length} showDetails={true} />

                {/* Weak Areas Analysis */}
                {weakSubjects.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      Areas for Improvement
                    </h3>
                    <div className="space-y-2">
                      {weakSubjects.map(([subject, stats]) => (
                        <div key={subject} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-slate-900">{subject}</span>
                            <Badge className="bg-red-600">
                              {stats.correct}/{stats.total} ({((stats.correct / stats.total) * 100).toFixed(0)}%)
                            </Badge>
                          </div>
                          <Progress value={(stats.correct / stats.total) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question by Question Review */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Question Review</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {questions.map((q, idx) => {
                      const userAnswer = answers[q.id];
                      const isCorrect = userAnswer?.correct;
                      const wasFlagged = flaggedQuestions.has(q.id);

                      return (
                        <AccordionItem key={idx} value={`q-${idx}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className="text-left flex-1">Q{idx + 1}: {q.subject}</span>
                              {wasFlagged && (
                                <Badge variant="outline" className="mr-2">
                                  <Flag className="w-3 h-3 mr-1" />
                                  Flagged
                                </Badge>
                              )}
                              <Badge className={isCorrect ? "bg-green-600" : "bg-red-600"}>
                                {isCorrect ? "Correct" : "Incorrect"}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="p-4 space-y-4">
                              <p className="font-medium">{q.question_text}</p>
                              
                              <div className="space-y-2">
                                {['A', 'B', 'C', 'D', 'E'].map(opt => {
                                  const isUserChoice = userAnswer?.selected === opt;
                                  const isCorrectAnswer = q.correct_answer === opt;
                                  
                                  let className = "p-3 rounded-lg border ";
                                  if (isCorrectAnswer) {
                                    className += "bg-green-50 border-green-300";
                                  } else if (isUserChoice) {
                                    className += "bg-red-50 border-red-300";
                                  } else {
                                    className += "bg-slate-50 border-slate-200";
                                  }

                                  return (
                                    <div key={opt} className={className}>
                                      <div className="flex items-start gap-2">
                                        {isCorrectAnswer && (
                                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                        )}
                                        {isUserChoice && !isCorrect && (
                                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                        )}
                                        <div>
                                          <span className="font-bold mr-2">{opt}.</span>
                                          <span>{q[`option_${opt.toLowerCase()}`]}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {q.explanation && (
                                <Alert>
                                  <AlertDescription className="text-sm">
                                    <strong>Explanation:</strong> {q.explanation}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push(createPageUrl('Dashboard'))}
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Dashboard
                  </Button>
                  <Button
                    onClick={() => router.push(createPageUrl('PersonalisedPractice'))}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                  >
                    Practice Weak Areas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {gamificationRewards && (
          <GamificationToast 
            points={gamificationRewards.points}
            newBadges={gamificationRewards.newBadges}
            streakInfo={gamificationRewards.streakInfo}
          />
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const hasAnswered = answers[currentQuestion.id] !== undefined;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const isFlagged = flaggedQuestions.has(currentQuestion.id);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <Watermark />
      <div className="max-w-4xl mx-auto">
        {/* Header with timer and progress */}
        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{examTitle}</h2>
                <p className="text-slate-600">
                  Question {currentIndex + 1} of {questions.length}
                </p>
              </div>
              
              {isTimed && timeRemaining !== null && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                  <Clock className="w-5 h-5 text-slate-700" />
                  <span className={`text-xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>

            <Progress value={progress} className="h-2" />
            
            <div className="flex gap-2 mt-4 text-sm text-slate-600">
              <span>Answered: {answeredCount}/{questions.length}</span>
              <span>•</span>
              <span>Flagged: {flaggedQuestions.size}</span>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader className="border-b bg-slate-50">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFlag}
                    className={isFlagged ? "border-amber-500 bg-amber-50" : ""}
                  >
                    <Flag className={`w-4 h-4 ${isFlagged ? "text-amber-600 fill-amber-600" : ""}`} />
                  </Button>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">{currentQuestion.subject}</Badge>
                  <Badge variant="outline">{currentQuestion.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                    const isSelected = selectedAnswer === opt;
                    const isPreviouslyAnswered = answers[currentQuestion.id]?.selected === opt;
                    
                    let className = "p-4 rounded-lg border-2 cursor-pointer transition-all ";
                    if (isPreviouslyAnswered || isSelected) {
                      className += "bg-slate-100 border-slate-900";
                    } else {
                      className += "bg-white border-slate-200 hover:border-slate-400";
                    }

                    return (
                      <div
                        key={opt}
                        onClick={() => handleAnswerSelect(opt)}
                        className={className}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            (isSelected || isPreviouslyAnswered) ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
                          }`}>
                            {(isSelected || isPreviouslyAnswered) && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold mr-2">{opt}.</span>
                            <span>{currentQuestion[`option_${opt.toLowerCase()}`]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  {!hasAnswered && selectedAnswer !== null && (
                    <Button
                      onClick={handleConfirmAnswer}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Confirm Answer
                    </Button>
                  )}
                  
                  {currentIndex < questions.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      className="flex-1 bg-slate-900 hover:bg-slate-800"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinish}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Finish Exam
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Question Navigator */}
        <Card className="mt-6 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                const isFlagged = flaggedQuestions.has(q.id);

                let className = "w-full aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all cursor-pointer ";
                if (isCurrent) {
                  className += "border-slate-900 bg-slate-900 text-white";
                } else if (isAnswered) {
                  className += "border-green-500 bg-green-50 text-green-900";
                } else if (isFlagged) {
                  className += "border-amber-500 bg-amber-50 text-amber-900";
                } else {
                  className += "border-slate-300 bg-white text-slate-600 hover:border-slate-400";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      const answer = answers[q.id];
                      setSelectedAnswer(answer?.selected || null);
                    }}
                    className={className}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
