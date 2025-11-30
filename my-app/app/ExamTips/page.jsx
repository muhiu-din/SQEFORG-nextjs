
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Calendar, Brain, Heart, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const tipsData = [
  {
    title: "Before the Exam",
    icon: Calendar,
    color: "text-blue-500",
    content: `
*   **Create a Realistic Plan:** Don't just list topics; schedule specific, timed study blocks. A 4-month plan is great, but break it down week-by-week.
*   **Active Recall is King:** Instead of just re-reading notes, force your brain to retrieve information. Use flashcards (even digital ones) or try to explain a concept out loud without looking at your notes.
*   **Practice, Practice, Practice:** Do as many multiple-choice questions as you can under timed conditions. This builds mental stamina and familiarity with the question style.
    `
  },
  {
    title: "The Week Before",
    icon: BookOpen,
    color: "text-purple-500",
    content: `
*   **Taper Your Studies:** The day before the exam is for light review, not cramming. Trust the work you've put in.
*   **Logistics Check:** Know exactly where your exam center is. Plan your route and travel time. Prepare your ID and any other required items the night before.
*   **Fuel Your Brain:** Eat well and hydrate. Your brain is an organ and needs fuel to perform at its peak. Avoid heavy meals or excessive caffeine right before the exam.
    `
  },
  {
    title: "During the Exam",
    icon: Brain,
    color: "text-green-500",
    content: `
*   **Read the Full Question:** Read the question stem and all five options carefully before making a choice. The SQE is designed to test precision.
*   **Eliminate Wrong Answers:** Often, you can identify two or three obviously incorrect options. This significantly increases your odds even if you're unsure.
*   **Don't Get Stuck:** If a question is too difficult, make your best educated guess, flag it for review, and move on. Time management is critical. You can always come back if you have time at the end.
    `
  },
  {
    title: "Mindset & Wellbeing",
    icon: Heart,
    color: "text-red-500",
    content: `
*   **It's a Marathon, Not a Sprint:** You will have good days and bad days. Consistency over a long period is more important than a few heroic study sessions.
*   **Positive Self-Talk:** Replace "I can't do this" with "This is challenging, but I am capable." Your mindset has a real impact on performance.
*   **Schedule Downtime:** Protect your time off. Your brain needs breaks to consolidate information. Burnout is the enemy of effective revision.
    `
  }
];

export default function ExamTips() {
    return (
        <div className="p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                        <Lightbulb className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">SQE Exam Tips & Strategies</h1>
                    <p className="text-slate-600 text-lg">Fun and practical advice to help you excel on exam day.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {tipsData.map(tip => (
                        <Card key={tip.title} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <tip.icon className={`w-8 h-8 ${tip.color}`} />
                                <CardTitle className="text-xl font-bold text-slate-900">{tip.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none text-slate-700">
                                    <ReactMarkdown>{tip.content}</ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
