"use client";
import React, { useState, useEffect } from 'react';
import { User, ExamAttempt, Question, UserAnswerLog } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Users, Target, Clock, Award, AlertCircle, BarChart3, Lock, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import _ from 'lodash';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution", "Property Practice", 
  "Land Law", "Wills & Administration of Estates", "Trusts", "Criminal Law", "Criminal Practice", 
  "Solicitors Accounts", "Constitutional & Administrative Law", "EU Law", 
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const OFFICIAL_SQE_AVG_SECONDS = 102;

// Tier-based feature access
const TIER_FEATURES = {
  starter: {
    overallComparison: true,
    timingAnalysis: false,
    subjectBreakdown: false,
    examTypeComparison: false,
    percentileRanking: false,
    detailedInsights: false
  },
  pro: {
    overallComparison: true,
    timingAnalysis: true,
    subjectBreakdown: true,
    examTypeComparison: true,
    percentileRanking: true,
    detailedInsights: false
  },
  ultimate: {
    overallComparison: true,
    timingAnalysis: true,
    subjectBreakdown: true,
    examTypeComparison: true,
    percentileRanking: true,
    detailedInsights: true
  }
};

export default function PerformanceBenchmarks() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [benchmarks, setBenchmarks] = useState(null);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    loadBenchmarkData();
  }, []);

  const loadBenchmarkData = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [allAttempts, allAnswerLogs, allQuestions] = await Promise.all([
        ExamAttempt.list(),
        UserAnswerLog.list(),
        Question.list()
      ]);

      const platformStats = calculatePlatformStats(allAttempts, allAnswerLogs, allQuestions);
      const userAttempts = allAttempts.filter(a => a.created_by === currentUser.email);
      const userAnswerLogs = allAnswerLogs.filter(log => log.created_by === currentUser.email);
      const userStatsData = calculateUserStats(userAttempts, userAnswerLogs, allQuestions, currentUser.email);
      const comparison = comparePerformance(userStatsData, platformStats);

      setBenchmarks({ platformStats, comparison });
      setUserStats(userStatsData);

    } catch (error) {
      console.error("Failed to load benchmark data:", error);
    }
    setLoading(false);
  };

  const calculatePlatformStats = (allAttempts, allAnswerLogs, allQuestions) => {
    const questionMap = new Map(allQuestions.map(q => [q.id, q]));
    
    const validAttempts = allAttempts.filter(a => a.completed && a.total_questions > 0);
    const avgMockScore = validAttempts.length > 0
      ? validAttempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / validAttempts.length
      : 0;

    const subjectPerformance = {};
    for (const log of allAnswerLogs) {
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

    const subjectAverages = {};
    for (const [subject, stats] of Object.entries(subjectPerformance)) {
      subjectAverages[subject] = stats.total > 0 ? (stats.correct / stats.total * 100) : 0;
    }

    const timedAttempts = validAttempts.filter(a => a.is_timed && a.question_times);
    let allQuestionTimes = [];
    for (const attempt of timedAttempts) {
      const times = Object.values(attempt.question_times);
      allQuestionTimes.push(...times);
    }
    const avgQuestionTime = allQuestionTimes.length > 0
      ? allQuestionTimes.reduce((sum, t) => sum + t, 0) / allQuestionTimes.length
      : OFFICIAL_SQE_AVG_SECONDS;

    const flk1Attempts = validAttempts.filter(a => a.mock_exam_title?.includes('FLK 1') || a.mock_exam_title?.includes('FLK1'));
    const flk2Attempts = validAttempts.filter(a => a.mock_exam_title?.includes('FLK 2') || a.mock_exam_title?.includes('FLK2'));

    const avgFLK1Score = flk1Attempts.length > 0
      ? flk1Attempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / flk1Attempts.length
      : 0;
    
    const avgFLK2Score = flk2Attempts.length > 0
      ? flk2Attempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / flk2Attempts.length
      : 0;

    return {
      avgMockScore,
      subjectAverages,
      avgQuestionTime,
      totalAttempts: validAttempts.length,
      totalUsers: new Set(allAttempts.map(a => a.created_by)).size,
      avgFLK1Score,
      avgFLK2Score
    };
  };

  const calculateUserStats = (userAttempts, userAnswerLogs, allQuestions, userEmail) => {
    const questionMap = new Map(allQuestions.map(q => [q.id, q]));
    
    const validAttempts = userAttempts.filter(a => a.completed && a.total_questions > 0);
    const avgMockScore = validAttempts.length > 0
      ? validAttempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / validAttempts.length
      : 0;

    const subjectPerformance = {};
    for (const log of userAnswerLogs) {
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

    const subjectScores = {};
    for (const [subject, stats] of Object.entries(subjectPerformance)) {
      if (stats.total >= 5) {
        subjectScores[subject] = (stats.correct / stats.total * 100);
      }
    }

    const timedAttempts = validAttempts.filter(a => a.is_timed && a.question_times);
    let allQuestionTimes = [];
    for (const attempt of timedAttempts) {
      const times = Object.values(attempt.question_times);
      allQuestionTimes.push(...times);
    }
    const avgQuestionTime = allQuestionTimes.length > 0
      ? allQuestionTimes.reduce((sum, t) => sum + t, 0) / allQuestionTimes.length
      : null;

    const flk1Attempts = validAttempts.filter(a => a.mock_exam_title?.includes('FLK 1') || a.mock_exam_title?.includes('FLK1'));
    const flk2Attempts = validAttempts.filter(a => a.mock_exam_title?.includes('FLK 2') || a.mock_exam_title?.includes('FLK2'));

    const avgFLK1Score = flk1Attempts.length > 0
      ? flk1Attempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / flk1Attempts.length
      : null;
    
    const avgFLK2Score = flk2Attempts.length > 0
      ? flk2Attempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / flk2Attempts.length
      : null;

    return {
      avgMockScore,
      subjectScores,
      avgQuestionTime,
      totalAttempts: validAttempts.length,
      avgFLK1Score,
      avgFLK2Score
    };
  };

  const comparePerformance = (userStats, platformStats) => {
    const insights = [];

    if (userStats.totalAttempts > 0) {
      const scoreDiff = userStats.avgMockScore - platformStats.avgMockScore;
      const percentile = scoreDiff > 0 
        ? Math.min(50 + (scoreDiff / platformStats.avgMockScore * 50), 95)
        : Math.max(50 - (Math.abs(scoreDiff) / platformStats.avgMockScore * 50), 5);

      insights.push({
        type: 'overall',
        tier: 'starter',
        category: scoreDiff >= 5 ? 'outperform' : scoreDiff <= -5 ? 'underperform' : 'average',
        title: scoreDiff >= 5 ? 'Above Average Performance' : scoreDiff <= -5 ? 'Below Average Performance' : 'Average Performance',
        description: `Your average mock exam score of ${userStats.avgMockScore.toFixed(1)}% is ${Math.abs(scoreDiff).toFixed(1)}% ${scoreDiff >= 0 ? 'higher' : 'lower'} than the platform average of ${platformStats.avgMockScore.toFixed(1)}%. You're in the top ${(100 - percentile).toFixed(0)}% of users.`,
        userScore: userStats.avgMockScore,
        platformScore: platformStats.avgMockScore,
        difference: scoreDiff,
        percentile
      });
    }

    const subjectInsights = [];
    for (const subject of ALL_SUBJECTS) {
      const userScore = userStats.subjectScores[subject];
      const platformScore = platformStats.subjectAverages[subject];

      if (userScore !== undefined && platformScore !== undefined) {
        const diff = userScore - platformScore;
        if (Math.abs(diff) >= 10) {
          subjectInsights.push({
            subject,
            userScore,
            platformScore,
            difference: diff,
            category: diff > 0 ? 'strength' : 'weakness'
          });
        }
      }
    }

    subjectInsights.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    if (subjectInsights.length > 0) {
      const strengths = subjectInsights.filter(s => s.category === 'strength').slice(0, 3);
      const weaknesses = subjectInsights.filter(s => s.category === 'weakness').slice(0, 3);

      if (strengths.length > 0) {
        insights.push({
          type: 'subject',
          tier: 'pro',
          category: 'outperform',
          title: 'Standout Subjects',
          description: `You significantly outperform the average in ${strengths.map(s => s.subject).join(', ')}.`,
          subjects: strengths
        });
      }

      if (weaknesses.length > 0) {
        insights.push({
          type: 'subject',
          tier: 'pro',
          category: 'underperform',
          title: 'Areas Needing Attention',
          description: `You're scoring below average in ${weaknesses.map(s => s.subject).join(', ')}. Focus here to catch up.`,
          subjects: weaknesses
        });
      }
    }

    if (userStats.avgQuestionTime !== null) {
      const timeDiff = userStats.avgQuestionTime - platformStats.avgQuestionTime;
      const category = Math.abs(timeDiff) <= 10 ? 'average' : timeDiff < 0 ? 'faster' : 'slower';
      
      insights.push({
        type: 'timing',
        tier: 'pro',
        category,
        title: category === 'faster' ? 'Faster Than Average' : category === 'slower' ? 'Slower Than Average' : 'Average Pacing',
        description: `You average ${Math.round(userStats.avgQuestionTime)}s per question, which is ${Math.abs(Math.round(timeDiff))}s ${timeDiff < 0 ? 'faster' : 'slower'} than the platform average of ${Math.round(platformStats.avgQuestionTime)}s.`,
        userTime: userStats.avgQuestionTime,
        platformTime: platformStats.avgQuestionTime,
        difference: timeDiff
      });
    }

    if (userStats.avgFLK1Score !== null) {
      const diff = userStats.avgFLK1Score - platformStats.avgFLK1Score;
      insights.push({
        type: 'exam',
        tier: 'pro',
        examType: 'FLK1',
        category: diff >= 5 ? 'outperform' : diff <= -5 ? 'underperform' : 'average',
        title: `FLK1 Performance: ${diff >= 5 ? 'Above Average' : diff <= -5 ? 'Below Average' : 'Average'}`,
        description: `Your FLK1 average of ${userStats.avgFLK1Score.toFixed(1)}% is ${Math.abs(diff).toFixed(1)}% ${diff >= 0 ? 'higher' : 'lower'} than the platform average.`,
        userScore: userStats.avgFLK1Score,
        platformScore: platformStats.avgFLK1Score,
        difference: diff
      });
    }

    if (userStats.avgFLK2Score !== null) {
      const diff = userStats.avgFLK2Score - platformStats.avgFLK2Score;
      insights.push({
        type: 'exam',
        tier: 'pro',
        examType: 'FLK2',
        category: diff >= 5 ? 'outperform' : diff <= -5 ? 'underperform' : 'average',
        title: `FLK2 Performance: ${diff >= 5 ? 'Above Average' : diff <= -5 ? 'Below Average' : 'Average'}`,
        description: `Your FLK2 average of ${userStats.avgFLK2Score.toFixed(1)}% is ${Math.abs(diff).toFixed(1)}% ${diff >= 0 ? 'higher' : 'lower'} than the platform average.`,
        userScore: userStats.avgFLK2Score,
        platformScore: platformStats.avgFLK2Score,
        difference: diff
      });
    }

    return insights;
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
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8 border-none shadow-xl">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Please Log In</h1>
          <p className="text-slate-600">Log in to view your performance benchmarks.</p>
        </Card>
      </div>
    );
  }

  if (!userStats || userStats.totalAttempts === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Performance Benchmarks</h1>
          <Card className="border-none shadow-xl">
            <CardContent className="p-16 text-center">
              <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Not Enough Data Yet</h3>
              <p className="text-slate-600 mb-8">
                Complete at least one mock exam to see how your performance compares to other users on the platform.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const userTier = user.role === 'admin' ? 'ultimate' : (user.subscription_tier || 'starter');
  const tierFeatures = TIER_FEATURES[userTier];

  // Filter insights based on tier
  const visibleInsights = benchmarks.comparison.filter(insight => {
    const insightTier = insight.tier || 'starter';
    if (insightTier === 'starter') return true;
    if (insightTier === 'pro' && (userTier === 'pro' || userTier === 'ultimate')) return true;
    if (insightTier === 'ultimate' && userTier === 'ultimate') return true;
    return false;
  });

  const lockedInsights = benchmarks.comparison.filter(insight => !visibleInsights.includes(insight));

  const categoryColors = {
    outperform: 'bg-green-50 border-green-200',
    underperform: 'bg-red-50 border-red-200',
    average: 'bg-blue-50 border-blue-200',
    strength: 'bg-green-50 border-green-200',
    weakness: 'bg-amber-50 border-amber-200',
    faster: 'bg-blue-50 border-blue-200',
    slower: 'bg-amber-50 border-amber-200'
  };

  const categoryIcons = {
    outperform: <TrendingUp className="w-6 h-6 text-green-600" />,
    underperform: <TrendingDown className="w-6 h-6 text-red-600" />,
    average: <Target className="w-6 h-6 text-blue-600" />,
    strength: <Award className="w-6 h-6 text-green-600" />,
    weakness: <AlertCircle className="w-6 h-6 text-amber-600" />,
    faster: <Clock className="w-6 h-6 text-blue-600" />,
    slower: <Clock className="w-6 h-6 text-amber-600" />
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Performance Benchmarks</h1>
          <p className="text-slate-600">See how you compare to {benchmarks.platformStats.totalUsers} users across the platform</p>
          <Badge className="mt-2 bg-purple-600 text-white">
            {userTier === 'starter' ? 'Starter' : userTier === 'pro' ? 'Pro' : 'Ultimate'} Insights
          </Badge>
        </div>

        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <Users className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Anonymized Comparison</AlertTitle>
          <AlertDescription className="text-blue-800">
            All data is aggregated and anonymized. We compare your performance against platform averages to help you understand your strengths and areas for improvement.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Your Average</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-900">{userStats.avgMockScore.toFixed(1)}%</p>
              <p className="text-sm text-slate-500 mt-1">Mock exam average</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Platform Average</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-900">{benchmarks.platformStats.avgMockScore.toFixed(1)}%</p>
              <p className="text-sm text-slate-500 mt-1">Across all users</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Your Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              {tierFeatures.percentileRanking ? (
                <>
                  <p className="text-4xl font-bold text-slate-900">
                    {benchmarks.comparison.find(c => c.type === 'overall')?.percentile 
                      ? `Top ${(100 - benchmarks.comparison.find(c => c.type === 'overall').percentile).toFixed(0)}%`
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Of all users</p>
                </>
              ) : (
                <div className="text-center">
                  <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Pro Feature</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 mb-8">
          {visibleInsights.map((insight, idx) => (
            <Card key={idx} className={`border-2 ${categoryColors[insight.category]}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {categoryIcons[insight.category]}
                  <CardTitle className="text-xl">{insight.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 mb-4">{insight.description}</p>
                
                {insight.type === 'overall' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Your Score</p>
                      <Progress value={insight.userScore} className="h-3 mb-1" />
                      <p className="text-lg font-bold">{insight.userScore.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Platform Average</p>
                      <Progress value={insight.platformScore} className="h-3 mb-1" />
                      <p className="text-lg font-bold">{insight.platformScore.toFixed(1)}%</p>
                    </div>
                  </div>
                )}

                {insight.type === 'subject' && insight.subjects && (
                  <div className="space-y-3 mt-4">
                    {insight.subjects.map(subj => (
                      <div key={subj.subject} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="font-medium text-slate-900">{subj.subject}</span>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-slate-600">You</p>
                            <p className="text-lg font-bold">{subj.userScore.toFixed(1)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">Average</p>
                            <p className="text-lg font-bold">{subj.platformScore.toFixed(1)}%</p>
                          </div>
                          <Badge variant={subj.difference > 0 ? 'default' : 'destructive'}>
                            {subj.difference > 0 ? '+' : ''}{subj.difference.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {insight.type === 'timing' && (
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Your Average</p>
                      <p className="text-2xl font-bold">{Math.round(insight.userTime)}s</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Platform Average</p>
                      <p className="text-2xl font-bold">{Math.round(insight.platformTime)}s</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Difference</p>
                      <p className="text-2xl font-bold">{insight.difference > 0 ? '+' : ''}{Math.round(insight.difference)}s</p>
                    </div>
                  </div>
                )}

                {insight.type === 'exam' && (
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Your {insight.examType} Average</p>
                      <p className="text-3xl font-bold">{insight.userScore.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Platform {insight.examType} Average</p>
                      <p className="text-3xl font-bold">{insight.platformScore.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {lockedInsights.length > 0 && (
            <Card className="border-2 border-amber-300 bg-linear-to-br from-amber-50 to-amber-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-amber-600" />
                  <CardTitle className="text-xl text-amber-900">
                    {lockedInsights.length} More Insight{lockedInsights.length > 1 ? 's' : ''} Available
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-amber-800 mb-4">
                  Upgrade to {userTier === 'starter' ? 'Pro or Ultimate' : 'Ultimate'} to unlock:
                </p>
                <ul className="space-y-2 mb-6">
                  {!tierFeatures.timingAnalysis && (
                    <li className="flex items-center gap-2 text-amber-900">
                      <Clock className="w-4 h-4" />
                      <span>Detailed timing analysis vs platform average</span>
                    </li>
                  )}
                  {!tierFeatures.subjectBreakdown && (
                    <li className="flex items-center gap-2 text-amber-900">
                      <Award className="w-4 h-4" />
                      <span>Subject-by-subject performance breakdown</span>
                    </li>
                  )}
                  {!tierFeatures.examTypeComparison && (
                    <li className="flex items-center gap-2 text-amber-900">
                      <BarChart3 className="w-4 h-4" />
                      <span>FLK1 vs FLK2 comparison insights</span>
                    </li>
                  )}
                  {!tierFeatures.percentileRanking && (
                    <li className="flex items-center gap-2 text-amber-900">
                      <TrendingUp className="w-4 h-4" />
                      <span>Percentile ranking among all users</span>
                    </li>
                  )}
                </ul>
                <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  <Link to={createPageUrl("Packages")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-blue-900 mb-3">Your {userTier === 'starter' ? 'Starter' : userTier === 'pro' ? 'Pro' : 'Ultimate'} Benchmarking Features</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              {tierFeatures.overallComparison && <li>• <strong>Overall Performance:</strong> Compare your average to all users</li>}
              {tierFeatures.percentileRanking && <li>• <strong>Percentile Ranking:</strong> See exactly where you stand</li>}
              {tierFeatures.subjectBreakdown && <li>• <strong>Subject Analysis:</strong> Identify strengths and weaknesses</li>}
              {tierFeatures.timingAnalysis && <li>• <strong>Timing Insights:</strong> Compare your pacing to the platform</li>}
              {tierFeatures.examTypeComparison && <li>• <strong>Exam Type Breakdown:</strong> Separate FLK1/FLK2 analysis</li>}
              <li>• <strong>Privacy:</strong> All comparisons use anonymized, aggregated data</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}