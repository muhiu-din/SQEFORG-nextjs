"use client";
import React, { useState, useEffect, useMemo } from 'react';
//call api entities here
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Loader2, ChevronLeft, ChevronRight, Lock, AlertCircle, ThumbsUp, Meh, ThumbsDown, BarChart3, CheckCircle2, XCircle, BookOpen, Target, Calendar } from 'lucide-react';
import _ from 'lodash';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { processFlashcardRewards } from '@/components/GamificationHelper';
import GamificationToast from '@/components/GamificationToast';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law", 
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const Flashcard = ({ front, back, isFlipped, onFlip }) => {
    return (
        <div className="w-full h-96 cursor-pointer" onClick={onFlip} style={{ perspective: '1000px' }}>
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="absolute w-full h-full p-8 bg-white rounded-2xl shadow-xl border flex items-center justify-center text-center" style={{ backfaceVisibility: 'hidden' }}>
                    <p className="text-xl font-semibold text-slate-800">{front}</p>
                </div>
                <div className="absolute w-full h-full p-8 bg-slate-800 text-white rounded-2xl shadow-xl border flex flex-col justify-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <h3 className="font-bold text-amber-400 mb-2">Answer</h3>
                    <p className="text-slate-200 overflow-auto">{back}</p>
                </div>
            </motion.div>
        </div>
    );
};

