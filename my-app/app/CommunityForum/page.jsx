"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
//call api entities here
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Loader2, PlusCircle, MessageSquare, BookOpen, AlertCircle, ArrowUp, ArrowDown, TrendingUp, Clock, Flame, Sparkles, Brain } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import _ from 'lodash';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const categories = ["General Discussion", "Contract Law", "Tort Law", "Criminal Law", "Property Law", "Exam Strategy", "Study Tips", "Motivation & Support", "Q&A - Legal Questions"];

// NewPostForm now accepts currentUser as a prop
function NewPostForm({ onPostCreated, currentUser }) {
    const queryClient = useQueryClient();
    // Removed local user state and useEffect for fetching user, as currentUser is passed via props
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: async (newPost) => {
            // Check for duplicate posts by this user in the last hour
            // Assuming Post.filter takes filter object, sort order, and limit
            const recentPosts = await Post.filter({
                created_by: currentUser.email,
            }, '-created_date', 5); // Check last 5 posts

            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentDuplicate = recentPosts.find(p => 
                p.title === newPost.title && 
                new Date(p.created_date) > oneHourAgo
            );
            
            if (recentDuplicate) {
                throw new Error('You already posted this recently. Please wait before posting again.');
            }
            
            return Post.create(newPost);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            onPostCreated();

            // CRITICAL FIX: Deduct credit on success, not before.
            if (currentUser && currentUser.simulation_credits > 0) {
                User.updateMyUserData({ simulation_credits: currentUser.simulation_credits - 1 })
                    .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['currentUser'] }); // Invalidate user query to reflect credit change
                    })
                    .catch(err => {
                        console.error("Failed to update user credits:", err);
                        // In a real application, you might want to show a warning to the user
                        // that credits deduction failed but post was created.
                    });
            }
        },
        onError: (error) => {
            setError(error.message || "An unexpected error occurred.");
        }
    });

    const handleSubmit = () => {
        if (!title || !content || !category) {
            setError("Please fill all fields.");
            return;
        }
        if (!currentUser) { // Check against currentUser prop
            setError("You must be logged in to create a post.");
            return;
        }
        // New: Implement simulation credit check
        if (currentUser.simulation_credits < 1 && currentUser.role !== 'admin') {
            setError("You need at least 1 simulation credit to create a post.");
            return;
        }

        setError('');
        mutation.mutate({ 
            title, 
            content, 
            category, 
            author_name: currentUser.full_name, // Use currentUser prop
            created_by: currentUser.email, // Add created_by for filtering
            upvotes: 1, 
            users_voted: [currentUser.email], // Use currentUser prop
            comments: [] 
        });
    };

    return (
        <div className="space-y-4 py-4">
            <Input placeholder="Post Title" value={title} onChange={e => setTitle(e.target.value)} disabled={mutation.isLoading} />
            <Select onValueChange={setCategory} value={category} disabled={mutation.isLoading}>
                <SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger>
                <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
            <Textarea placeholder="What's on your mind?" value={content} onChange={e => setContent(e.target.value)} disabled={mutation.isLoading} rows={6} />
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Button onClick={handleSubmit} disabled={mutation.isLoading} className="w-full">
                {mutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Post (1 Credit)
            </Button>
        </div>
    );
}

