
import React, { useState, useEffect, useMemo } from "react";
import { Question, User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen } from "lucide-react";
import _ from 'lodash';

// Define ALL_SUBJECTS constant as per the outline
const ALL_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct", "Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];

export default function QuickPracticeDialog() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    // allQuestions is no longer needed here as we don't pre-fetch all questions for filtering
    // const [allQuestions, setAllQuestions] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null); // Add user state

    const [subject, setSubject] = useState("");
    const [difficulty, setDifficulty] = useState("all");
    const [numQuestions, setNumQuestions] = useState(10);
    
    // Subjects are now derived from the static list, not the fetched questions
    const subjects = ALL_SUBJECTS.sort();

    useEffect(() => {
        // This effect now only fetches the user, not all questions.
        const fetchUser = async () => {
            if (open) {
                setLoading(true);
                try {
                    const currentUser = await User.me();
                    setUser(currentUser);
                } catch (err) {
                    console.error("Failed to load user for dialog:", err);
                    setUser(null); // Clear user state
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUser();
    }, [open]);

    // The availableQuestions and maxQuestions derived states are no longer needed
    // as we are not pre-filtering questions within this component.
    // const availableQuestions = useMemo(() => allQuestions.filter(q => 
    //     (subject ? q.subject === subject : true) &&
    //     (difficulty !== 'all' ? q.difficulty === difficulty : true)
    // ), [allQuestions, subject, difficulty]);
    // const maxQuestions = availableQuestions.length;

    // This useEffect to reset numQuestions based on availableQuestions is no longer needed
    // useEffect(() => {
    //     if (subject) {
    //         setNumQuestions(Math.min(10, maxQuestions > 0 ? maxQuestions : 1));
    //     } else {
    //         setNumQuestions(0);
    //     }
    // }, [subject, difficulty, maxQuestions]);

    const handleStart = () => {
        // We now check if numQuestions is greater than 0, as we don't have a local maxQuestions.
        if (!subject || numQuestions <= 0) return; 
        const url = createPageUrl(`QuestionBank?startSession=true&subject=${encodeURIComponent(subject)}&numQuestions=${numQuestions}&difficulty=${difficulty}&feedbackMode=instant`);
        navigate(url);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200 cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Practice Questions</h3>
                    <p className="text-sm text-slate-600">Start a quick practice session</p>
                  </div>
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Quick Practice Session</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="py-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="subject-select">Subject</Label>
                            <Select value={subject} onValueChange={setSubject}>
                                <SelectTrigger id="subject-select"><SelectValue placeholder="Select a subject..." /></SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="difficulty-select">Difficulty</Label>
                                <Select value={difficulty} onValueChange={setDifficulty} disabled={!subject}>
                                    <SelectTrigger id="difficulty-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="num-questions-input">No. of Questions</Label>
                                <Input 
                                    id="num-questions-input"
                                    type="number" 
                                    value={numQuestions}
                                    onChange={e => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    max="100" // A reasonable upper limit for a "quick" session
                                    disabled={!subject}
                                />
                            </div>
                        </div>
                        {/* The warning message for 0 questions available is removed as we don't pre-filter */}
                        {/* {subject && maxQuestions === 0 && <p className="text-sm text-red-500">No questions available for this selection.</p>} */}
                        <Button onClick={handleStart} className="w-full" disabled={!subject || numQuestions <= 0}>Start Session</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