export default function FlashCards() {
    const searchParams = useSearchParams();
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [subject, setSubject] = useState('');
    const [sessionCards, setSessionCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loadingCards, setLoadingCards] = useState(false);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [numCards, setNumCards] = useState(20);
    const [totalAvailable, setTotalAvailable] = useState(0);
    const [reviewRatings, setReviewRatings] = useState({});
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionMode, setSessionMode] = useState('new'); // 'new', 'weak', 'all', 'due'
    const [userReviews, setUserReviews] = useState([]);
    const [studyMode, setStudyMode] = useState('review'); // 'review', 'quiz'
    const [selectedDeckId, setSelectedDeckId] = useState(null);
    const [availableDecks, setAvailableDecks] = useState([]);
    const [gamificationRewards, setGamificationRewards] = useState(null);

    const subjects = ALL_SUBJECTS.sort();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
                
                // Load user's reviews
                const reviews = await base44.entities.FlashCardReview.filter(
                    { created_by: currentUser.email },
                    '-created_date',
                    10000
                );
                setUserReviews(reviews);

                // Load user's decks
                const decks = await base44.entities.FlashCardDeck.filter(
                    { created_by: currentUser.email },
                    '-created_date'
                );
                setAvailableDecks(decks);

                // Check URL parameters for deck
                const params = new URLSearchParams(searchParams.toString());
                const deckId = params.get('deckId');
                if (deckId) {
                    setSelectedDeckId(deckId);
                    const deck = decks.find(d => d.id === deckId);
                    if (deck && deck.subject !== 'Mixed') {
                        setSubject(deck.subject);
                    }
                } else if (decks.length > 0) {
                     // If no deckId in URL, but user has decks, default to showing "All Flashcards" if that's an option
                    setSelectedDeckId(null); // explicitly set to null for "All Flashcards (Library)"
                }

            } catch (error) {
                setUser({ subscription_tier: 'starter', role: 'guest' });
            }
            setLoadingUser(false);
        };
        fetchUser();
    }, [searchParams]);

    // Calculate next review date using SM-2 algorithm
    const calculateNextReview = (quality, previousReviews) => {
        // Find the latest review for the specific card being reviewed now
        const latestCardReview = previousReviews
            .filter(r => r.flashcard_id === sessionCards[currentIndex].id)
            .sort((a, b) => new Date(b.review_date) - new Date(a.review_date))[0];

        let easeFactor = latestCardReview?.ease_factor || 2.5;
        let interval = latestCardReview?.review_interval_days || 0; // Initialize to 0, will be set to 1 if repetitions is 0
        let repetitions = latestCardReview?.repetitions || 0;

        if (quality >= 3) { // Easy or Medium (quality 3 or 4)
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions += 1;
            easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        } else { // Hard or Again (quality 0, 1, or 2)
            repetitions = 0;
            interval = 1;
        }

        easeFactor = Math.max(1.3, easeFactor);
        
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
        
        return {
            next_review_date: format(nextReviewDate, 'yyyy-MM-dd'),
            review_interval_days: interval,
            ease_factor: easeFactor,
            repetitions: repetitions
        };
    };

    const startSession = async () => {
        if (!subject && !selectedDeckId) { // Ensure either subject or deck is selected
            alert('Please select a subject or a deck to start the session.');
            return;
        }
        if (numCards <= 0 || !user) return;
        setLoadingCards(true);
        setSessionStarted(true);
        setIsFlipped(false);
        setReviewRatings({});
        setSessionComplete(false);
        setGamificationRewards(null); // Reset rewards for new session

        let cards = [];
        try {
            const isAdmin = user.role === 'admin';
            const tier = user.subscription_tier || 'starter';

            let allSubjectCards = [];

            // If a deck is selected, use cards from that deck
            if (selectedDeckId) {
                const deck = await base44.entities.FlashCardDeck.get(selectedDeckId);
                if (deck && deck.flashcard_ids && deck.flashcard_ids.length > 0) {
                    allSubjectCards = await base44.entities.FlashCard.filter({
                        id: { $in: deck.flashcard_ids }
                    });
                }
            } else { // If no specific deck, use the subject for filtering from the general library
                allSubjectCards = await base44.entities.FlashCard.filter({ subject: subject });
            }

            setTotalAvailable(allSubjectCards.length);

            let maxCards;
            if (isAdmin || tier === 'ultimate') {
                maxCards = 3000;
            } else if (tier === 'pro') {
                maxCards = 1000;
            } else {
                maxCards = 200;
            }

            const availableCards = allSubjectCards.slice(0, maxCards);
            
            // Filter based on session mode
            const subjectReviews = userReviews.filter(r => r.subject === subject || (selectedDeckId && r.deck_id === selectedDeckId));
            
            // Determine mastered cards (easy/medium)
            const masteredCardIds = new Set(
                subjectReviews
                    .filter(r => r.difficulty_rating === 'easy' || r.difficulty_rating === 'medium')
                    .map(r => r.flashcard_id)
            );
            
            // Determine weak cards (hard/again)
            const weakCardIds = new Set(
                subjectReviews
                    .filter(r => r.difficulty_rating === 'hard' || r.difficulty_rating === 'again')
                    .map(r => r.flashcard_id)
            );

            // Get cards due for review (spaced repetition)
            const today = format(new Date(), 'yyyy-MM-dd');
            const dueCardIds = new Set();
            subjectReviews.forEach(review => {
                if (review.next_review_date && review.next_review_date <= today) {
                    dueCardIds.add(review.flashcard_id);
                }
            });
            
            let filteredCards = availableCards;
            
            if (sessionMode === 'new') {
                filteredCards = availableCards.filter(card => !masteredCardIds.has(card.id));
            } else if (sessionMode === 'weak') {
                filteredCards = availableCards.filter(card => weakCardIds.has(card.id));
            } else if (sessionMode === 'due') {
                filteredCards = availableCards.filter(card => dueCardIds.has(card.id));
                if (filteredCards.length === 0) {
                    alert('No cards due for review today! Great job staying on top of your studies.');
                    setSessionStarted(false);
                    setLoadingCards(false);
                    return;
                }
            }
            // 'all' mode includes everything

            cards = _.shuffle(filteredCards).slice(0, Math.min(numCards, filteredCards.length));

        } catch(e) {
            console.error("Failed to start flashcard session:", e);
            alert("Failed to load cards. Please try again.");
            setSessionStarted(false);
            setLoadingCards(false);
            return;
        }

        if (cards.length === 0) {
            const modeText = sessionMode === 'weak' ? 'weak cards' : sessionMode === 'new' ? 'new cards' : sessionMode === 'due' ? 'cards due for review' : 'cards';
            const subjectOrDeckName = selectedDeckId ? (availableDecks.find(d => d.id === selectedDeckId)?.name || 'this deck') : (subject || 'this subject');
            alert(`No ${modeText} found for "${subjectOrDeckName}". ${sessionMode === 'weak' ? 'Try reviewing cards you haven\'t mastered yet!' : 'This is a separate content library from MCQ questions.'}`);
            setSessionStarted(false);
            setLoadingCards(false);
            return;
        }

        setSessionCards(cards);
        setCurrentIndex(0);
        setLoadingCards(false);
    };

    const handleRating = async (rating) => {
        const currentCard = sessionCards[currentIndex];
        const newRatings = {...reviewRatings, [currentCard.id]: rating};
        setReviewRatings(newRatings);

        // Map rating to quality for SM-2 algorithm
        // 0: Again, 1: Wrong, 2: Hard, 3: Medium, 4: Easy, 5: Perfect
        // We're using 0 for 'again', 2 for 'hard', 3 for 'medium', 4 for 'easy'
        const qualityMap = { 'again': 0, 'hard': 2, 'medium': 3, 'easy': 4 };
        const quality = qualityMap[rating];

        // Get previous reviews for this card
        const previousReviews = userReviews.filter(r => r.flashcard_id === currentCard.id);
        
        // Calculate next review using spaced repetition
        const spacedRepetition = calculateNextReview(quality, previousReviews);

        // Save review to database
        try {
            await base44.entities.FlashCardReview.create({
                flashcard_id: currentCard.id,
                deck_id: selectedDeckId,
                subject: currentCard.subject,
                difficulty_rating: rating,
                review_date: format(new Date(), 'yyyy-MM-dd'),
                ...spacedRepetition
            });
            
            // Update local reviews
            setUserReviews(prev => [...prev, {
                flashcard_id: currentCard.id,
                deck_id: selectedDeckId,
                subject: currentCard.subject,
                difficulty_rating: rating,
                review_date: format(new Date(), 'yyyy-MM-dd'),
                ...spacedRepetition
            }]);
        } catch (error) {
            console.error('Failed to save review:', error);
        }

        // Auto-advance after rating
        setTimeout(() => {
            if (currentIndex < sessionCards.length - 1) {
                handleNext();
            } else {
                setSessionComplete(true);
            }
        }, 500);
    };

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
             setCurrentIndex((prev) => (prev + 1) % sessionCards.length);
        }, 300);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + sessionCards.length) % sessionCards.length);
        }, 300);
    };

    const resetSession = () => {
        setSessionStarted(false);
        setSubject('');
        setNumCards(20);
        setSessionComplete(false);
        setReviewRatings({});
        setSelectedDeckId(null); // Reset selected deck
        setSessionMode('new'); // Reset session mode
        setStudyMode('review'); // Reset study mode
        setGamificationRewards(null); // Clear gamification rewards for the next session
    };
    
    // Process rewards when session completes
    useEffect(() => {
        const processRewards = async () => {
            if (sessionComplete && user && !gamificationRewards) {
                try {
                    const easyCount = Object.values(reviewRatings).filter(r => r === 'easy').length;
                    const rewards = await processFlashcardRewards(user, sessionCards.length, easyCount);
                    setGamificationRewards(rewards);
                } catch (e) {
                    console.error("Failed to process flashcard rewards:", e);
                }
            }
        };
        processRewards();
    }, [sessionComplete, user, gamificationRewards, reviewRatings, sessionCards.length]);

    if (loadingUser) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" /></div>;
    }

    const hasAccess = user?.role === 'admin' || user?.subscription_tier === 'starter' || user?.subscription_tier === 'pro' || user?.subscription_tier === 'ultimate';

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
                <div className="max-w-3xl mx-auto text-center">
                    <Card className="border-none shadow-xl p-10">
                        <Lock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Flash Cards Available</h1>
                        <p className="text-slate-600 mb-8">Flash Cards are available on all plans including Starter (200 per topic).</p>
                        <Link href={createPageUrl("Packages")}>
                            <Button className="bg-amber-400 text-slate-900 hover:bg-amber-500 h-12 px-8 text-lg">
                                View Plans
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    if (sessionComplete) {
        const easyCount = Object.values(reviewRatings).filter(r => r === 'easy').length;
        const mediumCount = Object.values(reviewRatings).filter(r => r === 'medium').length;
        const hardCount = Object.values(reviewRatings).filter(r => r === 'hard').length;
        const againCount = Object.values(reviewRatings).filter(r => r === 'again').length;

        return (
            <div className="p-6 md:p-10">
                <div className="max-w-3xl mx-auto text-center">
                    <Card className="border-none shadow-xl p-10">
                        <Layers className="w-20 h-20 text-purple-600 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Session Complete! 🎉</h1>
                        <p className="text-slate-600 mb-4">You reviewed {sessionCards.length} cards on {subject || (availableDecks.find(d => d.id === selectedDeckId)?.name || 'your selected deck')}</p>
                        
                        <Alert className="mb-8 bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <strong>Smart Spaced Repetition:</strong> Cards are scheduled for review based on how well you know them. 
                                Focus on due cards for maximum efficiency!
                            </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="p-4 bg-green-50 rounded-xl">
                                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-green-700">{easyCount}</p>
                                <p className="text-sm text-green-600">Easy</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl">
                                <Meh className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-amber-700">{mediumCount}</p>
                                <p className="text-sm text-amber-600">Medium</p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-xl">
                                <XCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-orange-700">{hardCount}</p>
                                <p className="text-sm text-orange-600">Hard</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-xl">
                                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-red-700">{againCount}</p>
                                <p className="text-sm text-red-600">Again</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center">
                            <Button onClick={resetSession} variant="outline" className="gap-2">
                                Choose New Topic
                            </Button>
                            <Button asChild variant="outline" className="gap-2">
                                <Link href={createPageUrl("MyDecks")}>
                                    <Layers className="w-4 h-4" />
                                    My Decks
                                </Link>
                            </Button>
                            <Button asChild className="bg-purple-600 hover:bg-purple-700 gap-2">
                                <Link href={createPageUrl("FlashCardProgress")}>
                                    <BarChart3 className="w-4 h-4" />
                                    View Progress
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </div>
                
                {gamificationRewards && (
                    <GamificationToast 
                        points={gamificationRewards.points}
                        newBadges={gamificationRewards.newBadges}
                        streakInfo={gamificationRewards.streakInfo}
                    />
                )}
            </div>
        );
    }
    
    return (
        <div className="p-6 md:p-10">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-16 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                            <Layers className="w-8 h-8 text-amber-400" />
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm" className="gap-2">
                                <Link href={createPageUrl("FlashCardProgress")}>
                                    <BarChart3 className="w-4 h-4" />
                                    Progress
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="gap-2">
                                <Link href={createPageUrl("MyDecks")}>
                                    <Layers className="w-4 h-4" />
                                    My Decks
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Flash Cards</h1>
                    <p className="text-slate-600 text-lg">Quick revision with focused key concepts - separate from MCQ practice</p>
                    {user?.subscription_tier === 'starter' && (
                        <p className="text-sm text-blue-600 font-medium mt-2">Starter Plan: 200 flash cards per topic</p>
                    )}
                    {user?.subscription_tier === 'pro' && (
                        <p className="text-sm text-amber-600 font-medium mt-2">Pro Plan: 1000 flash cards per topic</p>
                    )}
                    {user?.subscription_tier === 'ultimate' && (
                        <p className="text-sm text-purple-600 font-medium mt-2">Ultimate Plan: 3000 flash cards per topic</p>
                    )}
                </div>

                <Alert className="mb-6 border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>Smart Spaced Repetition:</strong> Cards are scheduled based on how well you know them. 
                        Focus on due cards for maximum efficiency!
                    </AlertDescription>
                </Alert>

                {!sessionStarted ? (
                     <Card className="border-none shadow-xl text-center p-8">
                        <h2 className="text-2xl font-bold mb-6">Select Your Practice Mode</h2>
                        
                        {/* Study Mode Selection */}
                        <div className="mb-6">
                            <Label className="text-sm font-semibold text-slate-700 mb-3 block">Study Mode</Label>
                            <Tabs value={studyMode} onValueChange={setStudyMode} className="mb-4">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="review">
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Review Mode
                                    </TabsTrigger>
                                    <TabsTrigger value="quiz">
                                        <Target className="w-4 h-4 mr-2" />
                                        Quiz Mode
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <p className="text-xs text-slate-500">
                                {studyMode === 'review' 
                                    ? 'Flip cards to see answers, rate your confidence'
                                    : 'Test yourself before seeing the answer'
                                }
                            </p>
                        </div>

                        {/* Deck Selection */}
                        {availableDecks.length > 0 && (
                            <div className="mb-6">
                                <Label htmlFor="deck-select" className="text-sm font-semibold text-slate-700 mb-3 block">Choose Source</Label>
                                <Select value={selectedDeckId || 'all'} onValueChange={(value) => {
                                    setSelectedDeckId(value === 'all' ? null : value);
                                    if (value === 'all') {
                                        setSubject(''); // Clear subject if "All Flashcards" is selected
                                    } else {
                                        const deck = availableDecks.find(d => d.id === value);
                                        if (deck && deck.subject !== 'Mixed') {
                                            setSubject(deck.subject);
                                        } else if (deck && deck.subject === 'Mixed') {
                                            setSubject('Mixed'); // Set subject to 'Mixed' for mixed decks
                                        }
                                    }
                                }}>
                                    <SelectTrigger id="deck-select">
                                        <SelectValue placeholder="Select a deck or library..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-96">
                                        <SelectItem value="all">All Flashcards (Library)</SelectItem>
                                        {availableDecks.map(deck => (
                                            <SelectItem key={deck.id} value={deck.id}>
                                                {deck.name} ({deck.flashcard_ids?.length || 0} cards)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <Tabs value={sessionMode} onValueChange={setSessionMode} className="mb-6">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="due">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Due Today
                                </TabsTrigger>
                                <TabsTrigger value="new">
                                    <Layers className="w-4 h-4 mr-2" />
                                    New Cards
                                </TabsTrigger>
                                <TabsTrigger value="weak">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Weak Cards
                                </TabsTrigger>
                                <TabsTrigger value="all">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Review All
                                </TabsTrigger>
                            </TabsList>
                            
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg text-left">
                                {sessionMode === 'due' && (
                                    <p className="text-sm text-slate-700">
                                        <strong>Due Today:</strong> Cards scheduled for review today based on spaced repetition. Most efficient way to study!
                                    </p>
                                )}
                                {sessionMode === 'new' && (
                                    <p className="text-sm text-slate-700">
                                        <strong>New Cards:</strong> Unreviewed cards + cards you found Hard. Excludes mastered cards.
                                    </p>
                                )}
                                {sessionMode === 'weak' && (
                                    <p className="text-sm text-slate-700">
                                        <strong>Weak Cards:</strong> Only cards you previously rated as Hard or Again. Focus on your trouble spots!
                                    </p>
                                )}
                                {sessionMode === 'all' && (
                                    <p className="text-sm text-slate-700">
                                        <strong>Review All:</strong> All available cards including mastered ones. Perfect for comprehensive review.
                                    </p>
                                )}
                            </div>
                        </Tabs>
                        
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            {selectedDeckId === null && ( // Only show subject select if "All Flashcards" is selected
                                <Select value={subject} onValueChange={setSubject}>
                                    <SelectTrigger className="flex-1 h-12">
                                        <SelectValue placeholder="Choose a subject..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-96">
                                        {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                            <div className="flex-1 text-left">
                                <Label htmlFor="num-cards" className="text-sm font-medium">Number of Cards</Label>
                                <Input 
                                    id="num-cards"
                                    type="number"
                                    value={numCards}
                                    onChange={e => setNumCards(parseInt(e.target.value) || 1)}
                                    min="1"
                                    max={user?.subscription_tier === 'ultimate' ? 500 : user?.subscription_tier === 'pro' ? 100 : 50}
                                    disabled={(!subject && !selectedDeckId)}
                                    className="h-12 mt-1"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <Button asChild variant="link" className="gap-2">
                                <Link href={createPageUrl("MyDecks")}>
                                    <Layers className="w-4 h-4" />
                                    Manage Decks
                                </Link>
                            </Button>
                        </div>

                        <Button 
                            onClick={startSession} 
                            disabled={(!subject && !selectedDeckId) || loadingCards || numCards <= 0} 
                            className="h-12 bg-slate-900 hover:bg-slate-800 mt-4 w-full md:w-auto px-8"
                        >
                             {loadingCards ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Start Practice'}
                        </Button>
                    </Card>
                ) : (
                    <>
                        {loadingCards ? (
                            <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" /></div>
                        ) : sessionCards.length > 0 ? (
                            <div>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentIndex}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {studyMode === 'review' ? (
                                            <Flashcard
                                                front={sessionCards[currentIndex].front}
                                                back={sessionCards[currentIndex].back}
                                                isFlipped={isFlipped}
                                                onFlip={() => setIsFlipped(!isFlipped)}
                                            />
                                        ) : ( // Quiz Mode
                                            <Card className="w-full h-96 p-8 border-2 border-purple-200 shadow-xl rounded-2xl flex flex-col justify-between">
                                                <div className="h-full flex flex-col">
                                                    <h3 className="text-xl font-semibold text-slate-800 mb-6">
                                                        {sessionCards[currentIndex].front}
                                                    </h3>
                                                    {isFlipped && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="flex-1 p-6 bg-slate-800 text-white rounded-xl overflow-auto"
                                                        >
                                                            <h4 className="font-bold text-amber-400 mb-2">Answer</h4>
                                                            <p className="text-slate-200">{sessionCards[currentIndex].back}</p>
                                                        </motion.div>
                                                    )}
                                                    {!isFlipped && (
                                                        <Button
                                                            onClick={() => setIsFlipped(true)}
                                                            className="mt-auto bg-purple-600 hover:bg-purple-700"
                                                        >
                                                            Show Answer
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card>
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                {isFlipped && !reviewRatings[sessionCards[currentIndex].id] && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6"
                                    >
                                        <p className="text-center text-slate-700 font-semibold mb-4">How well did you know this?</p>
                                        <div className="grid grid-cols-4 gap-3">
                                            <Button 
                                                onClick={() => handleRating('again')}
                                                className="h-20 flex-col bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                <XCircle className="w-6 h-6 mb-2" />
                                                Again
                                                <span className="text-xs mt-1 opacity-80">&lt;1 day</span>
                                            </Button>
                                            <Button 
                                                onClick={() => handleRating('hard')}
                                                className="h-20 flex-col bg-orange-600 hover:bg-orange-700 text-white"
                                            >
                                                <XCircle className="w-6 h-6 mb-2" />
                                                Hard
                                                <span className="text-xs mt-1 opacity-80">1 day</span>
                                            </Button>
                                            <Button 
                                                onClick={() => handleRating('medium')}
                                                className="h-20 flex-col bg-amber-500 hover:bg-amber-600 text-white"
                                            >
                                                <Meh className="w-6 h-6 mb-2" />
                                                Medium
                                                <span className="text-xs mt-1 opacity-80">6 days</span>
                                            </Button>
                                            <Button 
                                                onClick={() => handleRating('easy')}
                                                className="h-20 flex-col bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle2 className="w-6 h-6 mb-2" />
                                                Easy
                                                <span className="text-xs mt-1 opacity-80">2+ weeks</span>
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex items-center justify-between mt-6">
                                    <Button variant="outline" onClick={handlePrev} className="gap-2" disabled={currentIndex === 0}>
                                        <ChevronLeft className="w-4 h-4" /> Prev
                                    </Button>
                                    <div className="text-center">
                                        <p className="text-slate-600 font-medium">{currentIndex + 1} / {sessionCards.length}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {Object.keys(reviewRatings).length} rated
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={handleNext} className="gap-2" disabled={currentIndex === sessionCards.length - 1}>
                                        Next <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="text-center mt-4">
                                    <p className="text-sm text-slate-500">Mode: {sessionMode === 'new' ? 'New Cards' : sessionMode === 'weak' ? 'Weak Cards' : sessionMode === 'due' ? 'Due Today' : 'Review All'} ({studyMode === 'review' ? 'Review Mode' : 'Quiz Mode'})</p>
                                    {!isFlipped && (
                                        <p className="text-xs text-slate-400 mt-2">Click card to flip • Rate each card after reviewing</p>
                                    )}
                                </div>
                                <Button variant="link" onClick={resetSession} className="w-full mt-4 text-slate-600">
                                    Choose a different topic
                                </Button>
                            </div>
                        ) : (
                            <Card className="border-none shadow-xl text-center p-8">
                                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-4">No Cards Available</h2>
                                <p className="text-slate-600 mb-6">
                                    {sessionMode === 'weak' 
                                        ? `You haven't marked any cards as "Hard" or "Again" for "${subject || 'this selection'}" yet. Try practicing new cards first!`
                                        : sessionMode === 'new'
                                        ? `Great work! You've mastered all available cards for "${subject || 'this selection'}". Try "Due Today" or "Review All" mode to practice them again.`
                                        : sessionMode === 'due'
                                        ? `No cards are due for review today for "${subject || 'this selection'}". Keep up the great work! Try "New Cards" or "Review All" modes.`
                                        : `No flash cards for "${subject || 'this selection'}" or in this deck have been added yet.`
                                    }
                                </p>
                                <Button onClick={resetSession} variant="outline">
                                    Go Back
                                </Button>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
