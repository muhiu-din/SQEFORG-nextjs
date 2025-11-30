import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Zap, Flame, Award, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BADGES_CATALOG } from './GamificationWidget';

export default function GamificationToast({ points, newBadges = [], streakInfo }) {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
        }, 6000);

        return () => clearTimeout(timer);
    }, []);

    if (!show || (!points && (!newBadges || newBadges.length === 0) && !streakInfo?.streakUpdated)) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 max-w-md"
            >
                <Card className="border-none shadow-2xl bg-linear-to-br from-purple-600 to-blue-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <Trophy className="w-6 h-6 text-amber-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-3">Rewards Earned! 🎉</h3>
                                
                                {points > 0 && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap className="w-5 h-5 text-amber-300" />
                                        <span className="text-2xl font-bold">+{points}</span>
                                        <span className="text-sm">points</span>
                                    </div>
                                )}

                                {streakInfo?.streakUpdated && (
                                    <div className="mb-3">
                                        {streakInfo.streakBroken ? (
                                            <div className="flex items-center gap-2 p-2 bg-orange-500/30 rounded-lg">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="text-sm">Streak reset. Start a new one!</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-white/20 rounded-lg">
                                                <Flame className="w-5 h-5 text-amber-300" />
                                                <span className="font-bold">{streakInfo.newStreak} day streak!</span>
                                                {streakInfo.newStreak === 7 && (
                                                    <Badge className="bg-amber-500 text-white ml-2">Week Warrior!</Badge>
                                                )}
                                                {streakInfo.newStreak === 30 && (
                                                    <Badge className="bg-amber-500 text-white ml-2">Month Legend!</Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {newBadges && newBadges.length > 0 && (
                                    <div>
                                        <p className="text-sm mb-2 flex items-center gap-2">
                                            <Award className="w-4 h-4" />
                                            New Badge{newBadges.length > 1 ? 's' : ''} Unlocked:
                                        </p>
                                        <div className="space-y-2">
                                            {newBadges.map((badgeId) => {
                                                const badge = BADGES_CATALOG[badgeId];
                                                if (!badge) return null;
                                                return (
                                                    <div key={badgeId} className="flex items-center gap-2 p-2 bg-white/20 rounded-lg">
                                                        <span className="text-2xl">{badge.icon}</span>
                                                        <div>
                                                            <p className="font-bold text-sm">{badge.name}</p>
                                                            <p className="text-xs opacity-90">{badge.description}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setShow(false)}
                                    className="mt-4 text-sm underline hover:no-underline opacity-80 hover:opacity-100"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}