const PostItem = ({ post, currentUserEmail }) => {
    const queryClient = useQueryClient();
    const isQA = post.category === "Q&A - Legal Questions";

    const voteMutation = useMutation({
        mutationFn: (updatedPost) => Post.update(post.id, updatedPost),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    const hasUserVoted = useMemo(() => {
        return (post.users_voted || []).includes(currentUserEmail);
    }, [post.users_voted, currentUserEmail]);

    const handleVote = () => {
        // Sample posts should not be votable
        if (post.id && String(post.id).startsWith('sample-')) {
            console.log("Cannot vote on sample posts.");
            return;
        }

        if (!currentUserEmail) return;
        const usersVoted = post.users_voted || [];
        const hasVotedLocal = usersVoted.includes(currentUserEmail);
        
        const newUpvotes = hasVotedLocal ? (post.upvotes || 1) - 1 : (post.upvotes || 0) + 1;
        const newUsersVoted = hasVotedLocal
            ? usersVoted.filter(email => email !== currentUserEmail)
            : [...usersVoted, currentUserEmail];

        voteMutation.mutate({ upvotes: newUpvotes, users_voted: newUsersVoted });
    };

    return (
        <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 border-none bg-white flex items-start p-0 ${isQA ? 'border-2 border-blue-200' : ''}`}>
            <div className="flex flex-col items-center p-3 w-16 bg-slate-50 rounded-l-lg h-full">
                <button 
                    onClick={handleVote} 
                    disabled={voteMutation.isLoading || !currentUserEmail || String(post.id).startsWith('sample-')} 
                    className="group"
                >
                    <ArrowUp className={`w-6 h-6 rounded-md group-hover:text-amber-600 transition-colors ${hasUserVoted ? 'text-amber-500' : 'text-slate-400'}`} />
                </button>
                <span className="font-bold text-slate-800 text-base my-1 select-none">{post.upvotes || 0}</span>
            </div>
            <div className="grow p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Link href={createPageUrl(`CommunityForum?category=${encodeURIComponent(post.category)}`)} className="text-xs font-semibold text-slate-700 hover:underline">
                        {post.category}
                    </Link>
                    {isQA && (
                        <Badge className="bg-blue-600 text-xs">
                          <Brain className="w-3 h-3 mr-1" />
                          Q&A
                        </Badge>
                    )}
                    <span className="text-xs text-slate-500">• Posted by {post.author_name} • {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
                </div>
                <Link href={createPageUrl(`PostDetails?id=${post.id}`)} className="block">
                    <h2 className="text-xl font-bold text-slate-800 hover:text-amber-600 transition-colors">{post.title}</h2>
                </Link>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{post.content}</p>
                <Link href={createPageUrl(`PostDetails?id=${post.id}`)} className="flex items-center gap-2 mt-3 text-sm font-medium text-slate-600 hover:bg-slate-100 p-2 rounded-md w-fit transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.answers_count || post.comments?.length || 0} {isQA ? 'Answers' : 'Comments'}</span>
                </Link>
            </div>
        </Card>
    );
};

export default function CommunityForum() {
    const [openNewPost, setOpenNewPost] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortBy, setSortBy] = useState('Hot'); // 'New', 'Top', or 'Hot'
    const [viewMode, setViewMode] = useState('all'); // 'all', 'discussions', 'qa'
    const router = useRouter();

    // Check for category filter in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        if (category && categories.includes(category)) {
            setFilterCategory(category);
        } else if (category && category === 'All') { // Also handle 'All' explicitly if present in URL
            setFilterCategory('All');
        } else if (category) { // If category is in URL but not valid, remove it.
             router.push(createPageUrl(`CommunityForum`));
        }
    }, [router]);
    
    // CRITICAL FIX: Use useQuery to handle loading and error states for the user object safely.
    const { data: user, isLoading: isCurrentUserLoading, isError: isUserError } = useQuery({ 
        queryKey: ['currentUser'], 
        queryFn: () => User.me(),
        retry: false, // Don't retry if user is not logged in
        staleTime: 5 * 60 * 1000 // Cache user for 5 minutes
    });

    const { data: posts, isLoading, error } = useQuery({ queryKey: ['posts'], queryFn: () => Post.list() });

    // Updated sample posts - removed exam timing references
    const samplePosts = [
        {
            id: 'sample-1',
            title: 'How do you approach scenario-based questions?',
            content: 'I struggle with the longer scenario questions where you need to identify multiple legal issues. Any tips on how to break them down systematically? I find myself missing key issues or getting confused about which law applies.',
            category: 'Exam Strategy',
            author_name: 'Alex Turner',
            created_by: 'sample@user.com',
            created_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            upvotes: 12,
            users_voted: [],
            answers_count: 5
        },
        {
            id: 'sample-2',
            title: 'Understanding the difference between offer and invitation to treat',
            content: 'Can someone explain with examples when something is an offer vs an invitation to treat? I keep getting these mixed up in practice questions. For example, is displaying goods in a shop window an offer or invitation to treat?',
            category: 'Q&A - Legal Questions',
            author_name: 'Sophie Williams',
            created_by: 'sample@user.com',
            created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            upvotes: 18,
            users_voted: [],
            answers_count: 8
        },
        {
            id: 'sample-3',
            title: 'Study group success - January exam preparation',
            content: 'Our study group is preparing for January exams together! The progress sharing feature helps us stay accountable. We meet virtually twice a week, share notes, and test each other. Highly recommend joining or creating a group!',
            category: 'Motivation & Support',
            author_name: 'Rachel Green',
            created_by: 'sample@user.com',
            created_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            upvotes: 34,
            users_voted: [],
            answers_count: 12
        },
        {
            id: 'sample-4',
            title: 'Best way to memorize cases for Criminal Law?',
            content: 'There are so many cases to remember! What techniques do you use to keep them all straight? I\'ve tried flashcards but still mixing up similar cases. Anyone have success with mnemonics or other memory techniques?',
            category: 'Study Tips',
            author_name: 'Mohammed Ali',
            created_by: 'sample@user.com',
            created_date: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
            upvotes: 15,
            users_voted: [],
            answers_count: 11
        },
        {
            id: 'sample-5',
            title: 'Confusion about solicitors\' duties in conflict situations',
            content: 'Working through Ethics questions and I\'m struggling with when a solicitor must withdraw vs can continue with informed consent. For example, if you have Client A suing Client B, and both are your clients but in different matters - what are the rules?',
            category: 'Q&A - Legal Questions',
            author_name: 'Jessica Martinez',
            created_by: 'sample@user.com',
            created_date: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
            upvotes: 9,
            users_voted: [],
            answers_count: 6
        },
        {
            id: 'sample-6',
            title: 'Property Law: Lease vs License distinction',
            content: 'I know Street v Mountford is the key case but I\'m still confused about when something is a lease vs a license in practical scenarios. What about student accommodation? How do you identify "exclusive possession" in exam questions?',
            category: 'Q&A - Legal Questions',
            author_name: 'Liam Thompson',
            created_by: 'sample@user.com',
            created_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            upvotes: 7,
            users_voted: [],
            answers_count: 4
        },
        {
            id: 'sample-7',
            title: 'Time management during exam preparation',
            content: 'How do you manage timing in your practice sessions? Do you aim for exactly 1.7 minutes per question or do you let some run longer if they\'re complex? Looking for tips to improve speed without sacrificing accuracy.',
            category: 'Exam Strategy',
            author_name: 'Emma Richardson',
            created_by: 'sample@user.com',
            created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            upvotes: 19,
            users_voted: [],
            answers_count: 9
        }
    ];

    // Merge real posts with samples
    const allPosts = posts ? [...posts, ...samplePosts] : samplePosts;

    const sortedAndFilteredPosts = useMemo(() => {
        let processedPosts = allPosts.filter(p => {
            // Apply category filter
            if (filterCategory !== 'All' && p.category !== filterCategory) return false;
            
            // Apply view mode filter
            if (viewMode === 'qa') return p.category === "Q&A - Legal Questions";
            if (viewMode === 'discussions') return p.category !== "Q&A - Legal Questions";
            
            return true;
        });
        
        if (sortBy === 'Top') {
            processedPosts = _.orderBy(processedPosts, ['upvotes', 'created_date'], ['desc', 'desc']);
        } else if (sortBy === 'Hot') {
            const now = new Date();
            processedPosts.forEach(post => {
                const ageInHours = (now.getTime() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
                const score = post.upvotes || 0;
                // Simplified Reddit-like hot ranking algorithm
                // Add a small constant to upvotes to handle 0 or negative scores in the numerator better
                // Add a small constant to ageInHours to avoid division by zero or very large numbers for very new posts
                post.hotScore = (score + 1) / Math.pow(ageInHours + 2, 1.8);
            });
            processedPosts = _.orderBy(processedPosts, ['hotScore'], ['desc']);
        } else { // 'New'
            processedPosts = _.orderBy(processedPosts, ['created_date'], ['desc']);
        }
        return processedPosts;
    }, [allPosts, filterCategory, sortBy, viewMode]);

    // Combined loading check for the main content to avoid flicker
    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    if (error) return <div className="p-10 text-center text-red-500">Failed to load forum posts. Please try refreshing the page.</div>;

    const canCreatePost = !isCurrentUserLoading && user && (user.simulation_credits >= 1 || user.role === 'admin');

    return (
        <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">Community Forum</h1>
                        <p className="text-slate-600">Connect, share knowledge, and learn from fellow SQE candidates.</p>
                    </div>
                    <Dialog open={openNewPost} onOpenChange={setOpenNewPost}>
                        <DialogTrigger asChild>
                            <Button 
                                className="gap-2 bg-slate-900 hover:bg-slate-800"
                                // Disable if user data is loading, no user logged in, or user has no credits
                                disabled={isCurrentUserLoading || !user || !canCreatePost} 
                            >
                                <PlusCircle className="w-5 h-5" /> New Discussion
                                {!isCurrentUserLoading && user && ( // Display credits if available
                                    <span className="ml-2 text-sm text-white/80">({user.simulation_credits} credits)</span>
                                )}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Start a New Discussion (Costs 1 Credit)</DialogTitle></DialogHeader>
                            <NewPostForm 
                                onPostCreated={() => setOpenNewPost(false)} 
                                currentUser={user} // Pass currentUser to NewPostForm
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* View Mode Tabs */}
                <Tabs value={viewMode} onValueChange={setViewMode} className="mb-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All Posts</TabsTrigger>
                    <TabsTrigger value="discussions">Discussions</TabsTrigger>
                    <TabsTrigger value="qa">
                      <Brain className="w-4 h-4 mr-2" />
                      Q&A
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Card className="p-3 mb-6 flex items-center justify-between shadow-md border-none bg-white">
                     <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant={sortBy === 'Hot' ? 'default' : 'outline'} onClick={() => setSortBy('Hot')} className="gap-1"><Flame className="w-4 h-4" />Hot</Button>
                        <Button size="sm" variant={sortBy === 'New' ? 'default' : 'outline'} onClick={() => setSortBy('New')} className="gap-1"><Clock className="w-4 h-4" />New</Button>
                        <Button size="sm" variant={sortBy === 'Top' ? 'default' : 'outline'} onClick={() => setSortBy('Top')} className="gap-1"><TrendingUp className="w-4 h-4"/>Top</Button>
                    </div>
                     <div className="flex flex-wrap gap-2">
                        <Select 
                            onValueChange={(val) => {
                                setFilterCategory(val); // Update local state for immediate feedback
                                router.push(createPageUrl(`CommunityForum${val === 'All' ? '' : `?category=${encodeURIComponent(val)}`}`));
                            }} 
                            value={filterCategory} // Control select based on state
                        >
                            <SelectTrigger className="w-[200px] h-9">
                                <SelectValue placeholder="Filter by category..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Categories</SelectItem>
                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                <div className="space-y-3">
                    {sortedAndFilteredPosts.length > 0 ? sortedAndFilteredPosts.map(post => (
                        <PostItem key={post.id} post={post} currentUserEmail={user?.email} />
                    )) : (
                        <div className="text-center py-20 bg-white rounded-lg shadow-md">
                            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700">No posts here yet.</h3>
                            <p className="text-slate-500 mt-2">Be the first to start a discussion!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
