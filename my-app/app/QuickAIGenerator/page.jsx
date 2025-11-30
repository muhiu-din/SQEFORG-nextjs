"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, CheckCircle2, Lock, AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ALL_SUBJECTS = [
  "Contract Law", "Tort Law", "Criminal Law", "Property Practice", "Land Law",
  "Business Law & Practice", "Dispute Resolution", "Wills & Administration of Estates",
  "Trusts", "Criminal Practice", "Solicitors Accounts", "Constitutional & Administrative Law",
  "EU Law", "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const CREDIT_LIMIT = 10000;

const questionSchema = {
  type: "object",
  properties: {
    question_text: { type: "string" },
    option_a: { type: "string" },
    option_b: { type: "string" },
    option_c: { type: "string" },
    option_d: { type: "string" },
    option_e: { type: "string" },
    correct_answer: { type: "string", enum: ["A", "B", "C", "D", "E"] },
    explanation: { type: "string" },
    angoff_score: { type: "number" }
  },
  required: ["question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation"]
};

export default function QuickAIGenerator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [subject, setSubject] = useState("Contract Law");
  const [numQuestions, setNumQuestions] = useState(1);
  const [generated, setGenerated] = useState([]);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [aiCreditsUsed, setAiCreditsUsed] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = {name: "Admin User", email: "admin@example.com", role: "admin"}; // Mock admin user
        setUser(currentUser);
        
        // Get AI credits used
        try {
          const logs = await base44.entities.AICreditLog.list();
          const totalUsed = logs.reduce((sum, log) => sum + (log.credits_added || 0), 0);
          setAiCreditsUsed(Math.abs(totalUsed));
        } catch (e) {
          setAiCreditsUsed(0);
        }
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const generateQuestions = async () => {
    // Safety check
    if (aiCreditsUsed + numQuestions > CREDIT_LIMIT) {
      setError(`Cannot generate ${numQuestions} questions. Would exceed ${CREDIT_LIMIT} credit limit. Current usage: ${aiCreditsUsed}.`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerated([]);
    setProgress(0);

    try {
      for (let i = 0; i < numQuestions; i++) {
        setProgress(Math.round(((i + 1) / numQuestions) * 100));

        const prompt = `Generate ONE high-quality HARD difficulty SQE1 multiple-choice question for ${subject}.

REQUIREMENTS:
- Create a realistic 2-3 paragraph legal scenario
- Test black letter law application to facts
- All 5 options must be plausible
- Provide detailed explanation with case/statute references
- Angoff score between 0.3-0.5 for hard difficulty

Subject: ${subject}
Difficulty: Hard
Question ${i + 1} of ${numQuestions}`;

        const response = await base44.integrations.Core.InvokeLLM({ 
          prompt, 
          response_json_schema: questionSchema 
        });

        const questionData = {
          subject,
          difficulty: 'hard',
          question_text: response.question_text,
          option_a: response.option_a,
          option_b: response.option_b,
          option_c: response.option_c,
          option_d: response.option_d,
          option_e: response.option_e,
          correct_answer: response.correct_answer,
          explanation: response.explanation,
          angoff_score: response.angoff_score || 0.4
        };

        const created = await base44.entities.Question.create(questionData);
        setGenerated(prev => [...prev, created]);
        
        // Log credit usage
        await base44.entities.AICreditLog.create({
          user_email: user.email,
          credits_added: -1,
          granted_by_admin_email: user.email,
          reason: `Generated 1 hard question for ${subject}`
        });
        
        setAiCreditsUsed(prev => prev + 1);
      }
    } catch (err) {
      setError(`Generation failed: ${err.message}`);
    }

    setIsGenerating(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center p-6">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Admin Only</h1>
          <p className="text-slate-600">This tool requires admin access.</p>
        </Card>
      </div>
    );
  }

  const creditsRemaining = CREDIT_LIMIT - aiCreditsUsed;
  const canGenerate = creditsRemaining >= numQuestions;

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-linear-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Quick AI Generator</h1>
          <p className="text-sm text-slate-600">Mobile-friendly • Start with 1 question</p>
        </div>

        {/* Credit Usage Alert */}
        <Alert className={`mb-6 ${creditsRemaining < 100 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">AI Credits: {aiCreditsUsed} / {CREDIT_LIMIT} used</AlertTitle>
          <AlertDescription>
            {creditsRemaining} credits remaining. Each question = 1 credit.
          </AlertDescription>
        </Alert>

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Generate Hard Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Subject</label>
              <Select value={subject} onValueChange={setSubject} disabled={isGenerating}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {ALL_SUBJECTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Number of Questions</label>
              <Select 
                value={numQuestions.toString()} 
                onValueChange={v => setNumQuestions(parseInt(v))} 
                disabled={isGenerating}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 question (1 credit)</SelectItem>
                  <SelectItem value="5">5 questions (5 credits)</SelectItem>
                  <SelectItem value="10">10 questions (10 credits)</SelectItem>
                  <SelectItem value="20">20 questions (20 credits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-slate-600">
                  Generating {generated.length + 1} of {numQuestions}...
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={generateQuestions}
              disabled={isGenerating || !canGenerate}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-base"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generate {numQuestions} Question{numQuestions > 1 ? 's' : ''}
                </>
              )}
            </Button>
            
            {!canGenerate && (
              <p className="text-sm text-red-600 text-center">
                Not enough credits remaining ({creditsRemaining} left)
              </p>
            )}
          </CardContent>
        </Card>

        {generated.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Generated ({generated.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generated.map((q, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-lg space-y-3 text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-slate-900 flex-1">{q.question_text}</p>
                    <Badge>{q.subject}</Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <p className={q.correct_answer === 'A' ? 'text-green-700 font-semibold' : ''}>
                      A: {q.option_a}
                    </p>
                    <p className={q.correct_answer === 'B' ? 'text-green-700 font-semibold' : ''}>
                      B: {q.option_b}
                    </p>
                    <p className={q.correct_answer === 'C' ? 'text-green-700 font-semibold' : ''}>
                      C: {q.option_c}
                    </p>
                    <p className={q.correct_answer === 'D' ? 'text-green-700 font-semibold' : ''}>
                      D: {q.option_d}
                    </p>
                    <p className={q.correct_answer === 'E' ? 'text-green-700 font-semibold' : ''}>
                      E: {q.option_e}
                    </p>
                  </div>

                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs text-green-900">
                      <strong>Correct: {q.correct_answer}</strong>
                      <p className="mt-1">{q.explanation}</p>
                    </AlertDescription>
                  </Alert>
                </div>
              ))}

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  Questions saved! Students can now practice them in the Question Bank.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}