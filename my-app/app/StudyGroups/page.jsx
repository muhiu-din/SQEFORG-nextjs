"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Lock, PlusCircle, BookOpen, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const SUBJECTS = ["All Subjects", "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution", "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts", "Criminal Law", "Criminal Practice", "Solicitors Accounts", "Constitutional & Administrative Law", "EU Law", "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"];

function CreateGroupDialog({ onGroupCreated, currentUser }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [subjectFocus, setSubjectFocus] = useState('All Subjects');
    const [maxMembers, setMaxMembers] = useState(10);
    const [isPrivate, setIsPrivate] = useState(false);

    const mutation = useMutation({
        mutationFn: async (newGroup) => base44.entities.StudyGroup.create(newGroup),
        onSuccess: () => {
            onGroupCreated();
        }
    });

    const handleSubmit = () => {
        if (!name || !description || !currentUser) return;
        mutation.mutate({
            name,
            description,
            subject_focus: subjectFocus,
            admin_email: currentUser.email,
            member_emails: [currentUser.email],
            max_members: maxMembers,
            is_private: isPrivate
        });
    };

    return (
        <div className="space-y-4 py-4">
            <Input placeholder="Group Name" value={name} onChange={e => setName(e.target.value)} />
            <Textarea placeholder="What's this group about?" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
            <Select value={subjectFocus} onValueChange={setSubjectFocus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
            <div>
                <Label>Max Members</Label>
                <Input type="number" value={maxMembers} onChange={e => setMaxMembers(parseInt(e.target.value))} min="2" max="50" />
            </div>
            <div className="flex items-center gap-2">
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} id="private" />
                <Label htmlFor="private">Private (require approval to join)</Label>
            </div>
            <Button onClick={handleSubmit} disabled={mutation.isLoading || !name || !description} className="w-full">
                {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Group
            </Button>
        </div>
    );
}

export default function StudyGroups() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState([]);
    const [openNewGroup, setOpenNewGroup] = useState(false);
    const [showProgressSharing, setShowProgressSharing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const allGroups = await base44.entities.StudyGroup.list();
            
            // Updated sample groups - aligned with Jan/July exam cycles
            const sampleGroups = [
                {
                    id: 'sample-group-1',
                    name: 'January 2026 FLK1 Preparation',
                    description: 'Focused group preparing for January FLK1 exams. We meet virtually twice a week and share notes and hard practice questions.',
                    subject_focus: 'All Subjects',
                    member_emails: ['member1@example.com', 'member2@example.com', 'member3@example.com', 'member4@example.com', 'member5@example.com'],
                    admin_email: 'member1@example.com',
                    max_members: 10,
                    is_private: false,
                    created_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'sample-group-2',
                    name: 'Criminal Law Deep Dive',
                    description: 'Dedicated to mastering Criminal Law and Criminal Practice. Share case summaries, discuss tricky scenarios, and test each other with hard questions!',
                    subject_focus: 'Criminal Law',
                    member_emails: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
                    admin_email: 'user1@example.com',
                    max_members: 8,
                    is_private: false,
                    created_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'sample-group-3',
                    name: 'Property & Land Law Experts',
                    description: 'Struggling with property law concepts? Join us! We break down complex topics into manageable chunks and create shared study materials.',
                    subject_focus: 'Property Practice',
                    member_emails: ['student1@example.com', 'student2@example.com', 'student3@example.com', 'student4@example.com', 'student5@example.com', 'student6@example.com', 'student7@example.com'],
                    admin_email: 'student1@example.com',
                    max_members: 12,
                    is_private: false,
                    created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'sample-group-4',
                    name: 'July 2026 Weekend Warriors',
                    description: 'For those juggling work and study, preparing for July exams. We focus on efficient study techniques and weekend intensive sessions. All subjects covered.',
                    subject_focus: 'All Subjects',
                    member_emails: ['prof1@example.com', 'prof2@example.com', 'prof3@example.com', 'prof4@example.com'],
                    admin_email: 'prof1@example.com',
                    max_members: 15,
                    is_private: false,
                    created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'sample-group-5',
                    name: 'Ethics & Professional Conduct Study Circle',
                    description: 'Discuss real-world ethical dilemmas and SRA principles. Great for understanding the practical application of rules for upcoming exams.',
                    subject_focus: 'Ethics & Professional Conduct',
                    member_emails: ['ethics1@example.com', 'ethics2@example.com'],
                    admin_email: 'ethics1@example.com',
                    max_members: 6,
                    is_private: false,
                    created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            
            setGroups([...allGroups, ...sampleGroups]);
        } catch (error) {
            console.error("Failed to load study groups:", error);
        }
        setLoading(false);
    };

    const joinGroupMutation = useMutation({
        mutationFn: async (groupId) => {
            const group = groups.find(g => g.id === groupId);
            if (!group) throw new Error("Group not found");
            
            const updatedMembers = [...(group.member_emails || []), user.email];
            return base44.entities.StudyGroup.update(groupId, { member_emails: updatedMembers });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studyGroups'] });
            loadData();
        }
    });

    const leaveGroupMutation = useMutation({
        mutationFn: async (groupId) => {
            const group = groups.find(g => g.id === groupId);
            if (!group) throw new Error("Group not found");
            
            const updatedMembers = (group.member_emails || []).filter(email => email !== user.email);
            return base44.entities.StudyGroup.update(groupId, { member_emails: updatedMembers });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studyGroups'] });
            loadData();
        }
    });

    const handleJoinGroup = (groupId) => {
        // Don't allow joining sample groups
        if (groupId.startsWith('sample-')) {
            alert("This is a demo group. Create your own group to get started!");
            return;
        }
        joinGroupMutation.mutate(groupId);
    };

    const handleLeaveGroup = (groupId) => {
        if (groupId.startsWith('sample-')) return;
        leaveGroupMutation.mutate(groupId);
    };

    const getMemberProgress = async (memberEmail) => {
        try {
            const attempts = await base44.entities.ExamAttempt.filter(
                { created_by: memberEmail, completed: true },
                '-created_date',
                10
            );
            const logs = await base44.entities.UserAnswerLog.filter(
                { created_by: memberEmail },
                '-created_date',
                500
            );

            const avgMockScore = attempts.length > 0
                ? (attempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / attempts.length).toFixed(1)
                : 0;

            const totalQuestions = logs.length;
            const correctAnswers = logs.filter(l => l.was_correct).length;
            const overallAccuracy = totalQuestions > 0 
                ? (correctAnswers / totalQuestions * 100).toFixed(1)
                : 0;

            return {
                avgMockScore,
                overallAccuracy,
                totalQuestions,
                mocksCompleted: attempts.length
            };
        } catch (error) {
            return null;
        }
    };

    const GroupCard = ({ group }) => {
        const isMember = group.member_emails?.includes(user?.email);
        const isAdmin = group.admin_email === user?.email;
        const memberCount = group.member_emails?.length || 0;
        const isFull = memberCount >= group.max_members;
        const isSample = group.id.startsWith('sample-');
        
        const [memberProgress, setMemberProgress] = React.useState({});
        const [loadingProgress, setLoadingProgress] = React.useState(false);

        const loadMemberProgress = async () => {
            if (!showProgressSharing || !isMember || isSample) return;
            
            setLoadingProgress(true);
            const progressData = {};
            
            for (const email of group.member_emails || []) {
                const progress = await getMemberProgress(email);
                if (progress) {
                    progressData[email] = progress;
                }
            }
            
            setMemberProgress(progressData);
            setLoadingProgress(false);
        };

        React.useEffect(() => {
            if (showProgressSharing && isMember && !isSample) {
                loadMemberProgress();
            }
        }, [showProgressSharing, isMember]);

        return (
            <Card key={group.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{group.name}</CardTitle>
                            <p className="text-sm text-slate-600">{group.description}</p>
                            <div className="flex items-center gap-2 mt-3">
                                <Badge variant="outline">{group.subject_focus}</Badge>
                                <Badge className={isFull ? "bg-red-600" : "bg-green-600"}>
                                    <Users className="w-3 h-3 mr-1" />
                                    {memberCount}/{group.max_members}
                                </Badge>
                                {group.is_private && <Badge variant="outline"><Lock className="w-3 h-3 mr-1" />Private</Badge>}
                                {isSample && <Badge className="bg-purple-600">Demo Group</Badge>}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {showProgressSharing && isMember && !isSample && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Member Progress
                            </h4>
                            {loadingProgress ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            ) : Object.keys(memberProgress).length > 0 ? (
                                <div className="space-y-2">
                                    {Object.entries(memberProgress).slice(0, 5).map(([email, progress]) => (
                                        <div key={email} className="flex items-center justify-between p-2 bg-white rounded">
                                            <span className="text-sm font-medium text-slate-700">
                                                {email === user?.email ? 'You' : email.split('@')[0]}
                                            </span>
                                            <div className="flex gap-3 text-xs text-slate-600">
                                                <span>{progress.totalQuestions} questions</span>
                                                <span>{progress.overallAccuracy}% acc.</span>
                                                <span>{progress.avgMockScore}% mocks</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-2">No progress data available yet</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2">
                        {isMember && !isSample ? (
                            <>
                                <Button
                                    onClick={() => navigate(createPageUrl(`GroupDiscussion?groupId=${group.id}`))}
                                    className="flex-1"
                                >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    View Discussions
                                </Button>
                                <Button
                                    onClick={() => handleLeaveGroup(group.id)}
                                    variant="outline"
                                    disabled={leaveGroupMutation.isLoading}
                                >
                                    Leave
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => handleJoinGroup(group.id)}
                                disabled={joinGroupMutation.isLoading || isFull || isSample}
                                className="w-full"
                            >
                                {isSample ? 'Demo Group - Create Your Own!' : isFull ? 'Group Full' : 'Join Group'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) return (
        <div className="p-10 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );

    if (!user) return (
        <div className="p-10 text-center">
            <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Please log in to access study groups.</p>
        </div>
    );

    const myGroups = groups.filter(g => g.member_emails?.includes(user.email) && !g.id.startsWith('sample-'));

    return (
        <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">Study Groups</h1>
                        <p className="text-slate-600">Join or create groups to study together and stay motivated</p>
                    </div>
                    <Dialog open={openNewGroup} onOpenChange={setOpenNewGroup}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
                                <PlusCircle className="w-5 h-5" /> Create Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create a New Study Group</DialogTitle>
                            </DialogHeader>
                            <CreateGroupDialog
                                onGroupCreated={() => {
                                    setOpenNewGroup(false);
                                    loadData();
                                }}
                                currentUser={user}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <Users className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>Study groups help you stay accountable!</strong> Join a group to share resources, discuss difficult topics, and track progress together.
                    </AlertDescription>
                </Alert>

                {/* Progress Sharing Toggle */}
                <Card className="mb-6 border-none shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="progress-sharing" className="font-semibold">
                                    Show Member Progress
                                </Label>
                                <p className="text-sm text-slate-600">
                                    See how your study group members are performing
                                </p>
                            </div>
                            <Switch
                                id="progress-sharing"
                                checked={showProgressSharing}
                                onCheckedChange={setShowProgressSharing}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="all" className="mb-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="all">All Groups</TabsTrigger>
                        <TabsTrigger value="my-groups">My Groups ({myGroups.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {groups.map(group => <GroupCard key={group.id} group={group} />)}
                        </div>
                    </TabsContent>

                    <TabsContent value="my-groups" className="mt-6">
                        {myGroups.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow-md">
                                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-600">You haven't joined any study groups yet</p>
                                <Button onClick={() => document.querySelector('[value="all"]').click()} className="mt-4" variant="outline">
                                    Browse All Groups
                                </Button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {myGroups.map(group => <GroupCard key={group.id} group={group} />)}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
