"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Question, DailyChallengeCompletion, User } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Trophy, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { processDailyChallengeRewards } from './GamificationHelper';

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];
const ALL_SUBJECTS = [...FLK1_SUBJECTS, ...FLK2_SUBJECTS];
const DAILY_CHALLENGE_QS = 5;

const getTodaysSubject = () => {
    const dayOfWeek = new Date().getDay(); // Sunday = 0, Monday = 1, etc.
    return ALL_SUBJECTS[dayOfWeek % ALL_SUBJECTS.length];
};

const ChallengeSession = ({ questions, onFinish }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [feedback, setFeedback] = useState(null);
    const currentQuestion = questions[currentIndex];

    const handleAnswer = (answer) => {
        if (feedback) return;
        setAnswers(prev => ({...prev, [currentQuestion.id]: answer}));
        setFeedback({
            isCorrect: answer === currentQuestion.correct_answer,
            correctAnswer: currentQuestion.correct_answer,
        });
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setFeedback(null);
        } else {
            let score = 0;
            questions.forEach(q => {
                if (answers[q.id] === q.correct_answer) {
                    score++;
                }
            });
            onFinish(score);
        }
    };

    return (
        <div className="p-1">
             <p className="text-center text-sm text-slate-500 mb-4">Question {currentIndex + 1} of {questions.length}</p>
             <h3 className="text-lg font-semibold mb-6 text-center">{currentQuestion.question_text}</h3>
             <div className="space-y-3 mb-6">
                {['A', 'B', 'C', 'D', 'E'].map(opt => {
                    const optText = currentQuestion[`option_${opt.toLowerCase()}`];
                    let feedbackClass = "border-slate-200 hover:border-slate-400";
                    if (feedback) {
                        if (feedback.correctAnswer === opt) feedbackClass = "bg-green-100 border-green-500";
                        else if (answers[currentQuestion.id] === opt) feedbackClass = "bg-red-100 border-red-500";
                        else feedbackClass = "border-slate-200 opacity-60";
                    }
                    return (
                        <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${feedbackClass}`}>
                            <span className="font-bold mr-2">{opt}.</span>{optText}
                        </button>
                    )
                })}
             </div>
             {feedback && (
                <div className="p-4 bg-amber-50 rounded-lg mb-6">
                    <h4 className="font-bold">Explanation</h4>
                    <p className="text-sm text-slate-700">{currentQuestion.explanation}</p>
                </div>
             )}
             <Button onClick={handleNext} disabled={!feedback} className="w-full h-12">
                {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
             </Button>
        </div>
    );
};

export default function DailyChallenge() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [todaysCompletion, setTodaysCompletion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [sessionState, setSessionState] = useState('start'); // 'start', 'playing', 'finished'
    const [finalScore, setFinalScore] = useState(0);

    const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
    const todaysSubject = useMemo(() => getTodaysSubject(), []);

    useEffect(() => {
        const checkUserAndCompletion = async () => {
            setLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                const completions = await DailyChallengeCompletion.filter({
                    created_by: currentUser.email,
                    challenge_date: todayStr
                });
                if (completions.length > 0) {
                    setTodaysCompletion(completions[0]);
                }
            } catch (e) {
                setUser(null); // Not logged in
            }
            setLoading(false);
        };
        checkUserAndCompletion();
    }, [todayStr]);

    const handleStart = async () => {
        setLoading(true);
        const fetchedQuestions = await Question.filter({ subject: todaysSubject }, "-created_date", DAILY_CHALLENGE_QS);
        setQuestions(fetchedQuestions);
        setSessionState('playing');
        setLoading(false);
    };

    const handleFinish = async (score) => {
        setFinalScore(score);
        if (user) {
            const newCompletion = await DailyChallengeCompletion.create({
                challenge_date: todayStr,
                score: score,
                total_questions: questions.length
            });
            setTodaysCompletion(newCompletion);
            
            // Award gamification points
            await processDailyChallengeRewards(score, questions.length);
        }
        setSessionState('finished');
    };
    
    const resetChallenge = () => {
        setSessionState('start');
        setFinalScore(0);
        setIsOpen(false);
    }

    if (loading && !todaysCompletion) {
        return (
             <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                 <div>
                    <h3 className="font-semibold text-slate-900">Daily Challenge</h3>
                    <p className="text-sm text-slate-600">Loading today's challenge...</p>
                </div>
            </div>
        );
    }
    
    if (todaysCompletion) {
        return (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border border-green-200">
                <Trophy className="w-12 h-12 text-amber-500"/>
                <div>
                    <h3 className="font-semibold text-green-900">Challenge Complete!</h3>
                    <p className="text-sm text-green-700">You scored {todaysCompletion.score}/{todaysCompletion.total_questions}. Come back tomorrow!</p>
                </div>
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200 cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Daily Challenge</h3>
                    <p className="text-sm text-slate-600">A quick set of questions to keep you sharp.</p>
                  </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Daily Challenge: {todaysSubject}</DialogTitle>
                </DialogHeader>
                {sessionState === 'start' && (
                    <div className="text-center p-8">
                        <h3 className="text-xl font-bold mb-4">Ready to test your knowledge?</h3>
                        <p className="text-slate-600 mb-8">You'll face {DAILY_CHALLENGE_QS} questions on today's topic: <span className="font-semibold">{todaysSubject}</span>.</p>
                        <Button onClick={handleStart} disabled={loading || !user} className="h-12 px-8 text-lg">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Start Challenge"}
                        </Button>
                        {!user && <p className="text-xs text-red-500 mt-4">Please log in to participate in daily challenges.</p>}
                    </div>
                )}
                {sessionState === 'playing' && <ChallengeSession questions={questions} onFinish={handleFinish} />}
                {sessionState === 'finished' && (
                     <div className="text-center p-8">
                        <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-6"/>
                        <h3 className="text-2xl font-bold mb-2">Challenge Complete!</h3>
                        <p className="text-5xl font-bold mb-4">{finalScore}/{questions.length}</p>
                        <p className="text-slate-600 mb-8">Great job! Consistency is key. Come back tomorrow for a new challenge.</p>
                        <Button onClick={resetChallenge} className="w-full">Close</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
