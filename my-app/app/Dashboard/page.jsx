"use client";
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  TrendingUp,
  BookOpen,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  BarChart3,
  Zap,
  Flame,
  Trophy,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Loader2,
  Lock,
  Brain
} from "lucide-react";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import _ from "lodash";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import MiniMock from "../components/MiniMock";
import DailyChallenge from "../components/DailyChallenge";
import ForgerHelper from "../components/ForgerHelper";
import AccountStatusSummary from "../components/dashboard/AccountStatusSummary";
import QuickPracticeDialog from "../components/dashboard/QuickPracticeDialog";
import GamificationWidget from "../components/GamificationWidget";
import PerformanceWatcher from '../components/PerformanceWatcher'; // NEW IMPORT
import AICreditBreakdown from '../components/AICreditBreakdown';

const FLK1_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Constitutional & Administrative Law", "EU Law", "The Legal System of England & Wales", "Legal Services"
];

const FLK2_SUBJECTS = [
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts", "Ethics & Professional Conduct"
];

const generateRecommendations = (weak = [], medium = [], strong = [], untested = [], goal, avgScore, examType, flk1Date, flk2Date) => {
  const recs = [];

  const flk1DaysToExam = flk1Date ? Math.ceil((new Date(flk1Date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const flk2DaysToExam = flk2Date ? Math.ceil((new Date(flk2Date) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const safeWeak = Array.isArray(weak) ? weak : [];
  const safeMedium = Array.isArray(medium) ? medium : [];
  const safeStrong = Array.isArray(strong) ? strong : [];
  const safeUntested = Array.isArray(untested) ? untested : [];

  let relevantWeakAreas = safeWeak;
  if (examType === 'FLK 1') {
    relevantWeakAreas = relevantWeakAreas.filter(w => FLK1_SUBJECTS.includes(w.subject));
  } else if (examType === 'FLK 2') {
    relevantWeakAreas = relevantWeakAreas.filter(w => FLK2_SUBJECTS.includes(w.subject));
  }

  if (relevantWeakAreas.length > 0) {
    const topWeak = relevantWeakAreas.slice(0, 3);
    recs.push({
      priority: 'high',
      title: `Urgent: Address Your Weak Areas`,
      description: `You're scoring below 60% in ${topWeak.map(w => w.subject).join(', ')}. These need immediate attention.`,
      action: 'View Personalised Practice',
      actionUrl: createPageUrl('PersonalisedPractice')
    });
  }

  if ((flk1DaysToExam && flk1DaysToExam <= 14) || (flk2DaysToExam && flk2DaysToExam <= 14)) {
    const daysLeft = Math.min(flk1DaysToExam || Infinity, flk2DaysToExam || Infinity);
    recs.push({
      priority: 'high',
      title: `⏰ Final Countdown: ${daysLeft} Days Until Exam`,
      description: `Switch to intensive revision mode. Focus on weak areas and full mock exams.`,
      action: 'Final Prep Mode',
      actionUrl: createPageUrl('FinalPrep')
    });
  }

  if (safeUntested.length > 0) {
    const untopics = safeUntested.slice(0, 3).join(', ');
    recs.push({
      priority: 'medium',
      title: 'Coverage Gap: Untested Subjects',
      description: `You haven't practiced questions in ${untopics}. Address these blind spots.`,
      action: 'View Study Path',
      actionUrl: createPageUrl('PersonalizedStudyPath')
    });
  }

  if (goal === 'last_minute_prep' && avgScore >= 65) {
    recs.push({
      priority: 'medium',
      title: 'Last-Minute Prep Strategy',
      description: 'Take full mock exams under timed conditions. Focus on exam technique over new content.',
      action: 'Take Mock Exam',
      actionUrl: createPageUrl('MockExams')
    });
  }

  if (goal === 'improve_weak_areas' && safeWeak.length > 0) {
    recs.push({
      priority: 'medium',
      title: 'Targeted Improvement Plan',
      description: 'Use spaced repetition to tackle your weak subjects systematically.',
      action: 'Personalised Practice',
      actionUrl: createPageUrl('PersonalisedPractice')
    });
  }

  if (avgScore >= 70 && safeWeak.length === 0) {
    recs.push({
      priority: 'low',
      title: 'You\'re On Track! 🎯',
      description: 'Strong performance across the board. Keep practicing consistently.',
      action: 'Continue Practice',
      actionUrl: createPageUrl('QuestionBank')
    });
  }

  return recs;
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    overallAccuracy: 0,
    completedMocks: 0,
    avgMockScore: 0,
    weakAreas: [],
    mediumAreas: [],
    strongAreas: [],
    untestedSubjects: []
  });
  const [recommendations, setRecommendations] = useState([]);
  const [showQuickPractice, setShowQuickPractice] = useState(false);
  const [examAttempts, setExamAttempts] = useState([]); // NEW: Store attempts for performance watcher

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Check authentication first
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        // Redirect to login if not authenticated
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      // Try to get current user
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Only fetch data if user is authenticated
      try {
        const answerLogs = await base44.entities.UserAnswerLog.filter(
          { created_by: currentUser.email },
          '-created_date',
          500
        );

        const examAttemptsData = await base44.entities.ExamAttempt.filter( // Renamed to avoid collision
          { created_by: currentUser.email },
          '-created_date',
          100
        );

        setExamAttempts(examAttemptsData); // NEW: Store for performance watcher

        // Add safety checks for arrays
        const safeAnswerLogs = Array.isArray(answerLogs) ? answerLogs : [];
        const safeExamAttempts = Array.isArray(examAttemptsData) ? examAttemptsData : []; // Use examAttemptsData

        const totalQuestions = safeAnswerLogs.length;
        const correctAnswers = safeAnswerLogs.filter(log => log && log.was_correct).length;
        const overallAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions * 100).toFixed(1) : 0;

        const completedMocks = safeExamAttempts.filter(a => a && a.completed).length;
        const avgMockScore = completedMocks > 0
          ? (safeExamAttempts.filter(a => a && a.completed).reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / completedMocks).toFixed(1)
          : 0;

        const subjectScores = {};

        for (const log of safeAnswerLogs) {
          if (!log) continue;
          const subject = log.subject || 'Unknown';

          if (!subjectScores[subject]) {
            subjectScores[subject] = { correct: 0, total: 0 };
          }
          subjectScores[subject].total++;
          if (log.was_correct) {
            subjectScores[subject].correct++;
          }
        }

        const subjectPerformance = Object.entries(subjectScores)
          .filter(([subject, stats]) => stats && stats.total >= 5 && subject !== 'Unknown')
          .map(([subject, stats]) => ({
            subject,
            accuracy: (stats.correct / stats.total * 100).toFixed(1),
            attempted: stats.total
          }))
          .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));

        const weakAreas = subjectPerformance.filter(s => parseFloat(s.accuracy) < 60);
        const mediumAreas = subjectPerformance.filter(s => parseFloat(s.accuracy) >= 60 && parseFloat(s.accuracy) < 75);
        const strongAreas = subjectPerformance.filter(s => parseFloat(s.accuracy) >= 75);

        const allSubjects = [...FLK1_SUBJECTS, ...FLK2_SUBJECTS];
        const testedSubjects = new Set(Object.keys(subjectScores).filter(s => s !== 'Unknown'));
        const untestedSubjects = allSubjects.filter(s => !testedSubjects.has(s));

        setStats({
          totalQuestions,
          overallAccuracy,
          completedMocks,
          avgMockScore,
          weakAreas: Array.isArray(weakAreas) ? weakAreas : [],
          mediumAreas: Array.isArray(mediumAreas) ? mediumAreas : [],
          strongAreas: Array.isArray(strongAreas) ? strongAreas : [],
          untestedSubjects: Array.isArray(untestedSubjects) ? untestedSubjects : []
        });

        const recs = generateRecommendations(
          weakAreas,
          mediumAreas,
          strongAreas,
          untestedSubjects,
          currentUser.study_goal || 'pass_exam',
          parseFloat(overallAccuracy),
          currentUser.exam_type || 'Both',
          currentUser.flk1_exam_date,
          currentUser.flk2_exam_date
        );
        setRecommendations(Array.isArray(recs) ? recs : []);

      } catch (dataError) {
        console.error('Failed to load user data:', dataError);
        // Set empty stats if data fetch fails
        setStats({
          totalQuestions: 0,
          overallAccuracy: 0,
          completedMocks: 0,
          avgMockScore: 0,
          weakAreas: [],
          mediumAreas: [],
          strongAreas: [],
          untestedSubjects: []
        });
        setRecommendations([]);
        setExamAttempts([]); // Also clear exam attempts on error
      }

    } catch (authError) {
      console.error('Authentication failed:', authError);
      // Redirect to login instead of showing error
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    setLoading(false);
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
        <Card className="max-w-md text-center p-8">
          <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Please Log In</h1>
          <p className="text-slate-600">Access your personalized dashboard by logging in.</p>
        </Card>
      </div>
    );
  }

  const hasActivity = stats && stats.totalQuestions > 0;
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  const safeWeakAreas = Array.isArray(stats?.weakAreas) ? stats.weakAreas : [];
  const safeStrongAreas = Array.isArray(stats?.strongAreas) ? stats.strongAreas : [];
  const safeUntestedSubjects = Array.isArray(stats?.untestedSubjects) ? stats.untestedSubjects : [];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50">
      {/* NEW: Silent performance watcher */}
      {user && examAttempts.length > 0 && (
        <PerformanceWatcher user={user} recentAttempts={examAttempts} />
      )}
      
      <div className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome back, {user.full_name?.split(' ')[0] || 'Student'}!</h1>
            <p className="text-slate-600 text-lg">Here's your study overview and personalized recommendations</p>
          </div>

          <AccountStatusSummary user={user} />

          {user?.role === 'admin' && (
            <div className="mb-8">
              <AICreditBreakdown />
            </div>
          )}

          {!hasActivity && (
            <Card className="mb-8 border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Get Started with SQEForge</h3>
                    <p className="text-slate-700 mb-6">
                      Welcome! Let's begin your SQE preparation journey. Here are some great ways to start:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Button asChild className="h-auto py-4 px-6 flex-col items-start bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200">
                        <Link href={createPageUrl("QuestionBank")}>
                          <Target className="w-6 h-6 mb-2 text-blue-600" />
                          <span className="font-bold">Practice Questions</span>
                          <span className="text-xs text-slate-600 mt-1">Start with 30 questions</span>
                        </Link>
                      </Button>
                      <Button asChild className="h-auto py-4 px-6 flex-col items-start bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200">
                        <Link href={createPageUrl("MockExams")}>
                          <BookOpen className="w-6 h-6 mb-2 text-amber-600" />
                          <span className="font-bold">Full Mock Exam</span>
                          <span className="text-xs text-slate-600 mt-1">90 question timed test</span>
                        </Link>
                      </Button>
                      <Button asChild className="h-auto py-4 px-6 flex-col items-start bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200">
                        <Link href={createPageUrl("InteractivePractice")}>
                          <Brain className="w-6 h-6 mb-2 text-purple-600" />
                          <span className="font-bold">Interactive Quiz</span>
                          <span className="text-xs text-slate-600 mt-1">Timed with explanations</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Questions Practiced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{stats?.totalQuestions || 0}</div>
                <p className="text-sm text-slate-500 mt-1">Total questions attempted</p>
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
                <div className="text-4xl font-bold text-slate-900">{stats?.overallAccuracy || 0}%</div>
                <Progress value={parseFloat(stats?.overallAccuracy || 0)} className="h-2 mt-3" />
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Mock Exams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{stats?.completedMocks || 0}</div>
                <p className="text-sm text-slate-500 mt-1">Avg: {stats?.avgMockScore || 0}%</p>
              </CardContent>
            </Card>
          </div>

          <GamificationWidget user={user} />

          {hasActivity && safeRecommendations.length > 0 && (
            <Card className="mb-8 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Personalised Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {safeRecommendations.map((rec, idx) => (
                  <Alert key={idx} className={
                    rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                    rec.priority === 'medium' ? 'border-amber-200 bg-amber-50' :
                    'border-green-200 bg-green-50'
                  }>
                    <div className="flex items-start gap-3">
                      {rec.priority === 'high' && <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />}
                      {rec.priority === 'medium' && <Zap className="w-5 h-5 text-amber-600 mt-0.5" />}
                      {rec.priority === 'low' && <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />}
                      <div className="flex-1">
                        <AlertTitle className={
                          rec.priority === 'high' ? 'text-red-900' :
                          rec.priority === 'medium' ? 'text-amber-900' :
                          'text-green-900'
                        }>{rec.title}</AlertTitle>
                        <AlertDescription className={
                          rec.priority === 'high' ? 'text-red-800' :
                          rec.priority === 'medium' ? 'text-amber-800' :
                          'text-green-800'
                        }>
                          {rec.description}
                        </AlertDescription>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={rec.actionUrl}>
                          {rec.action}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <MiniMock />
            <DailyChallenge />
          </div>

          {hasActivity && stats && (
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {safeWeakAreas.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      Areas Needing Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {safeWeakAreas.slice(0, 5).map((area, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-slate-900">{area.subject}</p>
                            <p className="text-xs text-slate-600">{area.attempted} questions</p>
                          </div>
                          <Badge className="bg-red-600 text-white">{area.accuracy}%</Badge>
                        </div>
                      ))}
                    </div>
                    <Button asChild className="w-full mt-4 bg-red-600 hover:bg-red-700">
                      <Link href={createPageUrl('PersonalisedPractice')}>
                        Focus on Weak Areas
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {safeStrongAreas.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      Strong Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {safeStrongAreas.slice(0, 5).map((area, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-semibold text-slate-900">{area.subject}</p>
                            <p className="text-xs text-slate-600">{area.attempted} questions</p>
                          </div>
                          <Badge className="bg-green-600 text-white">{area.accuracy}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {hasActivity && safeUntestedSubjects.length > 0 && (
            <Card className="mb-8 border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="w-5 h-5" />
                  Coverage Gaps: {safeUntestedSubjects.length} Untested Subject{safeUntestedSubjects.length > 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-800 mb-4">You haven't practiced questions from these subjects yet:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {safeUntestedSubjects.map((subject, idx) => (
                    <Badge key={idx} variant="outline" className="border-amber-400 text-amber-900">
                      {subject}
                    </Badge>
                  ))}
                </div>
                <Button asChild className="bg-amber-600 hover:bg-amber-700">
                  <Link href={createPageUrl('PersonalizedStudyPath')}>
                    Complete Your Coverage
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Button
                  onClick={() => setShowQuickPractice(true)}
                  className="h-20 flex-col bg-linear-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Target className="w-6 h-6 mb-2" />
                  Quick Practice
                </Button>
                <Button asChild className="h-20 flex-col bg-linear-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Link href={createPageUrl("InteractivePractice")}>
                    <Brain className="w-6 h-6 mb-2" />
                    Interactive Quiz
                  </Link>
                </Button>
                <Button asChild className="h-20 flex-col bg-linear-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Link href={createPageUrl("MockExams")}>
                    <BookOpen className="w-6 h-6 mb-2" />
                    Mock Exam
                  </Link>
                </Button>
                <Button asChild className="h-20 flex-col bg-linear-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Link href={createPageUrl("ProgressTracker")}>
                    <BarChart3 className="w-6 h-6 mb-2" />
                    Progress
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <ForgerHelper />
        </div>
      </div>

      <QuickPracticeDialog
        open={showQuickPractice}
        onOpenChange={setShowQuickPractice}
      />
    </div>
  );
}