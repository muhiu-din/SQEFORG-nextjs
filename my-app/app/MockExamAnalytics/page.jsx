"use client";
import React, { useState, useEffect } from 'react';
import { ExamAttempt, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import _ from 'lodash';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-3 border rounded-lg shadow-lg">
        <p className="font-bold text-slate-800">{`Attempt: ${new Date(label).toLocaleDateString()}`}</p>
        <p className="text-green-600">{`Your Score: ${payload[0].value.toFixed(0)}`}</p>
        <p className="text-slate-600">{`Pass Mark: 300`}</p>
      </div>
    );
  }
  return null;
};

export default function MockExamAnalytics() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        const userAttempts = await ExamAttempt.filter({ created_by: currentUser.email }, "-created_date");
        setAttempts(userAttempts);
      } catch (error) {
        console.error("Failed to fetch user or attempts:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const performanceOverTime = attempts
    .map(attempt => ({
      date: attempt.created_date,
      scaledScore: (attempt.score / attempt.total_questions) * 500,
      passMark: 300,
    }))
    .reverse(); // Reverse to show chronological order

  const performanceBySubject = _.chain(attempts)
    .flatMap(attempt => {
      // A mock exam might not have a clear single subject. This is a simplification.
      // A more robust solution might need questions to have subject tags.
      const subject = attempt.mock_exam_title.includes('FLK 1') ? 'FLK 1' : attempt.mock_exam_title.includes('FLK 2') ? 'FLK 2' : 'Mixed';
      return {
        subject,
        score: attempt.score,
        total: attempt.total_questions
      };
    })
    .groupBy('subject')
    .map((group, subject) => {
      const totalScore = _.sumBy(group, 'score');
      const totalQuestions = _.sumBy(group, 'total');
      return {
        subject,
        averageScore: totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0,
      };
    })
    .value();

  const overallStats = {
    totalAttempts: attempts.length,
    averageScore: attempts.length > 0 ? (_.sumBy(attempts, a => (a.score / a.total_questions) * 100) / attempts.length) : 0,
    passRate: attempts.length > 0 ? (attempts.filter(a => (a.score/a.total_questions) * 500 >= 300).length / attempts.length) * 100 : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <Card className="max-w-md w-full border-none shadow-xl text-center">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-3 text-xl text-slate-800">
                        <BarChart className="w-10 h-10 text-slate-400" />
                        No Analytics Data Yet
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-600 mb-6">Complete a mock exam to see your performance analytics.</p>
                </CardContent>
            </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Mock Exam Analytics</h1>
            <p className="text-slate-600 text-lg">Track your performance and identify areas for improvement.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-none shadow-lg"><CardHeader><CardTitle>Total Attempts</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{overallStats.totalAttempts}</p></CardContent></Card>
            <Card className="border-none shadow-lg"><CardHeader><CardTitle>Average Score</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{overallStats.averageScore.toFixed(0)}%</p></CardContent></Card>
            <Card className="border-none shadow-lg"><CardHeader><CardTitle>Overall Pass Rate</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{overallStats.passRate.toFixed(0)}%</p></CardContent></Card>
        </div>

        <Card className="border-none shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              Performance Over Time (Scaled Score)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96 pr-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} stroke="#64748b" />
                <YAxis domain={[0, 500]} stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="scaledScore" name="Your Scaled Score" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="passMark" name="Standard Pass Mark" stroke="#334155" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-amber-500" />
                Average Score by Subject Area
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96 pr-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceBySubject} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                <YAxis type="category" dataKey="subject" width={150} stroke="#64748b" />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey="averageScore" name="Average Score (%)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}