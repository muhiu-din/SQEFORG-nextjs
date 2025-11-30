"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Circle, AlertTriangle, Loader2, Lock, Sparkles, Target, BookText, FileText, Layers, Zap, Save, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadProgress, saveCheckpoint, loadCheckpoint, clearProgress } from '@/components/ProgressSaver';

const CREDIT_LIMIT = 10000;
const SAFETY_BUFFER = 1000; // Reserve 1000 credits for emergencies

const LAUNCH_TASKS = [
  {
    id: 'categorization',
    title: 'Fix Question Categorization',
    description: 'Run Keyword Auto-Categorizer + Subject Review Tool on existing questions',
    credits: 0,
    priority: 1,
    icon: Target,
    actions: [
      { label: 'Keyword Categorizer', url: 'KeywordCategorizer' },
      { label: 'Subject Review Tool', url: 'SubjectReviewTool' }
    ],
    instructions: '1. Run Keyword Categorizer first\n2. Then run Subject Review Tool\n3. Verify all questions have correct subjects',
    tier: 'all'
  },
  {
    id: 'mcq-questions',
    title: 'Hard Scenario-Based MCQs (Equal Per Subject)',
    description: '3,492 total questions - equal distribution across all 16 subjects',
    credits: 350,
    priority: 2,
    icon: FileText,
    details: {
      starter: '496 questions (31 per subject × 16) = ~50 credits',
      pro: '1,008 additional (63 per subject × 16) = ~100 credits',
      ultimate: '1,504 additional (94 per subject × 16) = ~150 credits'
    },
    actions: [
      { label: 'AI Generator (Bulk)', url: 'AIGenerator' }
    ],
    instructions: '⚖️ EQUAL DISTRIBUTION:\n• Starter: 31 × 16 subjects = 496 questions\n• Pro: +63 × 16 subjects = +1,008 questions\n• Ultimate: +94 × 16 subjects = +1,504 questions\n\nTotal: 3,008 questions, ~350 credits\nEVERY subject gets equal amounts!',
    tier: 'all'
  },
  {
    id: 'mock-exams',
    title: 'Mock Exams (Equal FLK Split)',
    description: '30 total hard mocks - equally split between FLK 1 and FLK 2',
    credits: 30,
    priority: 3,
    icon: FileText,
    details: {
      starter: '4 mocks (2 FLK1 + 2 FLK2) = ~4 credits',
      pro: '15 mocks (8 FLK1 + 7 FLK2) = ~15 credits',
      ultimate: 'Unlimited mocks = ~11 credits for initial 11'
    },
    actions: [
      { label: 'Bulk Mock Generator', url: 'BulkMockGenerator' }
    ],
    instructions: '⚖️ EQUAL FLK DISTRIBUTION:\n• Starter: 2 FLK1 + 2 FLK2 = 4 mocks (360 questions)\n• Pro: +6 FLK1 + +5 FLK2 = 11 more mocks\n• Ultimate: Unlimited (generate 15+ more)\n\nEach mock = 90 hard questions, ~1 credit\nFair split between both FLKs!',
    tier: 'all'
  },
  {
    id: 'flash-cards',
    title: 'Flash Cards (Equal Per Subject)',
    description: '3,488 flash cards - equal amounts across all 16 subjects',
    credits: 350,
    priority: 4,
    icon: Layers,
    details: {
      starter: '496 cards (31 per subject × 16) = ~50 credits',
      pro: '1,488 cards (93 per subject × 16) = ~150 credits',
      ultimate: '1,504 cards (94 per subject × 16) = ~150 credits'
    },
    actions: [
      { label: 'Flash Card Generator (Bulk)', url: 'AdminFlashCardGenerator' }
    ],
    instructions: '⚖️ EQUAL DISTRIBUTION:\n• Starter: 31 cards × 16 subjects = 496 total\n• Pro: 93 cards × 16 subjects = 1,488 total\n• Ultimate: 94 cards × 16 subjects = 1,504 total\n\nUse Bulk Mode for automatic equal generation!\nEVERY subject gets same amount = completely fair',
    tier: 'pro'
  },
  {
    id: 'revision-books',
    title: 'Revision Books (One Per Subject)',
    description: '16 revision books - one for each subject (Ultimate tier only)',
    credits: 16,
    priority: 5,
    icon: BookText,
    details: {
      starter: 'Basic study notes (all subjects available)',
      pro: 'Basic study notes (all subjects available)',
      ultimate: '16 full revision books (1 per subject) = ~16 credits'
    },
    actions: [
      { label: 'Batch Book Generator', url: 'BatchRevisionBookGenerator' }
    ],
    instructions: '⚖️ ONE BOOK PER SUBJECT:\nGenerate 16 books (one for each subject):\nContract, Tort, Criminal, Property, Land, Wills, Trusts, Business, Dispute, Criminal Practice, Accounts, Ethics, Constitution, EU, Legal System, Legal Services\n\n~1 credit per book = 16 total\nEVERY subject gets ONE comprehensive book!',
    tier: 'ultimate'
  }
];

