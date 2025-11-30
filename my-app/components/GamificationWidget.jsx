import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Zap, Flame, Award, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

const LEVEL_THRESHOLDS = [
    { level: 1, points: 0 },
    { level: 2, points: 1000 },
    { level: 3, points: 2500 },
    { level: 4, points: 5000 },
    { level: 5, points: 10000 },
    { level: 6, points: 20000 },
    { level: 7, points: 35000 },
    { level: 8, points: 50000 },
    { level: 9, points: 75000 },
    { level: 10, points: 100000 }
];

const BADGES_CATALOG = {
    // Question Practice Badges
    'first_steps': { name: 'First Steps', icon: '👣', description: 'Answered your first 10 questions', points: 100, category: 'practice' },
    'practice_warrior': { name: 'Practice Warrior', icon: '⚔️', description: 'Answered 100 questions', points: 500, category: 'practice' },
    'question_master': { name: 'Question Master', icon: '🎯', description: 'Answered 500 questions', points: 1000, category: 'practice' },
    'question_legend': { name: 'Question Legend', icon: '🏆', description: 'Answered 1000 questions', points: 2000, category: 'practice' },
    
    // Mock Exam Badges
    'mock_beginner': { name: 'Mock Beginner', icon: '📝', description: 'Completed your first mock exam', points: 200, category: 'mocks' },
    'mock_veteran': { name: 'Mock Veteran', icon: '🎖️', description: 'Completed 10 mock exams', points: 1000, category: 'mocks' },
    'mock_champion': { name: 'Mock Champion', icon: '🥇', description: 'Completed 25 mock exams', points: 2500, category: 'mocks' },
    
    // Accuracy Badges
    'accuracy_ace': { name: 'Accuracy Ace', icon: '🎯', description: 'Scored 85%+ on a mock exam', points: 500, category: 'accuracy' },
    'perfect_score': { name: 'Perfect Score', icon: '💯', description: 'Got 100% on any assessment', points: 1000, category: 'accuracy' },
    'consistent_excellence': { name: 'Consistent Excellence', icon: '⭐', description: 'Scored 80%+ on 5 consecutive mocks', points: 1500, category: 'accuracy' },
    
    // Subject Mastery Badges
    'subject_master': { name: 'Subject Master', icon: '📚', description: 'Mastered all questions in a subject', points: 750, category: 'mastery' },
    'multi_subject_master': { name: 'Multi-Subject Master', icon: '📖', description: 'Mastered 3 different subjects', points: 2000, category: 'mastery' },
    'complete_coverage': { name: 'Complete Coverage', icon: '🌐', description: 'Practiced all 16 SQE subjects', points: 3000, category: 'mastery' },
    
    // Streak Badges
    'week_warrior': { name: 'Week Warrior', icon: '🔥', description: 'Maintained a 7-day study streak', points: 300, category: 'streak' },
    'month_legend': { name: 'Month Legend', icon: '⭐', description: 'Maintained a 30-day study streak', points: 1500, category: 'streak' },
    'unstoppable': { name: 'Unstoppable', icon: '🌟', description: 'Maintained a 60-day study streak', points: 3000, category: 'streak' },
    'dedication_master': { name: 'Dedication Master', icon: '👑', description: 'Maintained a 100-day study streak', points: 5000, category: 'streak' },
    
    // Special Badges
    'simulator_graduate': { name: 'Simulator Graduate', icon: '🎓', description: 'Completed Exam Day Simulator', points: 1000, category: 'special' },
    'speed_demon': { name: 'Speed Demon', icon: '⚡', description: 'Averaged under 90s per question', points: 500, category: 'special' },
    'night_owl': { name: 'Night Owl', icon: '🦉', description: 'Completed 10 study sessions after 10 PM', points: 300, category: 'special' },
    'early_bird': { name: 'Early Bird', icon: '🐦', description: 'Completed 10 study sessions before 7 AM', points: 300, category: 'special' },
    
    // Community Badges
    'community_helper': { name: 'Community Helper', icon: '🤝', description: 'Posted 10 helpful forum posts', points: 500, category: 'community' },
    'study_buddy': { name: 'Study Buddy', icon: '👥', description: 'Joined a study group', points: 200, category: 'community' },
    'group_leader': { name: 'Group Leader', icon: '👨‍🏫', description: 'Created and led a study group', points: 750, category: 'community' },
    
    // Black Letter Law Badges
    'bll_novice': { name: 'BLL Novice', icon: '⚖️', description: 'Answered 50 Black Letter Law questions', points: 300, category: 'bll' },
    'bll_expert': { name: 'BLL Expert', icon: '⚖️', description: 'Answered 200 Black Letter Law questions', points: 1000, category: 'bll' },
    'bll_master': { name: 'BLL Master', icon: '⚖️', description: 'Scored 90%+ on 100 Black Letter Law questions', points: 2000, category: 'bll' },
    
    // Milestone Badges
    'level_5_milestone': { name: 'Rising Star', icon: '🌠', description: 'Reached Level 5', points: 500, category: 'milestone' },
    'level_10_milestone': { name: 'Grandmaster', icon: '👑', description: 'Reached Level 10', points: 2000, category: 'milestone' },
    'points_milestone_10k': { name: '10K Club', icon: '💎', description: 'Earned 10,000 points', points: 1000, category: 'milestone' },
    'points_milestone_50k': { name: '50K Elite', icon: '💎', description: 'Earned 50,000 points', points: 3000, category: 'milestone' },
    
    // Improvement Badges
    'comeback_king': { name: 'Comeback King', icon: '📈', description: 'Improved a weak subject by 30%', points: 1000, category: 'improvement' },
    'determined': { name: 'Determined', icon: '💪', description: 'Retook the same mock 3 times', points: 500, category: 'improvement' },
    
    // Resource Usage Badges
    'flashcard_fan': { name: 'Flashcard Fan', icon: '🎴', description: 'Reviewed 100 flashcards', points: 400, category: 'resources' },
    'note_taker': { name: 'Note Taker', icon: '📓', description: 'Created 10 study notes', points: 300, category: 'resources' },
    'resource_master': { name: 'Resource Master', icon: '📚', description: 'Used all study tools (flashcards, notes, mind maps)', points: 1000, category: 'resources' }
};

