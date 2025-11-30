"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Target, TrendingUp, Loader2, Crown, Medal, Award, Zap, Users, Lock } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BADGES_CATALOG } from '@/components/GamificationWidget';
import Watermark from '@/components/Watermark';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RANK_ICONS = {
  1: <Crown className="w-6 h-6 text-amber-400" />,
  2: <Medal className="w-6 h-6 text-slate-400" />,
  3: <Award className="w-6 h-6 text-amber-700" />
};

const PROFILE_COLORS = {
  purple: 'from-purple-500 to-pink-500',
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-green-500 to-emerald-500',
  amber: 'from-amber-500 to-orange-500',
  red: 'from-red-500 to-rose-500'
};

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardType, setLeaderboardType] = useState('points'); // points, mocks, streaks, practice
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month
  const [users, setUsers] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [examAttempts, setExamAttempts] = useState([]);
  const [answerLogs, setAnswerLogs] = useState([]);

  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardType, timeFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Fetch all users who are visible on leaderboard
      const allUsers = await base44.entities.User.list();
      const visibleUsers = allUsers.filter(u => u.leaderboard_visible !== false);

      // Fetch exam attempts and answer logs for calculations
      const attempts = await base44.entities.ExamAttempt.filter({ completed: true }, '-created_date', 5000);
      const logs = await base44.entities.UserAnswerLog.list('-created_date', 10000);
      
      setExamAttempts(attempts);
      setAnswerLogs(logs);

      // Calculate rankings based on type
      const rankedUsers = calculateRankings(visibleUsers, attempts, logs, leaderboardType, timeFilter);
      setUsers(rankedUsers);

      // Find current user's rank
      const userRankIndex = rankedUsers.findIndex(u => u.email === currentUser.email);
      if (userRankIndex !== -1) {
        setCurrentUserRank({
          rank: userRankIndex + 1,
          user: rankedUsers[userRankIndex]
        });
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    }
    setLoading(false);
  };

  const calculateRankings = (users, attempts, logs, type, timeFilter) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filterByTime = (dateStr) => {
      if (timeFilter === 'all') return true;
      const date = new Date(dateStr);
      if (timeFilter === 'week') return date >= weekAgo;
      if (timeFilter === 'month') return date >= monthAgo;
      return true;
    };

    const rankedUsers = users.map(u => {
      let score = 0;
      let metric = '';

      switch (type) {
        case 'points':
          score = u.gamification_points || 0;
          metric = `${score.toLocaleString()} pts`;
          break;

        case 'mocks':
          const userAttempts = attempts.filter(a => 
            a.created_by === u.email && filterByTime(a.created_date)
          );
          const avgScore = userAttempts.length > 0
            ? userAttempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / userAttempts.length
            : 0;
          score = avgScore * 100 + userAttempts.length; // Weight by both score and attempts
          metric = `${avgScore.toFixed(1)}% avg (${userAttempts.length} exams)`;
          break;

        case 'streaks':
          score = u.current_streak || 0;
          metric = `${score} day${score !== 1 ? 's' : ''}`;
          break;

        case 'practice':
          const userLogs = logs.filter(l => 
            l.created_by === u.email && filterByTime(l.created_date)
          );
          const correct = userLogs.filter(l => l.was_correct).length;
          const total = userLogs.length;
          const accuracy = total > 0 ? (correct / total * 100) : 0;
          score = accuracy * 100 + total; // Weight by both accuracy and volume
          metric = `${accuracy.toFixed(1)}% (${total} questions)`;
          break;

        default:
          score = 0;
      }

      return {
        ...u,
        score,
        metric
      };
    });

    return rankedUsers
      .filter(u => u.score > 0) // Only show users with activity
      .sort((a, b) => b.score - a.score)
      .slice(0, 100); // Top 100
  };

  const getUserAvatar = (user) => {
    const colorScheme = user.profile_color_scheme || 'purple';
    const initial = (user.full_name || 'U')[0].toUpperCase();
    
    return (
      <div className={`w-12 h-12 rounded-full bg-linear-to-br ${PROFILE_COLORS[colorScheme]} flex items-center justify-center text-white font-bold text-lg`}>
        {initial}
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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <Watermark />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-amber-500" />
            Community Leaderboard
          </h1>
          <p className="text-slate-600">Compete with fellow SQE candidates and track your progress</p>
        </div>

        {/* Current User Rank Card */}
        {currentUserRank && user && (
          <Card className="mb-6 border-none shadow-lg bg-linear-to-r from-purple-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getUserAvatar(user)}
                  <div>
                    <p className="text-sm text-slate-600">Your Rank</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-slate-900">#{currentUserRank.rank}</span>
                      {currentUserRank.rank <= 3 && RANK_ICONS[currentUserRank.rank]}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Score</p>
                  <p className="text-xl font-bold text-slate-900">{currentUserRank.user.metric}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!user?.leaderboard_visible && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              You're currently hidden from the leaderboard. Update your settings to appear publicly.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Total Points
                      </div>
                    </SelectItem>
                    <SelectItem value="mocks">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Mock Exam Performance
                      </div>
                    </SelectItem>
                    <SelectItem value="streaks">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        Study Streaks
                      </div>
                    </SelectItem>
                    <SelectItem value="practice">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Practice Performance
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={timeFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setTimeFilter('all')}
                  size="sm"
                >
                  All Time
                </Button>
                <Button
                  variant={timeFilter === 'month' ? 'default' : 'outline'}
                  onClick={() => setTimeFilter('month')}
                  size="sm"
                >
                  This Month
                </Button>
                <Button
                  variant={timeFilter === 'week' ? 'default' : 'outline'}
                  onClick={() => setTimeFilter('week')}
                  size="sm"
                >
                  This Week
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="p-12 text-center">
                <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No data available for this category</p>
              </div>
            ) : (
              <div className="divide-y">
                {users.map((u, index) => {
                  const rank = index + 1;
                  const isCurrentUser = u.email === user?.email;
                  const topBadges = (u.favorite_badges || []).slice(0, 3);

                  return (
                    <div
                      key={u.id}
                      className={`p-4 hover:bg-slate-50 transition-colors ${
                        isCurrentUser ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 text-center">
                          {rank <= 3 ? (
                            RANK_ICONS[rank]
                          ) : (
                            <span className="text-lg font-bold text-slate-600">#{rank}</span>
                          )}
                        </div>

                        {getUserAvatar(u)}

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900">
                              {u.full_name || 'Anonymous'}
                            </span>
                            {isCurrentUser && (
                              <Badge className="bg-blue-600">You</Badge>
                            )}
                            {u.profile_title && (
                              <Badge variant="outline">{u.profile_title}</Badge>
                            )}
                          </div>
                          
                          {topBadges.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {topBadges.map((badgeId, idx) => {
                                const badge = BADGES_CATALOG[badgeId];
                                if (!badge) return null;
                                return (
                                  <span
                                    key={idx}
                                    className="text-sm"
                                    title={badge.description}
                                  >
                                    {badge.icon}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <Badge className="bg-slate-900">Level {u.level || 1}</Badge>
                          </div>
                          <p className="text-sm font-semibold text-slate-700">{u.metric}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hall of Fame - Top 3 */}
        {users.length >= 3 && (
          <Card className="mt-6 border-none shadow-lg bg-linear-to-br from-amber-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Hall of Fame - Top 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {users.slice(0, 3).map((u, index) => {
                  const rank = index + 1;
                  return (
                    <div key={u.id} className="text-center p-4 bg-white rounded-lg shadow">
                      <div className="flex justify-center mb-3">
                        {RANK_ICONS[rank]}
                      </div>
                      <div className="flex justify-center mb-3">
                        {getUserAvatar(u)}
                      </div>
                      <h3 className="font-bold text-slate-900">{u.full_name || 'Anonymous'}</h3>
                      <p className="text-sm text-slate-600 mt-1">{u.metric}</p>
                      <Badge className="mt-2 bg-slate-900">Level {u.level || 1}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}