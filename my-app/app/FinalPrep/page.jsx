"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Rocket, Target, PenSquare, BookOpen, Clock, BrainCircuit, Coffee, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TaskTypeIcon = ({ type }) => {
    switch (type) {
        case 'review': return <PenSquare className="w-5 h-5 text-orange-500" />;
        case 'practice': return <Target className="w-5 h-5 text-green-500" />;
        case 'mock': return <Clock className="w-5 h-5 text-purple-500" />;
        case 'plan': return <BrainCircuit className="w-5 h-5 text-indigo-500" />;
        case 'rest': return <Coffee className="w-5 h-5 text-teal-500" />;
        default: return <BookOpen className="w-5 h-5 text-blue-500" />;
    }
};

const finalPrepPlan = [
  { day: 30, title: "Initial Assessment & Planning", tasks: [
      { id: 'fp-d30-t1', type: 'mock', description: 'Take a full 90-question FLK 1 mock to set a baseline.', link: createPageUrl('MockExams') },
      { id: 'fp-d30-t2', type: 'plan', description: 'Review results. Identify your 3 weakest subjects from Mock Exam Analytics.' },
  ]},
  { day: 29, title: "Weak Area Focus #1", tasks: [
      { id: 'fp-d29-t1', type: 'review', description: 'Deep dive into Study Notes for your #1 weakest subject.' },
      { id: 'fp-d29-t2', type: 'practice', description: 'Complete 30 practice questions on that subject (untimed).', link: createPageUrl('QuestionBank') },
  ]},
  { day: 28, title: "Weak Area Focus #2", tasks: [
      { id: 'fp-d28-t1', type: 'review', description: 'Review Study Notes for your #2 weakest subject.' },
      { id: 'fp-d28-t2', type: 'practice', description: 'Complete 30 practice questions on that subject (untimed).', link: createPageUrl('QuestionBank') },
  ]},
  { day: 27, title: "Weak Area Focus #3", tasks: [
      { id: 'fp-d27-t1', type: 'review', description: 'Review Study Notes for your #3 weakest subject.' },
      { id: 'fp-d27-t2', type: 'practice', description: 'Complete 30 practice questions on that subject (untimed).', link: createPageUrl('QuestionBank') },
  ]},
  { day: 26, title: "FLK 1 Mixed Practice", tasks: [
      { id: 'fp-d26-t1', type: 'practice', description: 'Timed 45-question mini-mock on FLK 1 subjects.', link: createPageUrl(`CustomMockSession?subject=${encodeURIComponent('FLK 1 (All Subjects)')}&numQuestions=45`) },
  ]},
  { day: 25, title: "FLK 2 Mixed Practice", tasks: [
      { id: 'fp-d25-t1', type: 'practice', description: 'Timed 45-question mini-mock on FLK 2 subjects.', link: createPageUrl(`CustomMockSession?subject=${encodeURIComponent('FLK 2 (All Subjects)')}&numQuestions=45`) },
  ]},
  { day: 24, title: "Active Recall Day", tasks: [
      { id: 'fp-d24-t1', type: 'practice', description: 'Use Flash Cards for 60 minutes on your weakest subjects.', link: createPageUrl('FlashCards') },
      { id: 'fp-d24-t2', type: 'review', description: 'Explain 3 complex legal concepts out loud without notes.'},
  ]},
  { day: 23, title: "Review & Consolidate", tasks: [
      { id: 'fp-d23-t1', type: 'review', description: 'Review questions you got wrong this week in your Review Bank.', link: createPageUrl('ReviewBank') },
  ]},
  { day: 22, title: "Full Mock Exam #2", tasks: [
      { id: 'fp-d22-t1', type: 'mock', description: 'Take a full 90-question FLK 2 mock exam.', link: createPageUrl('MockExams') },
      { id: 'fp-d22-t2', type: 'plan', description: 'Briefly review results - identify any new problem areas.' },
  ]},
  ...[...Array(8)].map((_, i) => ({
      day: 21 - i,
      title: `Mixed Timed Practice Day ${i + 1}`,
      tasks: [
          { id: `fp-d${21-i}-t1`, type: 'practice', description: `Complete a 60-question mixed subject timed practice.`, link: createPageUrl(`CustomMockSession?subject=${encodeURIComponent(i % 2 === 0 ? 'FLK 1 (All Subjects)' : 'FLK 2 (All Subjects)')}&numQuestions=60`) },
          { id: `fp-d${21-i}-t2`, type: 'review', description: 'Spend 30 minutes reviewing the hardest questions.' },
      ]
  })),
  { day: 13, title: "Full Mock Exam #3", tasks: [
      { id: 'fp-d13-t1', type: 'mock', description: 'Take a full 90-question FLK 1 mock under exam conditions.', link: createPageUrl('MockExams') },
  ]},
  { day: 12, title: "Full Mock Exam #4", tasks: [
      { id: 'fp-d12-t1', type: 'mock', description: 'Take a full 90-question FLK 2 mock under exam conditions.', link: createPageUrl('MockExams') },
  ]},
  { day: 11, title: "Deep Dive Mock Review", tasks: [
      { id: 'fp-d11-t1', type: 'review', description: 'Thoroughly review both mocks from the past two days. Understand every wrong answer.' },
  ]},
  { day: 10, title: "Solicitors Accounts Focus", tasks: [
      { id: 'fp-d10-t1', type: 'review', description: 'Re-read all Study Notes for Solicitors Accounts.' },
      { id: 'fp-d10-t2', type: 'practice', description: 'Complete 20 practice questions on Solicitors Accounts.', link: createPageUrl('QuestionBank') },
  ]},
  { day: 9, title: "Ethics & Conduct Focus", tasks: [
      { id: 'fp-d9-t1', type: 'review', description: 'Review the SRA Principles and Codes of Conduct.' },
      { id: 'fp-d9-t2', type: 'practice', description: 'Complete 20 practice questions on Ethics.', link: createPageUrl('QuestionBank') },
  ]},
  { day: 8, title: "Light Mixed Practice", tasks: [
      { id: 'fp-d8-t1', type: 'practice', description: 'Complete one 30-question untimed mixed practice session.', link: createPageUrl('QuickPractice') },
  ]},
  { day: 7, title: "Final Mock Exam", tasks: [
      { id: 'fp-d7-t1', type: 'mock', description: 'Take your final full mock exam (FLK 1 or 2). Give it your all!', link: createPageUrl('MockExams') },
  ]},
  { day: 6, title: "Final Mock Review", tasks: [
      { id: 'fp-d6-t1', type: 'review', description: 'Review your final mock. Focus on careless errors and timing strategy.' },
  ]},
  { day: 5, title: "Black Letter Law Review", tasks: [
      { id: 'fp-d5-t1', type: 'review', description: 'Read through all Black Letter Law summaries.', link: createPageUrl('BlackLetterLaw') },
  ]},
  { day: 4, title: "Mind Maps & Flash Cards", tasks: [
      { id: 'fp-d4-t1', type: 'review', description: 'Quickly review your Mind Maps and most difficult Flash Cards.', link: createPageUrl('MindMaps') },
  ]},
  { day: 3, title: "Light Topic Skim", tasks: [
      { id: 'fp-d3-t1', type: 'review', description: 'Skim read your notes for any topics you still feel shaky on. No questions.' },
  ]},
  { day: 2, title: "Logistics & Relaxation", tasks: [
      { id: 'fp-d2-t1', type: 'plan', description: 'Plan your route to the test center. Pack your bag (ID, water, etc.).' },
      { id: 'fp-d2-t2', type: 'rest', description: 'Do something relaxing. Light exercise, watch a movie. Stop studying by the evening.' },
  ]},
  { day: 1, title: "Exam Day", tasks: [
      { id: 'fp-d1-t1', type: 'rest', description: 'Have a good breakfast. Stay calm. Trust your hard work.' },
      { id: 'fp-d1-t2', type: 'mock', description: 'Good luck! You\'ve got this.' },
  ]},
].reverse(); // Reverse to show Day 30 at the top

