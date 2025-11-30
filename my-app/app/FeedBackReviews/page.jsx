"use client";
import React, { useState, useEffect } from 'react';
import { Review, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import _ from 'lodash';

const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-6 h-6 transition-colors ${
                        rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    } ${!readOnly ? 'cursor-pointer hover:text-amber-300' : ''}`}
                    onClick={() => !readOnly && onRatingChange(star)}
                />
            ))}
        </div>
    );
};

export default function FeedbackReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);
    const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
    const [error, setError] = useState(null);

    // Updated sample reviews - removed recent exam references
    const sampleReviews = [
        {
            id: 'sample-1',
            author_name: 'Sarah Mitchell',
            rating: 5,
            comment: 'The leaderboard feature is brilliant! It really motivates me to stay consistent with my practice. Love the friendly competition aspect.',
            created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'sample-2',
            author_name: 'James Chen',
            rating: 5,
            comment: 'Study groups have been a game-changer. Being able to share tips and see how my group members are progressing has really helped me stay on track. The progress sharing feature is awesome!',
            created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'sample-3',
            author_name: 'Emily Roberts',
            rating: 5,
            comment: 'The Q&A forum is exactly what I needed! Being able to ask specific legal questions and get answers from peers is invaluable. Great feature for collaborative learning.',
            created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'sample-4',
            author_name: 'David Thompson',
            rating: 5,
            comment: 'Progress tracker with all the visual charts is incredible. I can finally see exactly where I need to improve. The detailed feedback after mock exams is so helpful for my January prep!',
            created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'sample-5',
            author_name: 'Priya Patel',
            rating: 4,
            comment: 'Really impressed with the platform. The gamification elements (badges, streaks, points) make studying actually enjoyable. Hard questions keep me challenged and ready.',
            created_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'sample-6',
            author_name: 'Michael O\'Brien',
            rating: 5,
            comment: 'The weak area practice feature identified subjects I didn\'t even realize I was struggling with. After using the personalized practice for two weeks, my scores improved dramatically. Great prep for July!',
            created_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'sample-7',
            author_name: 'Aisha Khan',
            rating: 5,
            comment: 'Love the community features! The study group discussions have introduced me to study techniques I never would have found on my own. Preparing for January with confidence.',
            created_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'sample-8',
            author_name: 'Thomas Wilson',
            rating: 4,
            comment: 'Comprehensive platform with excellent hard mock exams. The detailed performance analytics and subject breakdown help me focus my revision efficiently.',
            created_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        }
    ];

    useEffect(() => {
        User.me().then(setUser).catch(() => setUser(null));
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const fetchedReviews = await Review.list('-created_date');
            // De-duplicate by author first, then by comment text to be extra safe.
            const uniqueByAuthor = _.uniqBy(fetchedReviews, 'author_name');
            const uniqueByContent = _.uniqBy(uniqueByAuthor, 'comment');
            setReviews(uniqueByContent);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (newReview.rating === 0 || !newReview.comment.trim()) {
            setError('Please provide a rating and a comment.');
            return;
        }
        if (!user) {
            setError('You must be logged in to submit a review.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await Review.create({
                ...newReview,
                author_name: user.full_name,
            });
            setNewReview({ rating: 0, comment: '' });
            fetchReviews();
        } catch (err) {
            console.error(err);
            setError('Failed to submit review. Please try again.');
        }
        setSubmitting(false);
    };

    // Merge real reviews with sample reviews and sort them by date (newest first)
    const allReviews = [...reviews, ...sampleReviews].sort((a, b) => 
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
    );

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                    <Star className="w-8 h-8 text-amber-400" />
                  </div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-3">Reviews</h1>
                  <p className="text-slate-600 text-lg">See what others are saying and share your experience.</p>
                </div>

                <Card className="border-none shadow-xl mb-8">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-slate-900">Leave a Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div>
                                <label className="font-semibold text-slate-800 mb-2 block">Your Rating</label>
                                <StarRating rating={newReview.rating} onRatingChange={(r) => setNewReview(prev => ({...prev, rating: r}))} />
                            </div>
                            <div>
                                <label htmlFor="review-comment" className="font-semibold text-slate-800 mb-2 block">Your Comment</label>
                                <Textarea
                                    id="review-comment"
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview(prev => ({...prev, comment: e.target.value}))}
                                    placeholder="Tell us what you think..."
                                    disabled={!user || isSubmitting}
                                    className="h-32"
                                />
                            </div>
                             {error && <p className="text-sm text-red-600">{error}</p>}
                             {!user && <p className="text-sm text-amber-600">Please log in to leave a review.</p>}
                            <Button type="submit" disabled={!user || isSubmitting} className="bg-slate-900 hover:bg-slate-800">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Submit Review'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Reviews</h2>
                    {loading && reviews.length === 0 ? ( // Only show loader if no reviews (fetched or sample) are available yet
                        <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" /></div>
                    ) : (
                        <div className="space-y-6">
                            {allReviews.length > 0 ? allReviews.map(review => (
                                <Card key={review.id} className="border-none shadow-lg bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-slate-900">{review.author_name}</p>
                                                <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}</p>
                                            </div>
                                            <StarRating rating={review.rating} readOnly={true} />
                                        </div>
                                        <p className="text-slate-700">{review.comment}</p>
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="text-center py-12 bg-slate-100 rounded-lg">
                                    <p className="font-semibold text-slate-600">No reviews yet.</p>
                                    <p className="text-sm text-slate-500">Be the first to share your feedback!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
