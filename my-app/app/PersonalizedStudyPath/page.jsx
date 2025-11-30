"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, Calendar, TrendingUp, BookOpen, Zap, Lock, CheckCircle2, AlertCircle, AlertTriangle, Clock, ArrowRight, Flame } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import _ from 'lodash';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import moment from 'moment';

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

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "EU Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];

const INTENSIVE_PLANS = {
  "7_day": {
    name: "7-Day Blitz",
    description: "Ultra-intensive final week prep",
    days: 7,
    schedule: [
      { day: 1, focus: "Core Contract & Tort", tasks: ["Review all Contract notes", "50 Contract MCQs", "50 Tort MCQs", "1 Mini Mock"] },
      { day: 2, focus: "Business Law & Dispute Resolution", tasks: ["Review Business Law notes", "50 Business Law MCQs", "50 Dispute Resolution MCQs"] },
      { day: 3, focus: "Property & Land Law", tasks: ["Review Property Practice notes", "40 Property MCQs", "40 Land Law MCQs", "1 Full Mock Exam"] },
      { day: 4, focus: "Wills, Trusts & Criminal", tasks: ["Review Wills & Trusts notes", "30 Wills MCQs", "30 Trusts MCQs", "30 Criminal Law MCQs"] },
      { day: 5, focus: "Full Mock + Review", tasks: ["1 Full Timed Mock", "Review all incorrect answers", "Note weak areas"] },
      { day: 6, focus: "Weak Areas Blitz", tasks: ["100 MCQs on your 3 weakest subjects", "Flash cards review", "Quick notes scan"] },
      { day: 7, focus: "Light Review & Rest", tasks: ["Light review of key principles", "10 easy MCQs for confidence", "Rest and mental prep"] }
    ]
  },
  "14_day": {
    name: "14-Day Power Sprint",
    description: "Comprehensive two-week intensive revision",
    days: 14,
    schedule: [
      { day: 1, focus: "Contract Law Deep Dive", tasks: ["Review all Contract notes", "50 Contract MCQs", "Review explanations"] },
      { day: 2, focus: "Tort Law Deep Dive", tasks: ["Review all Tort notes", "50 Tort MCQs", "Create summary sheet"] },
      { day: 3, focus: "Business Law", tasks: ["Review Business Law notes", "60 Business Law MCQs", "1 Mini Mock"] },
      { day: 4, focus: "Dispute Resolution", tasks: ["Review DR notes", "50 DR MCQs", "Focus on CPR timeline"] },
      { day: 5, focus: "First Full Mock", tasks: ["1 Full Timed Mock Exam", "Detailed review of all answers"] },
      { day: 6, focus: "Property Practice", tasks: ["Review Property notes", "50 Property MCQs", "Conveyancing flowchart"] },
      { day: 7, focus: "Land Law", tasks: ["Review Land Law notes", "50 Land Law MCQs", "Easements & covenants focus"] },
      { day: 8, focus: "Wills & Trusts", tasks: ["Review Wills notes", "30 Wills MCQs", "30 Trusts MCQs", "Three certainties drill"] },
      { day: 9, focus: "Criminal Law & Practice", tasks: ["Review Criminal notes", "40 Criminal Law MCQs", "30 Criminal Practice MCQs"] },
      { day: 10, focus: "Second Full Mock", tasks: ["1 Full Timed Mock Exam", "Compare performance to first mock"] },
      { day: 11, focus: "Ethics, Accounts & Professional Conduct", tasks: ["Review all Ethics notes", "40 Ethics MCQs", "30 Accounts MCQs"] },
      { day: 12, focus: "Weak Areas Intensive", tasks: ["100 MCQs on weakest 3 subjects", "Review all past mistakes"] },
      { day: 13, focus: "Final Mock & Polish", tasks: ["1 Final Full Mock", "Flash cards review", "Quick subject summaries"] },
      { day: 14, focus: "Confidence & Rest", tasks: ["20 easy MCQs", "Skim key notes", "Relax and prepare mentally"] }
    ]
  }
};

