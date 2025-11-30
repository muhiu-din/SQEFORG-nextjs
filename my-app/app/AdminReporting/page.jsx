"use client";
import React, { useState, useEffect } from 'react';
// call api
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, FileText, DollarSign, Activity, Download, RefreshCw, Loader2, AlertTriangle, CheckCircle, Target, Zap, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import moment from 'moment';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminReporting() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30days');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const currentUser ={name: "Admin User", email: "admin@example.com", role: "admin"};
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        setLoading(false);
        return;
      }

      const dateThreshold = dateRange === '7days' ? moment().subtract(7, 'days').toISOString() :
                           dateRange === '30days' ? moment().subtract(30, 'days').toISOString() :
                           dateRange === '90days' ? moment().subtract(90, 'days').toISOString() :
                           moment().subtract(365, 'days').toISOString();

      const [users, questions, mockExams, examAttempts, answerLogs, studyNotes, posts, studyLogs, reviews] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Question.list(null, null, ['id', 'subject', 'difficulty', 'created_date']),
        base44.entities.MockExam.list(null, null, ['id', 'exam_type', 'created_date']),
        base44.entities.ExamAttempt.list(null, null, ['id', 'score', 'total_questions', 'created_date', 'completed', 'created_by']),
        base44.entities.UserAnswerLog.list(null, null, ['id', 'was_correct', 'created_date', 'created_by']),
        base44.entities.StudyNote.list(null, null, ['id', 'subject', 'created_date']),
        base44.entities.Post.list(null, null, ['id', 'created_date']),
        base44.entities.StudyLog.list(null, null, ['id', 'created_date', 'created_by']),
        base44.entities.Review.list(null, null, ['id', 'rating', 'created_date'])
      ]);

      const filteredUsers = users.filter(u => u.created_date >= dateThreshold);
      const filteredAttempts = examAttempts.filter(a => a.created_date >= dateThreshold);
      const filteredAnswers = answerLogs.filter(a => a.created_date >= dateThreshold);
      const filteredStudyLogs = studyLogs.filter(l => l.created_date >= dateThreshold);

      // User Analytics
      const totalUsers = users.length;
      const newUsers = filteredUsers.length;
      const activeUsers = [...new Set(filteredStudyLogs.map(l => l.created_by))].length;
      
      const tierDistribution = {
        starter: users.filter(u => (u.subscription_tier || 'starter') === 'starter').length,
        pro: users.filter(u => u.subscription_tier === 'pro').length,
        ultimate: users.filter(u => u.subscription_tier === 'ultimate').length
      };

      // REAL Revenue from User Records
      const activeSubscribers = users.filter(u => u.subscription_status === 'active' && u.monthly_subscription_amount);
      const monthlyRecurringRevenue = activeSubscribers.reduce((sum, u) => sum + (u.monthly_subscription_amount || 0), 0);
      const lifetimeRevenue = users.reduce((sum, u) => sum + (u.lifetime_revenue || 0), 0);
      
      const revenueByTier = {
        starter: users.filter(u => (u.subscription_tier || 'starter') === 'starter' && u.subscription_status === 'active').reduce((sum, u) => sum + (u.monthly_subscription_amount || 0), 0),
        pro: users.filter(u => u.subscription_tier === 'pro' && u.subscription_status === 'active').reduce((sum, u) => sum + (u.monthly_subscription_amount || 0), 0),
        ultimate: users.filter(u => u.subscription_tier === 'ultimate' && u.subscription_status === 'active').reduce((sum, u) => sum + (u.monthly_subscription_amount || 0), 0)
      };

      // Engagement Metrics
      const totalMocksTaken = filteredAttempts.filter(a => a.completed).length;
      const totalQuestionsPracticed = filteredAnswers.length;
      const avgQuestionsPerUser = activeUsers > 0 ? (totalQuestionsPracticed / activeUsers).toFixed(0) : 0;
      
      const completionRate = filteredAttempts.length > 0 
        ? ((filteredAttempts.filter(a => a.completed).length / filteredAttempts.length) * 100).toFixed(1)
        : 0;

      // Performance Metrics
      const completedAttempts = filteredAttempts.filter(a => a.completed && a.total_questions > 0);
      const avgScore = completedAttempts.length > 0
        ? (completedAttempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / completedAttempts.length).toFixed(1)
        : 0;

      const correctAnswers = filteredAnswers.filter(a => a.was_correct).length;
      const practiceAccuracy = filteredAnswers.length > 0
        ? ((correctAnswers / filteredAnswers.length) * 100).toFixed(1)
        : 0;

      // Content Stats
      const totalQuestions = questions.length;
      const totalMocks = mockExams.length;
      const totalStudyNotes = studyNotes.length;
      const totalForumPosts = posts.length;

      // Subject Distribution
      const subjectQuestions = {};
      questions.forEach(q => {
        if (q.subject) {
          subjectQuestions[q.subject] = (subjectQuestions[q.subject] || 0) + 1;
        }
      });

      const subjectData = Object.entries(subjectQuestions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([subject, count]) => ({
          subject: subject.length > 20 ? subject.substring(0, 20) + '...' : subject,
          count
        }));

      // Daily Activity (last 14 days)
      const dailyActivity = [];
      for (let i = 13; i >= 0; i--) {
        const date = moment().subtract(i, 'days');
        const dateStr = date.format('YYYY-MM-DD');
        const dayAnswers = answerLogs.filter(a => moment(a.created_date).format('YYYY-MM-DD') === dateStr).length;
        const dayAttempts = examAttempts.filter(a => moment(a.created_date).format('YYYY-MM-DD') === dateStr).length;
        dailyActivity.push({
          date: date.format('MMM D'),
          answers: dayAnswers,
          attempts: dayAttempts
        });
      }

      // User Growth (last 12 weeks)
      const userGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = moment().subtract(i, 'weeks').startOf('week');
        const weekEnd = moment().subtract(i, 'weeks').endOf('week');
        const weekUsers = users.filter(u => {
          const created = moment(u.created_date);
          return created.isBetween(weekStart, weekEnd, null, '[]');
        }).length;
        userGrowth.push({
          week: weekStart.format('MMM D'),
          users: weekUsers
        });
      }

      // Mock Exam Types
      const mockTypeData = [
        { name: 'FLK 1', value: mockExams.filter(m => m.exam_type === 'FLK 1').length },
        { name: 'FLK 2', value: mockExams.filter(m => m.exam_type === 'FLK 2').length },
        { name: 'Mixed', value: mockExams.filter(m => m.exam_type === 'Mixed').length }
      ];

      // Question Difficulty
      const difficultyData = [
        { name: 'Easy', value: questions.filter(q => q.difficulty === 'easy').length },
        { name: 'Medium', value: questions.filter(q => q.difficulty === 'medium').length },
        { name: 'Hard', value: questions.filter(q => q.difficulty === 'hard').length }
      ];

      // Top Performers
      const userScores = {};
      completedAttempts.forEach(a => {
        if (!userScores[a.created_by]) {
          userScores[a.created_by] = { total: 0, count: 0 };
        }
        userScores[a.created_by].total += (a.score / a.total_questions * 100);
        userScores[a.created_by].count++;
      });

      const topPerformers = Object.entries(userScores)
        .map(([email, data]) => ({
          email,
          avgScore: (data.total / data.count).toFixed(1),
          attempts: data.count
        }))
        .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
        .slice(0, 10);

      // Reviews
      const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

      const recentReviews = reviews
        .filter(r => r.created_date >= dateThreshold)
        .length;

      setReportData({
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
          tierDistribution,
          userGrowth
        },
        revenue: {
          mrr: monthlyRecurringRevenue,
          lifetime: lifetimeRevenue,
          byTier: revenueByTier,
          activeSubscribers: activeSubscribers.length
        },
        engagement: {
          mocksTaken: totalMocksTaken,
          questionsPracticed: totalQuestionsPracticed,
          avgQuestionsPerUser,
          completionRate,
          dailyActivity
        },
        performance: {
          avgScore,
          practiceAccuracy,
          topPerformers
        },
        content: {
          totalQuestions,
          totalMocks,
          totalStudyNotes,
          totalForumPosts,
          subjectData,
          mockTypeData,
          difficultyData
        },
        reviews: {
          total: reviews.length,
          recent: recentReviews,
          avgRating
        }
      });

    } catch (error) {
      console.error('Failed to load report data:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  const handleExport = () => {
    if (!reportData) return;

    const csvData = [
      ['SQEFORGE ADMIN REPORT'],
      ['Generated:', new Date().toLocaleString()],
      ['Period:', dateRange],
      [''],
      ['REVENUE'],
      ['Monthly Recurring Revenue (MRR)', `£${reportData.revenue.mrr.toFixed(2)}`],
      ['Lifetime Revenue', `£${reportData.revenue.lifetime.toFixed(2)}`],
      ['Active Subscribers', reportData.revenue.activeSubscribers],
      ['Starter Revenue', `£${reportData.revenue.byTier.starter.toFixed(2)}`],
      ['Pro Revenue', `£${reportData.revenue.byTier.pro.toFixed(2)}`],
      ['Ultimate Revenue', `£${reportData.revenue.byTier.ultimate.toFixed(2)}`],
      [''],
      ['USER METRICS'],
      ['Total Users', reportData.users.total],
      ['New Users', reportData.users.new],
      ['Active Users', reportData.users.active],
      ['Starter Tier', reportData.users.tierDistribution.starter],
      ['Pro Tier', reportData.users.tierDistribution.pro],
      ['Ultimate Tier', reportData.users.tierDistribution.ultimate],
      [''],
      ['ENGAGEMENT'],
      ['Mocks Taken', reportData.engagement.mocksTaken],
      ['Questions Practiced', reportData.engagement.questionsPracticed],
      ['Avg Questions/User', reportData.engagement.avgQuestionsPerUser],
      ['Completion Rate', `${reportData.engagement.completionRate}%`],
      [''],
      ['PERFORMANCE'],
      ['Avg Mock Score', `${reportData.performance.avgScore}%`],
      ['Practice Accuracy', `${reportData.performance.practiceAccuracy}%`],
      [''],
      ['CONTENT'],
      ['Total Questions', reportData.content.totalQuestions],
      ['Total Mocks', reportData.content.totalMocks],
      ['Study Notes', reportData.content.totalStudyNotes],
      ['Forum Posts', reportData.content.totalForumPosts],
      [''],
      ['REVIEWS'],
      ['Total Reviews', reportData.reviews.total],
      ['Recent Reviews', reportData.reviews.recent],
      ['Avg Rating', reportData.reviews.avgRating]
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sqeforge-report-${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-10 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h1>
        <p className="text-slate-600">This page is only accessible to administrators.</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" />
        <p className="text-slate-600 mt-4">Loading report data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Advanced Admin Reporting</h1>
            <p className="text-slate-600">Real-time platform analytics and revenue tracking</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="365days">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Revenue Data Source</p>
                <p className="text-sm text-blue-800">
                  Revenue shown is pulled from user records (monthly_subscription_amount and lifetime_revenue fields). 
                  These should be updated automatically via your payment gateway webhooks (Stripe, PayPal, etc.). 
                  If you see £0.00, ensure payment webhooks are configured to update user records on successful payments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-500" />
                <Badge variant="outline" className="text-green-600 border-green-600">+{reportData.users.new}</Badge>
              </div>
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="text-4xl font-bold text-slate-900">{reportData.users.total}</p>
              <p className="text-xs text-slate-500 mt-1">{reportData.users.active} active in period</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">Monthly Recurring Revenue</p>
              <p className="text-4xl font-bold text-slate-900">£{reportData.revenue.mrr.toFixed(0)}</p>
              <p className="text-xs text-slate-500 mt-1">{reportData.revenue.activeSubscribers} active subscribers</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-purple-500" />
                <Badge variant="outline">{reportData.engagement.completionRate}%</Badge>
              </div>
              <p className="text-sm text-slate-600">Mocks Taken</p>
              <p className="text-4xl font-bold text-slate-900">{reportData.engagement.mocksTaken}</p>
              <p className="text-xs text-slate-500 mt-1">Completion rate</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-amber-500" />
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">Avg Mock Score</p>
              <p className="text-4xl font-bold text-slate-900">{reportData.performance.avgScore}%</p>
              <p className="text-xs text-slate-500 mt-1">{reportData.performance.practiceAccuracy}% practice accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & User Analytics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-green-700 mb-1">Lifetime Revenue</p>
                  <p className="text-3xl font-bold text-green-900">£{reportData.revenue.lifetime.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-blue-900">Starter</p>
                    <p className="text-sm text-blue-700">{reportData.users.tierDistribution.starter} users</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">£{reportData.revenue.byTier.starter.toFixed(2)}/mo</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-amber-900">Pro</p>
                    <p className="text-sm text-amber-700">{reportData.users.tierDistribution.pro} users</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">£{reportData.revenue.byTier.pro.toFixed(2)}/mo</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-purple-900">Ultimate</p>
                    <p className="text-sm text-purple-700">{reportData.users.tierDistribution.ultimate} users</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">£{reportData.revenue.byTier.ultimate.toFixed(2)}/mo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.users.userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity & Content Analytics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Daily Activity (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.engagement.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="answers" stroke="#10b981" strokeWidth={2} name="Questions" />
                  <Line type="monotone" dataKey="attempts" stroke="#f59e0b" strokeWidth={2} name="Mock Attempts" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Top 10 Subjects by Question Count</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.content.subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="subject" type="category" stroke="#64748b" style={{ fontSize: '11px' }} width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Mock Exam Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={reportData.content.mockTypeData} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
                    {reportData.content.mockTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {reportData.content.mockTypeData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-xs text-slate-600">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Question Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={reportData.content.difficultyData} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
                    {reportData.content.difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {reportData.content.difficultyData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }}></div>
                    <span className="text-xs text-slate-600">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Content Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Questions</span>
                <span className="text-xl font-bold text-slate-900">{reportData.content.totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Mock Exams</span>
                <span className="text-xl font-bold text-slate-900">{reportData.content.totalMocks}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Study Notes</span>
                <span className="text-xl font-bold text-slate-900">{reportData.content.totalStudyNotes}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Forum Posts</span>
                <span className="text-xl font-bold text-slate-900">{reportData.content.totalForumPosts}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers & Reviews */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Top 10 Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.performance.topPerformers.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No completed exams yet</p>
              ) : (
                <div className="space-y-2">
                  {reportData.performance.topPerformers.map((performer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          idx === 0 ? 'bg-amber-400 text-white' :
                          idx === 1 ? 'bg-slate-300 text-slate-700' :
                          idx === 2 ? 'bg-amber-700 text-white' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{performer.email.split('@')[0]}</p>
                          <p className="text-xs text-slate-500">{performer.attempts} attempts</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-900 border-green-300">
                        {performer.avgScore}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Platform Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center p-6 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg
                        key={star}
                        className={`w-8 h-8 ${star <= parseFloat(reportData.reviews.avgRating) ? 'text-amber-400 fill-current' : 'text-slate-300'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-4xl font-bold text-slate-900 mb-2">{reportData.reviews.avgRating}</p>
                  <p className="text-sm text-slate-600">Average Rating</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-3xl font-bold text-slate-900">{reportData.reviews.total}</p>
                    <p className="text-sm text-slate-600">Total Reviews</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-3xl font-bold text-slate-900">{reportData.reviews.recent}</p>
                    <p className="text-sm text-slate-600">Recent Reviews</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}