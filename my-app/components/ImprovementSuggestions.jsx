import React from 'react';
import _ from 'lodash';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Lightbulb, BookOpen, CheckCircle2 } from 'lucide-react';

const ImprovementSuggestions = ({ attempt, questions, answers }) => {
    // Handle both cases: attempt object from ExamReview, or raw answers object from QuestionBank
    const userAnswers = attempt?.answers || answers || {};
    // Add extra safety check
    const safeQuestions = Array.isArray(questions) ? questions.filter(Boolean) : [];

    if (safeQuestions.length === 0) {
        return null;
    }

    // Filter incorrect answers - handle both answer structures
    const incorrectQuestions = safeQuestions.filter(q => {
        if (!q || !q.id) return false;
        
        const userAnswer = userAnswers[q.id];
        
        // Handle QuestionBank structure: {selected: X, correct: boolean}
        if (userAnswer && typeof userAnswer === 'object' && 'correct' in userAnswer) {
            return !userAnswer.correct;
        }
        
        // Handle ExamReview structure: direct answer value
        return userAnswer !== q.correct_answer;
    });

    if (incorrectQuestions.length === 0) {
        return (
            <Card className="border-none bg-green-50 text-green-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600"/>
                        Excellent Work!
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You answered all questions correctly in this session. Keep up the great work!</p>
                </CardContent>
            </Card>
        );
    }

    const weakSubjects = _.countBy(incorrectQuestions, 'subject');

    const sortedWeakSubjects = Object.entries(weakSubjects)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 3);

    if (sortedWeakSubjects.length === 0) {
        return null;
    }

    const suggestions = {
        "Property Practice": "Focus on the formalities of land contracts and the differences between registered and unregistered land.",
        "Wills & Administration of Estates": "Review the rules of intestacy and the requirements for a valid will.",
        "Solicitors Accounts": "Practice double-entry bookkeeping and understand the SRA Accounts Rules thoroughly.",
        "Land Law": "Create mind maps for concepts like easements, covenants, and leases.",
        "Trusts": "Drill down on the three certainties and the different types of trusts.",
        "Criminal Law": "Distinguish between the mens rea and actus reus for common offences like theft, burglary, and assault.",
        "Business Law & Practice": "Understand the different business mediums (sole trader, partnership, company) and director's duties.",
        "Dispute Resolution": "Memorize the Civil Procedure Rules (CPR) timeline and the pre-action protocols.",
        "Contract Law": "Focus on the elements of contract formation: offer, acceptance, consideration, and intention to create legal relations.",
        "Tort Law": "Practice negligence scenarios, ensuring you can apply the duty, breach, causation, and remoteness of damage framework.",
        "default": "Review your core notes for this topic and practice more MCQs to identify specific knowledge gaps."
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-amber-500" />
                    How to Improve
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                <p className="text-slate-600 mb-4">Based on your results, here are your weakest areas and some suggestions to improve:</p>
                <div className="space-y-4">
                    {sortedWeakSubjects.map(([subject, count]) => (
                        <div key={subject} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <h4 className="font-bold text-slate-800">{subject}</h4>
                            <p className="text-sm text-slate-500 mb-3">{count} incorrect answers in this area.</p>
                            <p className="text-slate-700 mb-4">{suggestions[subject] || suggestions.default}</p>
                            <Button asChild size="sm" variant="outline">
                                <Link to={createPageUrl(`QuestionBank?startSession=true&subject=${encodeURIComponent(subject)}&numQuestions=10&difficulty=All&feedbackMode=instant`)}>
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Practice This Subject
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ImprovementSuggestions;