// Calculate recommended questions per weak subject
const calculateWeakAreaPlan = (weakAreas, daysUntilExam) => {
  if (!weakAreas || weakAreas.length === 0 || !daysUntilExam || daysUntilExam <= 0) {
    return null;
  }

  const questionsPerSubject = 100; // Target 100 questions per weak subject
  const totalQuestionsNeeded = weakAreas.length * questionsPerSubject;
  
  // Calculate daily/weekly targets
  const questionsPerDay = Math.ceil(totalQuestionsNeeded / Math.max(daysUntilExam, 1));
  const questionsPerWeek = questionsPerDay * 7;
  
  // Estimate hours needed (assuming 90 seconds per question + review time)
  const minutesPerQuestion = 2.5; // 90s question + 60s review
  const hoursNeeded = (totalQuestionsNeeded * minutesPerQuestion) / 60;
  const hoursPerWeek = hoursNeeded / Math.ceil(daysUntilExam / 7);
  
  return {
    totalQuestionsNeeded,
    questionsPerDay,
    questionsPerWeek,
    hoursNeeded: Math.ceil(hoursNeeded),
    hoursPerWeek: Math.ceil(hoursPerWeek),
    weeksAvailable: Math.ceil(daysUntilExam / 7),
    urgency: daysUntilExam < 30 ? 'high' : daysUntilExam < 60 ? 'medium' : 'low'
  };
};

