"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, Coffee, AlertTriangle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SimulatorPart from '../components/simulator/SimulatorPart';
import BreakScreen from '../components/simulator/BreakScreen';
import SimulatorResults from '../components/simulator/SimulatorResults';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import _ from 'lodash';

const FLK1_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Constitutional & Administrative Law", "EU Law", "The Legal System of England & Wales", "Legal Services"
];

const FLK2_SUBJECTS = [
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts", "Ethics & Professional Conduct"
];

export default function ExamDaySimulator() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState('FLK 1');
    const [stage, setStage] = useState('setup'); // 'setup', 'part1', 'break', 'part2', 'results'
    const [part1Questions, setPart1Questions] = useState([]);
    const [part2Questions, setPart2Questions] = useState([]);
    const [part1Answers, setPart1Answers] = useState({});
    const [part2Answers, setPart2Answers] = useState({});
    const [startingSimulator, setStartingSimulator] = useState(false);
    const [attemptId, setAttemptId] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const startSimulator = async () => {
        if (!user) return;
        
        // Check credits
        const creditsNeeded = 1;
        if (user.simulation_credits < creditsNeeded && user.role !== 'admin') {
            alert(`You need ${creditsNeeded} simulator credit to start. Visit the Packages page to purchase more.`);
            return;
        }

        setStartingSimulator(true);

        try {
            const subjects = selectedExam === 'FLK 1' ? FLK1_SUBJECTS : FLK2_SUBJECTS;
            
            // Fetch all available questions for selected exam
            const allQuestions = await base44.entities.Question.list('-created_date', 2000);
            const examQuestions = allQuestions.filter(q => subjects.includes(q.subject));

            if (examQuestions.length < 180) {
                alert(`Insufficient questions available for ${selectedExam}. Need 180 questions, found ${examQuestions.length}.`);
                setStartingSimulator(false);
                return;
            }

            // Shuffle and split into two parts of 90 each (SRA standard)
            const shuffled = _.shuffle(examQuestions);
            const part1 = shuffled.slice(0, 90);
            const part2 = shuffled.slice(90, 180);

            setPart1Questions(part1);
            setPart2Questions(part2);
            setPart1Answers({});
            setPart2Answers({});

            // Create exam attempt record
            const attempt = await base44.entities.ExamAttempt.create({
                mock_exam_id: 'exam-day-simulator',
                mock_exam_title: `Exam Day Simulator - ${selectedExam}`,
                question_ids: shuffled.slice(0, 180).map(q => q.id),
                answers: {},
                score: 0,
                total_questions: 180,
                time_taken_minutes: 0,
                completed: false,
                is_timed: true,
                exam_mode: 'simulator'
            });
            setAttemptId(attempt.id);

            // Deduct credit (unless admin)
            if (user.role !== 'admin') {
                await base44.auth.updateMe({
                    simulation_credits: user.simulation_credits - creditsNeeded
                });
            }

            setStage('part1');
        } catch (error) {
            console.error('Failed to start simulator:', error);
            alert('Failed to start simulator. Please try again.');
        }

        setStartingSimulator(false);
    };

    const handlePart1Complete = (answers) => {
        setPart1Answers(answers);
        setStage('break');
    };

    const handleBreakComplete = () => {
        setStage('part2');
    };

    const handlePart2Complete = async (answers) => {
        setPart2Answers(answers);
        
        // Calculate total score
        const allAnswers = { ...part1Answers, ...answers };
        const allQuestions = [...part1Questions, ...part2Questions];
        
        let totalScore = 0;
        allQuestions.forEach(q => {
            const userAnswer = allAnswers[q.id];
            if (userAnswer === q.correct_answer) {
                totalScore++;
            }
        });

        // Update attempt as completed
        if (attemptId) {
            try {
                await base44.entities.ExamAttempt.update(attemptId, {
                    answers: allAnswers,
                    score: totalScore,
                    completed: true,
                    time_taken_minutes: 315 // 5 hours 15 minutes total (SRA standard)
                });
            } catch (e) {
                console.error('Failed to update attempt:', e);
            }
        }

        setStage('results');
    };

    const handleRestart = () => {
        setStage('setup');
        setPart1Questions([]);
        setPart2Questions([]);
        setPart1Answers({});
        setPart2Answers({});
        setAttemptId(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
                <Card className="max-w-md text-center p-8 border-none shadow-xl">
                    <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Login Required</h1>
                    <p className="text-slate-600">Please log in to access the Exam Day Simulator.</p>
                </Card>
            </div>
        );
    }

    // Setup Screen
    if (stage === 'setup') {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10 flex items-center justify-center">
                <div className="max-w-3xl w-full">
                    <Card className="border-none shadow-2xl">
                        <CardHeader className="text-center pb-6 bg-linear-to-r from-slate-800 to-slate-700 text-white rounded-t-xl">
                            <div className="flex justify-center mb-4">
                                <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Shield className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl font-bold mb-2">Exam Day Simulator</CardTitle>
                            <p className="text-slate-200 text-lg">Experience authentic SQE exam conditions with full-length practice</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <Alert className="border-blue-200 bg-blue-50">
                                <AlertTriangle className="h-5 w-5 text-blue-600" />
                                <AlertTitle className="text-blue-900">Official SQE Exam Format</AlertTitle>
                                <AlertDescription className="text-blue-800">
                                    This simulator replicates the actual SQE exam format exactly: <strong>180 MCQ questions</strong> split into two 90-question sessions with a mandatory break. Total time: <strong>5 hours 15 minutes</strong> (2h 37.5min per session) - matching official SRA standards.
                                </AlertDescription>
                            </Alert>

                            <div>
                                <Label className="text-lg font-semibold mb-3 block">Select Your Exam</Label>
                                <Select value={selectedExam} onValueChange={setSelectedExam}>
                                    <SelectTrigger className="h-14 text-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FLK 1">FLK 1 (180 Questions - Official Format)</SelectItem>
                                        <SelectItem value="FLK 2">FLK 2 (180 Questions - Official Format)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-6 space-y-3">
                                <h3 className="font-bold text-slate-900 text-lg mb-4">Official SRA Exam Format:</h3>
                                <div className="space-y-2 text-slate-700">
                                    <p className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span><strong>Session 1:</strong> 90 questions in 2 hours 37.5 minutes (157.5 mins)</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span><strong>Mandatory Break:</strong> Short break between sessions (just like the real exam)</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span><strong>Session 2:</strong> 90 questions in 2 hours 37.5 minutes (157.5 mins)</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span><strong>Total:</strong> 180 questions, 5 hours 15 minutes (315 minutes total)</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span>Flag questions for review and navigate freely within each session</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span>Built-in calculator for Solicitors Accounts questions</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span>Detailed performance breakdown with Angoff scoring after completion</span>
                                    </p>
                                </div>
                            </div>

                            <Alert className="border-amber-200 bg-amber-50">
                                <Coffee className="h-5 w-5 text-amber-600" />
                                <AlertTitle className="text-amber-900">Cost: 1 Simulator Credit</AlertTitle>
                                <AlertDescription className="text-amber-800">
                                    {user.role === 'admin' ? (
                                        <span>As an admin, you have unlimited access.</span>
                                    ) : (
                                        <span>You currently have <strong>{user.simulation_credits || 0} credits</strong>. {user.simulation_credits < 1 && <Link href={createPageUrl("Packages")} className="underline font-semibold">Purchase more credits</Link>}</span>
                                    )}
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-4">
                                <Button
                                    onClick={startSimulator}
                                    disabled={startingSimulator || (user.simulation_credits < 1 && user.role !== 'admin')}
                                    className="flex-1 h-16 text-xl bg-slate-900 hover:bg-slate-800"
                                >
                                    {startingSimulator ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                            Preparing Your Exam...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-6 h-6 mr-3" />
                                            Start Official Format Simulator
                                        </>
                                    )}
                                </Button>
                                <Button asChild variant="outline" className="h-16">
                                    <Link href={createPageUrl("Dashboard")}>Cancel</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Part 1
    if (stage === 'part1') {
        return (
            <SimulatorPart
                partNumber={1}
                questions={part1Questions}
                initialAnswers={part1Answers}
                timeLimit={157.5}
                onComplete={handlePart1Complete}
                examTitle={`${selectedExam} - Session 1`}
            />
        );
    }

    // Break Screen
    if (stage === 'break') {
        return <BreakScreen onContinue={handleBreakComplete} />;
    }

    // Part 2
    if (stage === 'part2') {
        return (
            <SimulatorPart
                partNumber={2}
                questions={part2Questions}
                initialAnswers={part2Answers}
                timeLimit={157.5}
                onComplete={handlePart2Complete}
                examTitle={`${selectedExam} - Session 2`}
            />
        );
    }

    // Results
    if (stage === 'results') {
        return (
            <SimulatorResults
                part1Questions={part1Questions}
                part2Questions={part2Questions}
                part1Answers={part1Answers}
                part2Answers={part2Answers}
                onRestart={handleRestart}
                examTitle={selectedExam}
            />
        );
    }

    return null;
}