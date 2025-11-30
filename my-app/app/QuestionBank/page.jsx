"use client";
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from '@/api/base44Client';
import _ from 'lodash';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Percent, Play, Loader2, Info, AlertCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createPageUrl } from "@/utils";
import Link from 'next/link';
import { useSearchParams,useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScoreVisualization from '@/components/ScoreVisualization';
import Watermark from '@/components/Watermark';
import ImprovementSuggestions from '@/components/ImprovementSuggestions';
import { processSessionRewards } from '@/components/GamificationHelper';
import GamificationToast from '@/components/GamificationToast';
import { Alert, AlertDescription } from "@/components/ui/alert";

// CANONICAL SUBJECT LIST - matches Question entity exactly
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

export default function QuestionBank() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inSession, setInSession] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [filterSubject, setFilterSubject] = useState("All");
  // The filterDifficulty state is removed as all questions are now hard-coded
  const [filterTags, setFilterTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [sessionConfig, setSessionConfig] = useState({
    numQuestions: 30,
    subject: "All",
    difficulty: "Hard", // Fixed to Hard
    feedbackMode: "instant"
  });
  const [userAnswerLogs, setUserAnswerLogs] = useState([]);
  const [completedSession, setCompletedSession] = useState(false);
  const [gamificationRewards, setGamificationRewards] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allQuestions = await base44.entities.Question.list();
      
      // FILTER TO HARD ONLY
      let hardQuestions = allQuestions.filter(q => q.difficulty === 'Hard');
      
      let availableQuestions = hardQuestions;
      if (currentUser.role !== 'admin') {
        const tier = currentUser.subscription_tier || 'starter';
        // Equal distribution per subject: 31 starter, 63 pro, unlimited ultimate
        const perSubject = { starter: 31, pro: 63, ultimate: Infinity };
        const questionsPerSubject = perSubject[tier] || 31;
        
        if (questionsPerSubject !== Infinity) {
          // Group by subject and take equal amounts from each
          const bySubject = _.groupBy(hardQuestions, 'subject');
          availableQuestions = [];
          
          ALL_SUBJECTS.forEach(subject => {
            const subjectQuestions = bySubject[subject] || [];
            const toTake = Math.min(questionsPerSubject, subjectQuestions.length);
            availableQuestions.push(...subjectQuestions.slice(0, toTake));
          });
        }
      }
      
      setQuestions(availableQuestions);

      const tagsSet = new Set();
      availableQuestions.forEach(q => {
        if (q.tags && Array.isArray(q.tags)) {
          q.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAvailableTags(Array.from(tagsSet).sort());

      const logs = await base44.entities.UserAnswerLog.filter({ created_by: currentUser.email });
      setUserAnswerLogs(logs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get('startSession') === 'true') {
      const config = {
        numQuestions: parseInt(params.get('numQuestions')) || 30,
        subject: params.get('subject') || 'All',
        difficulty: 'Hard', // Force difficulty to Hard from URL params
        feedbackMode: params.get('feedbackMode') || 'instant'
      };
      setSessionConfig(config);
      setTimeout(() => startSession(config), 500);
    }
  }, [searchParams, questions]);

  const startSession = (config = sessionConfig) => {
    let pool = [...questions]; // 'questions' array already contains only 'Hard' questions
    if (config.subject !== "All") {
      pool = pool.filter(q => q.subject === config.subject);
    }
    // No need to filter by difficulty here, as 'questions' already filtered
    const shuffled = _.shuffle(pool);
    const selected = shuffled.slice(0, Math.min(config.numQuestions, shuffled.length));
    setSessionQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setShowFeedback(false);
    setSessionScore(0);
    setInSession(true);
    setCompletedSession(false);
    setGamificationRewards(null); // Clear previous rewards
  };

  const handleAnswerSelect = (optionIndex) => {
    if (showFeedback) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;
    const currentQuestion = sessionQuestions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer_index;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { selected: selectedAnswer, correct: isCorrect }
    }));

    if (isCorrect) {
      setSessionScore(prev => prev + 1);
    }

    try {
      // Only send fields that exist in the UserAnswerLog entity schema
      await base44.entities.UserAnswerLog.create({
        question_id: currentQuestion.id,
        was_correct: isCorrect
      });
    } catch (e) {
      console.error("Failed to log answer:", e);
    }

    if (sessionConfig.feedbackMode === "instant") {
      setShowFeedback(true);
    } else {
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    setCompletedSession(true);
    
    // Calculate score
    let finalScore = 0;
    sessionQuestions.forEach(q => {
      const answer = answers[q.id];
      if (answer && answer.correct) {
        finalScore++;
      }
    });
    
    // Award gamification points
    try {
      const rewards = await processSessionRewards(user, finalScore, sessionQuestions.length, false);
      setGamificationRewards(rewards);
    } catch (e) {
      console.error("Failed to process rewards:", e);
    }
  };

  const handleEndSession = () => {
    setInSession(false);
    setCompletedSession(false);
    router.push(createPageUrl('QuestionBank'));
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" />
      </div>
    );
  }

  const hasAccess = user?.role === 'admin' || user?.subscription_tier;
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Subscription Required</h1>
          <p className="text-slate-600 mb-6">Access the Question Bank with any subscription plan.</p>
          <Link href={createPageUrl("Packages")}>
            <Button className="bg-amber-400 hover:bg-amber-500 text-slate-900">View Plans</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (completedSession) {
    const scorePercentage = sessionQuestions.length > 0 ? (sessionScore / sessionQuestions.length * 100) : 0;
    
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <Watermark />
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-linear-to-r from-slate-900 to-slate-700 text-white p-8">
                <CardTitle className="text-3xl font-bold text-center">Session Complete! 🎉</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <ScoreVisualization 
                  score={sessionScore} 
                  total={sessionQuestions.length}
                  showDetails={true}
                />
                
                <ImprovementSuggestions 
                  answers={answers}
                  questions={sessionQuestions}
                />

                <div className="mt-8 space-y-4">
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="review">Review Answers</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-6 text-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-green-900">{sessionScore}</p>
                            <p className="text-sm text-green-700">Correct</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-6 text-center">
                            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-red-900">{sessionQuestions.length - sessionScore}</p>
                            <p className="text-sm text-red-700">Incorrect</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-6 text-center">
                            <Percent className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-blue-900">{scorePercentage.toFixed(0)}%</p>
                            <p className="text-sm text-blue-700">Score</p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="review">
                      <Accordion type="single" collapsible className="w-full">
                        {sessionQuestions.map((q, idx) => {
                          const userAnswer = answers[q.id];
                          const isCorrect = userAnswer?.correct;
                          
                          return (
                            <AccordionItem key={idx} value={`question-${idx}`}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3 w-full">
                                  {isCorrect ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                  )}
                                  <span className="text-left">Question {idx + 1}</span>
                                  <Badge className="ml-auto">{q.subject}</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="p-4 space-y-4">
                                  <p className="font-medium text-slate-900">{q.question_text}</p>
                                  <div className="space-y-2">
                                    {q.options.map((opt, optIdx) => {
                                      const isUserAnswer = userAnswer?.selected === optIdx;
                                      const isCorrectAnswer = optIdx === q.correct_answer_index;
                                      
                                      let className = "p-3 rounded-lg border ";
                                      if (isCorrectAnswer) {
                                        className += "bg-green-50 border-green-300";
                                      } else if (isUserAnswer && !isCorrect) {
                                        className += "bg-red-50 border-red-300";
                                      } else {
                                        className += "bg-slate-50 border-slate-200";
                                      }
                                      
                                      return (
                                        <div key={optIdx} className={className}>
                                          <div className="flex items-start gap-2">
                                            {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />}
                                            {isUserAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                                            <span>{opt}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {q.explanation && (
                                    <Alert>
                                      <Info className="h-4 w-4" />
                                      <AlertDescription>{q.explanation}</AlertDescription>
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
                </div>

                <div className="mt-8 flex gap-4">
                  <Button onClick={handleEndSession} variant="outline" className="flex-1">
                    Back to Question Bank
                  </Button>
                  <Button onClick={() => startSession(sessionConfig)} className="flex-1 bg-slate-900 hover:bg-slate-800">
                    <Play className="w-4 h-4 mr-2" />
                    Start New Session
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

  if (inSession && sessionQuestions.length > 0) {
    const currentQuestion = sessionQuestions[currentIndex];
    const progress = ((currentIndex + 1) / sessionQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <Watermark />
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">
                Question {currentIndex + 1} of {sessionQuestions.length}
              </span>
              <span className="text-sm font-medium text-slate-600">
                Score: {sessionScore}/{currentIndex + (showFeedback ? 1 : 0)}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-xl">
                <CardHeader className="border-b bg-slate-50">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold">{currentQuestion.question_text}</CardTitle>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Badge variant="outline">{currentQuestion.subject}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === currentQuestion.correct_answer_index;
                      const showCorrect = showFeedback && isCorrect;
                      const showIncorrect = showFeedback && isSelected && !isCorrect;

                      let className = "p-4 rounded-lg border-2 cursor-pointer transition-all ";
                      if (showCorrect) {
                        className += "bg-green-50 border-green-500";
                      } else if (showIncorrect) {
                        className += "bg-red-50 border-red-500";
                      } else if (isSelected) {
                        className += "bg-slate-100 border-slate-900";
                      } else {
                        className += "bg-white border-slate-200 hover:border-slate-400";
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => handleAnswerSelect(idx)}
                          className={className}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="flex-1">{option}</span>
                            {showCorrect && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                            {showIncorrect && <XCircle className="w-6 h-6 text-red-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {showFeedback && currentQuestion.explanation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="mt-2">{currentQuestion.explanation}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <div className="mt-6 flex gap-3">
                    {!showFeedback ? (
                      <Button 
                        onClick={handleSubmitAnswer}
                        disabled={selectedAnswer === null}
                        className="flex-1 bg-slate-900 hover:bg-slate-800"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNext}
                        className="flex-1 bg-slate-900 hover:bg-slate-800"
                      >
                        {currentIndex < sessionQuestions.length - 1 ? 'Next Question' : 'Finish Session'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Enhanced filtering logic, adjusted for only 'Hard' questions
  const filteredQuestions = questions.filter(q => {
    const matchSubject = filterSubject === "All" || q.subject === filterSubject;
    // Removed difficulty filter as all loaded questions are already 'Hard'
    const matchTags = filterTags.length === 0 || (q.tags && filterTags.every(tag => q.tags.includes(tag)));
    return matchSubject && matchTags;
  });

  // Function to start session from current filters
  const startSessionFromFilters = () => {
    const config = {
      numQuestions: Math.min(30, filteredQuestions.length),
      subject: filterSubject,
      difficulty: "Hard", // Fixed to Hard
      feedbackMode: "instant"
    };
    
    // `filteredQuestions` already respects subject and tags, and all are hard.
    let pool = [...filteredQuestions];
    const shuffled = _.shuffle(pool);
    const selected = shuffled.slice(0, config.numQuestions);
    
    setSessionQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setShowFeedback(false);
    setSessionScore(0);
    setInSession(true);
    setCompletedSession(false);
  };


  const questionsBySubject = _.groupBy(filteredQuestions, 'subject');

  return (
    <div className="p-6 md:p-10">
      <Watermark />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Question Bank</h1>
          <p className="text-slate-600">Practice with {questions.length} challenging SQE questions</p>
          {user?.role !== 'admin' && (
            <p className="text-sm text-slate-500 mt-2">
              Your {user?.subscription_tier || 'starter'} plan: Up to {
                user?.subscription_tier === 'ultimate' ? 'unlimited' : 
                user?.subscription_tier === 'pro' ? '63 questions per subject (1,008 total)' : 
                '31 questions per subject (496 total)'
              }
            </p>
          )}
        </div>

        <Card className="border-none shadow-lg mb-8">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3">
              <Play className="w-6 h-6" />
              Start Practice Session
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-2 block">Number of Questions</Label>
                <Input
                  type="number"
                  value={sessionConfig.numQuestions}
                  onChange={(e) => setSessionConfig(prev => ({ ...prev, numQuestions: parseInt(e.target.value) || 30 }))}
                  min="1"
                  max="200"
                />
              </div>
              <div>
                <Label className="mb-2 block">Subject</Label>
                <Select
                  value={sessionConfig.subject}
                  onValueChange={(val) => setSessionConfig(prev => ({ ...prev, subject: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    <SelectItem value="All">All Subjects</SelectItem>
                    {ALL_SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Difficulty filter UI removed as all questions are hard */}
              <div>
                <Label className="mb-2 block">Feedback Mode</Label>
                <Select
                  value={sessionConfig.feedbackMode}
                  onValueChange={(val) => setSessionConfig(prev => ({ ...prev, feedbackMode: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant Feedback</SelectItem>
                    <SelectItem value="end">Feedback at End</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={() => startSession({ ...sessionConfig, difficulty: "Hard" })} // Ensure difficulty is always hard
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 h-12"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Practice Session
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle>Browse & Filter Questions</CardTitle>
              {filteredQuestions.length > 0 && (
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="grid md:grid-cols-2 gap-4"> {/* Adjusted to 2 columns */}
                <div>
                  <Label className="mb-2 block text-sm font-semibold">Subject Filter</Label>
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-96">
                      <SelectItem value="All">All Subjects</SelectItem>
                      {ALL_SUBJECTS.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Difficulty Filter UI removed */}

                <div>
                  <Label className="mb-2 block text-sm font-semibold">
                    Tags Filter ({filterTags.length} selected)
                  </Label>
                  <Select 
                    value={filterTags.length > 0 ? filterTags[filterTags.length - 1] : "none"}
                    onValueChange={(val) => {
                      if (val === "none") {
                        // Do nothing
                      } else if (!filterTags.includes(val)) {
                        setFilterTags([...filterTags, val]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tags..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-96">
                      <SelectItem value="none">No tag filter</SelectItem>
                      {availableTags.map(tag => (
                        <SelectItem key={tag} value={tag} disabled={filterTags.includes(tag)}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected tags display */}
              {filterTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-slate-600 font-medium">Active tags:</span>
                  {filterTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => setFilterTags(filterTags.filter(t => t !== tag))}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterTags([])}
                    className="h-6 text-xs text-slate-500 hover:text-slate-900"
                  >
                    Clear all tags
                  </Button>
                </div>
              )}

              {/* Create Practice Session from Filters button */}
              {filteredQuestions.length > 0 && (filterSubject !== "All" || filterTags.length > 0) && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <span className="text-blue-800">
                      <strong>{filteredQuestions.length}</strong> questions match your filters
                    </span>
                    <Button 
                      onClick={startSessionFromFilters}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Practice These Questions
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No questions match your current filters.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterSubject("All");
                    setFilterTags([]);
                  }}
                  className="mt-4"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {Object.keys(questionsBySubject).sort().map((subject) => {
                  const subjectQuestions = questionsBySubject[subject];
                  return (
                    <AccordionItem key={subject} value={subject}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex justify-between items-center w-full pr-4">
                          <span className="font-semibold">{subject}</span>
                          <Badge variant="outline">{subjectQuestions.length} questions</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {subjectQuestions.map((q) => (
                            <Card key={q.id} className="border-slate-200">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                <p className="font-medium text-slate-900 flex-1">{q.question_text}</p>
                                </div>
                                
                                {/* Display tags */}
                                {q.tags && q.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {q.tags.map(tag => (
                                      <Badge 
                                        key={tag} 
                                        variant="outline" 
                                        className="text-xs cursor-pointer hover:bg-blue-50"
                                        onClick={() => {
                                          if (!filterTags.includes(tag)) {
                                            setFilterTags([...filterTags, tag]);
                                          }
                                        }}
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                <Accordion type="single" collapsible>
                                  <AccordionItem value="details" className="border-none">
                                    <AccordionTrigger className="text-sm text-slate-600 hover:no-underline py-2">
                                      View Options & Answer
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="space-y-2 mt-2">
                                        {q.options.map((opt, optIdx) => (
                                          <div 
                                            key={optIdx}
                                            className={`p-3 rounded-lg ${
                                              optIdx === q.correct_answer_index 
                                                ? 'bg-green-50 border border-green-300' 
                                                : 'bg-slate-50 border border-slate-200'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              {optIdx === q.correct_answer_index && (
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                              )}
                                              <span className="text-sm">{opt}</span>
                                            </div>
                                          </div>
                                        ))}
                                        {q.explanation && (
                                          <Alert className="mt-4">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription className="text-sm">{q.explanation}</AlertDescription>
                                          </Alert>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}