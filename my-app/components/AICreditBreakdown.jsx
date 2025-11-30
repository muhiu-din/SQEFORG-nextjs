"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, Layers, FileText, Brain, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AICreditBreakdown() {
  const [loading, setLoading] = useState(true);
  const [creditData, setCreditData] = useState({
    totalLimit: 10000,
    totalUsed: 0,
    remaining: 10000,
    breakdown: {
      questions: 0,
      revisionBooks: 0,
      flashcards: 0,
      mocks: 0,
      other: 0
    }
  });

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    try {
      // Fetch all questions, revision books, flashcards to estimate credits used
      const questions = await base44.entities.Question.list().catch(() => []);
      const revisionBooks = await base44.entities.RevisionBook.list().catch(() => []);
      const flashcards = await base44.entities.FlashCard.list().catch(() => []);
      const mockExams = await base44.entities.MockExam.list().catch(() => []);

      // Calculate actual counts
      const questionCount = Array.isArray(questions) ? questions.length : 0;
      const revisionBookCount = Array.isArray(revisionBooks) ? revisionBooks.length : 0;
      const flashcardCount = Array.isArray(flashcards) ? flashcards.length : 0;
      const mockCount = Array.isArray(mockExams) ? mockExams.length : 0;

      // Credit estimates: 1 question = 0.1 credits, 1 in-depth revision book = 400 credits, 1 flashcard = 0.05 credits, 1 mock = 50 credits
      const questionCredits = questionCount * 0.1;
      const revisionBookCredits = revisionBookCount * 400;
      const flashcardCredits = flashcardCount * 0.05;
      const mockCredits = mockCount * 50; // Mocks cost credits for generation

      const totalUsed = Math.round(questionCredits + revisionBookCredits + flashcardCredits + mockCredits);
      const remaining = 10000 - totalUsed;

      console.log('Credit Calculation:', {
        questionCount,
        revisionBookCount,
        flashcardCount,
        mockCount,
        totalUsed,
        remaining
      });

      setCreditData({
        totalLimit: 10000,
        totalUsed,
        remaining: Math.max(0, remaining),
        breakdown: {
          questions: Math.round(questionCredits),
          revisionBooks: Math.round(revisionBookCredits),
          flashcards: Math.round(flashcardCredits),
          mocks: Math.round(mockCredits),
          other: 0
        }
      });
    } catch (error) {
      console.error('Failed to load credit data:', error);
    }
    setLoading(false);
  };

  const percentageUsed = (creditData.totalUsed / creditData.totalLimit) * 100;
  const isNearLimit = percentageUsed > 80;
  const isOverLimit = percentageUsed > 100;

  if (loading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-8 h-8 animate-spin mx-auto text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-none shadow-lg ${isOverLimit ? 'border-2 border-red-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Credit Usage
          </CardTitle>
          <Badge variant={isOverLimit ? 'destructive' : isNearLimit ? 'warning' : 'outline'}>
            {creditData.remaining} / {creditData.totalLimit} remaining
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isOverLimit && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong>Over Budget!</strong> You've exceeded your 10,000 credit limit. Consider purchasing more credits.
            </AlertDescription>
          </Alert>
        )}

        {isNearLimit && !isOverLimit && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>Nearly at limit:</strong> You've used {percentageUsed.toFixed(0)}% of your credits. Plan carefully for remaining content.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">Overall Usage</span>
              <span className="font-bold text-slate-900">
                {creditData.totalUsed.toLocaleString()} / {creditData.totalLimit.toLocaleString()} credits
              </span>
            </div>
            <Progress 
              value={Math.min(percentageUsed, 100)} 
              className={`h-3 ${isOverLimit ? 'bg-red-200' : isNearLimit ? 'bg-amber-200' : ''}`}
            />
            <p className="text-xs text-slate-500 mt-1">{percentageUsed.toFixed(1)}% used</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Credit Breakdown by Content Type</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-900">Questions</p>
                    <p className="text-xs text-slate-600">~0.1 credits per question</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {creditData.breakdown.questions.toLocaleString()} credits
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-slate-900">Revision Books (In-Depth)</p>
                    <p className="text-xs text-slate-600">~400 credits per book</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {creditData.breakdown.revisionBooks.toLocaleString()} credits
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-900">Flash Cards</p>
                    <p className="text-xs text-slate-600">~0.05 credits per card</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {creditData.breakdown.flashcards.toLocaleString()} credits
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-slate-900">Mock Exams</p>
                    <p className="text-xs text-slate-600">~50 credits per mock</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {creditData.breakdown.mocks.toLocaleString()} credits
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Budget Recommendations</h4>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• {creditData.remaining >= 6400 ? '✅' : '⚠️'} In-Depth Revision Books: Need ~6,400 credits for 16 books (400 each)</li>
                <li>• {creditData.remaining >= 2000 ? '✅' : '⚠️'} Hard Questions: Need ~2,000 credits for comprehensive library</li>
                <li>• {creditData.remaining >= 800 ? '✅' : '⚠️'} Flash Cards: Need ~800 credits for full collection</li>
                <li>• Keep 500-800 credits as buffer for regenerations/fixes</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}