const UpgradePrompt = () => (
    <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center border-none shadow-xl">
            <CardHeader className="p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Unlock Your Final Prep Bootcamp</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
                <p className="mb-6 text-slate-600">
                    The 30-Day Final Prep plan is an exclusive feature for our Pro and Ultimate members. It's designed to give you the ultimate edge in the final month before your exam.
                </p>
                <Button asChild size="lg" className="w-full bg-slate-900 hover:bg-slate-800">
                    <Link to={createPageUrl("Packages")}>
                        <Rocket className="w-5 h-5 mr-2" />
                        Upgrade Now to Access
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
);


export default function FinalPrep() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkedTasks, setCheckedTasks] = useState({});

    useEffect(() => {
        const fetchUserAndProgress = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                const savedProgress = localStorage.getItem(`finalPrepProgress_${currentUser.id}`);
                if (savedProgress) {
                    setCheckedTasks(JSON.parse(savedProgress));
                }
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        fetchUserAndProgress();
    }, []);

    const handleCheckChange = (taskId, isChecked) => {
        const newCheckedTasks = { ...checkedTasks, [taskId]: isChecked };
        setCheckedTasks(newCheckedTasks);
        if (user) {
            localStorage.setItem(`finalPrepProgress_${user.id}`, JSON.stringify(newCheckedTasks));
        }
    };
    
    const allTasks = useMemo(() => finalPrepPlan.flatMap(day => day.tasks), []);
    const totalProgress = useMemo(() => {
        const completedCount = Object.values(checkedTasks).filter(Boolean).length;
        return allTasks.length > 0 ? (completedCount / allTasks.length) * 100 : 0;
    }, [checkedTasks, allTasks]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-slate-500 animate-spin" />
            </div>
        );
    }
    
    const isAuthorized = user && (user.role === 'admin' || user.subscription_tier === 'pro' || user.subscription_tier === 'ultimate');

    if (!isAuthorized) {
        return <UpgradePrompt />;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-linear-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center">
                        <ShieldAlert className="w-10 h-10 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">30-Day Final Prep Bootcamp</h1>
                    <p className="text-slate-600 text-lg">Your structured plan for the final month. Follow this path to success.</p>
                </header>

                <Card className="mb-8 border-none shadow-lg">
                    <CardContent className="p-6">
                         <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <p className="font-semibold text-slate-800 mb-1">Overall Progress</p>
                                <Progress value={totalProgress} />
                            </div>
                            <p className="font-bold text-lg text-slate-700">{Math.round(totalProgress)}%</p>
                        </div>
                    </CardContent>
                </Card>

                <Accordion type="single" collapsible defaultValue="day-30" className="w-full space-y-4">
                    {finalPrepPlan.map(({ day, title, tasks }) => {
                        const dayProgress = (tasks.filter(t => checkedTasks[t.id]).length / tasks.length) * 100;
                        return (
                            <AccordionItem value={`day-${day}`} key={day} className="border-none">
                                <Card className="shadow-md transition-all hover:shadow-lg">
                                    <AccordionTrigger className="w-full p-6 text-left hover:no-underline">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-lg shrink-0 flex items-center justify-center ${dayProgress === 100 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                                                    <span className="text-xl font-bold">{day}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Day {day}</p>
                                                    <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
                                                </div>
                                            </div>
                                            <div className="w-24 ml-4 hidden sm:block">
                                                 <Progress value={dayProgress} />
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-6 pt-0">
                                        <div className="border-t pt-6 space-y-4">
                                            {tasks.map(task => (
                                                <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50">
                                                    <Checkbox
                                                        id={task.id}
                                                        checked={!!checkedTasks[task.id]}
                                                        onCheckedChange={(checked) => handleCheckChange(task.id, checked)}
                                                        className="mt-1"
                                                    />
                                                    <label htmlFor={task.id} className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <TaskTypeIcon type={task.type} />
                                                            <span className={`text-slate-700 ${checkedTasks[task.id] ? 'line-through text-slate-500' : ''}`}>
                                                                {task.description}
                                                            </span>
                                                        </div>
                                                        {task.link && (
                                                            <Button asChild variant="outline" size="sm" className="self-start sm:self-center">
                                                                <Link to={task.link}>Go to Task</Link>
                                                            </Button>
                                                        )}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </Card>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </div>
    );
}