export default function LaunchChecklist() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiCreditsUsed, setAiCreditsUsed] = useState(0);
  const [taskStatus, setTaskStatus] = useState({});
  const [counts, setCounts] = useState({
    questions: 0,
    mocks: 0,
    flashCards: 0,
    revisionBooks: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Get AI credits used (only count negative/deducted credits)
        const logs = await base44.entities.AICreditLog.list();
        const totalUsed = logs.reduce((sum, log) => {
          const credits = log.credits_added || 0;
          // Only count negative values (credits used), ignore positive (credits added)
          return credits < 0 ? sum + Math.abs(credits) : sum;
        }, 0);
        setAiCreditsUsed(totalUsed);

        // Get content counts
        const [questions, mocks, flashCards, books] = await Promise.all([
          base44.entities.Question.list(),
          base44.entities.MockExam.list(),
          base44.entities.FlashCard.list(),
          base44.entities.RevisionBook.list()
        ]);

        setCounts({
          questions: questions.length,
          mocks: mocks.length,
          flashCards: flashCards.length,
          revisionBooks: books.length
        });

      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleTask = (taskId) => {
    setTaskStatus(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center p-6">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Admin Only</h1>
          <p className="text-slate-600">Launch checklist requires admin access.</p>
        </Card>
      </div>
    );
  }

  const completedTasks = Object.values(taskStatus).filter(Boolean).length;
  const totalTasks = LAUNCH_TASKS.length;
  const progressPercent = (completedTasks / totalTasks) * 100;

  const totalEstimatedCredits = LAUNCH_TASKS.reduce((sum, task) => sum + task.credits, 0);
  const creditsRemaining = CREDIT_LIMIT - aiCreditsUsed;
  const safeCreditsRemaining = creditsRemaining - SAFETY_BUFFER;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 text-center mb-2">Launch Checklist</h1>
          <p className="text-slate-600 text-center">Complete these steps to build the best SQE prep platform</p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6 border-2 border-blue-200 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Launch Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold">Tasks Completed</span>
                <span>{completedTasks} / {totalTasks}</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">AI Credits Used</p>
                <p className="text-2xl font-bold text-slate-900">{aiCreditsUsed}</p>
                <p className="text-xs text-slate-500">of {CREDIT_LIMIT}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Est. Total Needed</p>
                <p className="text-2xl font-bold text-blue-900">{totalEstimatedCredits}</p>
                <p className="text-xs text-blue-700">for full launch</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 mb-1">Credits Remaining</p>
                <p className="text-2xl font-bold text-green-900">{creditsRemaining}</p>
                <p className="text-xs text-green-700">available</p>
              </div>
            </div>

            {safeCreditsRemaining < totalEstimatedCredits && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Insufficient Safe Credits</AlertTitle>
                <AlertDescription>
                  You need {totalEstimatedCredits - safeCreditsRemaining} more credits to complete all tasks safely (keeping {SAFETY_BUFFER} buffer).
                  Current safe budget: {safeCreditsRemaining.toLocaleString()} credits. Consider prioritizing essential content first.
                </AlertDescription>
              </Alert>
            )}
            
            <Alert className="bg-blue-50 border-blue-200 mt-4">
              <Save className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>💾 Progress Protection:</strong> All generation progress is auto-saved. Safe to close browser anytime - resume exactly where you left off.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Current Content Stats */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Current Content Library</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">{counts.questions}</p>
                <p className="text-xs text-purple-700">Questions</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{counts.mocks}</p>
                <p className="text-xs text-blue-700">Mock Exams</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <Layers className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-900">{counts.flashCards}</p>
                <p className="text-xs text-amber-700">Flash Cards</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BookText className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{counts.revisionBooks}</p>
                <p className="text-xs text-green-700">Revision Books</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Tabs */}
        <Tabs defaultValue="task-0" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            {LAUNCH_TASKS.map((task, idx) => {
              const isComplete = taskStatus[task.id];
              return (
                <TabsTrigger key={task.id} value={`task-${idx}`} className="relative">
                  {isComplete && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 absolute -top-1 -right-1" />
                  )}
                  Step {idx + 1}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {LAUNCH_TASKS.map((task, idx) => {
            const Icon = task.icon;
            const isComplete = taskStatus[task.id];
            const canAfford = creditsRemaining >= task.credits;

            return (
              <TabsContent key={task.id} value={`task-${idx}`}>
                <Card className={`shadow-lg ${isComplete ? 'border-2 border-green-500 bg-green-50/30' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="shrink-0 mt-1"
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        ) : (
                          <Circle className="w-8 h-8 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <Icon className="w-6 h-6 text-slate-600" />
                            <div>
                              <CardTitle className="text-2xl">{task.title}</CardTitle>
                              <p className="text-sm text-slate-500 mt-1">Step {idx + 1} of {LAUNCH_TASKS.length}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-base px-3 py-1">Priority {task.priority}</Badge>
                            {task.credits > 0 && (
                              <Badge className={`text-base px-3 py-1 ${canAfford ? 'bg-green-600' : 'bg-red-600'}`}>
                                {task.credits} credits
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-base text-slate-700 mb-4">{task.description}</p>

                        {task.instructions && (
                          <Alert className="mb-4 bg-blue-50 border-blue-200">
                            <AlertDescription className="text-sm text-blue-900 whitespace-pre-line">
                              <strong>📋 Instructions:</strong>
                              {task.instructions}
                            </AlertDescription>
                          </Alert>
                        )}

                        {task.details && (
                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                              <p className="text-sm font-semibold text-blue-900 mb-2">Starter Tier</p>
                              <p className="text-sm text-blue-700">{task.details.starter}</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                              <p className="text-sm font-semibold text-purple-900 mb-2">Pro Tier</p>
                              <p className="text-sm text-purple-700">{task.details.pro}</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                              <p className="text-sm font-semibold text-amber-900 mb-2">Ultimate Tier</p>
                              <p className="text-sm text-amber-700">{task.details.ultimate}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          {task.actions.map((action, actionIdx) => (
                            <Link key={actionIdx} to={createPageUrl(action.url)}>
                              <Button className="gap-2 bg-slate-900 hover:bg-slate-800 h-12 px-6">
                                <Zap className="w-5 h-5" />
                                {action.label}
                              </Button>
                            </Link>
                          ))}
                          <Button
                            onClick={() => toggleTask(task.id)}
                            variant={isComplete ? "outline" : "default"}
                            className={`h-12 px-6 ${isComplete ? '' : 'bg-green-600 hover:bg-green-700'}`}
                          >
                            {isComplete ? 'Mark Incomplete' : 'Mark Complete'}
                          </Button>
                        </div>

                        {!canAfford && task.credits > 0 && (
                          <Alert className="mt-4" variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Insufficient credits remaining ({creditsRemaining} available)
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Final Summary */}
        {completedTasks === totalTasks && (
          <Card className="mt-8 border-2 border-green-500 bg-linear-to-br from-green-50 to-emerald-50 shadow-2xl">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-green-900 mb-2">Launch Ready! 🚀</h2>
              <p className="text-green-800 mb-4">
                All tasks complete. Your platform is ready for students.
              </p>
              <div className="flex justify-center gap-3">
                <Link to={createPageUrl("Dashboard")}>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link to={createPageUrl("QuestionBank")}>
                  <Button variant="outline">
                    View Question Bank
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}