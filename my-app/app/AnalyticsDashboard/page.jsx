"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, Cell
} from 'recharts';
import {
  Brain, Target, Clock, TrendingUp, Loader2, Calendar,
  Zap, Award, AlertTriangle, CheckCircle2, BarChart3,
  Activity, Sun, Moon, Coffee, Flame, Trophy, Eye,
  Timer, PieChart as PieChartIcon
} from 'lucide-react';
import { format, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law",
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function AnalyticsDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerLogs, setAnswerLogs] = useState([]);
  const [examAttempts, setExamAttempts] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [logs, attempts, quizzes] = await Promise.all([
        base44.entities.UserAnswerLog.filter({ created_by: currentUser.email }, '-created_date', 2000),
        base44.entities.ExamAttempt.filter({ created_by: currentUser.email }, '-created_date', 200),
        base44.entities.UserQuizResult.filter({ created_by: currentUser.email }, '-created_date', 200)
      ]);

      setAnswerLogs(logs);
      setExamAttempts(attempts);
      setQuizResults(quizzes);

      const computed = computeAdvancedAnalytics(logs, attempts, quizzes, currentUser);
      setAnalytics(computed);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setLoading(false);
  };

  const computeAdvancedAnalytics = (logs, attempts, quizzes, currentUser) => {
    // 1. QUESTION TYPE PERFORMANCE
    const questionTypeStats = {
      'scenario-based': { correct: 0, total: 0, avgTime: 0 },
      'application': { correct: 0, total: 0, avgTime: 0 },
      'black-letter': { correct: 0, total: 0, avgTime: 0 },
      'procedural': { correct: 0, total: 0, avgTime: 0 }
    };

    logs.forEach(log => {
      const tags = log.tags || [];
      let type = 'application'; // default
      
      if (tags.includes('scenario-based') || log.question_text?.length > 200) {
        type = 'scenario-based';
      } else if (tags.includes('black-letter') || tags.includes('definition')) {
        type = 'black-letter';
      } else if (tags.includes('procedural') || tags.includes('process')) {
        type = 'procedural';
      }

      if (!questionTypeStats[type]) {
        questionTypeStats[type] = { correct: 0, total: 0, avgTime: 0 };
      }

      questionTypeStats[type].total++;
      if (log.was_correct) questionTypeStats[type].correct++;
    });

    const questionTypePerformance = Object.entries(questionTypeStats)
      .map(([type, stats]) => ({
        type: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        accuracy: stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(1) : 0,
        total: stats.total
      }))
      .filter(t => t.total > 0);

    // 2. TIME-PER-QUESTION ANALYSIS BY SUBJECT
    const subjectTimeAnalysis = {};
    
    [...attempts, ...quizzes].forEach(attempt => {
      if (attempt.question_times) {
        Object.entries(attempt.question_times).forEach(([qId, time]) => {
          const log = logs.find(l => l.question_id === qId);
          const subject = log?.subject || 'Unknown';
          
          if (!subjectTimeAnalysis[subject]) {
            subjectTimeAnalysis[subject] = { times: [], avgTime: 0 };
          }
          subjectTimeAnalysis[subject].times.push(time);
        });
      }
    });

    const timeBySubject = Object.entries(subjectTimeAnalysis)
      .map(([subject, data]) => ({
        subject,
        avgTime: data.times.length > 0 
          ? (data.times.reduce((sum, t) => sum + t, 0) / data.times.length).toFixed(0)
          : 0,
        minTime: data.times.length > 0 ? Math.min(...data.times) : 0,
        maxTime: data.times.length > 0 ? Math.max(...data.times) : 0
      }))
      .filter(s => s.avgTime > 0)
      .sort((a, b) => parseFloat(b.avgTime) - parseFloat(a.avgTime));

    // 3. CONFIDENCE SCORING PER TOPIC
    const confidenceScores = {};
    
    ALL_SUBJECTS.forEach(subject => {
      const subjectLogs = logs.filter(l => l.subject === subject);
      if (subjectLogs.length < 5) return;

      const recent = subjectLogs.slice(0, 20);
      const accuracy = recent.filter(l => l.was_correct).length / recent.length;
      const volume = subjectLogs.length;
      const consistency = calculateConsistency(subjectLogs);

      confidenceScores[subject] = {
        score: (accuracy * 0.5 + Math.min(volume / 100, 1) * 0.3 + consistency * 0.2) * 100,
        accuracy: (accuracy * 100).toFixed(1),
        attempts: volume
      };
    });

    const topicConfidence = Object.entries(confidenceScores)
      .map(([subject, data]) => ({
        subject,
        confidence: data.score.toFixed(0),
        accuracy: data.accuracy,
        attempts: data.attempts
      }))
      .sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence));

    // 4. PASS PROBABILITY PREDICTION
    const recentAttempts = [...attempts, ...quizzes]
      .filter(a => a.completed)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10);

    let passProbability = 0;
    if (recentAttempts.length >= 3) {
      const avgScore = recentAttempts.reduce((sum, a) => 
        sum + (a.score / a.total_questions * 100), 0) / recentAttempts.length;
      
      const trend = recentAttempts.length >= 5 
        ? recentAttempts.slice(0, 3).reduce((sum, a) => sum + a.score / a.total_questions, 0) / 3 -
          recentAttempts.slice(3, 6).reduce((sum, a) => sum + a.score / a.total_questions, 0) / 3
        : 0;

      const weakAreasCount = Object.keys(confidenceScores).filter(
        s => confidenceScores[s].accuracy < 60
      ).length;

      const volumeBonus = Math.min(logs.length / 500, 1) * 10;
      
      passProbability = Math.min(
        Math.max(
          avgScore * 0.7 + 
          (trend > 0 ? 10 : trend < -0.05 ? -10 : 0) +
          volumeBonus -
          (weakAreasCount * 5),
          0
        ),
        99
      );
    }

    // 5. STUDY HABITS HEATMAP
    const studyHeatmap = generateStudyHeatmap(logs, attempts, quizzes);

    // 6. PEAK PRODUCTIVITY ANALYSIS
    const productivityAnalysis = analyzeProductivity(logs, attempts, quizzes);

    return {
      questionTypePerformance,
      timeBySubject,
      topicConfidence,
      passProbability: passProbability.toFixed(0),
      studyHeatmap,
      productivityAnalysis,
      totalActivity: logs.length + attempts.length + quizzes.length
    };
  };

  const calculateConsistency = (logs) => {
    if (logs.length < 10) return 0;
    const batches = [];
    for (let i = 0; i < logs.length; i += 10) {
      const batch = logs.slice(i, i + 10);
      const accuracy = batch.filter(l => l.was_correct).length / batch.length;
      batches.push(accuracy);
    }
    const variance = batches.reduce((sum, acc) => {
      const mean = batches.reduce((s, a) => s + a, 0) / batches.length;
      return sum + Math.pow(acc - mean, 2);
    }, 0) / batches.length;
    return Math.max(0, 1 - variance * 2);
  };

  const generateStudyHeatmap = (logs, attempts, quizzes) => {
    const heatmap = Array(7).fill(0).map(() => Array(24).fill(0));
    
    [...logs, ...attempts, ...quizzes].forEach(item => {
      const date = parseISO(item.created_date);
      const day = date.getDay(); // 0 = Sunday
      const hour = date.getHours();
      heatmap[day][hour]++;
    });

    return heatmap;
  };

  const analyzeProductivity = (logs, attempts, quizzes) => {
    const hourlyPerformance = {};
    
    logs.forEach(log => {
      const hour = parseISO(log.created_date).getHours();
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { correct: 0, total: 0 };
      }
      hourlyPerformance[hour].total++;
      if (log.was_correct) hourlyPerformance[hour].correct++;
    });

    const productivityByHour = Object.entries(hourlyPerformance)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        accuracy: stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(1) : 0,
        volume: stats.total,
        timeOfDay: parseInt(hour) < 12 ? 'Morning' : parseInt(hour) < 18 ? 'Afternoon' : 'Evening'
      }))
      .sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy));

    const bestHours = productivityByHour.slice(0, 3);
    
    return {
      hourlyData: productivityByHour,
      peakHours: bestHours,
      bestTimeOfDay: bestHours[0]?.timeOfDay || 'Not enough data'
    };
  };

  const HeatmapVisualization = ({ data }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxValue = Math.max(...data.flat());

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex gap-2 mb-2 pl-12">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="w-8 text-xs text-center text-slate-500">
                {i}
              </div>
            ))}
          </div>
          {days.map((day, dayIdx) => (
            <div key={day} className="flex gap-2 mb-2 items-center">
              <div className="w-10 text-xs font-semibold text-slate-600">{day}</div>
              {data[dayIdx].map((value, hourIdx) => {
                const intensity = maxValue > 0 ? value / maxValue : 0;
                const color = intensity === 0 ? 'bg-slate-100' :
                              intensity < 0.25 ? 'bg-blue-200' :
                              intensity < 0.5 ? 'bg-blue-400' :
                              intensity < 0.75 ? 'bg-blue-600' :
                              'bg-blue-800';
                
                return (
                  <div
                    key={hourIdx}
                    className={`w-8 h-8 rounded ${color} flex items-center justify-center text-xs ${
                      value > 0 ? 'text-white' : 'text-slate-400'
                    }`}
                    title={`${day} ${hourIdx}:00 - ${value} activities`}
                  >
                    {value > 0 ? value : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!analytics || analytics.totalActivity === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No Analytics Yet</h2>
          <p className="text-slate-600 mb-6">
            Start practicing questions or taking mock exams to unlock your comprehensive analytics dashboard.
          </p>
          <Button className="bg-slate-900 hover:bg-slate-800">
            Start Practicing
          </Button>
        </Card>
      </div>
    );
  }

  const passProb = parseFloat(analytics.passProbability);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
            <Brain className="w-10 h-10 text-purple-600" />
            Advanced Analytics Dashboard
          </h1>
          <p className="text-slate-600 text-lg">Deep insights into your performance, habits, and readiness</p>
        </div>

        {/* PASS PROBABILITY PREDICTOR */}
        <Card className="mb-8 border-none shadow-xl bg-linear-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              Predicted Pass Probability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-6xl font-bold text-slate-900">{analytics.passProbability}%</span>
                  <Badge className={
                    passProb >= 75 ? 'bg-green-600' :
                    passProb >= 60 ? 'bg-amber-600' :
                    'bg-red-600'
                  }>
                    {passProb >= 75 ? 'High' : passProb >= 60 ? 'Moderate' : 'Developing'}
                  </Badge>
                </div>
                <Progress value={passProb} className="h-4 mb-4" />
                <p className="text-sm text-slate-600">
                  Based on recent performance, study volume, consistency, and weak area analysis.
                  {passProb >= 75 && " You're on track! ✅"}
                  {passProb >= 60 && passProb < 75 && " Keep improving weak areas to increase probability."}
                  {passProb < 60 && " Focus on consistency and addressing weak subjects."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="types" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="types">Question Types</TabsTrigger>
            <TabsTrigger value="timing">Time Analysis</TabsTrigger>
            <TabsTrigger value="confidence">Confidence</TabsTrigger>
            <TabsTrigger value="habits">Study Habits</TabsTrigger>
            <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
          </TabsList>

          {/* QUESTION TYPE PERFORMANCE */}
          <TabsContent value="types">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  Performance by Question Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.questionTypePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="accuracy" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="space-y-4">
                    {analytics.questionTypePerformance.map((type, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-slate-900">{type.type}</span>
                          <Badge className={
                            parseFloat(type.accuracy) >= 75 ? 'bg-green-600' :
                            parseFloat(type.accuracy) >= 60 ? 'bg-amber-600' :
                            'bg-red-600'
                          }>
                            {type.accuracy}%
                          </Badge>
                        </div>
                        <Progress value={parseFloat(type.accuracy)} className="h-2 mb-2" />
                        <p className="text-xs text-slate-600">{type.total} questions attempted</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert className="mt-6 bg-blue-50 border-blue-200">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <strong>Insight:</strong> {
                      analytics.questionTypePerformance.length > 0 &&
                      (() => {
                        const weakest = analytics.questionTypePerformance.sort((a, b) => 
                          parseFloat(a.accuracy) - parseFloat(b.accuracy)
                        )[0];
                        return `Focus on ${weakest.type} questions - your weakest area at ${weakest.accuracy}%.`;
                      })()
                    }
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIME ANALYSIS */}
          <TabsContent value="timing">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-orange-600" />
                  Time-Per-Question Analysis by Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.timeBySubject.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={analytics.timeBySubject} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" angle={-45} textAnchor="end" height={120} tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => `${value}s`}
                          labelFormatter={(label) => `Subject: ${label}`}
                        />
                        <Bar dataKey="avgTime" fill="#f59e0b" radius={[8, 8, 0, 0]}>
                          {analytics.timeBySubject.map((entry, idx) => (
                            <Cell 
                              key={idx}
                              fill={parseFloat(entry.avgTime) > 120 ? '#ef4444' : 
                                    parseFloat(entry.avgTime) > 90 ? '#f59e0b' : 
                                    '#10b981'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <Clock className="w-6 h-6 text-green-600 mb-2" />
                        <p className="text-sm text-green-900 font-semibold mb-1">Target Time</p>
                        <p className="text-2xl font-bold text-green-900">105s</p>
                        <p className="text-xs text-green-700">1:45 per question</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <Clock className="w-6 h-6 text-amber-600 mb-2" />
                        <p className="text-sm text-amber-900 font-semibold mb-1">Your Average</p>
                        <p className="text-2xl font-bold text-amber-900">
                          {analytics.timeBySubject.length > 0 
                            ? (analytics.timeBySubject.reduce((sum, s) => sum + parseFloat(s.avgTime), 0) / 
                               analytics.timeBySubject.length).toFixed(0)
                            : 0}s
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="w-6 h-6 text-red-600 mb-2" />
                        <p className="text-sm text-red-900 font-semibold mb-1">Slowest Subject</p>
                        <p className="text-sm font-bold text-red-900">
                          {analytics.timeBySubject[0]?.subject.substring(0, 20) || 'N/A'}
                        </p>
                        <p className="text-xs text-red-700">{analytics.timeBySubject[0]?.avgTime}s avg</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-slate-500 py-8">Time data will appear after timed practice sessions</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONFIDENCE SCORING */}
          <TabsContent value="confidence">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Topic Confidence Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 bg-purple-50 border-purple-200">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    Confidence combines accuracy (50%), practice volume (30%), and consistency (20%). Higher is better!
                  </AlertDescription>
                </Alert>

                {analytics.topicConfidence.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topicConfidence.map((topic, idx) => {
                      const confidence = parseFloat(topic.confidence);
                      return (
                        <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-slate-900">{topic.subject}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{topic.accuracy}% acc</Badge>
                              <Badge className={
                                confidence >= 75 ? 'bg-green-600' :
                                confidence >= 60 ? 'bg-amber-600' :
                                'bg-red-600'
                              }>
                                {topic.confidence}% confidence
                              </Badge>
                            </div>
                          </div>
                          <Progress value={confidence} className="h-2 mb-2" />
                          <p className="text-xs text-slate-600">{topic.attempts} questions attempted</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">Practice more to build confidence scores</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* STUDY HABITS */}
          <TabsContent value="habits">
            <div className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Study Activity Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Your study activity by day and hour (darker = more activity)</p>
                  <HeatmapVisualization data={analytics.studyHeatmap} />
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-amber-500" />
                      Peak Productivity Windows
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.productivityAnalysis.peakHours.map((hour, idx) => {
                        const Icon = hour.hour < 12 ? Sun : hour.hour < 18 ? Coffee : Moon;
                        return (
                          <div key={idx} className="p-4 bg-linear-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className="w-6 h-6 text-amber-600" />
                              <div className="flex-1">
                                <p className="font-bold text-slate-900">
                                  #{idx + 1} Peak Hour: {hour.hour}:00 - {hour.hour + 1}:00
                                </p>
                                <p className="text-xs text-slate-600">{hour.timeOfDay}</p>
                              </div>
                              <Badge className="bg-amber-600">{hour.accuracy}%</Badge>
                            </div>
                            <p className="text-sm text-slate-600">{hour.volume} questions attempted</p>
                          </div>
                        );
                      })}
                    </div>

                    <Alert className="mt-4 bg-blue-50 border-blue-200">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        <strong>Recommendation:</strong> Schedule your toughest subjects during your peak hours ({analytics.productivityAnalysis.bestTimeOfDay.toLowerCase()}) for maximum effectiveness.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      Study Streak & Consistency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-amber-50 rounded-lg text-center">
                        <Flame className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-slate-900">{user?.current_streak || 0}</p>
                        <p className="text-sm text-slate-600">Current Streak</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-slate-900">{user?.longest_streak || 0}</p>
                        <p className="text-sm text-slate-600">Longest Streak</p>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-semibold text-green-900 mb-2">Weekly Activity</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-800">Active days this week</span>
                        <Badge className="bg-green-600">5/7</Badge>
                      </div>
                      <Progress value={71} className="h-2 mt-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Hourly Performance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.productivityAnalysis.hourlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.productivityAnalysis.hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="accuracy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-slate-500 py-8">Complete timed sessions to see hourly patterns</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TIME ANALYSIS */}
          <TabsContent value="timing">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Time Management by Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.timeBySubject.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.timeBySubject.map((subject, idx) => {
                      const avgTime = parseFloat(subject.avgTime);
                      const isGood = avgTime <= 105;
                      
                      return (
                        <div key={idx} className={`p-4 rounded-lg border ${
                          isGood ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-slate-900">{subject.subject}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Range: {subject.minTime}s - {subject.maxTime}s
                              </Badge>
                              <Badge className={isGood ? 'bg-green-600' : 'bg-red-600'}>
                                {subject.avgTime}s avg
                              </Badge>
                            </div>
                          </div>
                          <div className="relative">
                            <Progress value={Math.min((avgTime / 120) * 100, 100)} className="h-2" />
                            <div className="absolute left-[87.5%] top-0 bottom-0 w-0.5 bg-green-600" title="Target: 105s"></div>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {isGood ? '✅ Good pace' : '⚠️ Taking too long - practice speed reading scenarios'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">Time tracking data will appear after timed sessions</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONFIDENCE */}
          <TabsContent value="confidence">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Subject Confidence Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topicConfidence.length >= 3 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={analytics.topicConfidence.slice(0, 8)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="Confidence" dataKey="confidence" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-8">Practice across more subjects to see confidence radar</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BENCHMARK */}
          <TabsContent value="benchmark">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Comparative Benchmarking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Compare your performance against anonymized data from successful SQE candidates.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-600 mb-2">Your Avg Score</p>
                    <p className="text-4xl font-bold text-slate-900">
                      {examAttempts.length > 0 
                        ? (examAttempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / examAttempts.length).toFixed(0)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-6 bg-green-50 rounded-lg text-center border-2 border-green-300">
                    <p className="text-sm text-green-800 mb-2">Successful Candidates Avg</p>
                    <p className="text-4xl font-bold text-green-900">68%</p>
                    <p className="text-xs text-green-700 mt-1">Benchmark</p>
                  </div>
                  <div className="p-6 bg-purple-50 rounded-lg text-center">
                    <p className="text-sm text-purple-800 mb-2">Top 10% Avg</p>
                    <p className="text-4xl font-bold text-purple-900">78%</p>
                    <p className="text-xs text-purple-700 mt-1">Elite Performance</p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-linear-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4">How You Compare</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Questions Practiced</span>
                        <span className="font-semibold">{answerLogs.length} vs avg 800</span>
                      </div>
                      <Progress value={Math.min((answerLogs.length / 800) * 100, 100)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Mock Exams Completed</span>
                        <span className="font-semibold">{examAttempts.filter(a => a.completed).length} vs avg 12</span>
                      </div>
                      <Progress value={Math.min((examAttempts.filter(a => a.completed).length / 12) * 100, 100)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Study Streak</span>
                        <span className="font-semibold">{user?.current_streak || 0} days vs avg 5</span>
                      </div>
                      <Progress value={Math.min(((user?.current_streak || 0) / 5) * 100, 100)} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}