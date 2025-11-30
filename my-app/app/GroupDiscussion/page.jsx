"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';

export default function GroupDiscussion() {
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [showNewThread, setShowNewThread] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const groupId = params.get('groupId');
      
      if (!groupId) {
        router.push(createPageUrl('StudyGroups'));
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const fetchedGroup = await base44.entities.StudyGroup.get(groupId);
      
      if (!fetchedGroup?.member_emails?.includes(currentUser.email)) {
        alert('You must be a member to view this group');
        router.push(createPageUrl('StudyGroups'));
        return;
      }
      
      setGroup(fetchedGroup);
    } catch (error) {
      console.error('Failed to load group:', error);
      alert('Failed to load group');
      router.push(createPageUrl('StudyGroups'));
    }
    setLoading(false);
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle || !newThreadContent) {
      alert('Please fill in all fields');
      return;
    }
    
    const newThread = {
      thread_id: `thread_${Date.now()}`,
      title: newThreadTitle,
      author_name: user.full_name,
      author_email: user.email,
      content: newThreadContent,
      created_date: new Date().toISOString(),
      replies: []
    };
    
    try {
      await base44.entities.StudyGroup.update(group.id, {
        discussion_threads: [...(group.discussion_threads || []), newThread]
      });
      setNewThreadTitle('');
      setNewThreadContent('');
      setShowNewThread(false);
      loadData();
    } catch (error) {
      console.error('Failed to create thread:', error);
      alert('Failed to create thread');
    }
  };

  const handleReply = async (threadId) => {
    const content = replyContent[threadId];
    if (!content) return;
    
    const threads = group?.discussion_threads || [];
    const thread = threads.find(t => t?.thread_id === threadId);
    if (!thread) return;

    const updatedThread = {
      ...thread,
      replies: [
        ...(thread.replies || []),
        {
          author_name: user.full_name,
          author_email: user.email,
          content,
          created_date: new Date().toISOString()
        }
      ]
    };
    
    const updatedThreads = threads.map(t => 
      t?.thread_id === threadId ? updatedThread : t
    );
    
    try {
      await base44.entities.StudyGroup.update(group.id, { discussion_threads: updatedThreads });
      setReplyContent({ ...replyContent, [threadId]: '' });
      loadData();
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('Failed to post reply');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  const discussionThreads = group?.discussion_threads || [];
  const sortedThreads = [...discussionThreads].sort((a, b) => 
    new Date(b?.created_date || 0) - new Date(a?.created_date || 0)
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={createPageUrl('StudyGroups')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Groups
          </Link>
        </Button>

        <Card className="mb-8 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{group.name}</CardTitle>
            <p className="text-slate-600">{group.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge>{group.subject_focus}</Badge>
              <Badge className="bg-blue-600">{group.exam_focus || 'SQE'}</Badge>
              <span className="text-sm text-slate-500">{group.member_emails?.length || 0} members</span>
            </div>
          </CardHeader>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Discussions</h2>
          <Button onClick={() => setShowNewThread(!showNewThread)} className="bg-slate-900">
            <MessageSquare className="w-4 h-4 mr-2" />
            New Discussion
          </Button>
        </div>

        {showNewThread && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6 space-y-4">
              <Input
                placeholder="Discussion Title"
                value={newThreadTitle}
                onChange={e => setNewThreadTitle(e.target.value)}
              />
              <Textarea
                placeholder="What would you like to discuss?"
                value={newThreadContent}
                onChange={e => setNewThreadContent(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateThread} className="bg-slate-900">Post</Button>
                <Button onClick={() => setShowNewThread(false)} variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {sortedThreads.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No discussions yet. Start one!</p>
            </div>
          ) : (
            sortedThreads.map((thread) => {
              if (!thread) return null;
              
              const replies = thread.replies || [];
              
              return (
                <Card key={thread.thread_id} className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">{thread.title}</CardTitle>
                    <p className="text-sm text-slate-500">
                      {thread.author_name} • {thread.created_date ? formatDistanceToNow(new Date(thread.created_date), { addSuffix: true }) : 'recently'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 mb-4 whitespace-pre-wrap">{thread.content}</p>
                    
                    {replies.length > 0 && (
                      <div className="space-y-3 mb-4 pl-4 border-l-2 border-slate-200">
                        {replies.map((reply, idx) => {
                          if (!reply) return null;
                          
                          return (
                            <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-slate-700">{reply.author_name}</p>
                              <p className="text-xs text-slate-500 mb-2">
                                {reply.created_date ? formatDistanceToNow(new Date(reply.created_date), { addSuffix: true }) : 'recently'}
                              </p>
                              <p className="text-slate-700 whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Write a reply..."
                        value={replyContent[thread.thread_id] || ''}
                        onChange={e => setReplyContent({ ...replyContent, [thread.thread_id]: e.target.value })}
                        onKeyPress={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(thread.thread_id);
                          }
                        }}
                      />
                      <Button onClick={() => handleReply(thread.thread_id)} size="icon">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}