"use client";
import React, { useState, useEffect } from 'react';
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

// ===== MOCK DATA =====
const MOCK_USER = { name: "Admin User", email: "admin@example.com", role: "admin" };
const MOCK_EXAM = {
  id: 'exam1',
  title: 'SQE Mock Exam 1',
  question_ids: ['q1','q2','q3'],
  time_limit_minutes: 30
};
const MOCK_QUESTIONS = [
  {
    id: 'q1',
    subject: 'Contract Law',
    question_text: 'Which of the following is required for a contract to be valid?',
    option_a: 'Offer',
    option_b: 'Acceptance',
    option_c: 'Consideration',
    option_d: 'All of the above',
    option_e: 'None of the above',
    correct_answer: 'D',
    explanation: 'A valid contract requires offer, acceptance, and consideration.'
  },
  {
    id: 'q2',
    subject: 'Tort Law',
    question_text: 'Which element is essential to prove negligence?',
    option_a: 'Duty of care',
    option_b: 'Breach of duty',
    option_c: 'Causation',
    option_d: 'Damage',
    option_e: 'All of the above',
    correct_answer: 'E',
    explanation: 'Negligence requires duty, breach, causation, and damage.'
  },
  {
    id: 'q3',
    subject: 'Property Law',
    question_text: 'What is the legal term for permanent transfer of property?',
    option_a: 'Lease',
    option_b: 'Sale',
    option_c: 'License',
    option_d: 'Mortgage',
    option_e: 'Tenancy',
    correct_answer: 'B',
    explanation: 'A sale permanently transfers property ownership.'
  }
];

// ===== MOCK GAMIFICATION =====
const processSessionRewards = async (user, score, total, completed) => {
  return {
    points: score * 10,
    newBadges: score === total ? ['Perfect Score'] : [],
    streakInfo: { streak: 3, bestStreak: 5 }
  };
};

