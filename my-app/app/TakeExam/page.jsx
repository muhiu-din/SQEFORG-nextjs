"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { useRouter,useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Flag, CheckCircle2, XCircle, AlertCircle, ArrowLeft, ArrowRight, BookOpen, Target, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Watermark from '@/components/Watermark';
import ScoreVisualization from '@/components/ScoreVisualization';
import { processSessionRewards } from '@/components/GamificationHelper';
import GamificationToast from '@/components/GamificationToast';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function TakeExam() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [mockExam, setMockExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [gamificationRewards, setGamificationRewards] = useState(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [detailedFeedback, setDetailedFeedback] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const examId = params.get('examId');

    const loadExam = async () => {
      setLoading(true);
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const exam = await base44.entities.MockExam.get(examId);
        setMockExam(exam);

        const allQuestions = await base44.entities.Question.list();
        const examQuestions = allQuestions.filter(q => exam.question_ids.includes(q.id));
        setQuestions(examQuestions);

        if (exam.time_limit_minutes) {
          setTimeRemaining(exam.time_limit_minutes * 60);
        }
      } catch (error) {
        console.error("Failed to load exam:", error);
      }
      setLoading(false);
    };

    if (examId) {
      loadExam();
    }
  }, [searchParams]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isFinished) return;

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
  }, [timeRemaining, isFinished, questions]); // Added questions to dependency array for handleFinish

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

    // Move to next question immediately after confirming, if not last question
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null); // Clear selected answer for the new question
      }, 300); // Small delay for visual feedback
    } else {
      // If it's the last question, keep the selected answer visible but allow to finish
      // The finish button will now become active
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

  const generateDetailedFeedback = async (question, userAnswer) => {
    try {
      const prompt = `You are an expert SQE law tutor. A student answered this multiple-choice question incorrectly.

**Question:** ${question.question_text}

**Options:**
A: ${question.option_a}
B: ${question.option_b}
C: ${question.option_c}
D: ${question.option_d}
E: ${question.option_e}

**Correct Answer:** ${question.correct_answer}
**Student Selected:** ${userAnswer}

Please provide:
1. A brief explanation (2-3 sentences) of why option ${question.correct_answer} is correct, citing relevant legal principles, statutes, or case law.
2. A specific explanation (2-3 sentences) of why option ${userAnswer} is incorrect and what misconception it represents.

Format your response as JSON:
{
  "why_correct": "explanation here",
  "why_wrong": "explanation here"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            why_correct: { type: "string" },
            why_wrong: { type: "string" }
          }
        }
      });

      return response;
    } catch (error) {
      console.error("Failed to generate feedback:", error);
      return {
        why_correct: question.explanation || "See the provided explanation.",
        why_wrong: "This answer does not align with the correct legal principle or application in this scenario."
      };
    }
  };

  const handleFinish = async () => {
    setIsFinished(true);
    setGeneratingFeedback(true);
    
    let score = 0;
    const incorrectQuestions = [];
    
    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer && answer.correct) {
        score++;
      } else if (answer && !answer.correct) {
        incorrectQuestions.push({ question: q, userAnswer: answer.selected });
      }
    });

    try {
      await base44.entities.ExamAttempt.create({
        mock_exam_id: mockExam.id,
        mock_exam_title: mockExam.title,
        answers: Object.fromEntries(Object.entries(answers).map(([qId, ans]) => [qId, ans.selected])),
        score,
        total_questions: questions.length,
        time_taken_minutes: timeRemaining !== null && mockExam?.time_limit_minutes ? Math.round((mockExam.time_limit_minutes * 60 - timeRemaining) / 60) : 0,
        completed: true,
        question_ids: questions.map(q => q.id),
        flagged_question_ids: Array.from(flaggedQuestions)
      });

      const rewards = await processSessionRewards(user, score, questions.length, true);
      setGamificationRewards(rewards);

      // Generate detailed feedback for incorrect answers
      const feedbackPromises = incorrectQuestions.slice(0, 10).map(async ({ question, userAnswer }) => {
        const feedback = await generateDetailedFeedback(question, userAnswer);
        return { questionId: question.id, feedback };
      });

      const feedbackResults = await Promise.all(feedbackPromises);
      const feedbackMap = {};
      feedbackResults.forEach(({ questionId, feedback }) => {
        feedbackMap[questionId] = feedback;
      });
      
      setDetailedFeedback(feedbackMap);
    } catch (error) {
      console.error("Failed to save attempt or generate feedback:", error);
    }
    
    setGeneratingFeedback(false);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!mockExam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Exam Not Found</h2>
          <p className="text-slate-600 mb-6">Unable to load this exam or it contains no questions.</p>
          <Button onClick={() => router.push(createPageUrl('MockExams'))}>
            Back to Mock Exams
          </Button>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    const score = Object.values(answers).filter(a => a.correct).length;
    const percentage = (score / questions.length * 100).toFixed(1);
    
    // Analyze performance by subject
    const subjectPerformance = {};
    questions.forEach(q => {
      if (!subjectPerformance[q.subject]) {
        subjectPerformance[q.subject] = { correct: 0, total: 0, questions: [] };
      }
      subjectPerformance[q.subject].total++;
      subjectPerformance[q.subject].questions.push(q);
      if (answers[q.id]?.correct) {
        subjectPerformance[q.subject].correct++;
      }
    });

    const weakSubjects = Object.entries(subjectPerformance)
      .filter(([, stats]) => (stats.correct / stats.total) < 0.6)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));

    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <Watermark user={user} />
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-none shadow-2xl">
              <CardHeader className="bg-linear-to-r from-slate-900 to-slate-700 text-white p-8">
                <CardTitle className="text-3xl font-bold text-center">
                  {mockExam.title} - Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <ScoreVisualization score={score} total={questions.length} showDetails={true} />

                {generatingFeedback && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                    <AlertDescription className="text-blue-800">
                      Generating personalized feedback for your answers...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Weak Areas Analysis */}
                {weakSubjects.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-500" />
                      Areas for Improvement
                    </h3>
                    <div className="space-y-3">
                      {weakSubjects.map(([subject, stats]) => (
                        <div key={subject} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <span className="font-semibold text-slate-900 block mb-1">{subject}</span>
                              <p className="text-sm text-slate-600">
                                {stats.correct}/{stats.total} correct ({((stats.correct / stats.total) * 100).toFixed(0)}%)
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={createPageUrl('BlackLetterLawPractice') + `?subject=${encodeURIComponent(subject)}`}>
                                <Button size="sm" variant="outline" className="text-xs">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  BLL Practice
                                </Button>
                              </Link>
                              <Link href={createPageUrl('QuestionBank') + `?startSession=true&subject=${encodeURIComponent(subject)}&numQuestions=20&difficulty=All&feedbackMode=instant`}>
                                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs">
                                  <Target className="w-3 h-3 mr-1" />
                                  Practice Now
                                </Button>
                              </Link>
                            </div>
                          </div>
                          <Progress value={(stats.correct / stats.total) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Question Review */}
                <Tabs defaultValue="incorrect" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="incorrect">
                      Incorrect Answers ({questions.length - score})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                      All Questions ({questions.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="incorrect" className="mt-6">
                    <Accordion type="single" collapsible className="w-full">
                      {questions.filter(q => !answers[q.id]?.correct).map((q, idx) => {
                        const userAnswer = answers[q.id];
                        const feedback = detailedFeedback[q.id];
                        const wasFlagged = flaggedQuestions.has(q.id);

                        return (
                          <AccordionItem key={q.id} value={`incorrect-${idx}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 w-full">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span className="text-left flex-1">{q.subject}</span>
                                {wasFlagged && (
                                  <Badge variant="outline" className="mr-2">
                                    <Flag className="w-3 h-3 mr-1" />
                                    Flagged
                                  </Badge>
                                )}
                                <Badge className="bg-red-600">Incorrect</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="p-4 space-y-4">
                                <p className="font-medium text-slate-900">{q.question_text}</p>
                                
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
                                          {isUserChoice && !isCorrectAnswer && (
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

                                {/* AI-Generated Detailed Feedback */}
                                {feedback ? (
                                  <div className="space-y-3">
                                    <Alert className="bg-green-50 border-green-200">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      <AlertDescription>
                                        <strong className="text-green-900">Why {q.correct_answer} is correct:</strong>
                                        <p className="text-green-800 mt-1">{feedback.why_correct}</p>
                                      </AlertDescription>
                                    </Alert>
                                    
                                    <Alert className="bg-red-50 border-red-200">
                                      <XCircle className="h-4 w-4 text-red-600" />
                                      <AlertDescription>
                                        <strong className="text-red-900">Why your answer ({userAnswer?.selected}) was incorrect:</strong>
                                        <p className="text-red-800 mt-1">{feedback.why_wrong}</p>
                                      </AlertDescription>
                                    </Alert>
                                  </div>
                                ) : q.explanation && (
                                  <Alert>
                                    <AlertDescription className="text-sm">
                                      <strong>Explanation:</strong> {q.explanation}
                                    </AlertDescription>
                                  </Alert>
                                )}

                                {/* Links to further study */}
                                <div className="flex gap-2 pt-2">
                                  <Link href={createPageUrl('BlackLetterLawPractice') + `?subject=${encodeURIComponent(q.subject)}`}>
                                    <Button size="sm" variant="outline">
                                      <BookOpen className="w-3 h-3 mr-1" />
                                      Study {q.subject}
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </TabsContent>

                  <TabsContent value="all" className="mt-6">
                    <Accordion type="single" collapsible className="w-full">
                      {questions.map((q, idx) => {
                        const userAnswer = answers[q.id];
                        const isCorrect = userAnswer?.correct;
                        const wasFlagged = flaggedQuestions.has(q.id);

                        return (
                          <AccordionItem key={q.id} value={`all-${idx}`}>
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
                                    } else if (isUserChoice && !isCorrectAnswer) { // Only mark user choice red if it's incorrect
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
                                          {isUserChoice && !isCorrectAnswer && (
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
                  </TabsContent>
                </Tabs>

                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push(createPageUrl('MockExams'))}
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Mock Exams
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
  const hasAnswered = answers[currentQuestion?.id] !== undefined;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const isFlagged = flaggedQuestions.has(currentQuestion?.id);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <Watermark user={user} />
      <div className="max-w-4xl mx-auto">
        {/* Header with timer and progress */}
        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{mockExam.title}</h2>
                <p className="text-slate-600">
                  Question {currentIndex + 1} of {questions.length}
                </p>
              </div>
              
              {timeRemaining !== null && (
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
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                    const isCurrentSelection = selectedAnswer === opt;
                    const isPreviouslyAnswered = answers[currentQuestion.id]?.selected === opt;
                    
                    let className = "p-4 rounded-lg border-2 cursor-pointer transition-all ";
                    if (isPreviouslyAnswered || isCurrentSelection) {
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
                            (isCurrentSelection || isPreviouslyAnswered) ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
                          }`}>
                            {(isCurrentSelection || isPreviouslyAnswered) && (
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
                  
                  {/* Show Confirm Answer if not answered AND an option is selected */}
                  {!hasAnswered && selectedAnswer !== null ? (
                    <Button
                      onClick={handleConfirmAnswer}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Confirm Answer
                    </Button>
                  ) : (
                    // Show Next Question or Finish Exam if answered or no selection made
                    currentIndex < questions.length - 1 ? (
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
                    )
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