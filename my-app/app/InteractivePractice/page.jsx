"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Loader2,
  Brain,
  Zap,
  Flag,
  ArrowRight,
  ArrowLeft,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

export default function InteractivePractice() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState([]);
  
  // Quiz setup
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('hard'); // Hardcoded to 'hard'
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(18); // minutes
  const [isTimed, setIsTimed] = useState(true);
  
  // Quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({});
  
  // Results
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [weakAreas, setWeakAreas] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (quizActive && isTimed && timeRemaining !== null && timeRemaining > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleFinishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizActive, isTimed, timeRemaining, isPaused]);

  useEffect(() => {
    if (quizActive && questionStartTime) {
      const timer = setInterval(() => {
        // Update time spent on current question
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizActive, questionStartTime]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const questions = await base44.entities.PracticeQuestion.list();
      // FILTER TO HARD ONLY
      const hardQuestions = questions.filter(q => q.difficulty === 'hard');
      setAllQuestions(hardQuestions);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const startQuiz = () => {
    let filteredQuestions = [...allQuestions];
    
    if (selectedSubject !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.subject === selectedSubject);
    }
    
    // No difficulty filter needed here, as allQuestions are already filtered to 'hard'
    
    // Shuffle and select
    const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    
    setQuizQuestions(selected);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSelectedAnswer(null);
    setShowExplanation(false);
    setFlaggedQuestions(new Set());
    setQuestionTimes({});
    setQuestionStartTime(Date.now());
    
    if (isTimed) {
      setTimeRemaining(timeLimit * 60);
    }
    
    setQuizActive(true);
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (answer) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const handleConfirmAnswer = () => {
    if (!selectedAnswer) return;
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer
    }));
    
    setQuestionTimes(prev => ({
      ...prev,
      [currentQuestion.id]: timeTaken
    }));
    
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    } else {
      handleFinishQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = quizQuestions[currentQuestionIndex - 1];
      setSelectedAnswer(userAnswers[prevQuestion.id] || null);
      setShowExplanation(!!userAnswers[prevQuestion.id]);
    }
  };

  const toggleFlag = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
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

  const handleFinishQuiz = async () => {
    let score = 0;
    const tagPerformance = {};
    const correctAnswers = {};
    
    quizQuestions.forEach(q => {
      const userAnswer = userAnswers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      correctAnswers[q.id] = q.correct_answer;
      
      if (isCorrect) {
        score++;
      }
      
      // Track performance by tags
      if (q.tags && q.tags.length > 0) {
        q.tags.forEach(tag => {
          if (!tagPerformance[tag]) {
            tagPerformance[tag] = { correct: 0, total: 0 };
          }
          tagPerformance[tag].total++;
          if (isCorrect) {
            tagPerformance[tag].correct++;
          }
        });
      }
    });
    
    // Identify weak areas (< 60% on tags with at least 2 questions)
    const identifiedWeakAreas = Object.entries(tagPerformance)
      .filter(([tag, stats]) => stats.total >= 2 && (stats.correct / stats.total) < 0.6)
      .map(([tag]) => tag);
    
    const percentage = (score / quizQuestions.length * 100).toFixed(1);
    const totalTimeTaken = Object.values(questionTimes).reduce((sum, time) => sum + time, 0);
    
    const results = {
      score,
      totalQuestions: quizQuestions.length,
      percentage,
      timeTaken: totalTimeTaken,
      weakAreas: identifiedWeakAreas
    };
    
    setQuizResults(results);
    setWeakAreas(identifiedWeakAreas);
    setQuizCompleted(true);
    setQuizActive(false);
    
    // Save to database
    try {
      await base44.entities.UserQuizResult.create({
        quiz_title: `${selectedSubject === 'all' ? 'Mixed' : selectedSubject} - HARD - ${questionCount}Q`,
        subject: selectedSubject === 'all' ? 'Mixed' : selectedSubject,
        difficulty: 'hard', // Always 'hard' for this component
        question_ids: quizQuestions.map(q => q.id),
        user_answers: userAnswers,
        correct_answers: correctAnswers,
        score,
        total_questions: quizQuestions.length,
        percentage: parseFloat(percentage),
        time_taken_seconds: totalTimeTaken,
        time_limit_seconds: isTimed ? timeLimit * 60 : null,
        timed: isTimed,
        question_times: questionTimes,
        weak_areas_identified: identifiedWeakAreas
      });
    } catch (error) {
      console.error('Failed to save quiz results:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (quizCompleted && quizResults) {
    const passedQuiz = parseFloat(quizResults.percentage) >= 60;
    
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-none shadow-2xl">
              <CardHeader className={`p-8 ${passedQuiz ? 'bg-linear-to-r from-green-600 to-emerald-600' : 'bg-linear-to-r from-slate-700 to-slate-800'} text-white`}>
                <CardTitle className="text-3xl font-bold text-center">
                  Quiz Complete! {passedQuiz ? '🎉' : '📚'}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-8 space-y-8">
                {/* Score Summary */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-slate-900 mb-2">
                    {quizResults.percentage}%
                  </div>
                  <p className="text-xl text-slate-600">
                    {quizResults.score} / {quizResults.totalQuestions} correct
                  </p>
                  {passedQuiz ? (
                    <Badge className="mt-4 bg-green-600 text-white text-lg px-6 py-2">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Passed (60%+)
                    </Badge>
                  ) : (
                    <Badge className="mt-4 bg-amber-600 text-white text-lg px-6 py-2">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Keep Practicing
                    </Badge>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-blue-50">
                    <CardContent className="p-6 text-center">
                      <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-900">
                        {formatTime(quizResults.timeTaken)}
                      </div>
                      <p className="text-sm text-blue-700">Time Taken</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50">
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900">
                        {quizResults.score}
                      </div>
                      <p className="text-sm text-green-700">Correct</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50">
                    <CardContent className="p-6 text-center">
                      <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-900">
                        {quizResults.totalQuestions - quizResults.score}
                      </div>
                      <p className="text-sm text-red-700">Incorrect</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Weak Areas */}
                {weakAreas.length > 0 && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <Target className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                      <strong className="text-amber-900">Areas for Improvement:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {weakAreas.map((area, idx) => (
                          <Badge key={idx} variant="outline" className="border-amber-400 text-amber-900">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Review Questions */}
                <Tabs defaultValue="incorrect" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="incorrect">
                      Incorrect ({quizResults.totalQuestions - quizResults.score})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                      All Questions ({quizResults.totalQuestions})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="incorrect" className="mt-6">
                    <Accordion type="single" collapsible className="w-full">
                      {quizQuestions.filter(q => userAnswers[q.id] !== q.correct_answer).map((q, idx) => (
                        <AccordionItem key={q.id} value={q.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 w-full text-left">
                              <XCircle className="w-5 h-5 text-redshrink-0" />
                              <span className="flex-1">{q.question_text.substring(0, 80)}...</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="p-4 space-y-4">
                              <p className="font-medium text-slate-900">{q.question_text}</p>
                              
                              <div className="space-y-2">
                                {['A', 'B', 'C', 'D', 'E'].map(opt => {
                                  const isUserAnswer = userAnswers[q.id] === opt;
                                  const isCorrect = q.correct_answer === opt;
                                  
                                  return (
                                    <div
                                      key={opt}
                                      className={`p-3 rounded-lg border-2 ${
                                        isCorrect ? 'bg-green-50 border-green-500' :
                                        isUserAnswer ? 'bg-red-50 border-red-500' :
                                        'bg-slate-50 border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />}
                                        {isUserAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                                        <div className="flex-1">
                                          <span className="font-bold">{opt}.</span> {q[`option_${opt.toLowerCase()}`]}
                                          <p className="text-sm mt-2 text-slate-700">
                                            <strong>Explanation:</strong> {q[`explanation_${opt.toLowerCase()}`]}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {q.general_explanation && (
                                <Alert>
                                  <Brain className="h-4 w-4" />
                                  <AlertDescription>
                                    <strong>Key Concept:</strong> {q.general_explanation}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>
                  
                  <TabsContent value="all" className="mt-6">
                    <Accordion type="single" collapsible className="w-full">
                      {quizQuestions.map((q, idx) => {
                        const isCorrect = userAnswers[q.id] === q.correct_answer;
                        
                        return (
                          <AccordionItem key={q.id} value={q.id}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 w-full text-left">
                                {isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                )}
                                <span className="flex-1">Q{idx + 1}: {q.question_text.substring(0, 80)}...</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="p-4 space-y-4">
                                <p className="font-medium text-slate-900">{q.question_text}</p>
                                
                                <div className="space-y-2">
                                  {['A', 'B', 'C', 'D', 'E'].map(opt => {
                                    const isUserAnswer = userAnswers[q.id] === opt;
                                    const isCorrectOpt = q.correct_answer === opt;
                                    
                                    return (
                                      <div
                                        key={opt}
                                        className={`p-3 rounded-lg border-2 ${
                                          isCorrectOpt ? 'bg-green-50 border-green-500' :
                                          isUserAnswer ? 'bg-red-50 border-red-500' :
                                          'bg-slate-50 border-slate-200'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2">
                                          {isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />}
                                          {isUserAnswer && !isCorrectOpt && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                                          <div className="flex-1">
                                            <span className="font-bold">{opt}.</span> {q[`option_${opt.toLowerCase()}`]}
                                            <p className="text-sm mt-2 text-slate-700">
                                              <strong>Explanation:</strong> {q[`explanation_${opt.toLowerCase()}`]}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {q.general_explanation && (
                                  <Alert>
                                    <Brain className="h-4 w-4" />
                                    <AlertDescription>
                                      <strong>Key Concept:</strong> {q.general_explanation}
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

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setQuizCompleted(false);
                      setQuizActive(false);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    New Quiz
                  </Button>
                  <Button asChild className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Link href={createPageUrl('PerformanceDashboard')}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View All Results
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (quizActive && quizQuestions.length > 0) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
    const answeredCount = Object.keys(userAnswers).length;
    const isFlagged = flaggedQuestions.has(currentQuestion.id);

    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Timer & Progress Header */}
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Quiz in Progress</h2>
                  <p className="text-slate-600">
                    Question {currentQuestionIndex + 1} of {quizQuestions.length}
                  </p>
                </div>
                
                {isTimed && timeRemaining !== null && (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPaused(!isPaused)}
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      timeRemaining < 60 ? 'bg-red-100' : 'bg-slate-100'
                    }`}>
                      <Clock className={`w-5 h-5 ${timeRemaining < 60 ? 'text-red-600' : 'text-slate-700'}`} />
                      <span className={`text-xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-slate-900'}`}>
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Progress value={progress} className="h-2" />
              
              <div className="flex gap-2 mt-4 text-sm text-slate-600">
                <span>Answered: {answeredCount}/{quizQuestions.length}</span>
                <span>•</span>
                <span>Flagged: {flaggedQuestions.size}</span>
              </div>
            </CardContent>
          </Card>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-none shadow-xl">
                <CardHeader className="border-b bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-3">{currentQuestion.question_text}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{currentQuestion.subject}</Badge>
                        <Badge variant="outline" className="capitalize">{currentQuestion.difficulty}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFlag}
                      className={isFlagged ? "border-amber-500 bg-amber-50" : ""}
                    >
                      <Flag className={`w-4 h-4 ${isFlagged ? "text-amber-600 fill-amber-600" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                      const isSelected = selectedAnswer === opt;
                      const isAnswered = userAnswers[currentQuestion.id] === opt;
                      
                      return (
                        <div
                          key={opt}
                          onClick={() => handleAnswerSelect(opt)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected || isAnswered ? 'bg-slate-100 border-slate-900' :
                            'bg-white border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected || isAnswered ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
                            }`}>
                              {(isSelected || isAnswered) && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-bold mr-2">{opt}.</span>
                              <span>{currentQuestion[`option_${opt.toLowerCase()}`]}</span>
                              
                              {showExplanation && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-3 p-3 bg-white rounded-lg border border-slate-200"
                                >
                                  <p className="text-sm text-slate-700">
                                    <strong>Explanation:</strong> {currentQuestion[`explanation_${opt.toLowerCase()}`]}
                                  </p>
                                </motion.div>
                              )}
                            </div>
                            
                            {showExplanation && currentQuestion.correct_answer === opt && (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            )}
                            {showExplanation && userAnswers[currentQuestion.id] === opt && currentQuestion.correct_answer !== opt && (
                              <XCircle className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {showExplanation && currentQuestion.general_explanation && (
                    <Alert className="mt-6">
                      <Brain className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Key Concept:</strong> {currentQuestion.general_explanation}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      variant="outline"
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    
                    {!showExplanation ? (
                      <Button
                        onClick={handleConfirmAnswer}
                        disabled={!selectedAnswer}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Confirm Answer
                      </Button>
                    ) : (
                      currentQuestionIndex < quizQuestions.length - 1 ? (
                        <Button
                          onClick={handleNextQuestion}
                          className="flex-1 bg-slate-900 hover:bg-slate-800"
                        >
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleFinishQuiz}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Finish Quiz
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
                {quizQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  const isFlagged = flaggedQuestions.has(q.id);

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setSelectedAnswer(userAnswers[q.id] || null);
                        setShowExplanation(!!userAnswers[q.id]);
                      }}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all ${
                        isCurrent ? 'border-slate-900 bg-slate-900 text-white' :
                        isAnswered ? 'border-green-500 bg-green-50 text-green-900' :
                        isFlagged ? 'border-amber-500 bg-amber-50 text-amber-900' :
                        'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                      }`}
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

  // Quiz Setup Screen
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
            <Brain className="w-10 h-10 text-purple-600" />
            Hard Interactive Practice Quiz
          </h1>
          <p className="text-slate-600 text-lg">
            Timed HARD quizzes with detailed explanations
          </p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader className="border-b bg-linear-to-r from-purple-600 to-indigo-600 text-white">
            <CardTitle className="text-2xl">Configure Your Hard Quiz</CardTitle>
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Subject
                </label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    <SelectItem value="all">All Subjects (Mixed)</SelectItem>
                    {ALL_SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Removed Difficulty Select as this component is now exclusively for hard questions */}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Number of Questions: {questionCount}
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5</span>
                  <span>30</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Time Limit: {timeLimit} minutes
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  disabled={!isTimed}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5 min</span>
                  <span>60 min</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="timed"
                checked={isTimed}
                onChange={(e) => setIsTimed(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="timed" className="text-sm font-medium text-slate-900">
                Enable time limit (recommended for exam practice)
              </label>
            </div>

            <Alert className="bg-red-50 border-red-200">
              <Zap className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>HARD Questions Only:</strong> All questions are challenging to prepare you for real exam conditions. 
                Includes detailed explanations for each option.
              </AlertDescription>
            </Alert>

            <Button
              onClick={startQuiz}
              disabled={allQuestions.length === 0}
              className="w-full h-14 text-lg bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Hard Quiz
            </Button>

            {allQuestions.length === 0 && (
              <p className="text-center text-amber-600 text-sm">
                No hard practice questions available yet. Check back soon!
              </p>
            )}
          </CardContent>
        </Card>

        {user && (
          <Card className="mt-8 border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Your Quiz History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={createPageUrl('PerformanceDashboard')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Performance Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
