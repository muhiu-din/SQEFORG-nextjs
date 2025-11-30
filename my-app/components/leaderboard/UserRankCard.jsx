import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, BarChart3, Target } from 'lucide-react';

const UserRankCard = ({ rank, name, averageScore, attemptsCount, points, level, type = 'accuracy' }) => {
    if (rank === null) {
        return (
            <Card className="mb-8 border-none shadow-lg bg-white">
                <CardContent className="p-6 text-center">
                    <p className="font-semibold text-slate-700">You're not on the leaderboard yet!</p>
                    <p className="text-sm text-slate-500 mt-1">
                        {type === 'accuracy' ? 'Complete a mock exam to see your rank.' : 'Start earning points to appear on the leaderboard!'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (type === 'accuracy') {
        return (
            <Card className="mb-8 border-none shadow-lg bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                            <p className="text-xs text-amber-300 uppercase font-bold tracking-wider">Your Rank</p>
                            <p className="text-5xl font-bold">#{rank + 1}</p>
                        </div>
                        <div className="border-l border-slate-600 pl-4">
                            <p className="text-lg font-semibold">{name}</p>
                            <p className="text-sm text-slate-300">Keep climbing!</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                            <Trophy className="w-4 h-4 text-amber-300" />
                            <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
                        </div>
                        <p className="text-xs text-slate-400">Average Score</p>
                        <div className="flex items-center gap-2 justify-end mt-2">
                            <BarChart3 className="w-4 h-4 text-slate-400" />
                            <p className="font-semibold">{attemptsCount}</p>
                            <p className="text-xs text-slate-400">Exams Taken</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Points type
    return (
        <Card className="mb-8 border-none shadow-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                        <p className="text-xs text-purple-200 uppercase font-bold tracking-wider">Your Rank</p>
                        <p className="text-5xl font-bold">#{rank + 1}</p>
                    </div>
                    <div className="border-l border-purple-400 pl-4">
                        <p className="text-lg font-semibold">{name}</p>
                        <p className="text-sm text-purple-200">Level {level}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        <Target className="w-5 h-5 text-amber-300" />
                        <p className="text-3xl font-bold">{points?.toLocaleString() || 0}</p>
                    </div>
                    <p className="text-xs text-purple-200">Total Points</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserRankCard;