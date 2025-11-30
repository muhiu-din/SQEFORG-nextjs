"use client";
import React, { useState, useEffect, useCallback } from "react";
//call api entities here
import _ from 'lodash';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Percent, Play, Loader2, Info, AlertCircle, Gavel, TrendingUp, BookOpen, Clock, Flag, Save, RotateCcw, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createPageUrl } from "@/utils";
import Link from "next/link";
import { useRouter ,useSearchParams} from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Watermark from '@/components/Watermark';
import { processSessionRewards } from '@/components/GamificationHelper';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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

export default function BlackLetterLawPractice() {
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
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [sessionConfig, setSessionConfig] = useState({
    numQuestions: 30,
    subject: "All",
    difficulty: "All",
    feedbackMode: "instant",
    mode: "practice" // Add new mode: 'practice' or 'exam'
  });
  const [completedSession, setCompletedSession] = useState(false);
  const [userStats, setUserStats] = useState({
    totalAttempted: 0,
    accuracy: 0,
    subjectPerformance: [],
    weakAreas: [],
    strongAreas: []
  });

  // New State for Timer, Flags, and Sessions
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState(0);
  const [questionTimes, setQuestionTimes] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [incompleteSession, setIncompleteSession] = useState(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval;
    if (inSession && !completedSession && !showFeedback) {
      interval = setInterval(() => {
        setQuestionTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inSession, completedSession, showFeedback, currentIndex]);

  // Reset timer on new question
  useEffect(() => {
    if (inSession && !completedSession) {
      setQuestionTimeElapsed(0);
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex, inSession]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allQuestions = await base44.entities.BlackLetterQuestion.list();
      
      let availableQuestions = Array.isArray(allQuestions) ? allQuestions : [];
      if (currentUser.role !== 'admin') {
        const tier = currentUser.subscription_tier || 'starter';
        const limits = { starter: 500, pro: 1000, ultimate: Infinity };
        const limit = limits[tier] || 500;
        availableQuestions = availableQuestions.slice(0, limit);
      }
      
      setQuestions(availableQuestions);

      const answerLogs = await base44.entities.UserAnswerLog.filter(
        { created_by: currentUser.email },
        '-created_date',
        1000
      );

      const safeAnswerLogs = Array.isArray(answerLogs) ? answerLogs : [];
      const bllQuestionIds = new Set(availableQuestions.map(q => q.id));
      const bllAnswerLogs = safeAnswerLogs.filter(log => bllQuestionIds.has(log.question_id));

      const totalAttempted = bllAnswerLogs.length;
      const correctAnswers = bllAnswerLogs.filter(log => log.was_correct).length;
      const accuracy = totalAttempted > 0 ? (correctAnswers / totalAttempted * 100).toFixed(1) : 0;

      const subjectStats = {};
      for (const log of bllAnswerLogs) {
        const question = availableQuestions.find(q => q.id === log.question_id);
        if (question) {
          const subject = question.subject;
          if (!subjectStats[subject]) {
            subjectStats[subject] = { correct: 0, total: 0 };
          }
          subjectStats[subject].total++;
          if (log.was_correct) {
            subjectStats[subject].correct++;
          }
        }
      }

      const subjectPerformance = Object.entries(subjectStats)
        .map(([subject, stats]) => ({
          subject,
          accuracy: (stats.correct / stats.total * 100).toFixed(1),
          attempted: stats.total
        }))
        .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));

      setUserStats({
        totalAttempted,
        accuracy,
        subjectPerformance: subjectPerformance || [],
        weakAreas: subjectPerformance.filter(s => parseFloat(s.accuracy) < 60) || [],
        strongAreas: subjectPerformance.filter(s => parseFloat(s.accuracy) >= 75) || []
      });

      // Check for incomplete session
      const sessions = await base44.entities.PracticeSession.filter({
        user_email: currentUser.email,
        status: 'in_progress'
      }, '-last_updated', 1);

      if (sessions && sessions.length > 0) {
        setIncompleteSession(sessions[0]);
        setShowResumeDialog(true);
      }

      // Load flagged questions
      const flagged = await base44.entities.FlaggedQuestion.filter({
        user_email: currentUser.email
      });
      if (flagged) {
        setFlaggedQuestions(new Set(flagged.map(f => f.question_id)));
      }

    } catch (e) {
      console.error(e);
      setUserStats({
        totalAttempted: 0,
        accuracy: 0,
        subjectPerformance: [],
        weakAreas: [],
        strongAreas: []
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get('startSession') === 'true' && questions.length > 0) {
      const config = {
        numQuestions: parseInt(params.get('numQuestions')) || 30,
        subject: params.get('subject') || 'All',
        difficulty: params.get('difficulty') || 'All',
        feedbackMode: params.get('feedbackMode') || 'instant',
        mode: params.get('mode') || 'practice'
      };
      setSessionConfig(config);
      setTimeout(() => startSession(config), 500);
    }
  }, [searchParams, questions]);

  const startSession = async (config = sessionConfig) => {
    let pool = [...questions];
    if (config.subject !== "All") {
      pool = pool.filter(q => q.subject === config.subject);
    }
    if (config.difficulty !== "All") {
      pool = pool.filter(q => q.difficulty === config.difficulty);
    }
    const shuffled = _.shuffle(pool);
    const selected = shuffled.slice(0, Math.min(config.numQuestions, shuffled.length));
    
    setSessionQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setShowFeedback(false);
    setSessionScore(0);
    setQuestionTimes({});
    setInSession(true);
    setCompletedSession(false);

    // Create persistent session
    try {
      const session = await base44.entities.PracticeSession.create({
        user_email: user.email,
        config: config,
        question_ids: selected.map(q => q.id),
        current_index: 0,
        answers: {},
        status: 'in_progress',
        score: 0,
        total_time_seconds: 0,
        question_times: {},
        last_updated: new Date().toISOString()
      });
      setActiveSessionId(session.id);
    } catch (e) {
      console.error("Failed to create session:", e);
    }
  };

  const handleResumeSession = async () => {
    if (!incompleteSession) return;
    
    try {
      // Restore questions
      const restoredQuestions = [];
      for (const id of incompleteSession.question_ids) {
        const q = questions.find(q => q.id === id) || await base44.entities.BlackLetterQuestion.get(id);
        if (q) restoredQuestions.push(q);
      }

      setSessionQuestions(restoredQuestions);
      setCurrentIndex(incompleteSession.current_index);
      setAnswers(incompleteSession.answers || {});
      setSessionScore(incompleteSession.score || 0);
      setSessionConfig(incompleteSession.config);
      setQuestionTimes(incompleteSession.question_times || {});
      setActiveSessionId(incompleteSession.id);
      
      setInSession(true);
      setCompletedSession(false);
      setShowFeedback(false);
      setShowResumeDialog(false);
      
    } catch (e) {
      console.error("Failed to resume session:", e);
    }
  };

  const handleToggleFlag = async (question) => {
    const isFlagged = flaggedQuestions.has(question.id);
    const newSet = new Set(flaggedQuestions);
    
    if (isFlagged) {
      newSet.delete(question.id);
      // Remove from DB
      const records = await base44.entities.FlaggedQuestion.filter({
        user_email: user.email,
        question_id: question.id
      });
      if (records.length > 0) {
        await base44.entities.FlaggedQuestion.delete(records[0].id);
      }
    } else {
      newSet.add(question.id);
      // Add to DB
      await base44.entities.FlaggedQuestion.create({
        user_email: user.email,
        question_id: question.id,
        question_type: 'black_letter',
        subject: question.subject,
        question_text: question.question_text
      });
    }
    setFlaggedQuestions(newSet);
  };

  const handleScheduleReview = async (question, rating) => {
    try {
        // Check if SRS record exists
        const existing = await base44.entities.SpacedRepetition.filter({
            created_by: user.email,
            question_id: question.id
        });

        let interval_days = 1;
        let ease_factor = 2.5;
        let repetitions = 0;

        if (existing.length > 0) {
            const rec = existing[0];
            ease_factor = rec.ease_factor;
            repetitions = rec.repetitions;
            interval_days = rec.interval_days;
        }

        // SRS Calculation (simplified SM-2)
        if (rating >= 3) {
            if (repetitions === 0) {
                interval_days = 1;
            } else if (repetitions === 1) {
                interval_days = 6;
            } else {
                interval_days = Math.round(interval_days * ease_factor);
            }
            repetitions += 1;
        } else {
            repetitions = 0;
            interval_days = 1;
        }
    
        ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
        if (ease_factor < 1.3) ease_factor = 1.3;

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval_days);

        if (existing.length > 0) {
            await base44.entities.SpacedRepetition.update(existing[0].id, {
                interval_days,
                ease_factor,
                repetitions,
                next_review_date: nextReviewDate.toISOString(),
                last_seen_date: new Date().toISOString()
            });
        } else {
            await base44.entities.SpacedRepetition.create({
                question_id: question.id,
                subject: question.subject,
                difficulty: question.difficulty,
                interval_days,
                ease_factor,
                repetitions,
                next_review_date: nextReviewDate.toISOString(),
                last_seen_date: new Date().toISOString(),
                times_seen: 1,
                times_correct: rating >= 3 ? 1 : 0, // Approximate logic
                mastery_level: 'learning'
            });
        }
        
        // Show toast or visual feedback? 
        // For now, we just assume it works. Ideally add a toast.
    } catch (e) {
        console.error("SRS Update failed", e);
    }
  };

  const handleSaveAndQuit = async () => {
    // Session is already saved on every step, just exit
    setInSession(false);
    router.push(createPageUrl('Dashboard'));
  };

  const handleAnswerSelect = (optionLetter) => {
    if (showFeedback && sessionConfig.mode === 'practice') return; // Only block in practice mode with instant feedback
    setSelectedAnswer(optionLetter);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;
    const currentQuestion = sessionQuestions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const timeSpent = questionTimeElapsed;

    const newAnswers = {
      ...answers,
      [currentIndex]: { selected: selectedAnswer, correct: isCorrect }
    };
    setAnswers(newAnswers);

    const newScore = isCorrect ? sessionScore + 1 : sessionScore;
    if (isCorrect) setSessionScore(newScore);

    const newQuestionTimes = { ...questionTimes, [currentIndex]: timeSpent };
    setQuestionTimes(newQuestionTimes);

    try {
      // Log answer
      const optionLetters = ['A', 'B', 'C', 'D', 'E'];
      await base44.entities.UserAnswerLog.create({
        question_id: currentQuestion.id,
        selected_answer_index: optionLetters.indexOf(selectedAnswer),
        was_correct: isCorrect,
        time_spent_seconds: timeSpent,
        subject: currentQuestion.subject
      });

      // Update persistent session
      if (activeSessionId) {
        await base44.entities.PracticeSession.update(activeSessionId, {
          answers: newAnswers,
          score: newScore,
          question_times: newQuestionTimes,
          last_updated: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error("Failed to log/save:", e);
    }

    if (sessionConfig.mode === 'exam') {
      handleNext();
    } else if (sessionConfig.feedbackMode === "instant") {
      setShowFeedback(true);
    } else {
      handleNext();
    }
  };

  const handleNext = async () => {
    if (currentIndex < sessionQuestions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setShowFeedback(false);
      
      // Update index in DB
      if (activeSessionId) {
        try {
          await base44.entities.PracticeSession.update(activeSessionId, {
            current_index: nextIndex,
            last_updated: new Date().toISOString()
          });
        } catch (e) {}
      }
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    setCompletedSession(true);
    
    try {
      if (activeSessionId) {
        await base44.entities.PracticeSession.update(activeSessionId, {
          status: 'completed',
          last_updated: new Date().toISOString()
        });
      }
      await processSessionRewards(user, sessionScore, sessionQuestions.length);
      await loadData();
    } catch (e) {
      console.error("Failed to process rewards:", e);
    }
  };

  const handleEndSession = () => {
    setInSession(false);
    setCompletedSession(false);
    router.push(createPageUrl('BlackLetterLawPractice'));
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
          <p className="text-slate-600 mb-6">Access Black Letter Law Practice with any subscription plan.</p>
          <Link href={createPageUrl("Packages")}>
            <Button className="bg-amber-400 hover:bg-amber-500 text-slate-900">View Plans</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (completedSession) {
    const safeSessionQuestions = Array.isArray(sessionQuestions) ? sessionQuestions : [];
    const scorePercentage = safeSessionQuestions.length > 0 ? (sessionScore / safeSessionQuestions.length * 100) : 0;
    
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <Watermark user={user} />
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-linear-to-r from-slate-900 to-slate-700 text-white p-8">
                <div className="flex items-center gap-3 justify-center">
                  <Gavel className="w-8 h-8 text-amber-400" />
                  <CardTitle className="text-3xl font-bold">Session Complete! 🎉</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-slate-900 mb-2">
                    {scorePercentage.toFixed(0)}%
                  </div>
                  <p className="text-slate-600 text-lg">
                    You scored {sessionScore} out of {safeSessionQuestions.length}
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="review">Review Answers</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-900">{sessionScore}</p>
                            <p className="text-xs text-green-700">Correct</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-4 text-center">
                            <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-red-900">{safeSessionQuestions.length - sessionScore}</p>
                            <p className="text-xs text-red-700">Incorrect</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <Percent className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-900">{scorePercentage.toFixed(0)}%</p>
                            <p className="text-xs text-blue-700">Accuracy</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-50 border-slate-200">
                          <CardContent className="p-4 text-center">
                            <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-slate-900">
                              {formatTime(Object.values(questionTimes).reduce((a, b) => a + b, 0))}
                            </p>
                            <p className="text-xs text-slate-700">Total Time</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Topic Performance Breakdown */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Performance by Topic</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(_.groupBy(safeSessionQuestions, 'subject')).map(([subject, qs]) => {
                              const correct = qs.filter((q, idx) => {
                                const globalIdx = safeSessionQuestions.indexOf(q);
                                return answers[globalIdx]?.correct;
                              }).length;
                              const total = qs.length;
                              const pct = Math.round((correct / total) * 100);

                              return (
                                <div key={subject} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{subject}</span>
                                    <span className="font-medium">{correct}/{total} ({pct}%)</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="review">
                      <Accordion type="single" collapsible className="w-full">
                        {safeSessionQuestions.map((q, idx) => {
                          const userAnswer = answers[idx];
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
                                  {flaggedQuestions.has(q.id) && <Bookmark className="w-4 h-4 text-amber-500 fill-current ml-2" />}
                                  <div className="ml-auto flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-mono">
                                        {questionTimes[idx] ? formatTime(questionTimes[idx]) : '--:--'}
                                    </span>
                                    <Badge>{q.subject}</Badge>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4 pt-2 bg-slate-50/50">
                                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm mt-2">
                                  <p className="text-sm text-slate-700 mb-4 font-medium">Explanation:</p>
                                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{q.explanation}</p>
                                  
                                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                    <span className="text-xs text-slate-500 font-medium">Schedule for Review:</span>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" className="h-8 text-xs border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => handleScheduleReview(q, 1)}>Hard</Button>
                                      <Button size="sm" variant="outline" className="h-8 text-xs border-blue-200 hover:bg-blue-50 hover:text-blue-700" onClick={() => handleScheduleReview(q, 3)}>Good</Button>
                                      <Button size="sm" variant="outline" className="h-8 text-xs border-green-200 hover:bg-green-50 hover:text-green-700" onClick={() => handleScheduleReview(q, 5)}>Easy</Button>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                              <AccordionContent>
                                <div className="p-4 space-y-4">
                                  <p className="font-medium text-slate-900">{q.question_text}</p>
                                  <div className="space-y-2">
                                    {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                                      const optionKey = `option_${letter.toLowerCase()}`;
                                      const optionText = q[optionKey];
                                      const isUserAnswer = userAnswer?.selected === letter;
                                      const isCorrectAnswer = letter === q.correct_answer;
                                      
                                      let className = "p-3 rounded-lg border ";
                                      if (isCorrectAnswer) {
                                        className += "bg-green-50 border-green-300";
                                      } else if (isUserAnswer && !isCorrect) {
                                        className += "bg-red-50 border-red-300";
                                      } else {
                                        className += "bg-slate-50 border-slate-200";
                                      }
                                      
                                      return (
                                        <div key={letter} className={className}>
                                          <div className="flex items-start gap-2">
                                            {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />}
                                            {isUserAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                                            <span><strong>{letter}.</strong> {optionText}</span>
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
                    Back to Practice
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
      </div>
    );
  }

  if (inSession && sessionQuestions.length > 0) {
    const currentQuestion = sessionQuestions[currentIndex];
    const progress = ((currentIndex + 1) / sessionQuestions.length) * 100;
    const isExamMode = sessionConfig.mode === 'exam';

    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <Watermark user={user} />
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <Badge variant={isExamMode ? "destructive" : "default"}>
                  {isExamMode ? "EXAM MODE" : "PRACTICE MODE"}
                </Badge>
                <span className="text-sm font-medium text-slate-600">
                  Question {currentIndex + 1} of {sessionQuestions.length}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-sm">{formatTime(questionTimeElapsed)}</span>
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {isExamMode ? `Answered: ${Object.keys(answers).length}` : `Score: ${sessionScore}/${currentIndex + (showFeedback ? 1 : 0)}`}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSaveAndQuit} className="text-slate-500">
                  <Save className="w-4 h-4 mr-1" /> Save & Quit
                </Button>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${isExamMode ? 'bg-red-600' : 'bg-slate-900'}`}
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
                    <CardTitle className="text-xl font-bold leading-relaxed">{currentQuestion.question_text}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleToggleFlag(currentQuestion)}
                      className={flaggedQuestions.has(currentQuestion.id) ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-slate-600"}
                    >
                      <Bookmark className={`w-5 h-5 ${flaggedQuestions.has(currentQuestion.id) ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Gavel className="w-3 h-3" />
                      {currentQuestion.subject}
                    </Badge>
                    <Badge variant="outline">{currentQuestion.difficulty}</Badge>
                    {currentQuestion.tags && currentQuestion.tags.map(tag => (
                       <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                      const optionKey = `option_${letter.toLowerCase()}`;
                      const optionText = currentQuestion[optionKey];
                      const isSelected = selectedAnswer === letter;
                      const isCorrect = letter === currentQuestion.correct_answer;
                      const showCorrect = showFeedback && isCorrect && !isExamMode;
                      const showIncorrect = showFeedback && isSelected && !isCorrect && !isExamMode;

                      let className = "p-4 rounded-lg border-2 cursor-pointer transition-all ";
                      if (showCorrect) {
                        className += "bg-green-50 border-green-500";
                      } else if (showIncorrect) {
                        className += "bg-red-50 border-red-500";
                      } else if (isSelected) {
                        className += isExamMode ? "bg-red-100 border-red-900" : "bg-slate-100 border-slate-900";
                      } else {
                        className += "bg-white border-slate-200 hover:border-slate-400";
                      }

                      return (
                        <div
                          key={letter}
                          onClick={() => handleAnswerSelect(letter)}
                          className={className}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? (isExamMode ? 'border-red-900 bg-red-900' : 'border-slate-900 bg-slate-900') : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="flex-1"><strong>{letter}.</strong> {optionText}</span>
                            {showCorrect && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                            {showIncorrect && <XCircle className="w-6 h-6 text-red-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {showFeedback && currentQuestion.explanation && !isExamMode && (
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
                    {!showFeedback || isExamMode ? (
                      <Button 
                        onClick={handleSubmitAnswer}
                        disabled={selectedAnswer === null}
                        className={`flex-1 ${isExamMode ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                      >
                        {isExamMode ? (currentIndex === sessionQuestions.length - 1 ? 'Submit Exam' : 'Next Question') : 'Submit Answer'}
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

  const filteredQuestions = Array.isArray(questions) ? questions.filter(q => {
    const matchSubject = filterSubject === "All" || q.subject === filterSubject;
    const matchDifficulty = filterDifficulty === "All" || q.difficulty === filterDifficulty;
    return matchSubject && matchDifficulty;
  }) : [];

  const questionsBySubject = _.groupBy(filteredQuestions, 'subject');
  const safeWeakAreas = Array.isArray(userStats?.weakAreas) ? userStats.weakAreas : [];
  const safeSubjectPerformance = Array.isArray(userStats?.subjectPerformance) ? userStats.subjectPerformance : [];

  return (
    <div className="p-6 md:p-10">
      <Watermark user={user} />
      
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume previous session?</AlertDialogTitle>
            <AlertDialogDescription>
              You have an incomplete session in {incompleteSession?.config?.subject} ({incompleteSession?.status}). 
              Would you like to pick up where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              // If cancelled, maybe mark as abandoned? For now just close
              setShowResumeDialog(false);
            }}>Start New</AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeSession}>Resume Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-linear-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
              <Gavel className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Black Letter Law Practice</h1>
          </div>
          <p className="text-slate-600">Master core legal principles with {questions.length} focused Black Letter Law questions</p>
        </div>

        {userStats && userStats.totalAttempted > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Questions Attempted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{userStats.totalAttempted}</div>
                <p className="text-sm text-slate-500 mt-1">Black Letter Law practice</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Overall Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{userStats.accuracy}%</div>
                <Progress value={parseFloat(userStats.accuracy)} className="h-2 mt-3" />
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Subject Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{safeSubjectPerformance.length}</div>
                <p className="text-sm text-slate-500 mt-1">of {ALL_SUBJECTS.length} subjects practiced</p>
              </CardContent>
            </Card>
          </div>
        )}

        {safeWeakAreas.length > 0 && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="w-5 h-5" />
                Focus Areas (Below 60%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {safeWeakAreas.map((area, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{area.subject}</p>
                      <p className="text-xs text-slate-600">{area.attempted} questions attempted</p>
                    </div>
                    <Badge className="bg-amber-600 text-white">{area.accuracy}%</Badge>
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => {
                  const newSessionConfig = { ...sessionConfig, subject: safeWeakAreas[0].subject };
                  setSessionConfig(newSessionConfig); 
                  startSession(newSessionConfig); 
                }}
                className="w-full mt-4 bg-amber-600 hover:bg-amber-700"
              >
                Practice Weak Areas
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-lg mb-8">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3">
              <Play className="w-6 h-6" />
              Start Practice Session
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={sessionConfig.mode} onValueChange={(val) => setSessionConfig(prev => ({ ...prev, mode: val }))}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="practice">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Practice Mode
                </TabsTrigger>
                <TabsTrigger value="exam">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Exam Mode
                </TabsTrigger>
              </TabsList>

              <TabsContent value="practice" className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Practice Mode:</strong> Get instant feedback after each question. Perfect for learning and understanding concepts.
                  </AlertDescription>
                </Alert>
                
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
                      <SelectContent>
                        <SelectItem value="All">All Subjects</SelectItem>
                        {ALL_SUBJECTS.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block">Difficulty</Label>
                    <Select
                      value={sessionConfig.difficulty}
                      onValueChange={(val) => setSessionConfig(prev => ({ ...prev, difficulty: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Levels</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
              </TabsContent>

              <TabsContent value="exam" className="space-y-4">
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Exam Mode:</strong> Simulates real exam conditions. No feedback until completion. Test your knowledge under pressure.
                  </AlertDescription>
                </Alert>
                
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
                      <SelectContent>
                        <SelectItem value="All">All Subjects</SelectItem>
                        {ALL_SUBJECTS.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Difficulty</Label>
                    <Select
                      value={sessionConfig.difficulty}
                      onValueChange={(val) => setSessionConfig(prev => ({ ...prev, difficulty: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Levels</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={() => startSession(sessionConfig)} 
              className={`w-full mt-6 h-12 ${sessionConfig.mode === 'exam' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              <Play className="w-5 h-5 mr-2" />
              {sessionConfig.mode === 'exam' ? 'Start Exam Mode' : 'Start Practice Session'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Browse All Questions</CardTitle>
            <div className="flex gap-4 mt-4">
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Subjects</SelectItem>
                  {ALL_SUBJECTS.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {Object.keys(questionsBySubject).sort().map((subject) => {
                const subjectQuestions = Array.isArray(questionsBySubject[subject]) ? questionsBySubject[subject] : [];
                const subjectStat = safeSubjectPerformance.find(s => s.subject === subject);
                
                return (
                  <AccordionItem key={subject} value={subject}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex justify-between items-center w-full pr-4">
                        <span className="font-semibold">{subject}</span>
                        <div className="flex items-center gap-2">
                          {subjectStat && (
                            <Badge variant="outline" className="bg-blue-50">
                              {subjectStat.accuracy}% ({subjectStat.attempted} attempted)
                            </Badge>
                          )}
                          <Badge variant="outline">{subjectQuestions.length} questions</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {subjectQuestions.map((q) => (
                          <Card key={q.id} className="border-slate-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <p className="font-medium text-slate-900 flex-1">{q.question_text}</p>
                                <Badge className="ml-4">{q.difficulty}</Badge>
                              </div>
                              <Accordion type="single" collapsible>
                                <AccordionItem value="details" className="border-none">
                                  <AccordionTrigger className="text-sm text-slate-600 hover:no-underline py-2">
                                    View Options & Answer
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-2 mt-2">
                                      {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                                        const optionKey = `option_${letter.toLowerCase()}`;
                                        const optionText = q[optionKey];
                                        const isCorrect = letter === q.correct_answer;
                                        
                                        return (
                                          <div 
                                            key={letter}
                                            className={`p-3 rounded-lg ${
                                              isCorrect
                                                ? 'bg-green-50 border border-green-300' 
                                                : 'bg-slate-50 border border-slate-200'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              {isCorrect && (
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                              )}
                                              <span className="text-sm"><strong>{letter}.</strong> {optionText}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}