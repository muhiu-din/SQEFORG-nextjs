"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Lock, CheckCircle2, Circle, BookOpen, Target, PenSquare } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Printer } from 'lucide-react';

const TaskTypeIcon = ({ type }) => {
    switch (type) {
        case 'study': return <BookOpen className="w-5 h-5 text-blue-500" />;
        case 'practice': return <Target className="w-5 h-5 text-green-500" />;
        case 'review': return <PenSquare className="w-5 h-5 text-orange-500" />;
        default: return <BookOpen className="w-5 h-5 text-blue-500" />;
    }
};

const januaryTimetable = [
    { 
        id: 'jan-w1', 
        title: "Week 1: Foundations & Contract (Part 1)", 
        period: "Starting September",
        tasks: [
            { id: 'jan-t1', description: 'Familiarise with SQE1 exam format and question style.', type: 'study' },
            { id: 'jan-t2', description: 'Cover contract formation: Offer & Acceptance.', type: 'study' },
            { id: 'jan-t3', description: 'Practice 10 MCQs on Offer & Acceptance.', type: 'practice' },
        ]
    },
    { 
        id: 'jan-w2', 
        title: "Week 2: Contract (Part 2)", 
        period: "Starting September",
        tasks: [
            { id: 'jan-t4', description: 'Understand the principles of Consideration.', type: 'study' },
            { id: 'jan-t5', description: 'Study Intention to Create Legal Relations.', type: 'study' },
            { id: 'jan-t6', description: 'Practice 10 MCQs on Consideration & Intention.', type: 'practice' },
        ]
    },
    {
        id: 'jan-w3',
        title: "Week 3: Contract Terms",
        period: "Starting September",
        tasks: [
            { id: 'jan-t7', description: 'Cover Express and Implied Contract Terms.', type: 'study' },
            { id: 'jan-t8', description: 'Study Exemption Clauses and Unfair Contract Terms.', type: 'study' },
            { id: 'jan-t9', description: 'Practice 15 mixed MCQs on Contract Terms.', type: 'practice' },
        ]
    },
    {
        id: 'jan-w4',
        title: "Week 4: Misrepresentation & Tort Intro",
        period: "Starting September",
        tasks: [
            { id: 'jan-t10', description: 'Understand Misrepresentation and its remedies.', type: 'study' },
            { id: 'jan-t11', description: 'Begin Tort Law: Negligence and Duty of Care.', type: 'study' },
            { id: 'jan-t12', description: 'Practice 15 mixed MCQs on Misrepresentation & Duty of Care.', type: 'practice' },
        ]
    },
     { 
        id: 'jan-w5', 
        title: "Week 5: Tort Law & Consolidation", 
        period: "Starting October",
        tasks: [
            { id: 'jan-t13', description: 'Cover Breach of Duty and Causation in Tort.', type: 'study' },
            { id: 'jan-t14', description: 'Attempt Mock Exam 1.', type: 'practice' },
            { id: 'jan-t15', description: 'Thoroughly review answers from Mock Exam 1.', type: 'review' },
        ]
    },
    {
        id: 'jan-w6',
        title: "Week 6: Business Law (Part 1)",
        period: "Starting October",
        tasks: [
            { id: 'jan-t16', description: 'Study Business Structures: Sole Traders, Partnerships, LLPs.', type: 'study' },
            { id: 'jan-t17', description: 'Cover Company Formation and the corporate veil.', type: 'study' },
            { id: 'jan-t18', description: 'Practice 10 MCQs on Business Structures.', type: 'practice' },
        ]
    },
    {
        id: 'jan-w7',
        title: "Week 7: Business Law (Part 2)",
        period: "Starting October",
        tasks: [
            { id: 'jan-t19', description: 'Understand Company Decision-Making (directors vs. shareholders).', type: 'study' },
            { id: 'jan-t20', description: 'Study Directors\' Duties.', type: 'study' },
            { id: 'jan-t21', description: 'Practice 15 MCQs on Company Decision-Making & Duties.', type: 'practice' },
        ]
    },
    {
        id: 'jan-w8',
        title: "Week 8: Property & Conveyancing",
        period: "Starting November",
        tasks: [
            { id: 'jan-t22', description: 'Study the Conveyancing Process (Pre-contract to Completion).', type: 'study' },
            { id: 'jan-t23', description: 'Practice 15 MCQs on Conveyancing.', type: 'practice' },
        ]
    },
     {
        id: 'jan-w9',
        title: "Week 9: Land Law & Mock 2",
        period: "Starting November",
        tasks: [
            { id: 'jan-t24', description: 'Introduce Land Law: Estates and Interests in Land.', type: 'study' },
            { id: 'jan-t25', description: 'Attempt Mock Exam 2.', type: 'practice' },
            { id: 'jan-t26', description: 'Review Mock 2, focusing on Property and Land Law answers.', type: 'review' },
        ]
    },
    {
        id: 'jan-w10',
        title: "Week 10: Criminal Law & Dispute Resolution Intro",
        period: "Starting November",
        tasks: [
            { id: 'jan-t27', description: 'Study Criminal Law principles: Actus Reus, Mens Rea.', type: 'study' },
            { id: 'jan-t28', description: 'Introduce Dispute Resolution: Pre-action conduct and case management.', type: 'study' },
            { id: 'jan-t29', description: 'Practice 20 mixed MCQs on Criminal Law and DR.', type: 'practice' },
        ]
    },
    {
        id: 'jan-w11',
        title: "Week 11: Wills & Trusts Intro",
        period: "Starting December",
        tasks: [
            { id: 'jan-t30', description: 'Study Wills, Intestacy, and Administration of Estates.', type: 'study' },
            { id: 'jan-t31', description: 'Cover the Three Certainties for Trusts.', type: 'study' },
            { id: 'jan-t32', description: 'Practice 15 MCQs on Wills and Trusts.', type: 'practice' },
        ]
    },
    {
        id: 'jan-w12',
        title: "Week 12: Ethics & Solicitors Accounts",
        period: "Starting December",
        tasks: [
            { id: 'jan-t33', description: 'Study Solicitors Accounts and Professional Conduct rules.', type: 'study' },
            { id: 'jan-t34', description: 'Attempt Mock Exam 3.', type: 'practice' },
            { id: 'jan-t35', description: 'Review Mock 3, identifying weak areas across all subjects.', type: 'review' },
        ]
    },
     {
        id: 'jan-w13',
        title: "Week 13: Full Topic Revision",
        period: "Starting January",
        tasks: [
            { id: 'jan-t36', description: 'Use Personalised Practice to target your 3 weakest subjects.', type: 'practice' },
            { id: 'jan-t37', description: 'Review all Study Notes and Mind Maps.', type: 'study' },
        ]
    },
    {
        id: 'jan-w14',
        title: "Week 14: Timed Mock Practice",
        period: "Starting January",
        tasks: [
            { id: 'jan-t38', description: 'Complete 2 full timed mocks under exam conditions.', type: 'practice' },
            { id: 'jan-t39', description: 'Create a "Wrong Answer" log and review it daily.', type: 'review' },
        ]
    },
    {
        id: 'jan-w15-16',
        title: "Weeks 15-16: Final Review & Rest",
        period: "Starting January",
        tasks: [
            { id: 'jan-t40', description: 'Final mock exam (Mock 4).', type: 'practice' },
            { id: 'jan-t41', description: 'Lightly review key principles the day before the exam.', type: 'study' },
            { id: 'jan-t42', description: 'Focus on rest, good nutrition, and mental preparation.', type: 'study' },
        ]
    },
];