const calculateLevel = (points) => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (points >= LEVEL_THRESHOLDS[i].points) {
            return LEVEL_THRESHOLDS[i].level;
        }
    }
    return 1;
};

const calculateNextLevelProgress = (points) => {
    const currentLevel = calculateLevel(points);
    const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel)?.points || 0;
    const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1)?.points;
    
    if (!nextThreshold) {
        return { progress: 100, pointsNeeded: 0, pointsToNext: 0 };
    }
    
    const pointsIntoLevel = points - currentThreshold;
    const pointsNeededForLevel = nextThreshold - currentThreshold;
    const progress = (pointsIntoLevel / pointsNeededForLevel) * 100;
    
    return {
        progress: Math.min(progress, 100),
        pointsNeeded: pointsNeededForLevel,
        pointsToNext: nextThreshold - points
    };
};

export default function GamificationWidget({ user, compact = false }) {
    if (!user) return null;

    const points = user.gamification_points || 0;
    const level = user.level || calculateLevel(points);
    const badges = Array.isArray(user.badges_earned) ? user.badges_earned : [];
    const streak = user.current_streak || 0;
    const questionsAnswered = user.total_questions_answered || 0;

    const { progress, pointsToNext } = calculateNextLevelProgress(points);

    if (compact) {
        return (
            <div className="flex items-center gap-4 p-4 bg-linear-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        {level}
                    </div>
                    <div>
                        <p className="text-xs text-slate-600">Level {level}</p>
                        <p className="font-bold text-slate-900">{points.toLocaleString()} pts</p>
                    </div>
                </div>
                {streak > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 rounded-full">
                        <Flame className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-amber-700">{streak}</span>
                    </div>
                )}
                <Button asChild variant="ghost" size="sm" className="ml-auto">
                    <Link to={createPageUrl("ProgressTracker")}>
                        <TrendingUp className="w-4 h-4" />
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <Card className="border-none shadow-lg bg-linear-to-br from-purple-50 to-blue-50 mb-8">
            <CardHeader className="border-b border-purple-100">
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Your Progress
                    </span>
                    <Button asChild size="sm" variant="outline">
                        <Link to={createPageUrl("ProgressTracker")}>View All</Link>
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Level Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-bold text-xl">
                                {level}
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Level {level}</p>
                                <p className="font-bold text-slate-900">{points.toLocaleString()} points</p>
                            </div>
                        </div>
                        {pointsToNext > 0 && (
                            <Badge variant="outline" className="text-purple-700 border-purple-300">
                                {pointsToNext.toLocaleString()} to Level {level + 1}
                            </Badge>
                        )}
                    </div>
                    <Progress value={progress} className="h-3 bg-slate-200" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg">
                        <Flame className={`w-6 h-6 mx-auto mb-1 ${streak > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
                        <p className="text-2xl font-bold text-slate-900">{streak}</p>
                        <p className="text-xs text-slate-600">Day Streak</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                        <Target className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                        <p className="text-2xl font-bold text-slate-900">{questionsAnswered}</p>
                        <p className="text-xs text-slate-600">Questions</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                        <Award className="w-6 h-6 mx-auto mb-1 text-green-500" />
                        <p className="text-2xl font-bold text-slate-900">{badges.length}</p>
                        <p className="text-xs text-slate-600">Badges</p>
                    </div>
                </div>

                {/* Recent Badges */}
                {badges.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-3">Recent Badges</p>
                        <div className="flex flex-wrap gap-2">
                            {badges.slice(0, 6).map((badgeId, idx) => {
                                const badge = BADGES_CATALOG[badgeId];
                                if (!badge) return null;
                                return (
                                    <div key={`${badgeId}-${idx}`} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200" title={badge.description}>
                                        <span className="text-2xl">{badge.icon}</span>
                                        <span className="text-xs font-medium text-slate-700">{badge.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export { BADGES_CATALOG, calculateLevel, calculateNextLevelProgress };