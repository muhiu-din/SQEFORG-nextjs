"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, BrainCircuit, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';

// SRS Algorithm (SuperMemo-2 inspired)
const calculateNextReview = (rating, previousData) => {
  let { interval_days, ease_factor, repetitions } = previousData || { 
    interval_days: 0, 
    ease_factor: 2.5, 
    repetitions: 0 
  };

  if (rating >= 3) {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval_days = 1;
  }

  ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  return { interval_days, ease_factor, repetitions };
};

// MOCK DATA
const MOCK_USER = { name: "Admin User", email: "admin@example.com" };
const MOCK_SRS_ITEMS = [
  {
    id: 'srs1',
    question_id: 'q1',
    interval_days: 0,
    ease_factor: 2.5,
    repetitions: 0,
    last_seen_date: new Date().toISOString(),
    next_review_date: new Date().toISOString(),
    times_seen: 0,
  },
  {
    id: 'srs2',
    question_id: 'q2',
    interval_days: 0,
    ease_factor: 2.5,
    repetitions: 0,
    last_seen_date: new Date().toISOString(),
    next_review_date: new Date().toISOString(),
    times_seen: 0,
  }
];
const MOCK_QUESTIONS = {
  q1: {
    subject: "Contract Law",
    question_text: "What is consideration in contract law?",
    option_a: "A promise without obligation",
    option_b: "Something of value exchanged",
    option_c: "A verbal agreement",
    option_d: "Only written contracts",
    option_e: "None of the above",
    correct_answer: "B",
    explanation: "Consideration is something of value exchanged between parties."
  },
  q2: {
    subject: "Tort Law",
    question_text: "Which tort requires proving duty, breach, causation, and damage?",
    option_a: "Negligence",
    option_b: "Battery",
    option_c: "Defamation",
    option_d: "Nuisance",
    option_e: "Trespass",
    correct_answer: "A",
    explanation: "Negligence requires all four elements to be proven."
  }
};

export default function SpacedRepetitionReview() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dueItems, setDueItems] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentSRS, setCurrentSRS] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, remaining: 0 });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setUser(MOCK_USER);

      // Filter items due for review (all mock items are due)
      const sorted = MOCK_SRS_ITEMS.sort((a, b) => new Date(a.next_review_date) - new Date(b.next_review_date));
      setDueItems(sorted);
      setSessionStats({ reviewed: 0, remaining: sorted.length });

      if (sorted.length > 0) loadQuestion(sorted[0]);
      setLoading(false);
    };
    init();
  }, []);

  const loadQuestion = (srsItem) => {
    setCurrentSRS(srsItem);
    const q = MOCK_QUESTIONS[srsItem.question_id];
    setCurrentQuestion(q || null);
    setShowAnswer(false);
  };

  const handleRate = (ratingValue) => {
    const { interval_days, ease_factor, repetitions } = calculateNextReview(ratingValue, currentSRS);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval_days);

    // Update mock SRS
    currentSRS.interval_days = interval_days;
    currentSRS.ease_factor = ease_factor;
    currentSRS.repetitions = repetitions;
    currentSRS.next_review_date = nextReviewDate.toISOString();
    currentSRS.last_seen_date = new Date().toISOString();
    currentSRS.times_seen = (currentSRS.times_seen || 0) + 1;

    // Move to next
    const remaining = dueItems.slice(1);
    setDueItems(remaining);
    setSessionStats(prev => ({ reviewed: prev.reviewed + 1, remaining: remaining.length }));

    if (remaining.length > 0) loadQuestion(remaining[0]);
    else setCurrentQuestion(null);
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" /></div>;

  if (!currentQuestion && sessionStats.reviewed > 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8 border-none shadow-xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Session Complete!</h2>
          <p className="text-slate-600 mb-6">You've reviewed {sessionStats.reviewed} questions today.</p>
          <Link href={createPageUrl("Dashboard")}>
            <Button className="bg-slate-900 text-white">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8 border-none shadow-xl">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Reviews Due</h2>
          <p className="text-slate-600 mb-6">You're all caught up! Check back tomorrow or start a new practice session.</p>
          <Link href={createPageUrl("BlackLetterLawPractice")}>
            <Button className="bg-slate-900 text-white">Start Practice</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-purple-600" />
              Spaced Repetition Review
            </h1>
            <p className="text-slate-500 text-sm">Queue: {sessionStats.remaining} remaining</p>
          </div>
          <Progress value={(sessionStats.reviewed / (sessionStats.reviewed + sessionStats.remaining)) * 100} className="w-32 h-2" />
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-white border-b p-6">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline">{currentQuestion.subject}</Badge>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                Last review: {new Date(currentSRS.last_seen_date).toLocaleDateString()}
              </div>
            </div>
            <CardTitle className="text-xl leading-relaxed">{currentQuestion.question_text}</CardTitle>
          </CardHeader>

          <CardContent className="p-8 min-h-[300px] flex flex-col">
            {!showAnswer ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <p className="text-slate-500 italic">Think about the answer...</p>
                <Button onClick={() => setShowAnswer(true)} size="lg" className="bg-slate-900 hover:bg-slate-800">
                  Show Answer
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-3">
                  {['A','B','C','D','E'].map(opt => (
                    <div key={opt} className={`p-3 rounded-lg border ${
                      currentQuestion.correct_answer === opt ? 'bg-green-50 border-green-200 text-green-900' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}>
                      <span className="font-bold mr-2">{opt}.</span>{currentQuestion[`option_${opt.toLowerCase()}`]}
                      {currentQuestion.correct_answer === opt && <CheckCircle2 className="w-4 h-4 inline ml-2 text-green-600" />}
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-2">Explanation</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              </div>
            )}
          </CardContent>

          {showAnswer && (
            <CardFooter className="bg-slate-50 p-4 border-t grid grid-cols-3 gap-4">
              <Button onClick={() => handleRate(1)} className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 h-12">
                <div className="flex flex-col items-center">
                  <span className="font-bold">Hard</span>
                  <span className="text-[10px] font-normal opacity-70">1 day</span>
                </div>
              </Button>
              <Button onClick={() => handleRate(3)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 h-12">
                <div className="flex flex-col items-center">
                  <span className="font-bold">Good</span>
                  <span className="text-[10px] font-normal opacity-70">3-4 days</span>
                </div>
              </Button>
              <Button onClick={() => handleRate(5)} className="bg-green-100 hover:bg-green-200 text-green-700 border border-green-200 h-12">
                <div className="flex flex-col items-center">
                  <span className="font-bold">Easy</span>
                  <span className="text-[10px] font-normal opacity-70">7+ days</span>
                </div>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