const julyTimetable = [
    { 
        id: 'jul-w1-2', 
        title: "Weeks 1-2: Foundations & Contract Law (Part 1)",
        tasks: [
            { id: 'jul-t1', description: 'Understand the legal system of England & Wales.', type: 'study' },
            { id: 'jul-t2', description: 'Cover Contract Formation (Offer, Acceptance, Consideration).', type: 'study' },
            { id: 'jul-t3', description: 'Practice 15 MCQs on Contract Formation.', type: 'practice' },
        ]
    },
    { 
        id: 'jul-w3-4', 
        title: "Weeks 3-4: Contract Law (Part 2) & Tort Intro",
        tasks: [
            { id: 'jul-t4', description: 'Cover Contract Terms, Exemption Clauses, and Misrepresentation.', type: 'study' },
            { id: 'jul-t5', description: 'Begin Tort Law: Negligence and Duty of Care.', type: 'study' },
            { id: 'jul-t6', description: 'Practice 20 mixed MCQs on Contract & Tort.', type: 'practice' },
        ]
    },
    { 
        id: 'jul-w5-6', 
        title: "Weeks 5-6: Tort Law & First Mock",
        tasks: [
            { id: 'jul-t7', description: 'Cover Breach of Duty, Causation, and Remedies in Tort.', type: 'study' },
            { id: 'jul-t8', description: 'Attempt Mock Exam 1.', type: 'practice' },
            { id: 'jul-t9', description: 'Review Mock Exam 1 in detail, focusing on wrong answers.', type: 'review' },
        ]
    },
    { 
        id: 'jul-w7-8', 
        title: "Weeks 7-8: Business Law (Part 1)",
        tasks: [
            { id: 'jul-t10', description: 'Study Business Structures and Company Formation.', type: 'study' },
            { id: 'jul-t11', description: 'Understand the roles of Directors vs. Shareholders.', type: 'study' },
            { id: 'jul-t12', description: 'Practice 15 MCQs on Business Law basics.', type: 'practice' },
        ]
    },
     { 
        id: 'jul-w9-10', 
        title: "Weeks 9-10: Business Law (Part 2) & Dispute Resolution Intro",
        tasks: [
            { id: 'jul-t13', description: 'Cover Directors\' Duties and Company Finance.', type: 'study' },
            { id: 'jul-t14', description: 'Begin Dispute Resolution: Pre-action conduct and Case Management.', type: 'study' },
            { id: 'jul-t15', description: 'Practice 20 MCQs on Business Law and DR.', type: 'practice' },
        ]
    },
    { 
        id: 'jul-w11-12', 
        title: "Weeks 11-12: Dispute Resolution & Second Mock",
        tasks: [
            { id: 'jul-t16', description: 'Cover DR topics from Allocation to Trial and Costs.', type: 'study' },
            { id: 'jul-t17', description: 'Attempt Mock Exam 2.', type: 'practice' },
            { id: 'jul-t18', description: 'Review Mock Exam 2.', type: 'review' },
        ]
    },
    { 
        id: 'jul-w13-14', 
        title: "Weeks 13-14: Property & Land Law (Part 1)",
        tasks: [
            { id: 'jul-t19', description: 'Cover the full conveyancing process in Property Practice.', type: 'study' },
            { id: 'jul-t20', description: 'Introduce Land Law: Estates, Interests, and Co-ownership.', type: 'study' },
            { id: 'jul-t21', description: 'Practice 20 MCQs on Property & Land Law.', type: 'practice' },
        ]
    },
    { 
        id: 'jul-w15-16', 
        title: "Weeks 15-16: Land Law & Third Mock",
        tasks: [
            { id: 'jul-t22', description: 'Cover Leases, Covenants, and Mortgages in Land Law.', type: 'study' },
            { id: 'jul-t23', description: 'Attempt Mock Exam 3.', type: 'practice' },
            { id: 'jul-t24', description: 'Review Mock Exam 3.', type: 'review' },
        ]
    },
    { 
        id: 'jul-w17-18', 
        title: "Weeks 17-18: Wills & Trusts",
        tasks: [
            { id: 'jul-t25', description: 'Cover Wills, Intestacy, and Administration of Estates.', type: 'study' },
            { id: 'jul-t26', description: 'Study Trusts: The Three Certainties, Formalities, and Trustees\' duties.', type: 'study' },
            { id: 'jul-t27', description: 'Practice 20 MCQs on Wills and Trusts.', type: 'practice' },
        ]
    },
    { 
        id: 'jul-w19-20', 
        title: "Weeks 19-20: Criminal Law & Practice",
        tasks: [
            { id: 'jul-t28', description: 'Cover core principles (Actus Reus, Mens Rea) and key offences (Theft, Homicide).', type: 'study' },
            { id: 'jul-t29', description: 'Understand Criminal Practice from arrest to trial.', type: 'study' },
            { id: 'jul-t30', description: 'Attempt Mock Exam 4.', type: 'practice' },
            { id: 'jul-t31', description: 'Review Mock Exam 4.', type: 'review' },
        ]
    },
     { 
        id: 'jul-w21-22', 
        title: "Weeks 21-22: Ethics, Accounts & Final Subjects",
        tasks: [
            { id: 'jul-t32', description: 'Cover Professional Conduct, Legal Services, and Solicitors Accounts.', type: 'study' },
            { id: 'jul-t33', description: 'Review Constitutional & Administrative Law.', type: 'study' },
            { id: 'jul-t34', description: 'Practice 30 mixed MCQs on these final areas.', type: 'practice' },
        ]
    },
    { 
        id: 'jul-w23-24', 
        title: "Weeks 23-24: Final Mocks & Intensive Review",
        tasks: [
            { id: 'jul-t35', description: 'Complete 2-3 final mock exams under timed conditions.', type: 'practice' },
            { id: 'jul-t36', description: 'Use Personalised Practice and the Review Bank daily.', type: 'review' },
            { id: 'jul-t37', description: 'Lightly review key notes and rest before exam day.', type: 'study' },
        ]
    },
];

