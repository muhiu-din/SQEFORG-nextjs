"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, ArrowUp, CheckCircle2, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function PostDetails() {
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const postId = searchParams.get('id');

    // Mock user
    const [user] = useState({
        email: 'mockuser@example.com',
        full_name: 'Mock User',
        role: 'user'
    });

    // Mock posts
    const samplePosts = [
        {
            id: 'sample-1',
            title: 'How do you approach scenario-based questions?',
            content: 'I struggle with the longer scenario questions where you need to identify multiple legal issues. Any tips?',
            category: 'Exam Strategy',
            author_name: 'Alex Turner',
            created_by: 'sample@user.com',
            created_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            upvotes: 12,
            users_voted: [],
        },
        {
            id: 'sample-2',
            title: 'Understanding the difference between offer and invitation to treat',
            content: 'Can someone explain with examples when something is an offer vs an invitation to treat?',
            category: 'Q&A - Legal Questions',
            author_name: 'Sophie Williams',
            created_by: 'sample@user.com',
            created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            upvotes: 18,
            users_voted: [],
        }
    ];

    // Mock answers
    const sampleAnswers = {
        'sample-1': [
            {
                id: 'ans-1-1',
                post_id: 'sample-1',
                author_name: 'Sarah Mitchell',
                author_email: 'sample@user.com',
                content: 'Use the IRAC method: Issue, Rule, Application, Conclusion. Identify all issues and apply rules systematically.',
                upvotes: 8,
                users_voted: [],
                is_best_answer: true,
                created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'ans-1-2',
                post_id: 'sample-1',
                author_name: 'James Chen',
                author_email: 'sample@user.com',
                content: 'Read the question twice. First for the big picture, then for specifics.',
                upvotes: 5,
                users_voted: [],
                created_date: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
            }
        ],
        'sample-2': [
            {
                id: 'ans-2-1',
                post_id: 'sample-2',
                author_name: 'Thomas Walker',
                author_email: 'sample@user.com',
                content: 'Invitation to treat does not create a binding contract, offers do.',
                upvotes: 15,
                users_voted: [],
                is_best_answer: true,
                created_date: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
            }
        ]
    };

    // Get the post
    const post = samplePosts.find(p => p.id === postId) || null;

    // Get answers for the post
    const [answers, setAnswers] = useState(postId ? (sampleAnswers[postId] || []) : []);

    // Post vote mutation
    const voteMutation = useMutation({
        mutationFn: (updatedPost) => {
            post.upvotes = updatedPost.upvotes;
            post.users_voted = updatedPost.users_voted;
        },
        onSuccess: () => queryClient.invalidateQueries(['post', postId])
    });

    const handlePostVote = () => {
        if (!user || !post) return;
        const hasVoted = post.users_voted?.includes(user.email);
        const newUpvotes = hasVoted ? (post.upvotes || 0) - 1 : (post.upvotes || 0) + 1;
        const newUsersVoted = hasVoted
            ? (post.users_voted || []).filter(email => email !== user.email)
            : [...(post.users_voted || []), user.email];

        voteMutation.mutate({ upvotes: newUpvotes, users_voted: newUsersVoted });
    };

    // Add answer mutation
    const addAnswerMutation = useMutation({
        mutationFn: (newAnswer) => {
            setAnswers(prev => [...prev, newAnswer]);
        },
        onSuccess: () => setAnswers(prev => [...prev])
    });

    const handleAddAnswer = () => {
        if (!user || !post || !answer.trim()) return;
        const newAnswer = {
            id: `ans-${Date.now()}`,
            post_id: postId,
            author_name: user.full_name,
            author_email: user.email,
            content: answer,
            upvotes: 1,
            users_voted: [user.email],
            is_best_answer: false,
            created_date: new Date().toISOString()
        };
        addAnswerMutation.mutate(newAnswer);
        setAnswer('');
    };

    // Answer vote mutation
    const answerVoteMutation = useMutation({
        mutationFn: ({ answerId, updates }) => {
            setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, ...updates } : a));
        },
        onSuccess: () => setAnswers(prev => [...prev])
    });

    const handleAnswerVote = (answerId) => {
        if (!user) return;
        const target = answers.find(a => a.id === answerId);
        if (!target) return;
        const hasVoted = target.users_voted?.includes(user.email);
        const newUpvotes = hasVoted ? (target.upvotes || 0) - 1 : (target.upvotes || 0) + 1;
        const newUsersVoted = hasVoted
            ? target.users_voted.filter(email => email !== user.email)
            : [...target.users_voted, user.email];
        answerVoteMutation.mutate({ answerId, updates: { upvotes: newUpvotes, users_voted: newUsersVoted } });
    };

    const handleMarkBestAnswer = (answerId) => {
        if (!user) return;
        const isPostAuthor = user.email === post.created_by;
        const isAdmin = user.role === 'admin';
        if (!isPostAuthor && !isAdmin) {
            alert("Only the post author or admins can mark best answers");
            return;
        }
        setAnswers(prev => prev.map(a => ({ ...a, is_best_answer: a.id === answerId })));
    };

    if (!post) return <div className="p-10 text-center text-red-500">Post not found.</div>;

    const isQA = post.category === "Q&A - Legal Questions";
    const sortedAnswers = [...answers].sort((a, b) => b.is_best_answer - a.is_best_answer || (b.upvotes || 0) - (a.upvotes || 0));
    const hasVotedPost = post.users_voted?.includes(user?.email);
    const [answerText, setAnswer] = useState('');

    return (
        <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Link href={createPageUrl('CommunityForum')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Forum
                </Link>

                <Card className={`shadow-lg mb-8 bg-white flex ${isQA ? 'border-2 border-blue-200' : ''}`}>
                    <div className="flex flex-col items-center p-3 bg-slate-50 rounded-l-xl">
                        <button onClick={handlePostVote}>
                            <ArrowUp className={`w-6 h-6 hover:text-amber-600 ${hasVotedPost ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                        </button>
                        <span className="font-bold text-slate-800 text-lg my-1">{post.upvotes || 0}</span>
                    </div>
                    <div className="p-6 grow">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline">{post.category}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">
                            Posted by {post.author_name} • {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                        </p>
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">{post.title}</h1>
                        <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    </div>
                </Card>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>{isQA ? 'Your Answer' : 'Leave a Comment'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea 
                            placeholder={isQA ? "Share your legal knowledge..." : "Share your thoughts..."} 
                            value={answerText} 
                            onChange={e => setAnswer(e.target.value)} 
                            rows={6} 
                        />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleAddAnswer} disabled={!user}>
                            {addAnswerMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                            Post {isQA ? 'Answer' : 'Comment'}
                        </Button>
                        {!user && <p className="text-sm text-red-500 ml-4">Please log in to respond.</p>}
                    </CardFooter>
                </Card>

                <div className="space-y-4">
                    {sortedAnswers.map((ans) => {
                        const hasVotedAnswer = ans.users_voted?.includes(user?.email);
                        const canMarkBest = user && (user.email === post.created_by || user.role === 'admin') && isQA;

                        return (
                            <Card key={ans.id} className={`bg-white flex items-start ${ans.is_best_answer ? 'border-2 border-green-400' : ''}`}>
                                <div className="flex flex-col items-center p-2 pt-4 bg-slate-50 rounded-l-lg h-full">
                                    <button onClick={() => handleAnswerVote(ans.id)}>
                                        <ArrowUp className={`w-5 h-5 hover:text-amber-600 ${hasVotedAnswer ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                                    </button>
                                    <span className="font-semibold text-slate-700 text-sm my-1">{ans.upvotes || 0}</span>
                                </div>
                                <div className="p-4 grow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="text-xs font-semibold text-slate-900">{ans.author_name}</p>
                                        {ans.is_best_answer && <Badge className="bg-green-600 text-xs"><Award className="w-3 h-3 mr-1"/>Best Answer</Badge>}
                                        {ans.is_verified && <Badge className="bg-blue-600 text-xs"><CheckCircle2 className="w-3 h-3 mr-1"/>Verified</Badge>}
                                        <span className="text-xs text-slate-500">• {formatDistanceToNow(new Date(ans.created_date), { addSuffix: true })}</span>
                                    </div>
                                    <div className="text-slate-700 prose prose-sm max-w-none whitespace-pre-wrap">{ans.content}</div>
                                    {canMarkBest && !ans.is_best_answer && (
                                        <Button onClick={() => handleMarkBestAnswer(ans.id)} size="sm" variant="outline" className="mt-3 gap-2">
                                            <Award className="w-4 h-4" /> Mark as Best Answer
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
