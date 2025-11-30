"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/app/api/base44Client/route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Layers, AlertCircle, Play } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import _ from 'lodash';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FlashCardReviewBanks() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [allCards, setAllCards] = useState([]);
    const [masteredCards, setMasteredCards] = useState([]);
    const [weakCards, setWeakCards] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const userReviews = await base44.entities.FlashCardReview.filter(
                { created_by: currentUser.email },
                '-created_date',
                10000
            );

            // Ensure userReviews is always an array
            const safeReviews = Array.isArray(userReviews) ? userReviews : [];
            setReviews(safeReviews);

            // Get unique card IDs with safety check
            const uniqueCardIds = [...new Set(safeReviews.map(r => r?.flashcard_id).filter(Boolean))];

            if (uniqueCardIds.length > 0) {
                const cards = await base44.entities.FlashCard.filter({
                    id: { '$in': uniqueCardIds }
                });

                // Ensure cards is always an array
                const safeCards = Array.isArray(cards) ? cards : [];
                setAllCards(safeCards);

                // Get latest rating for each card
                const latestRatings = {};
                safeReviews.forEach(review => {
                    if (review && review.flashcard_id) {
                        if (!latestRatings[review.flashcard_id] ||
                            new Date(review.created_date) > new Date(latestRatings[review.flashcard_id].created_date)) {
                            latestRatings[review.flashcard_id] = review;
                        }
                    }
                });

                const mastered = [];
                const weak = [];

                safeCards.forEach(card => {
                    if (!card || !card.id) return;

                    const latestRating = latestRatings[card.id];
                    if (latestRating) {
                        if (latestRating.difficulty_rating === 'hard') {
                            weak.push({ ...card, latestRating: latestRating.difficulty_rating });
                        } else {
                            mastered.push({ ...card, latestRating: latestRating.difficulty_rating });
                        }
                    }
                });

                setMasteredCards(mastered);
                setWeakCards(weak);
            }

        } catch (error) {
            console.error('Failed to load review banks:', error);
            // Set empty arrays on error to prevent map errors
            setReviews([]);
            setAllCards([]);
            setMasteredCards([]);
            setWeakCards([]);
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
                    <p className="text-slate-600">Log in to view your flashcard review banks.</p>
                </Card>
            </div>
        );
    }

    if (allCards.length === 0) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 mb-3">Flash Card Review Banks</h1>
                        <p className="text-slate-600">View and practice your mastered and weak cards</p>
                    </div>

                    <Card className="border-none shadow-xl text-center p-12">
                        <Layers className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">No Cards Reviewed Yet</h2>
                        <p className="text-slate-600 mb-8">Start reviewing flashcards to build your review banks!</p>
                        <Button asChild className="bg-slate-900 hover:bg-slate-800">
                            <Link href={createPageUrl("FlashCards")}>
                                <Layers className="w-4 h-4 mr-2" />
                                Start Reviewing Flash Cards
                            </Link>
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    // Safe grouping with additional checks
    const masteredBySubject = _.groupBy(masteredCards.filter(Boolean), 'subject');
    const weakBySubject = _.groupBy(weakCards.filter(Boolean), 'subject');

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-3">Flash Card Review Banks</h1>
                            <p className="text-slate-600">View and practice your mastered and weak cards</p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href={createPageUrl("FlashCards")}>
                                <Layers className="w-4 h-4 mr-2" />
                                Practice Cards
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-none shadow-lg">
                        <CardContent className="p-6 text-center">
                            <Layers className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                            <p className="text-4xl font-bold text-slate-900">{allCards.length}</p>
                            <p className="text-sm text-slate-600 mt-1">Total Cards Reviewed</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-green-50">
                        <CardContent className="p-6 text-center">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
                            <p className="text-4xl font-bold text-green-900">{masteredCards.length}</p>
                            <p className="text-sm text-green-700 mt-1">Mastered Cards</p>
                            <p className="text-xs text-green-600 mt-1">
                                {allCards.length > 0 ? ((masteredCards.length / allCards.length) * 100).toFixed(0) : 0}% mastery
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-red-50">
                        <CardContent className="p-6 text-center">
                            <XCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
                            <p className="text-4xl font-bold text-red-900">{weakCards.length}</p>
                            <p className="text-sm text-red-700 mt-1">Cards Needing Review</p>
                            {weakCards.length > 0 && (
                                <Button asChild size="sm" className="mt-3 bg-red-600 hover:bg-red-700">
                                    <Link href={createPageUrl("FlashCards")}>
                                        <Play className="w-3 h-3 mr-1" />
                                        Practice Weak Cards
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="weak" className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                        <TabsTrigger value="weak" className="gap-2">
                            <XCircle className="w-4 h-4" />
                            Weak Cards ({weakCards.length})
                        </TabsTrigger>
                        <TabsTrigger value="mastered" className="gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Mastered ({masteredCards.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="weak">
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-900">
                                    <XCircle className="w-5 h-5" />
                                    Cards You Found Difficult
                                </CardTitle>
                                <p className="text-sm text-red-700">
                                    These cards were marked as Hard. Practice them regularly until you master them!
                                </p>
                            </CardHeader>
                            <CardContent>
                                {weakCards.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                        <p className="text-slate-600 text-lg">No weak cards - great job!</p>
                                    </div>
                                ) : (
                                    <Accordion type="single" collapsible className="w-full">
                                        {Object.entries(weakBySubject).map(([subject, cards]) => {
                                            const safeCards = Array.isArray(cards) ? cards : [];
                                            return (
                                                <AccordionItem key={subject} value={subject}>
                                                    <AccordionTrigger className="hover:no-underline">
                                                        <div className="flex justify-between items-center w-full pr-4">
                                                            <span className="font-semibold text-red-900">{subject}</span>
                                                            <Badge className="bg-red-600 text-white">{safeCards.length} cards</Badge>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="space-y-3 pt-4">
                                                            {safeCards.map((card) => (
                                                                <Card key={card.id} className="bg-white border-red-200">
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <p className="font-semibold text-slate-900 flex-1">{card.front}</p>
                                                                            <Badge className="bg-red-600 text-white ml-2">Hard</Badge>
                                                                        </div>
                                                                        <div className="p-3 bg-slate-50 rounded-lg mt-3">
                                                                            <p className="text-sm text-slate-700">{card.back}</p>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="mastered">
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-900">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Cards You Have Mastered
                                </CardTitle>
                                <p className="text-sm text-green-700">
                                    These cards were marked as Easy or Medium. They will not appear in New Cards sessions.
                                </p>
                            </CardHeader>
                            <CardContent>
                                {masteredCards.length === 0 ? (
                                    <div className="text-center py-12">
                                        <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                        <p className="text-slate-600 text-lg">No mastered cards yet</p>
                                        <p className="text-slate-500 text-sm">Start reviewing cards and mark them as Easy or Medium!</p>
                                    </div>
                                ) : (
                                    <Accordion type="single" collapsible className="w-full">
                                        {Object.entries(masteredBySubject).map(([subject, cards]) => {
                                            const safeCards = Array.isArray(cards) ? cards : [];
                                            return (
                                                <AccordionItem key={subject} value={subject}>
                                                    <AccordionTrigger className="hover:no-underline">
                                                        <div className="flex justify-between items-center w-full pr-4">
                                                            <span className="font-semibold text-green-900">{subject}</span>
                                                            <Badge className="bg-green-600 text-white">{safeCards.length} cards</Badge>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="space-y-3 pt-4">
                                                            {safeCards.map((card) => (
                                                                <Card key={card.id} className="bg-white border-green-200">
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <p className="font-semibold text-slate-900 flex-1">{card.front}</p>
                                                                            <Badge className={card.latestRating === 'easy' ? 'bg-green-600 text-white ml-2' : 'bg-amber-500 text-white ml-2'}>
                                                                                {card.latestRating === 'easy' ? 'Easy' : 'Medium'}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="p-3 bg-slate-50 rounded-lg mt-3">
                                                                            <p className="text-sm text-slate-700">{card.back}</p>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}