export default function RevisionPlanner() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedTasks, setCompletedTasks] = useState(new Set());

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                setCompletedTasks(new Set(currentUser.completed_planner_tasks || []));
            } catch (error) {
                // Not logged in
                setUser({ subscription_tier: 'starter', role: 'user' });
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleTaskToggle = async (taskId) => {
        if (!user || !user.id) return; // Prevent guests from ticking boxes
        const newCompletedTasks = new Set(completedTasks);
        if (newCompletedTasks.has(taskId)) {
            newCompletedTasks.delete(taskId);
        } else {
            newCompletedTasks.add(taskId);
        }
        setCompletedTasks(newCompletedTasks);
        try {
            await User.updateMyUserData({ completed_planner_tasks: Array.from(newCompletedTasks) });
        } catch (error) {
            console.error("Failed to update completed tasks:", error);
            // Revert UI state if persistence fails
            setCompletedTasks(new Set(completedTasks));
        }
    };

    if (loading) {
        return <div className="p-10">Loading...</div>;
    }

    const hasAccess = user?.role === 'admin' || user?.subscription_tier === 'pro' || user?.subscription_tier === 'ultimate';

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
                <div className="max-w-3xl mx-auto text-center">
                    <Card className="border-none shadow-xl p-10">
                        <Lock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Content Locked</h1>
                        <p className="text-slate-600 mb-8">The Revision Planner is a premium feature available on Pro and Ultimate plans.</p>
                        <Link href={createPageUrl("Packages")}>
                            <Button className="bg-amber-400 text-slate-900 hover:bg-amber-500 h-12 px-8 text-lg">
                                Upgrade Your Plan
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>
            <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 printable-area">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-3">Revision Planner</h1>
                            <p className="text-slate-600">Your interactive, structured guide to exam success. Check off tasks as you go!</p>
                        </div>
                        <Button onClick={() => window.print()} variant="outline" className="gap-2 no-print">
                            <Printer className="w-4 h-4" />
                            Print Planner
                        </Button>
                    </div>
                    <Tabs defaultValue="january" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 no-print">
                            <TabsTrigger value="january">January Exam (4-Month Plan)</TabsTrigger>
                            <TabsTrigger value="july">July Exam (6-Month Plan)</TabsTrigger>
                        </TabsList>
                        <TabsContent value="january">
                            <TimetableAccordion
                                timetable={januaryTimetable}
                                completedTasks={completedTasks}
                                onTaskToggle={handleTaskToggle}
                            />
                        </TabsContent>
                        <TabsContent value="july">
                             <TimetableAccordion
                                timetable={julyTimetable}
                                completedTasks={completedTasks}
                                onTaskToggle={handleTaskToggle}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}

