"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Trophy, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from "framer-motion";
import Watermark from '@/components/Watermark';
import _ from 'lodash';

export default function MasteredQuestions() {
  const [masteredQuestions, setMasteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        const correctAnswerLogs = await UserAnswerLog.filter({ created_by: currentUser.email, was_correct: true });
        const questionIds = [...new Set(correctAnswerLogs.map(log => log.question_id))];

        if (questionIds.length > 0) {
          const questions = await Question.filter({ id: { '$in': questionIds } });
          setMasteredQuestions(questions);
        } else {
          setMasteredQuestions([]);
        }
      } catch (error) {
        console.error("Failed to load mastered questions:", error);
        setMasteredQuestions([]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto relative">
        <Watermark user={user} />
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Mastered Questions</h1>
          <p className="text-slate-600">Questions you've answered correctly at least once.</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100 p-6">
            <CardTitle className="text-xl font-bold text-slate-900">
              Your Mastered Questions ({masteredQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <p>Loading...</p>
            ) : masteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">No mastered questions yet!</p>
                <p className="text-slate-500">Start practicing to build your mastered question bank.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {masteredQuestions.map((q) => (
                  <Card key={q.id} className="bg-green-50 border border-green-200">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-white">{q.subject}</Badge>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <CardTitle className="text-base font-normal text-slate-900">{q.question_text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {['A', 'B', 'C', 'D', 'E'].map(opt => (
                          <div
                            key={opt}
                            className={`flex items-start gap-2 p-2 rounded-md ${
                              q.correct_answer === opt ? 'bg-green-100 border border-green-300' : 'bg-white'
                            }`}
                          >
                            {q.correct_answer === opt && <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5"/>}
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
