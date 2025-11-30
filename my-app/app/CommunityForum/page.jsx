"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { Loader2, PlusCircle, MessageSquare, BookOpen, AlertCircle, ArrowUp, TrendingUp, Clock, Flame, Brain } from 'lucide-react';
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

// ===================
// MOCK BACKEND
// ===================
const mockUser = { full_name: "John Doe", email: "john@example.com", role: "user", simulation_credits: 3 };
let mockPosts = [];

const User = {
  me: async () => {
    return new Promise(resolve => setTimeout(() => resolve(mockUser), 300));
  },
  updateMyUserData: async (data) => {
    Object.assign(mockUser, data);
    return mockUser;
  }
};

const Post = {
  list: async () => {
    return new Promise(resolve => setTimeout(() => resolve(mockPosts), 300));
  },
  create: async (newPost) => {
    const post = { ...newPost, id: crypto.randomUUID(), created_date: new Date().toISOString() };
    mockPosts.push(post);
    return post;
  },
  update: async (id, updatedFields) => {
    const idx = mockPosts.findIndex(p => p.id === id);
    if (idx !== -1) {
      mockPosts[idx] = { ...mockPosts[idx], ...updatedFields };
      return mockPosts[idx];
    }
    return null;
  }
};

// ===================
// COMPONENTS
// ===================
function NewPostForm({ onPostCreated, currentUser }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async (newPost) => {
      // simple duplicate check
      const recent = mockPosts.filter(p => p.created_by === currentUser.email);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const duplicate = recent.find(p => p.title === newPost.title && new Date(p.created_date) > oneHourAgo);
      if (duplicate) throw new Error('You already posted this recently.');
      return Post.create(newPost);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      onPostCreated();
      if (currentUser.simulation_credits > 0) {
        User.updateMyUserData({ simulation_credits: currentUser.simulation_credits - 1 });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    },
    onError: (err) => setError(err.message)
  });

  const handleSubmit = () => {
    if (!title || !content || !category) return setError("Please fill all fields.");
    if (currentUser.simulation_credits < 1 && currentUser.role !== 'admin') return setError("You need at least 1 credit.");
    setError('');
    mutation.mutate({
      title,
      content,
      category,
      author_name: currentUser.full_name,
      created_by: currentUser.email,
      upvotes: 1,
      users_voted: [currentUser.email],
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
      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      <Button onClick={handleSubmit} disabled={mutation.isLoading} className="w-full">
        {mutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Post (1 Credit)
      </Button>
    </div>
  );
}

const PostItem = ({ post, currentUserEmail }) => {
  const queryClient = useQueryClient();
  const voteMutation = useMutation({
    mutationFn: (updated) => Post.update(post.id, updated),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });
  const hasUserVoted = (post.users_voted || []).includes(currentUserEmail);

  const handleVote = () => {
    if (!currentUserEmail) return;
    const usersVoted = post.users_voted || [];
    const hasVotedLocal = usersVoted.includes(currentUserEmail);
    const newUpvotes = hasVotedLocal ? (post.upvotes || 1) - 1 : (post.upvotes || 0) + 1;
    const newUsersVoted = hasVotedLocal ? usersVoted.filter(e => e !== currentUserEmail) : [...usersVoted, currentUserEmail];
    voteMutation.mutate({ upvotes: newUpvotes, users_voted: newUsersVoted });
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-none bg-white flex items-start p-0">
      <div className="flex flex-col items-center p-3 w-16 bg-slate-50 rounded-l-lg h-full">
        <button onClick={handleVote} disabled={voteMutation.isLoading} className="group">
          <ArrowUp className={`w-6 h-6 rounded-md ${hasUserVoted ? 'text-amber-500' : 'text-slate-400'}`} />
        </button>
        <span className="font-bold text-slate-800 text-base my-1 select-none">{post.upvotes || 0}</span>
      </div>
      <div className="grow p-4">
        <div className="flex items-center gap-2 mb-2">
          <Link href={createPageUrl(`CommunityForum?category=${encodeURIComponent(post.category)}`)} className="text-xs font-semibold text-slate-700 hover:underline">{post.category}</Link>
        </div>
        <h2 className="text-xl font-bold text-slate-800">{post.title}</h2>
        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{post.content}</p>
      </div>
    </Card>
  );
};

// ===================
// MAIN PAGE
// ===================
export default function CommunityForum() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ForumContent />
    </QueryClientProvider>
  );
}

function ForumContent() {
  const [openNewPost, setOpenNewPost] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Hot');
  const [viewMode, setViewMode] = useState('all');
  const router = useRouter();

  const { data: user, isLoading: isUserLoading } = useQuery({ queryKey: ['currentUser'], queryFn: () => User.me() });
  const { data: posts, isLoading } = useQuery({ queryKey: ['posts'], queryFn: () => Post.list() });

  const sortedFilteredPosts = useMemo(() => {
    if (!posts) return [];
    let filtered = posts;
    if (filterCategory !== 'All') filtered = filtered.filter(p => p.category === filterCategory);
    if (sortBy === 'Top') filtered = _.orderBy(filtered, ['upvotes', 'created_date'], ['desc', 'desc']);
    else if (sortBy === 'New') filtered = _.orderBy(filtered, ['created_date'], ['desc']);
    return filtered;
  }, [posts, filterCategory, sortBy]);

  if (isLoading || isUserLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const canCreatePost = user && (user.simulation_credits >= 1 || user.role === 'admin');

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Community Forum</h1>
          <Dialog open={openNewPost} onOpenChange={setOpenNewPost}>
            <DialogTrigger asChild>
              <Button disabled={!canCreatePost} className="gap-2 bg-slate-900 hover:bg-slate-800">
                <PlusCircle className="w-5 h-5" /> New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Start a New Discussion (Costs 1 Credit)</DialogTitle></DialogHeader>
              <NewPostForm onPostCreated={() => setOpenNewPost(false)} currentUser={user} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {sortedFilteredPosts.length > 0 ? sortedFilteredPosts.map(post => (
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