const TimetableAccordion = ({ timetable, completedTasks, onTaskToggle }) => {
    
    const allTasks = useMemo(() => timetable.flatMap(section => section.tasks), [timetable]);
    const totalTasks = allTasks.length;
    const completedCount = useMemo(() => {
        let count = 0;
        allTasks.forEach(task => {
            if (completedTasks.has(task.id)) {
                count++;
            }
        });
        return count;
    }, [allTasks, completedTasks]);
    const totalProgress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

    return (
        <Card className="border-none shadow-lg mt-6">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <CalendarCheck className="w-6 h-6 text-slate-700"/>
                    Study Plan Overview
                </CardTitle>
                <div className="pt-4">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-slate-600">Overall Progress</p>
                        <p className="text-sm font-bold text-slate-800">{completedCount} of {totalTasks} tasks completed</p>
                    </div>
                    <Progress value={totalProgress} className="h-3"/>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <Accordion type="single" collapsible className="w-full space-y-3">
                    {timetable.map((section, index) => {
                        const sectionTasks = section.tasks;
                        const sectionCompletedCount = sectionTasks.filter(task => completedTasks.has(task.id)).length;
                        const sectionProgress = (sectionCompletedCount / sectionTasks.length) * 100;
                        
                        return (
                            <AccordionItem value={`item-${index}`} key={section.id} className="border border-slate-200 rounded-lg bg-slate-50/50">
                                <AccordionTrigger className="hover:no-underline p-4 text-left">
                                    <div className="w-full">
                                        <p className="font-bold text-slate-900">{section.title}</p>
                                        <p className="text-sm text-slate-500">{section.period}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Progress value={sectionProgress} className="h-2 w-full" />
                                            <span className="text-xs font-mono text-slate-600">{sectionCompletedCount}/{sectionTasks.length}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 border-t border-slate-200 bg-white">
                                    <div className="space-y-3">
                                        {sectionTasks.map(task => {
                                            const isCompleted = completedTasks.has(task.id);
                                            return (
                                                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-md transition-colors ${isCompleted ? 'bg-green-50' : ''}`}>
                                                    <Checkbox
                                                        checked={isCompleted}
                                                        onCheckedChange={() => onTaskToggle(task.id)}
                                                        className="w-5 h-5 mt-0.5 shrink-0"
                                                        id={`task-${task.id}`}
                                                    />
                                                    <label htmlFor={`task-${task.id}`} className={`flex-1 grid grid-cols-[auto_1fr] items-start gap-x-3 cursor-pointer ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                        <TaskTypeIcon type={task.type} />
                                                        {task.description}
                                                    </label>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
};