// ===== COMPONENT =====
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
    // MOCK LOADING
    const examId = searchParams.get('examId') || 'exam1';
    setUser(MOCK_USER);
    setMockExam(MOCK_EXAM);
    const examQuestions = MOCK_QUESTIONS.filter(q => MOCK_EXAM.question_ids.includes(q.id));
    setQuestions(examQuestions);
    setTimeRemaining(MOCK_EXAM.time_limit_minutes * 60);
    setLoading(false);
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
  }, [timeRemaining, isFinished]);

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
      setSelectedAnswer(answers[prevQuestion?.id]?.selected || null);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      const nextQuestion = questions[currentIndex + 1];
      setSelectedAnswer(answers[nextQuestion?.id]?.selected || null);
    }
  };

  const toggleFlag = () => {
    const currentQuestion = questions[currentIndex];
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) newSet.delete(currentQuestion.id);
      else newSet.add(currentQuestion.id);
      return newSet;
    });
  };

  const handleFinish = async () => {
    setIsFinished(true);
    setGeneratingFeedback(true);
    const score = Object.values(answers).filter(a => a.correct).length;
    const rewards = await processSessionRewards(user, score, questions.length, true);
    setGamificationRewards(rewards);

    // Generate dummy feedback for incorrect answers
    const feedbackMap = {};
    questions.forEach(q => {
      const ans = answers[q.id];
      if (!ans?.correct) {
        feedbackMap[q.id] = {
          why_correct: `Correct answer is ${q.correct_answer}. ${q.explanation}`,
          why_wrong: `Your choice (${ans?.selected || 'N/A'}) is incorrect. Review the key concept.`
        };
      }
    });
    setDetailedFeedback(feedbackMap);
    setGeneratingFeedback(false);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2,'0')}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-600" /></div>;
  if (!mockExam || questions.length === 0) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md text-center p-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Exam Not Found</h2>
        <p className="text-slate-600 mb-6">Unable to load this exam or it contains no questions.</p>
        <Button onClick={() => router.push(createPageUrl('MockExams'))}>Back to Mock Exams</Button>
      </Card>
    </div>
  );

  if (isFinished) {
    const score = Object.values(answers).filter(a => a.correct).length;
    const percentage = (score / questions.length * 100).toFixed(1);

    return (
      <div className="min-h-screen p-6 md:p-10 bg-linear-to-br from-slate-50 via-white to-slate-50">
        <Watermark user={user} />
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="shadow-2xl">
            <CardHeader className="bg-linear-to-r from-slate-900 to-slate-700 text-white p-8">
              <CardTitle className="text-3xl text-center">{mockExam.title} - Complete!</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <ScoreVisualization score={score} total={questions.length} showDetails={true} />
              {generatingFeedback && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                  <AlertDescription className="text-blue-800">
                    Generating personalized feedback...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          {gamificationRewards && <GamificationToast points={gamificationRewards.points} newBadges={gamificationRewards.newBadges} streakInfo={gamificationRewards.streakInfo} />}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const hasAnswered = answers[currentQuestion.id] !== undefined;
  const progress = ((currentIndex+1)/questions.length)*100;

  return (
    <div className="min-h-screen p-6 md:p-10 bg-linear-to-br from-slate-50 via-white to-slate-50">
      <Watermark user={user} />
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">{mockExam.title}</h2>
              <p className="text-slate-600">Question {currentIndex+1} of {questions.length}</p>
            </div>
            {timeRemaining !== null && <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg"><Clock className="w-5 h-5 text-slate-700" /><span className={`text-xl font-bold ${timeRemaining<300?'text-red-600':'text-slate-900'}`}>{formatTime(timeRemaining)}</span></div>}
          </div>
          <Progress value={progress} className="h-2"/>
        </Card>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-slate-50">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
                  <Button variant="outline" size="sm" onClick={toggleFlag} className={flaggedQuestions.has(currentQuestion.id)?'border-amber-500 bg-amber-50':''}><Flag className={`w-4 h-4 ${flaggedQuestions.has(currentQuestion.id)?'text-amber-600':''}`} /></Button>
                </div>
                <div className="flex gap-2 mt-3"><Badge variant="outline">{currentQuestion.subject}</Badge></div>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {['A','B','C','D','E'].map(opt=>{
                  const isCurrent = selectedAnswer===opt;
                  const isPrev = answers[currentQuestion.id]?.selected===opt;
                  let className="p-4 rounded-lg border-2 cursor-pointer transition-all ";
                  className += (isCurrent||isPrev)?'bg-slate-100 border-slate-900':'bg-white border-slate-200 hover:border-slate-400';
                  return (
                    <div key={opt} className={className} onClick={()=>handleAnswerSelect(opt)}>
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isCurrent||isPrev?'border-slate-900 bg-slate-900':'border-slate-300'}`}>
                          {(isCurrent||isPrev)&&<div className="w-2 h-2 bg-white rounded-full"/>}
                        </div>
                        <div><span className="font-bold mr-2">{opt}.</span>{currentQuestion[`option_${opt.toLowerCase()}`]}</div>
                      </div>
                    </div>
                  );
                })}
                <div className="mt-6 flex gap-3">
                  <Button onClick={handlePrevious} disabled={currentIndex===0} variant="outline" className="flex-1"><ArrowLeft className="w-4 h-4 mr-2"/>Previous</Button>
                  {!hasAnswered && selectedAnswer!==null ? (
                    <Button onClick={handleConfirmAnswer} className="flex-1 bg-blue-600 hover:bg-blue-700">Confirm Answer</Button>
                  ) : (
                    currentIndex<questions.length-1?
                    <Button onClick={handleNext} className="flex-1 bg-slate-900 hover:bg-slate-800">Next<ArrowRight className="w-4 h-4 ml-2"/></Button>:
                    <Button onClick={handleFinish} className="flex-1 bg-green-600 hover:bg-green-700">Finish Exam</Button>
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
