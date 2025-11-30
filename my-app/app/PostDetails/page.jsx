"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, ArrowUp, CheckCircle2, Award } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function PostDetails() {
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const postId = searchParams.get('id');
    const [user, setUser] = useState(null);
    const [answer, setAnswer] = useState('');

    useEffect(() => {
        base44.auth.me().then(setUser).catch(() => setUser(null));
    }, []);

    const { data: post, isLoading, error } = useQuery({
        queryKey: ['post', postId],
        queryFn: () => base44.entities.Post.get(postId),
        enabled: !!postId
    });

    const { data: answers } = useQuery({
        queryKey: ['answers', postId],
        queryFn: async () => {
            const realAnswers = await base44.entities.ForumAnswer.filter({ post_id: postId }, '-created_date', 100);
            
            // Add sample answers for demo posts
            if (postId?.startsWith('sample-')) {
                const sampleAnswers = getSampleAnswersForPost(postId);
                return [...realAnswers, ...sampleAnswers];
            }
            
            return realAnswers;
        },
        enabled: !!postId,
        initialData: []
    });

    const isQA = post?.category === "Q&A - Legal Questions";

    const voteMutation = useMutation({
        mutationFn: (updatedPost) => base44.entities.Post.update(postId, updatedPost),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
        },
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

    const addAnswerMutation = useMutation({
        mutationFn: async (newAnswer) => {
            return base44.entities.ForumAnswer.create(newAnswer);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['answers', postId] });
            setAnswer('');
        },
    });

    const answerVoteMutation = useMutation({
        mutationFn: ({ answerId, updates }) => base44.entities.ForumAnswer.update(answerId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['answers', postId] });
        },
    });

    const markBestAnswerMutation = useMutation({
        mutationFn: async ({ answerId }) => {
            // First, unmark all other answers
            const allAnswers = answers || [];
            for (const ans of allAnswers) {
                if (ans.is_best_answer && ans.id !== answerId) {
                    await base44.entities.ForumAnswer.update(ans.id, { is_best_answer: false });
                }
            }
            // Then mark the selected one
            return base44.entities.ForumAnswer.update(answerId, { is_best_answer: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['answers', postId] });
        },
    });

    const handleAddAnswer = () => {
        if (!answer.trim() || !user || !post) return;
        const newAnswer = {
            post_id: postId,
            author_name: user.full_name,
            author_email: user.email,
            content: answer,
            upvotes: 1,
            users_voted: [user.email],
            is_ai_generated: false
        };
        addAnswerMutation.mutate(newAnswer);
    };

    const handleAnswerVote = (answerId) => {
        if (!user) return;
        const targetAnswer = answers.find(a => a.id === answerId);
        if (!targetAnswer) return;

        const hasVoted = targetAnswer.users_voted?.includes(user.email);
        const newUpvotes = hasVoted ? (targetAnswer.upvotes || 0) - 1 : (targetAnswer.upvotes || 0) + 1;
        const newUsersVoted = hasVoted
            ? (targetAnswer.users_voted || []).filter(email => email !== user.email)
            : [...(targetAnswer.users_voted || []), user.email];
        
        answerVoteMutation.mutate({ 
            answerId, 
            updates: { upvotes: newUpvotes, users_voted: newUsersVoted } 
        });
    };

    const handleMarkBestAnswer = (answerId) => {
        if (!user || !post) return;
        const isPostAuthor = user.email === post.created_by;
        const isAdmin = user.role === 'admin';
        
        if (!isPostAuthor && !isAdmin) {
            alert("Only the post author or admins can mark best answers");
            return;
        }
        
        markBestAnswerMutation.mutate({ answerId });
    };

    // Helper function to generate sample answers
    const getSampleAnswersForPost = (postId) => {
        const answerSets = {
            'sample-1': [
                {
                    id: 'ans-1-1',
                    post_id: postId,
                    author_name: 'Sarah Mitchell',
                    author_email: 'sample@user.com',
                    content: 'Great question! I use the "IRAC" method - Issue, Rule, Application, Conclusion. First, I identify all the legal issues in the scenario (underline them!). Then for each issue, I think about which rule applies, how it applies to these facts, and what the conclusion would be. This systematic approach really helps.',
                    upvotes: 8,
                    users_voted: [],
                    is_best_answer: true,
                    created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'ans-1-2',
                    post_id: postId,
                    author_name: 'James Chen',
                    author_email: 'sample@user.com',
                    content: 'I find it helpful to read the question twice. First time to get the overall picture, second time to spot specific issues. Also, pay attention to dates, parties involved, and any transactions - these often signal different legal issues.',
                    upvotes: 5,
                    users_voted: [],
                    created_date: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
                }
            ],
            'sample-2': [
                {
                    id: 'ans-2-1',
                    post_id: postId,
                    author_name: 'Thomas Walker',
                    author_email: 'sample@user.com',
                    content: 'The key distinction is about who has the power to form the contract. An offer, when accepted, creates a binding contract. An invitation to treat is just inviting others to make offers.\n\nKey examples:\n- Shop display: Invitation to treat (Fisher v Bell)\n- Advertisement: Usually invitation to treat (Partridge v Crittenden)\n- Auction: The bid is the offer, auctioneer\'s hammer is acceptance\n- Online shopping: Adding to cart is usually still invitation to treat; the order is your offer\n\nThe test is: does the communication indicate a willingness to be bound immediately upon acceptance?',
                    upvotes: 15,
                    users_voted: [],
                    is_best_answer: true,
                    created_date: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'ans-2-2',
                    post_id: postId,
                    author_name: 'Emily Roberts',
                    author_email: 'sample@user.com',
                    content: 'To add to the above - think about it from a practical perspective: if displaying goods was an offer, a shop would be contractually bound to sell to everyone who "accepts" by trying to buy. But shops need to retain the right to refuse (out of stock, pricing errors, etc.). That\'s why it\'s invitation to treat.',
                    upvotes: 6,
                    users_voted: [],
                    created_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
                }
            ],
            'sample-4': [
                {
                    id: 'ans-4-1',
                    post_id: postId,
                    author_name: 'Priya Patel',
                    author_email: 'sample@user.com',
                    content: 'I group cases by legal principle rather than trying to memorize each one individually. For example, all the "intention to create legal relations" cases together (Balfour v Balfour, Merritt v Merritt, etc.). Then I create a simple story or acronym for each group. Much easier than random memorization!',
                    upvotes: 9,
                    users_voted: [],
                    is_best_answer: true,
                    created_date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'ans-4-2',
                    post_id: postId,
                    author_name: 'David Kumar',
                    author_email: 'sample@user.com',
                    content: 'The platform\'s flashcards feature has been really helpful for this! I review them daily using spaced repetition. Also, instead of just memorizing case names, I focus on: 1) The key facts, 2) The legal principle, 3) One weird/memorable detail. The weird detail helps trigger my memory of the whole case.',
                    upvotes: 7,
                    users_voted: [],
                    created_date: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString()
                }
            ],
            'sample-5': [
                {
                    id: 'ans-5-1',
                    post_id: postId,
                    author_name: 'Michael O\'Brien',
                    author_email: 'sample@user.com',
                    content: 'This is about "own interest conflict" vs "conflict of interest between clients". If you act for both clients in the same matter where their interests conflict, you MUST withdraw. If they\'re different matters but there\'s a conflict, you MAY continue with informed consent if certain conditions are met.\n\nFor your example (Client A suing Client B in unrelated matters), you need to consider:\n1. Is there significant risk the duty to one will conflict with duty to the other?\n2. Can you maintain confidentiality for both?\n3. Even if you can manage the conflict, does it create a perception issue?\n\nGenerally, acting for opponents is high risk even in unrelated matters. The safer course is to decline one client or obtain very clear informed consent.',
                    upvotes: 11,
                    users_voted: [],
                    is_best_answer: true,
                    created_date: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString()
                }
            ],
            'sample-6': [
                {
                    id: 'ans-6-1',
                    post_id: postId,
                    author_name: 'Lisa Anderson',
                    author_email: 'sample@user.com',
                    content: 'I took FLK1 last month and my mock average was 70%. I got 72% on the actual exam. So pretty similar! The real exam felt slightly easier actually, maybe because I\'d practiced so much. My advice: if you\'re consistently above 65%, you\'re in a good position.',
                    upvotes: 8,
                    users_voted: [],
                    created_date: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'ans-6-2',
                    post_id: postId,
                    author_name: 'Robert Zhang',
                    author_email: 'sample@user.com',
                    content: 'My experience was similar - mock average 68%, real exam 71%. But I\'d say don\'t get complacent! Use your last few weeks to really hammer your weak subjects. Also, the exam day environment is different - make sure you practice full 90-question mocks under timed conditions to build stamina.',
                    upvotes: 6,
                    users_voted: [],
                    is_best_answer: true,
                    created_date: new Date(Date.now() - 37 * 60 * 60 * 1000).toISOString()
                }
            ],
            'sample-7': [
                {
                    id: 'ans-7-1',
                    post_id: postId,
                    author_name: 'Hannah Scott',
                    author_email: 'sample@user.com',
                    content: 'The key factors from Street v Mountford are: 1) Exclusive possession, 2) For a term, 3) At a rent. If all three are present, it\'s presumed to be a lease unless there are exceptional circumstances.\n\nExclusive possession means the occupier has the right to exclude everyone, including the landlord (except for limited purposes like repairs). Look for:\n- Can the owner enter at will? (Suggests license)\n- Does occupier control who else can enter? (Suggests lease)\n- Is there a key? Who has it?\n\nFor exam questions, focus on whether occupier can "call the place their own" even temporarily.',
                    upvotes: 5,
                    users_voted: [],
                    is_best_answer: true,
                    created_date: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
                }
            ],
            'sample-8': [
                {
                    id: 'ans-8-1',
                    post_id: postId,
                    author_name: 'Christopher Lee',
                    author_email: 'sample@user.com',
                    content: 'I just did FLK1 - my strategy was to aim for 90 seconds per question on first pass, marking any I wasn\'t sure about. This got me through all 90 questions with about 20 minutes left. Then I used that time to review flagged questions. Worked well for me! The key is not getting stuck on any one question.',
                    upvotes: 12,
                    users_voted: [],
                    is_best_answer: true,
                    created_date: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'ans-8-2',
                    post_id: postId,
                    author_name: 'Olivia Martinez',
                    author_email: 'sample@user.com',
                    content: 'Practice with the platform\'s timed mocks really helped me get my pacing right. I learned which subjects take me longer and adjusted accordingly. Also, don\'t forget you get a calculator and can use it for timing - I set mini-goals like "45 questions done by the 1 hour mark".',
                    upvotes: 7,
                    users_voted: [],
                    created_date: new Date(Date.now() - 1.7 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
        };
        
        return answerSets[postId] || [];
    };

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    if (error || !post) return <div className="p-10 text-center text-red-500">Failed to load post.</div>;
    
    const hasVotedPost = post.users_voted?.includes(user?.email);
    const sortedAnswers = (answers || [])
        .sort((a, b) => {
            if (a.is_best_answer) return -1;
            if (b.is_best_answer) return 1;
            return (b.upvotes || 0) - (a.upvotes || 0);
        });

    return (
        <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Link href={createPageUrl('CommunityForum')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Forum
                </Link>

                <Card className={`shadow-lg mb-8 bg-white flex ${isQA ? 'border-2 border-blue-200' : ''}`}>
                    <div className="flex flex-col items-center p-3 bg-slate-50 rounded-l-xl">
                        <button onClick={handlePostVote} disabled={!user}>
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

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {isQA ? `${sortedAnswers.length} Answer${sortedAnswers.length !== 1 ? 's' : ''}` : `${sortedAnswers.length} Comment${sortedAnswers.length !== 1 ? 's' : ''}`}
                    </h2>
                </div>
                
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>{isQA ? 'Your Answer' : 'Leave a Comment'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea 
                            placeholder={isQA ? "Share your legal knowledge..." : "Share your thoughts..."} 
                            value={answer} 
                            onChange={e => setAnswer(e.target.value)} 
                            rows={6} 
                        />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleAddAnswer} disabled={addAnswerMutation.isLoading || !user}>
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
                                    <button onClick={() => handleAnswerVote(ans.id)} disabled={!user}>
                                        <ArrowUp className={`w-5 h-5 hover:text-amber-600 ${hasVotedAnswer ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                                    </button>
                                    <span className="font-semibold text-slate-700 text-sm my-1">{ans.upvotes || 0}</span>
                                </div>
                                <div className="p-4 grow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="text-xs font-semibold text-slate-900">
                                            {ans.author_name}
                                        </p>
                                        {ans.is_best_answer && (
                                            <Badge className="bg-green-600 text-xs">
                                                <Award className="w-3 h-3 mr-1" />
                                                Best Answer
                                            </Badge>
                                        )}
                                        {ans.is_verified && (
                                            <Badge className="bg-blue-600 text-xs">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Verified
                                            </Badge>
                                        )}
                                        <span className="text-xs text-slate-500">
                                            • {formatDistanceToNow(new Date(ans.created_date), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="text-slate-700 prose prose-sm max-w-none whitespace-pre-wrap">
                                        {ans.content}
                                    </div>
                                    {canMarkBest && !ans.is_best_answer && (
                                        <Button
                                            onClick={() => handleMarkBestAnswer(ans.id)}
                                            size="sm"
                                            variant="outline"
                                            className="mt-3 gap-2"
                                        >
                                            <Award className="w-4 h-4" />
                                            Mark as Best Answer
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