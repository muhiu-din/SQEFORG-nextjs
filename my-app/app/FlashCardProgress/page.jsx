"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Layers, Target, TrendingUp, Flame, Calendar, Award, AlertTriangle, CheckCircle2, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import _ from 'lodash';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law", 
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const COLORS = {
  easy: '#22c55e',
  medium: '#f59e0b', 
  hard: '#ef4444',
  purple: '#9333ea',
  blue: '#3b82f6',
  slate: '#64748b'
};

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export default function FlashCardProgress() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = {name: "Admin User", email: "admin@example.com", role: "admin"}; // Mock admin user
      setUser(currentUser);

      const userReviews = await base44.entities.FlashCardReview.filter(
        { created_by: currentUser.email },
        '-created_date',
        10000
      );
      setReviews(userReviews);

      // Calculate stats
      const totalReviewed = userReviews.length;
      const uniqueCards = new Set(userReviews.map(r => r.flashcard_id)).size;
      
      // Subject breakdown
      const subjectStats = {};
      ALL_SUBJECTS.forEach(subject => {
        const subjectReviews = userReviews.filter(r => r.subject === subject);
        if (subjectReviews.length > 0) {
          const easyCount = subjectReviews.filter(r => r.difficulty_rating === 'easy').length;
          const mediumCount = subjectReviews.filter(r => r.difficulty_rating === 'medium').length;
          const hardCount = subjectReviews.filter(r => r.difficulty_rating === 'hard').length;
          
          subjectStats[subject] = {
            total: subjectReviews.length,
            easy: easyCount,
            medium: mediumCount,
            hard: hardCount,
            mastery: ((easyCount + mediumCount * 0.5) / subjectReviews.length * 100).toFixed(1),
            uniqueCards: new Set(subjectReviews.map(r => r.flashcard_id)).size
          };
        }
      });

      // Difficulty distribution
      const easyTotal = userReviews.filter(r => r.difficulty_rating === 'easy').length;
      const mediumTotal = userReviews.filter(r => r.difficulty_rating === 'medium').length;
      const hardTotal = userReviews.filter(r => r.difficulty_rating === 'hard').length;

      // Streak calculation
      const reviewDates = [...new Set(userReviews.map(r => r.review_date))].sort().reverse();
      let currentStreak = 0;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      if (reviewDates.length > 0) {
        const lastReview = reviewDates[0];
        const daysSinceLastReview = differenceInDays(new Date(), parseISO(lastReview));
        
        if (daysSinceLastReview === 0) {
          // Reviewed today, count streak
          currentStreak = 1;
          for (let i = 1; i < reviewDates.length; i++) {
            const daysDiff = differenceInDays(parseISO(reviewDates[i-1]), parseISO(reviewDates[i]));
            if (daysDiff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        } else if (daysSinceLastReview === 1) {
          // Last review was yesterday, still counts
          currentStreak = 1;
          for (let i = 1; i < reviewDates.length; i++) {
            const daysDiff = differenceInDays(parseISO(reviewDates[i-1]), parseISO(reviewDates[i]));
            if (daysDiff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }

      // Daily activity for last 30 days
      const last30Days = Array.from({length: 30}, (_, i) => {
        const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
        const dayReviews = userReviews.filter(r => r.review_date === date);
        return {
          date: format(subDays(new Date(), 29 - i), 'MMM dd'),
          reviews: dayReviews.length,
          unique: new Set(dayReviews.map(r => r.flashcard_id)).size
        };
      });

      // Weak areas (subjects with high 'hard' percentage)
      const weakAreas = Object.entries(subjectStats)
        .filter(([, stats]) => stats.total >= 5) // At least 5 reviews
        .map(([subject, stats]) => ({
          subject,
          hardPercentage: (stats.hard / stats.total * 100).toFixed(1),
          total: stats.total,
          hard: stats.hard
        }))
        .filter(area => parseFloat(area.hardPercentage) > 40)
        .sort((a, b) => parseFloat(b.hardPercentage) - parseFloat(a.hardPercentage));

      setStats({
        totalReviewed,
        uniqueCards,
        easyTotal,
        mediumTotal,
        hardTotal,
        subjectStats,
        currentStreak,
        totalDaysActive: reviewDates.length,
        last30Days,
        weakAreas
      });

    } catch (error) {
      console.error('Failed to load flashcard progress:', error);
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
          <h1 className="text-2xl font-bold mb-2">Please Log In</h1>
          <p className="text-slate-600">Log in to view your flashcard progress.</p>
        </Card>
      </div>
    );
  }

  if (!stats || stats.totalReviewed === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Flash Card Progress</h1>
            <p className="text-slate-600">Track your flashcard learning journey</p>
          </div>

          <Card className="border-none shadow-xl text-center p-12">
            <Layers className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Start Your Flash Card Journey</h2>
            <p className="text-slate-600 mb-8">Begin reviewing flashcards to see your progress and analytics here.</p>
            <a href="/flashcards" className="inline-block bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800">
              Start Reviewing Flash Cards
            </a>
          </Card>
        </div>
      </div>
    );
  }

  const difficultyData = [
    { name: 'Easy', value: stats.easyTotal, percentage: (stats.easyTotal / stats.totalReviewed * 100).toFixed(1) },
    { name: 'Medium', value: stats.mediumTotal, percentage: (stats.mediumTotal / stats.totalReviewed * 100).toFixed(1) },
    { name: 'Hard', value: stats.hardTotal, percentage: (stats.hardTotal / stats.totalReviewed * 100).toFixed(1) }
  ];

  const subjectChartData = Object.entries(stats.subjectStats)
    .sort((a, b) => parseFloat(b[1].mastery) - parseFloat(a[1].mastery))
    .map(([subject, data]) => ({
      subject: subject.length > 25 ? subject.substring(0, 25) + '...' : subject,
      mastery: parseFloat(data.mastery),
      reviews: data.total
    }));

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Flash Card Progress</h1>
          <p className="text-slate-600">Comprehensive analytics of your flashcard learning journey</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <Layers className="w-12 h-12 mx-auto mb-3 text-purple-500" />
              <p className="text-4xl font-bold text-slate-900">{stats.totalReviewed}</p>
              <p className="text-sm text-slate-600 mt-1">Total Reviews</p>
              <p className="text-xs text-slate-500 mt-1">{stats.uniqueCards} unique cards</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <Flame className={`w-12 h-12 mx-auto mb-3 ${stats.currentStreak > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
              <p className="text-4xl font-bold text-slate-900">{stats.currentStreak}</p>
              <p className="text-sm text-slate-600 mt-1">Day Streak</p>
              <p className="text-xs text-slate-500 mt-1">Keep it going!</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <p className="text-4xl font-bold text-slate-900">{stats.totalDaysActive}</p>
              <p className="text-sm text-slate-600 mt-1">Days Active</p>
              <p className="text-xs text-slate-500 mt-1">Total days reviewed</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6 text-center">
              <Target className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-4xl font-bold text-slate-900">{stats.easyTotal}</p>
              <p className="text-sm text-slate-600 mt-1">Mastered Cards</p>
              <p className="text-xs text-slate-500 mt-1">Rated as 'Easy'</p>
            </CardContent>
          </Card>
        </div>

        {/* Difficulty Distribution */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Difficulty Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                {difficultyData.map((item, idx) => (
                  <div key={item.name} className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{backgroundColor: PIE_COLORS[idx]}}></div>
                    <p className="font-bold text-2xl text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-600">{item.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Last 30 Days Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.last30Days}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{fontSize: 11}} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reviews" stroke={COLORS.purple} strokeWidth={2} name="Reviews" />
                  <Line type="monotone" dataKey="unique" stroke={COLORS.blue} strokeWidth={2} name="Unique Cards" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Subject Mastery */}
        <Card className="border-none shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Mastery by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={subjectChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="subject" type="category" width={200} tick={{fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="mastery" fill={COLORS.purple} name="Mastery %" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Mastery = (Easy cards + Medium cards × 0.5) / Total reviews × 100
            </p>
          </CardContent>
        </Card>

        {/* Subject Details */}
        <Card className="border-none shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Subject Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.subjectStats)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([subject, data]) => (
                <div key={subject} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900">{subject}</h4>
                      <p className="text-sm text-slate-600">{data.uniqueCards} unique cards • {data.total} reviews</p>
                    </div>
                    <Badge className="bg-purple-600 text-white text-lg px-4 py-1">
                      {data.mastery}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <p className="font-bold text-green-700">{data.easy}</p>
                      <p className="text-xs text-green-600">Easy</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                      <p className="font-bold text-amber-700">{data.medium}</p>
                      <p className="text-xs text-amber-600">Medium</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                      <p className="font-bold text-red-700">{data.hard}</p>
                      <p className="text-xs text-red-600">Hard</p>
                    </div>
                  </div>
                  <Progress value={parseFloat(data.mastery)} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weak Areas Alert */}
        {stats.weakAreas && stats.weakAreas.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="w-5 h-5" />
                Areas Needing More Practice ({stats.weakAreas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 mb-4">
                These subjects have a high percentage of cards you found difficult. Review them more frequently:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {stats.weakAreas.map(area => (
                  <div key={area.subject} className="p-4 bg-white rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900">{area.subject}</h4>
                      <Badge className="bg-red-600 text-white">{area.hardPercentage}% Hard</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {area.hard} out of {area.total} reviews marked as difficult
                    </p>
                    <Progress value={parseFloat(area.hardPercentage)} className="h-2 mt-3 bg-red-200" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}