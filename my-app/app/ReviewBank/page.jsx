"use client";
import React, { useState, useEffect } from 'react';
import { UserAnswerLog, Question, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldQuestion, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from "framer-motion";
import Watermark from '@/components/Watermark';

export default function ReviewBank() {
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);

            const wrongAnswerLogs = await UserAnswerLog.filter({ created_by: currentUser.email, was_correct: false });
            const questionIds = [...new Set(wrongAnswerLogs.map(log => log.question_id))];
            
            if (questionIds.length > 0) {
                const questions = await Question.filter({ id: { '$in': questionIds } });
                setWrongQuestions(questions);
            } else {
                setWrongQuestions([]);
            }
        } catch (error) {
            console.error("Failed to load wrong answers:", error);
            setWrongQuestions([]);
        }
        setLoading(false);
    };
    loadData();
  }, []);
  
  // difficultyColors has been removed as per the instructions.

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto relative">
        <Watermark user={user} />
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Review Bank</h1>
          <p className="text-slate-600">Master your weak areas by reviewing questions you've answered incorrectly.</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100 p-6">
            <CardTitle className="text-xl font-bold text-slate-900">Your Incorrect Answers ({wrongQuestions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <p>Loading your review bank...</p>
            ) : wrongQuestions.length === 0 ? (
              <div className="text-center py-12">
                <ShieldQuestion className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">Your review bank is empty!</p>
                <p className="text-slate-500">Answer some questions incorrectly to start building your personalized review list.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {wrongQuestions.map((q) => (
                  <Card key={q.id} className="bg-slate-50">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                         {/* Difficulty badge has been removed as per the instructions. */}
                         <Badge variant="outline">{q.subject}</Badge>
                      </div>
                      <CardTitle className="text-base font-normal">{q.question_text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {['A', 'B', 'C', 'D', 'E'].map(opt => (
                          <div key={opt} className={`flex items-start gap-2 p-2 rounded-md ${q.correct_answer === opt ? 'bg-green-100' : 'bg-red-50'}`}>
                            {q.correct_answer === opt ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5"/> : <XCircle className="w-4 h-4 text-red-600 mt-0.5"/>}
                            <span><strong>{opt}.</strong> {q[`option_${opt.toLowerCase()}`]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-bold mb-2">Explanation</h4>
                        <p className="text-sm text-slate-700">{q.explanation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
