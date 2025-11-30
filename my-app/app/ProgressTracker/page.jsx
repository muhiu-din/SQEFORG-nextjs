"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Award, Calendar,
  CheckCircle2, XCircle, BarChart3, Loader2, Filter,
  AlertTriangle, BookOpen, Clock, Zap, Eye, Download,
  Flame, Trophy, FileText
} from 'lucide-react';
import { format, parseISO, subDays, subMonths, isAfter, isBefore } from 'date-fns';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import Watermark from '@/components/Watermark';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ComparativeBenchmark from '@/components/ComparativeBenchmark';
import next from 'next';

const CHART_COLORS = {
  primary: '#1e293b',
  secondary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899',
};

const SUBJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#84cc16',
];

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <Card className="border-none shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color.replace('text-', 'bg-')}-100`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ProgressTracker() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examAttempts, setExamAttempts] = useState([]);
  const [answerLogs, setAnswerLogs] = useState([]);
  const [filteredAttempts, setFilteredAttempts] = useState([]);

  const [examTypeFilter, setExamTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [completedOnly, setCompletedOnly] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [examAttempts, examTypeFilter, dateRangeFilter, customStartDate, customEndDate, completedOnly]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const attempts = await base44.entities.ExamAttempt.filter(
        { created_by: currentUser.email },
        '-created_date',
        500
      );
      setExamAttempts(attempts);

      const logs = await base44.entities.UserAnswerLog.filter(
        { created_by: currentUser.email },
        '-created_date',
        1000
      );
      setAnswerLogs(logs);

    } catch (error) {
      console.error("Failed to load progress data:", error);
      setUser({
        email: 'guest@example.com',
        current_streak: 0,
        longest_streak: 0,
        total_study_time_minutes: 0,
      });
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...examAttempts];

    if (completedOnly) {
      filtered = filtered.filter(a => a.completed);
    }

    if (examTypeFilter !== 'all') {
      filtered = filtered.filter(a => {
        const examType = a.exam_type || (a.mock_exam_title?.includes('FLK 1') ? 'FLK 1' :
                                          a.mock_exam_title?.includes('FLK 2') ? 'FLK 2' : 'Mixed');
        return examType === examTypeFilter;
      });
    }

    const now = new Date();
    let startDate = null;

    if (dateRangeFilter === '7days') {
      startDate = subDays(now, 7);
    } else if (dateRangeFilter === '30days') {
      startDate = subDays(now, 30);
    } else if (dateRangeFilter === '90days') {
      startDate = subDays(now, 90);
    } else if (dateRangeFilter === 'custom' && customStartDate) {
      startDate = parseISO(customStartDate);
    }

    if (startDate) {
      filtered = filtered.filter(a => {
        const attemptDate = parseISO(a.created_date);
        const afterStart = isAfter(attemptDate, startDate);

        if (dateRangeFilter === 'custom' && customEndDate) {
          const endDate = parseISO(customEndDate);
          return afterStart && isBefore(attemptDate, endDate);
        }

        return afterStart;
      });
    }

    setFilteredAttempts(filtered);
  };

  const calculateScoreData = () => {
    return filteredAttempts.map((attempt, index) => {
      const percentage = (attempt.score / attempt.total_questions * 100).toFixed(1);
      return {
        attempt: `Exam ${filteredAttempts.length - index}`,
        score: parseFloat(percentage),
        date: format(parseISO(attempt.created_date), 'MMM d'),
        rawScore: attempt.score,
        total: attempt.total_questions,
        title: attempt.mock_exam_title,
      };
    }).reverse();
  };

  const calculateSubjectPerformance = () => {
    const subjectStats = {};

    answerLogs.forEach(log => {
      if (!log.subject) return;

      if (!subjectStats[log.subject]) {
        subjectStats[log.subject] = { correct: 0, total: 0 };
      }

      subjectStats[log.subject].total++;
      if (log.was_correct) {
        subjectStats[log.subject].correct++;
      }
    });

    return Object.entries(subjectStats)
      .map(([subject, stats]) => ({
        subject,
        accuracy: (stats.correct / stats.total * 100).toFixed(1),
        correct: stats.correct,
        total: stats.total,
        incorrect: stats.total - stats.correct,
        attempted: stats.total,
        avgScore: (stats.correct / stats.total * 100).toFixed(1)
      }))
      .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
  };

  const calculateWeakAreas = () => {
    const subjectPerf = calculateSubjectPerformance();
    return subjectPerf.filter(s => parseFloat(s.accuracy) < 60);
  };

  const calculateStrengths = () => {
    const subjectPerf = calculateSubjectPerformance();
    return subjectPerf.filter(s => parseFloat(s.accuracy) >= 75).reverse();
  };

  const calculateOverallStats = () => {
    const totalAttempts = filteredAttempts.length;
    const avgScore = totalAttempts > 0
      ? (filteredAttempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / totalAttempts).toFixed(1)
      : 0;

    const totalQuestions = answerLogs.length;
    const correctAnswers = answerLogs.filter(l => l.was_correct).length;
    const overallAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions * 100).toFixed(1) : 0;

    const recentAttempts = filteredAttempts.slice(0, 5);
    const recentAvg = recentAttempts.length > 0
      ? (recentAttempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / recentAttempts.length).toFixed(1)
      : 0;

    const trend = recentAttempts.length >= 2
      ? parseFloat(recentAvg) - parseFloat(avgScore)
      : 0;

    const strongAreas = calculateStrengths().slice(0, 5);
    const completedMocks = filteredAttempts.filter(a => a.completed).length;
    const avgMockScore = parseFloat(avgScore);

    return {
      totalAttempts,
      avgScore: parseFloat(avgScore),
      overallAccuracy: parseFloat(overallAccuracy),
      totalQuestions,
      correctAnswers,
      recentAvg: parseFloat(recentAvg),
      trend,
      strongAreas,
      completedMocks,
      avgMockScore,
    };
  };

  const exportData = () => {
    const csvData = filteredAttempts.map(attempt => ({
      Date: format(parseISO(attempt.created_date), 'yyyy-MM-dd HH:mm'),
      Exam: attempt.mock_exam_title,
      Score: attempt.score,
      Total: attempt.total_questions,
      Percentage: (attempt.score / attempt.total_questions * 100).toFixed(1),
      TimeTaken: attempt.time_taken_minutes,
    }));

    if (csvData.length === 0) {
      alert("No data to export.");
      return;
    }

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
      </div>
    );
  }

  const scoreData = calculateScoreData();
  const subjectPerformance = calculateSubjectPerformance();
  const weakAreas = calculateWeakAreas();
  const strengths = calculateStrengths();
  const stats = calculateOverallStats();
  const allAttempts = examAttempts;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <Watermark />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-purple-600" />
              Advanced Progress Tracker
            </h1>
            <p className="text-slate-600">Comprehensive insights into your study progress and performance</p>
          </div>
          {filteredAttempts.length > 0 && (
            <Button onClick={exportData} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          )}
        </div>

        <Card className="mb-8 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Exam Type</Label>
                <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="FLK 1">FLK 1</SelectItem>
                    <SelectItem value="FLK 2">FLK 2</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date Range</Label>
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRangeFilter === 'custom' && (
                <>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </>
              )}
            </div>

            {filteredAttempts.length > 0 && (
              <p className="text-sm text-slate-600 mt-4">
                Showing {filteredAttempts.length} exam attempt{filteredAttempts.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        {user && (
          <ComparativeBenchmark 
            userStats={{
              avgMockScore: stats.avgScore,
              totalQuestions: allAttempts.reduce((sum, a) => sum + a.total_questions, 0),
              weakAreasCount: subjectPerformance.filter(s => parseFloat(s.avgScore) < 65).length,
              completedMocks: filteredAttempts.filter(a => a.completed).length
            }}
            daysUntilExam={user.flk1_exam_date ? Math.ceil((new Date(user.flk1_exam_date) - new Date()) / (1000 * 60 * 60 * 24)) : null}
          />
        )}

        {filteredAttempts.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
              No exam attempts found for the selected filters. Try adjusting your filters or take some exams to see your progress!
              <div className="mt-4">
                <Link href={createPageUrl('MockExams')}>
                  <Button className="bg-slate-900 hover:bg-slate-800">
                    Take a Mock Exam
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6 mt-8">
            <TabsList className="grid w-full grid-cols-3"> {/* Changed grid-cols to 3 */}
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subjects">By Subject</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Exams Taken"
                  value={stats.totalAttempts}
                  icon={BarChart3}
                  color="text-blue-600"
                />
                <StatsCard
                  title="Avg Score"
                  value={`${stats.avgScore}%`}
                  icon={Target}
                  color="text-purple-600"
                />
                <Card className="border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Recent Avg</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-slate-900">{stats.recentAvg}%</p>
                          {stats.trend !== 0 && (
                            <div className={`flex items-center ${stats.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stats.trend > 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="text-xs font-semibold ml-1">
                                {Math.abs(stats.trend).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <StatsCard
                  title="Overall Accuracy"
                  value={`${stats.overallAccuracy}%`}
                  icon={Zap}
                  color="text-amber-600"
                />
              </div>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Score Progression Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {scoreData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={scoreData}>
                          <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#64748b" />
                          <YAxis domain={[0, 100]} stroke="#64748b" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '12px'
                            }}
                            formatter={(value, name, props) => [
                              `${value}% (${props.payload.rawScore}/${props.payload.total})`,
                              'Score'
                            ]}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                return payload[0].payload.title;
                              }
                              return label;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke={CHART_COLORS.secondary}
                            strokeWidth={3}
                            fill="url(#scoreGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>

                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">Trend Analysis</h4>
                        <p className="text-sm text-blue-800">
                          {stats.trend > 5 && "🎉 Excellent progress! Your scores are trending upward significantly."}
                          {stats.trend > 0 && stats.trend <= 5 && "📈 Good improvement! Keep up the consistent practice."}
                          {stats.trend === 0 && "📊 Your performance is stable. Focus on weak areas to see improvement."}
                          {stats.trend < 0 && stats.trend >= -5 && "📉 Slight dip in recent scores. Review your weak areas and adjust your study approach."}
                          {stats.trend < -5 && "⚠️ Scores declining. Consider taking a break and reviewing fundamentals before continuing."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-slate-500 py-8">No score data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Performance by Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  {subjectPerformance.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={subjectPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                          <YAxis
                            dataKey="subject"
                            type="category"
                            width={200}
                            stroke="#64748b"
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '12px'
                            }}
                            formatter={(value, name, props) => [
                              `${value}% (${props.payload.correct}/${props.payload.total})`,
                              'Accuracy'
                            ]}
                          />
                          <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
                            {subjectPerformance.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={parseFloat(entry.accuracy) < 60 ? CHART_COLORS.danger :
                                      parseFloat(entry.accuracy) < 75 ? CHART_COLORS.warning :
                                      CHART_COLORS.success}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="mt-6 grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="font-semibold text-red-900">Below 60%</span>
                          </div>
                          <p className="text-2xl font-bold text-red-900">
                            {subjectPerformance.filter(s => parseFloat(s.accuracy) < 60).length}
                          </p>
                          <p className="text-sm text-red-700">Need improvement</p>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="font-semibold text-amber-900">60-75%</span>
                          </div>
                          <p className="text-2xl font-bold text-amber-900">
                            {subjectPerformance.filter(s => parseFloat(s.accuracy) >= 60 && parseFloat(s.accuracy) < 75).length}
                          </p>
                          <p className="text-sm text-amber-700">Moderate performance</p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-semibold text-green-900">Above 75%</span>
                          </div>
                          <p className="text-2xl font-bold text-green-900">
                            {subjectPerformance.filter(s => parseFloat(s.accuracy) >= 75).length}
                          </p>
                          <p className="text-sm text-green-700">Strong performance</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-slate-500 py-8">No subject data available</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-red-50 border-b border-red-100">
                    <CardTitle className="flex items-center gap-2 text-red-900">
                      <AlertTriangle className="w-5 h-5" />
                      Areas Needing Improvement ({weakAreas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {weakAreas.length > 0 ? (
                      <div className="space-y-4">
                        {weakAreas.map((area, idx) => (
                          <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-slate-900">{area.subject}</h4>
                              <Badge className="bg-red-600">{area.accuracy}%</Badge>
                            </div>
                            <Progress value={parseFloat(area.accuracy)} className="h-2 mb-2" />
                            <p className="text-sm text-slate-600">
                              {area.correct}/{area.total} correct • {area.incorrect} to review
                            </p>
                            <Link href={createPageUrl('QuestionBank') + `?startSession=true&subject=${encodeURIComponent(area.subject)}&numQuestions=20&difficulty=All&feedbackMode=instant`}>
                              <Button size="sm" className="mt-3 w-full bg-red-600 hover:bg-red-700">
                                <Target className="w-4 h-4 mr-2" />
                                Practice This Subject
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <p className="text-slate-600">No weak areas! All subjects above 60%</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-green-50 border-b border-green-100">
                    <CardTitle className="flex items-center gap-2 text-green-900">
                      <Award className="w-5 h-5" />
                      Your Strengths ({strengths.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {strengths.length > 0 ? (
                      <div className="space-y-4">
                        {strengths.map((area, idx) => (
                          <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-slate-900">{area.subject}</h4>
                              <Badge className="bg-green-600">{area.accuracy}%</Badge>
                            </div>
                            <Progress value={parseFloat(area.accuracy)} className="h-2 mb-2" />
                            <p className="text-sm text-slate-600">
                              {area.correct}/{area.total} correct • Excellent work!
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600">Keep practicing to build strengths!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Complete Exam History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredAttempts.map((attempt) => {
                      const percentage = (attempt.score / attempt.total_questions * 100).toFixed(1);
                      const isPassing = parseFloat(percentage) >= 60;

                      return (
                        <div key={attempt.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 mb-1">
                                {attempt.mock_exam_title}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(parseISO(attempt.created_date), 'MMM d, yyyy • HH:mm')}
                                </span>
                                {attempt.time_taken_minutes > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {attempt.time_taken_minutes} min
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900 mb-1">
                                {percentage}%
                              </div>
                              <Badge className={isPassing ? "bg-green-600" : "bg-red-600"}>
                                {attempt.score}/{attempt.total_questions}
                              </Badge>
                            </div>
                          </div>

                          <Progress value={parseFloat(percentage)} className="h-2" />

                          {attempt.flagged_question_ids && attempt.flagged_question_ids.length > 0 && (
                            <p className="text-xs text-amber-600 mt-2">
                              {attempt.flagged_question_ids.length} question{attempt.flagged_question_ids.length !== 1 ? 's' : ''} flagged
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