export default function PersonalisedStudyPath() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [studyPath, setStudyPath] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState('pass_exam');
  const [selectedExamType, setSelectedExamType] = useState('Both');
  const [flk1ExamDate, setFlk1ExamDate] = useState('');
  const [flk2ExamDate, setFlk2ExamDate] = useState('');
  const [intensivePlan, setIntensivePlan] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [weakAreaPlan, setWeakAreaPlan] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const currentUser = {name: "Admin User", email: "admin@example.com", role: "admin"}; // Mock admin user
        setUser(currentUser);
        setSelectedGoal(currentUser.study_goal || 'pass_exam');
        setSelectedExamType(currentUser.exam_type || 'Both');
        setFlk1ExamDate(currentUser.flk1_exam_date || '');
        setFlk2ExamDate(currentUser.flk2_exam_date || '');
      } catch (e) {
        console.error('Failed to load user:', e);
        setUser(null);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const daysUntilExam = (examType) => {
    let dateToUse = null;
    
    if (examType === 'FLK1' && flk1ExamDate) {
      dateToUse = flk1ExamDate;
    } else if (examType === 'FLK2' && flk2ExamDate) {
      dateToUse = flk2ExamDate;
    } else if (examType === 'earliest') {
      // Find the earliest exam date
      const dates = [];
      if (flk1ExamDate) dates.push(new Date(flk1ExamDate));
      if (flk2ExamDate) dates.push(new Date(flk2ExamDate));
      if (dates.length === 0) return null;
      dateToUse = new Date(Math.min(...dates)).toISOString().split('T')[0];
    }
    
    if (!dateToUse) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateToUse);
    examDate.setHours(0, 0, 0, 0);
    const days = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const analyzePerformance = async () => {
    if (!user) {
      alert("Please log in to analyze your performance.");
      return;
    }
    
    setAnalyzing(true);
    setAnalysisError('');
    
    try {
      console.log('Starting performance analysis...');
      
      const [attempts, answerLogs] = await Promise.all([
        base44.entities.ExamAttempt.filter({ created_by: user.email }, '-created_date', 50),
        base44.entities.UserAnswerLog.filter({ created_by: user.email }, '-created_date', 1000)
      ]);

      console.log(`Loaded ${attempts.length} attempts and ${answerLogs.length} answer logs`);

      if (attempts.length === 0 && answerLogs.length === 0) {
        setStudyPath({
          weakAreas: [],
          mediumAreas: [],
          strongAreas: [],
          untested: ALL_SUBJECTS,
          totalAttempts: 0,
          avgScore: 0,
          recommendations: [{
            priority: 'high',
            title: 'Start Your Journey',
            description: 'You haven\'t taken any exams or answered questions yet. Start practicing to get personalised recommendations!',
            action: 'Browse Questions',
            actionUrl: createPageUrl('QuestionBank')
          }],
          subjectAccuracy: []
        });
        setIntensivePlan(null);
        setWeakAreaPlan(null);
        setAnalyzing(false);
        return;
      }

      const uniqueQuestionIds = [...new Set(answerLogs.map(log => log.question_id))];
      console.log(`Found ${uniqueQuestionIds.length} unique questions`);
      
      let questions = [];
      if (uniqueQuestionIds.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < uniqueQuestionIds.length; i += batchSize) {
          const batch = uniqueQuestionIds.slice(i, i + batchSize);
          try {
            const batchQuestions = await base44.entities.Question.filter({ id: { '$in': batch } });
            questions.push(...batchQuestions);
          } catch (e) {
            console.error("Failed to fetch question batch:", e);
          }
        }
      }
      
      console.log(`Loaded ${questions.length} questions`);
      const questionMap = new Map(questions.map(q => [q.id, q]));

      const subjectPerformance = {};
      
      for (const log of answerLogs) {
        const question = questionMap.get(log.question_id);
        if (!question || !question.subject) continue;
        
        if (!subjectPerformance[question.subject]) {
          subjectPerformance[question.subject] = { correct: 0, total: 0 };
        }
        
        subjectPerformance[question.subject].total++;
        if (log.was_correct) {
          subjectPerformance[question.subject].correct++;
        }
      }

      console.log('Subject performance:', subjectPerformance);

      const subjectAccuracy = Object.entries(subjectPerformance)
        .filter(([, stats]) => stats.total >= 5)
        .map(([subject, stats]) => ({
          subject,
          accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
          attempted: stats.total
        }))
        .sort((a, b) => a.accuracy - b.accuracy);

      const weakAreas = subjectAccuracy.filter(s => s.accuracy < 60);
      const mediumAreas = subjectAccuracy.filter(s => s.accuracy >= 60 && s.accuracy < 75);
      const strongAreas = subjectAccuracy.filter(s => s.accuracy >= 75);
      const testedSubjects = new Set(subjectAccuracy.map(s => s.subject));
      const untested = ALL_SUBJECTS.filter(s => !testedSubjects.has(s));

      console.log('Analysis results:', { weakAreas: weakAreas.length, mediumAreas: mediumAreas.length, strongAreas: strongAreas.length, untested: untested.length });

      const totalAttempts = attempts.length;
      const avgScore = attempts.length > 0 
        ? attempts.reduce((sum, a) => {
            const attemptScore = a.total_questions > 0 ? (a.score / a.total_questions * 100) : 0;
            return sum + attemptScore;
          }, 0) / attempts.length 
        : 0;

      const recommendations = generateRecommendations(weakAreas, mediumAreas, strongAreas, untested, selectedGoal, avgScore, selectedExamType, flk1ExamDate, flk2ExamDate);

      setStudyPath({
        weakAreas,
        mediumAreas,
        strongAreas,
        untested,
        totalAttempts,
        avgScore,
        recommendations,
        subjectAccuracy
      });

      // Calculate weak area plan
      const examDays = daysUntilExam('earliest');
      if (weakAreas.length > 0 && examDays) {
        setWeakAreaPlan(calculateWeakAreaPlan(weakAreas.map(w => w.subject), examDays));
      } else {
        setWeakAreaPlan(null);
      }

      if (examDays !== null && examDays > 0 && examDays <= 14) {
        if (examDays <= 7) {
          setIntensivePlan(INTENSIVE_PLANS["7_day"]);
        } else {
          setIntensivePlan(INTENSIVE_PLANS["14_day"]);
        }
      } else {
        setIntensivePlan(null);
      }

    } catch (error) {
      console.error("Failed to analyze performance:", error);
      setAnalysisError("Failed to analyze your performance. Please try again later.");
    }
    setAnalyzing(false);
  };

  const generateRecommendations = (weak, medium, strong, untested, goal, avgScore, examType, flk1Date, flk2Date) => {
    const recs = [];
    
    // Calculate days to each exam
    const flk1Days = flk1Date ? daysUntilExam('FLK1') : null;
    const flk2Days = flk2Date ? daysUntilExam('FLK2') : null;
    const earliestDays = daysUntilExam('earliest');

    if (earliestDays !== null && earliestDays > 0 && earliestDays <= 14) {
      const examName = (flk1Days === earliestDays && flk1Days !== null) ? 'FLK 1' : 
                       (flk2Days === earliestDays && flk2Days !== null) ? 'FLK 2' : '';
      recs.push({
        priority: 'urgent',
        title: `${earliestDays} Days Until ${examName}!`,
        description: earliestDays <= 7 
          ? 'Focus on high-yield topics and revision. Use the 7-day intensive plan below.'
          : 'Time to intensify your preparation. Follow the 14-day intensive plan below.',
        action: 'View Intensive Plan',
        actionUrl: '#intensive'
      });
    }

    // Filter weak areas by exam type
    let relevantWeakAreas = weak;
    if (examType === 'FLK 1') {
      relevantWeakAreas = weak.filter(w => FLK1_SUBJECTS.includes(w.subject));
    } else if (examType === 'FLK 2') {
      relevantWeakAreas = weak.filter(w => FLK2_SUBJECTS.includes(w.subject));
    }

    if (relevantWeakAreas.length > 0) {
      const topWeak = relevantWeakAreas.slice(0, 3);
      recs.push({
        priority: 'high',
        title: `Urgent: Address Your Weak Areas`,
        description: `You're scoring below 60% in ${topWeak.map(w => w.subject).join(', ')}. These need immediate attention.`,
        action: 'View Weak Area Plan',
        actionUrl: '#weakplan'
      });
    }

    // Filter untested by exam type
    let relevantUntested = untested;
    if (examType === 'FLK 1') {
      relevantUntested = untested.filter(s => FLK1_SUBJECTS.includes(s));
    } else if (examType === 'FLK 2') {
      relevantUntested = untested.filter(s => FLK2_SUBJECTS.includes(s));
    }

    if (relevantUntested.length > 0) {
      recs.push({
        priority: 'medium',
        title: 'Cover All Subjects',
        description: `You haven't practiced ${relevantUntested.length} subject${relevantUntested.length > 1 ? 's' : ''}: ${relevantUntested.slice(0, 3).join(', ')}${relevantUntested.length > 3 ? '...' : ''}. Don't leave blind spots!`,
        action: 'Start Learning',
        actionUrl: createPageUrl(`StudyNotes`)
      });
    }

    if (medium.length >= 3) {
      recs.push({
        priority: 'medium',
        title: 'Push Medium Areas to Strong',
        description: `You have ${medium.length} subjects in the 60-75% range. A bit more focused practice will solidify these.`,
        action: 'Review & Practice',
        actionUrl: createPageUrl(`ReviewBank`)
      });
    }

    if (avgScore >= 70) {
      recs.push({
        priority: 'low',
        title: 'Excellent Progress!',
        description: `Your average score is ${avgScore.toFixed(0)}%. Focus on consistency, timing, and maintaining your strong areas.`,
        action: 'Take Full Mock',
        actionUrl: createPageUrl(`MockExams`)
      });
    } else if (avgScore > 0 && avgScore < 60) {
      recs.push({
        priority: 'high',
        title: 'Build Your Foundation',
        description: `Your average score is ${avgScore.toFixed(0)}%. Focus on understanding core concepts. Use study notes and easier questions to build confidence.`,
        action: 'Study Core Subjects',
        actionUrl: createPageUrl(`StudyNotes`)
      });
    }

    if (strong.length >= 3 && earliestDays !== null && earliestDays > 14) {
      recs.push({
        priority: 'medium',
        title: 'Test Under Real Conditions',
        description: 'You have good subject knowledge. Time to test yourself with the full Exam Day Simulator.',
        action: 'Take Simulator',
        actionUrl: createPageUrl(`ExamDaySimulator`)
      });
    }

    if (recs.length === 0) {
      recs.push({
        priority: 'medium',
        title: 'Keep Practicing',
        description: 'Continue taking mock exams and practicing questions regularly to build your confidence.',
        action: 'Take Mock Exam',
        actionUrl: createPageUrl(`MockExams`)
      });
    }

    return recs;
  };

  const handleSaveSettings = async () => {
    if (!user) {
      alert("Please log in to save settings.");
      return;
    }
    
    try {
      await base44.auth.updateMe({
        study_goal: selectedGoal,
        exam_type: selectedExamType,
        flk1_exam_date: flk1ExamDate || null,
        flk2_exam_date: flk2ExamDate || null
      });
      alert('Study preferences saved!');
      await analyzePerformance();
    } catch (error) {
      console.error("Save settings error:", error);
      alert('Failed to save settings. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8 border-none shadow-xl">
          <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Please Log In</h1>
          <p className="text-slate-600">Log in to access your personalised study path.</p>
        </Card>
      </div>
    );
  }

  const flk1Days = daysUntilExam('FLK1');
  const flk2Days = daysUntilExam('FLK2');
  const earliestExamDays = daysUntilExam('earliest');

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Your Personalised Study Path</h1>
          <p className="text-slate-600">Data-driven recommendations based on your actual performance</p>
        </div>

        {analysisError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>{analysisError}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-8 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="w-6 h-6 text-slate-700" />
              Study Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="exam-type">Which exam(s) are you preparing for?</Label>
              <Select value={selectedExamType} onValueChange={setSelectedExamType} id="exam-type">
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both FLK 1 and FLK 2</SelectItem>
                  <SelectItem value="FLK 1">FLK 1 Only</SelectItem>
                  <SelectItem value="FLK 2">FLK 2 Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {(selectedExamType === 'Both' || selectedExamType === 'FLK 1') && (
                <div>
                  <Label htmlFor="flk1-date">FLK 1 Exam Date</Label>
                  <Input
                    id="flk1-date"
                    type="date"
                    value={flk1ExamDate}
                    onChange={(e) => setFlk1ExamDate(e.target.value)}
                    className="mt-2"
                  />
                  {flk1Days !== null && flk1Days > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{flk1Days} days until FLK 1</p>
                  )}
                </div>
              )}
              
              {(selectedExamType === 'Both' || selectedExamType === 'FLK 2') && (
                <div>
                  <Label htmlFor="flk2-date">FLK 2 Exam Date</Label>
                  <Input
                    id="flk2-date"
                    type="date"
                    value={flk2ExamDate}
                    onChange={(e) => setFlk2ExamDate(e.target.value)}
                    className="mt-2"
                  />
                  {flk2Days !== null && flk2Days > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{flk2Days} days until FLK 2</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="study-goal">Study Goal</Label>
              <Select value={selectedGoal} onValueChange={setSelectedGoal} id="study-goal">
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass_exam">Pass the Exam</SelectItem>
                  <SelectItem value="improve_weak_areas">Improve Weak Areas</SelectItem>
                  <SelectItem value="comprehensive_review">Comprehensive Review</SelectItem>
                  <SelectItem value="last_minute_prep">Last Minute Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveSettings} variant="outline" disabled={analyzing}>
                Save Settings
              </Button>
              <Button onClick={analyzePerformance} disabled={analyzing} className="bg-slate-900 hover:bg-slate-800">
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyze My Performance
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exam Countdown Cards */}
        {(flk1Days !== null || flk2Days !== null) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {flk1Days !== null && flk1Days > 0 && (selectedExamType === 'Both' || selectedExamType === 'FLK 1') && (
              <Card className="bg-linear-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-10 h-10 text-blue-600" />
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{flk1Days} Days</h3>
                      <p className="text-slate-600">Until FLK 1</p>
                      <p className="text-xs text-slate-500">{moment(flk1ExamDate).format('DD MMMM YYYY')}</p>
                    </div>
                  </div>
                  {flk1Days <= 14 && (
                    <Button onClick={() => document.getElementById('intensive')?.scrollIntoView({ behavior: 'smooth' })} className="bg-blue-500 hover:bg-blue-600">
                      <Zap className="w-4 h-4 mr-2" />
                      Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {flk2Days !== null && flk2Days > 0 && (selectedExamType === 'Both' || selectedExamType === 'FLK 2') && (
              <Card className="bg-linear-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-10 h-10 text-purple-600" />
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{flk2Days} Days</h3>
                      <p className="text-slate-600">Until FLK 2</p>
                      <p className="text-xs text-slate-500">{moment(flk2ExamDate).format('DD MMMM YYYY')}</p>
                    </div>
                  </div>
                  {flk2Days <= 14 && (
                    <Button onClick={() => document.getElementById('intensive')?.scrollIntoView({ behavior: 'smooth' })} className="bg-purple-500 hover:bg-purple-600">
                      <Zap className="w-4 h-4 mr-2" />
                      Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {studyPath && weakAreaPlan && studyPath.weakAreas.length > 0 && (
          <Card id="weakplan" className="mb-8 border-2 border-red-300 shadow-xl bg-linear-to-br from-red-50 to-orange-50">
            <CardHeader className="border-b bg-red-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <CardTitle className="text-2xl text-red-900">Cover Your Weak Areas Before Exam</CardTitle>
                    <p className="text-red-700 mt-1">Priority action plan to boost your scores</p>
                  </div>
                </div>
                <Badge className={`text-lg px-4 py-2 ${weakAreaPlan.urgency === 'high' ? 'bg-red-600' : weakAreaPlan.urgency === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                  {weakAreaPlan.urgency === 'high' ? 'HIGH PRIORITY' : weakAreaPlan.urgency === 'medium' ? 'MEDIUM PRIORITY' : 'PLAN AHEAD'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Alert className="mb-6 bg-blue-50 border-blue-300">
                <Clock className="h-4 w-4 text-blue-700" />
                <AlertTitle className="text-blue-900 font-bold">Time-Based Action Plan</AlertTitle>
                <AlertDescription className="text-blue-800">
                  You have <strong>{earliestExamDays} days</strong> to improve {studyPath.weakAreas.length} weak subject{studyPath.weakAreas.length > 1 ? 's' : ''}. 
                  Follow this plan to systematically boost your performance before exam day.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white border-red-200">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-red-900">{studyPath.weakAreas.length}</p>
                    <p className="text-sm text-slate-600">Weak Subjects</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-orange-200">
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-orange-900">{weakAreaPlan.totalQuestionsNeeded}</p>
                    <p className="text-sm text-slate-600">Questions Needed</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-amber-200">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-amber-900">{weakAreaPlan.hoursNeeded}h</p>
                    <p className="text-sm text-slate-600">Total Study Time</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-green-200">
                  <CardContent className="p-4 text-center">
                    <Flame className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-green-900">{weakAreaPlan.questionsPerDay}</p>
                    <p className="text-sm text-slate-600">Questions/Day</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className="bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Weekly Targets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Questions per week:</span>
                      <Badge className="bg-blue-600">{weakAreaPlan.questionsPerWeek} MCQs</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Study hours per week:</span>
                      <Badge className="bg-purple-600">{weakAreaPlan.hoursPerWeek} hours</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Weeks available:</span>
                      <Badge className="bg-green-600">{weakAreaPlan.weeksAvailable} weeks</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recommended Daily Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Complete {weakAreaPlan.questionsPerDay} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Review all explanations thoroughly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Note key principles & mistakes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Revisit study notes for gaps</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-600" />
                  Your Weak Areas - Prioritized Action Plan
                </h4>
                {studyPath.weakAreas.map((area, idx) => (
                  <Card key={area.subject} className="bg-white border-l-4 border-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-red-600 text-white">#{idx + 1}</Badge>
                          <div>
                            <h5 className="font-bold text-slate-900">{area.subject}</h5>
                            <p className="text-sm text-slate-600">{area.attempted} questions attempted • {area.accuracy.toFixed(0)}% accuracy</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{area.accuracy.toFixed(0)}%</p>
                          <Progress value={area.accuracy} className="w-24 h-2 mt-1" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={createPageUrl(`QuestionBank?startSession=true&subject=${encodeURIComponent(area.subject)}&numQuestions=30&difficulty=medium&feedbackMode=instant`)}>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Practice Now (30 Qs)
                          </Button>
                        </Link>
                        <Link href={createPageUrl(`StudyNotes`)}>
                          <Button size="sm" variant="outline">
                            <BookOpen className="w-4 h-4 mr-1" />
                            Review Notes
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert className="bg-green-50 border-green-300">
                <CheckCircle2 className="h-4 w-4 text-green-700" />
                <AlertTitle className="text-green-900 font-bold">Success Strategy</AlertTitle>
                <AlertDescription className="text-green-800">
                  <ul className="space-y-1 mt-2">
                    <li>• <strong>Focus first</strong> on your weakest subject before moving to the next</li>
                    <li>• <strong>Target 60%+</strong> accuracy on each weak area before exam day</li>
                    <li>• <strong>Use instant feedback</strong> mode to learn from mistakes immediately</li>
                    <li>• <strong>Track progress</strong> - Re-analyze weekly to see improvements</li>
                    <li>• <strong>Don't neglect</strong> your strong areas - maintain with light practice</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {studyPath && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Mock Exams Taken</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-slate-900">{studyPath.totalAttempts}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-slate-900">{studyPath.avgScore.toFixed(0)}%</p>
                  <Progress value={studyPath.avgScore} className="mt-2 h-2" />
                </CardContent>
              </Card>
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Subjects Tested</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-slate-900">{studyPath.subjectAccuracy.length}</p>
                  <p className="text-sm text-slate-500 mt-1">of {ALL_SUBJECTS.length} total</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8 border-none shadow-lg">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-amber-500" />
                  Your Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {studyPath.recommendations.map((rec, idx) => {
                  const priorityColors = {
                    urgent: 'bg-red-50 border-red-200',
                    high: 'bg-amber-50 border-amber-200',
                    medium: 'bg-blue-50 border-blue-200',
                    low: 'bg-green-50 border-green-200'
                  };
                  const priorityBadgeColors = {
                    urgent: 'bg-red-500 text-white',
                    high: 'bg-amber-500 text-slate-900',
                    medium: 'bg-blue-500 text-white',
                    low: 'bg-green-500 text-white'
                  };

                  return (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${priorityColors[rec.priority]}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-slate-900">{rec.title}</h4>
                        <Badge className={priorityBadgeColors[rec.priority]}>{rec.priority.toUpperCase()}</Badge>
                      </div>
                      <p className="text-slate-700 mb-4">{rec.description}</p>
                      {rec.actionUrl.startsWith('#') ? (
                        <Button size="sm" onClick={() => document.getElementById(rec.actionUrl.slice(1))?.scrollIntoView({ behavior: 'smooth' })}>
                          {rec.action}
                        </Button>
                      ) : (
                        <Link href={rec.actionUrl}>
                          <Button size="sm">{rec.action}</Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {studyPath.weakAreas.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-900">Weak Areas ({studyPath.weakAreas.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {studyPath.weakAreas.slice(0, 5).map(area => (
                      <div key={area.subject} className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">{area.subject}</span>
                        <Badge variant="outline" className="text-red-700">{area.accuracy.toFixed(0)}%</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {studyPath.mediumAreas.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-amber-900">Improving ({studyPath.mediumAreas.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {studyPath.mediumAreas.slice(0, 5).map(area => (
                      <div key={area.subject} className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">{area.subject}</span>
                        <Badge variant="outline" className="text-amber-700">{area.accuracy.toFixed(0)}%</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {studyPath.strongAreas.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-900">Strong Areas ({studyPath.strongAreas.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {studyPath.strongAreas.slice(0, 5).map(area => (
                      <div key={area.subject} className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">{area.subject}</span>
                        <Badge variant="outline" className="text-green-700">{area.accuracy.toFixed(0)}%</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {intensivePlan && earliestExamDays !== null && earliestExamDays > 0 && earliestExamDays <= 14 && (
          <Card id="intensive" className="mb-8 border-2 border-amber-400 shadow-xl">
            <CardHeader className="bg-linear-to-r from-amber-50 to-amber-100 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Zap className="w-8 h-8 text-amber-600" />
                    {intensivePlan.name}
                  </CardTitle>
                  <p className="text-slate-600 mt-2">{intensivePlan.description}</p>
                </div>
                <Badge className="bg-amber-500 text-slate-900 text-lg px-4 py-2">{intensivePlan.days} Days</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">You're in the final stretch!</AlertTitle>
                <AlertDescription className="text-blue-800">
                  With only {earliestExamDays} days until your exam, follow this intensive plan to maximize your preparation.
                </AlertDescription>
              </Alert>
              <div className="space-y-4">
                {intensivePlan.schedule.map((day, idx) => (
                  <Card key={idx} className="bg-slate-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Day {day.day}: {day.focus}</CardTitle>
                        <CheckCircle2 className="w-5 h-5 text-slate-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {day.tasks.map((task, taskIdx) => (
                          <li key={taskIdx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-amber-500 mt-1">•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!studyPath && !analyzing && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-16 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Ready to Create Your Study Path?</h3>
              <p className="text-slate-600 mb-8">Click "Analyze My Performance" above to generate personalised recommendations based on your practice history.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
