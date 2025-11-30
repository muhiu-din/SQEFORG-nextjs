"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, TrendingUp, Loader2, CheckCircle2, XCircle, Lock, AlertCircle, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import _ from 'lodash';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution", "Property Practice", 
  "Land Law", "Wills & Administration of Estates", "Trusts", "Criminal Law", "Criminal Practice", 
  "Solicitors Accounts", "Constitutional & Administrative Law", "EU Law", 
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

export default function PersonalisedPractice() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState({
    weakAreas: [],
    missedTopics: [],
    underPracticed: []
  });
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        await analyzeStudyPattern(currentUser);
      } catch (e) {
        console.error('Failed to load user:', e);
        setUser(null);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const analyzeStudyPattern = async (currentUser) => {
    if (!currentUser) return;

    try {
      const answerLogs = await base44.entities.UserAnswerLog.filter({ created_by: currentUser.email }, '-created_date', 1000);
      
      if (answerLogs.length === 0) {
        setAnalysisComplete(true);
        return;
      }

      const uniqueQuestionIds = [...new Set(answerLogs.map(log => log.question_id))];
      
      let questions = [];
      if (uniqueQuestionIds.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < uniqueQuestionIds.length; i += batchSize) {
          const batch = uniqueQuestionIds.slice(i, i + batchSize);
          try {
            const batchQuestions = await base44.entities.Question.filter({ id: { '$in': batch } });
            questions.push(...batchQuestions);
          } catch (e) {
            console.error("Failed to fetch question batch:", e);
          }
        }
      }

      const questionMap = new Map(questions.map(q => [q.id, q]));
      const subjectAnalysis = {};

      // Analyze each subject
      for (const log of answerLogs) {
        const question = questionMap.get(log.question_id);
        if (!question || !question.subject) continue;

        if (!subjectAnalysis[question.subject]) {
          subjectAnalysis[question.subject] = { 
            correct: 0, 
            total: 0,
            lastPracticed: new Date(log.created_date)
          };
        }

        subjectAnalysis[question.subject].total++;
        if (log.was_correct) {
          subjectAnalysis[question.subject].correct++;
        }

        // Track most recent practice
        const logDate = new Date(log.created_date);
        if (logDate > subjectAnalysis[question.subject].lastPracticed) {
          subjectAnalysis[question.subject].lastPracticed = logDate;
        }
      }

      // 1. WEAK AREAS - Score below 65%
      const weakAreas = Object.entries(subjectAnalysis)
        .filter(([, stats]) => stats.total >= 5 && (stats.correct / stats.total) < 0.65)
        .map(([subject, stats]) => ({
          subject,
          accuracy: (stats.correct / stats.total) * 100,
          attempted: stats.total,
          lastPracticed: stats.lastPracticed,
          priority: 'HIGH'
        }))
        .sort((a, b) => a.accuracy - b.accuracy);

      // 2. MISSED TOPICS - Never practiced
      const practicedSubjects = new Set(Object.keys(subjectAnalysis));
      const missedTopics = ALL_SUBJECTS
        .filter(subject => !practicedSubjects.has(subject))
        .map(subject => ({
          subject,
          attempted: 0,
          priority: 'CRITICAL',
          reason: 'Never practiced'
        }));

      // 3. UNDER-PRACTICED - Less than 20 questions OR not practiced in 7+ days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const underPracticed = Object.entries(subjectAnalysis)
        .filter(([subject, stats]) => {
          const isLowVolume = stats.total < 20;
          const isStale = stats.lastPracticed < sevenDaysAgo;
          const isNotWeak = (stats.correct / stats.total) >= 0.65; // Don't duplicate weak areas
          return (isLowVolume || isStale) && isNotWeak;
        })
        .map(([subject, stats]) => {
          const daysSince = Math.floor((now - stats.lastPracticed) / (1000 * 60 * 60 * 24));
          const isLowVolume = stats.total < 20;
          
          return {
            subject,
            accuracy: (stats.correct / stats.total) * 100,
            attempted: stats.total,
            lastPracticed: stats.lastPracticed,
            daysSince,
            priority: isLowVolume ? 'MEDIUM' : 'LOW',
            reason: isLowVolume 
              ? `Only ${stats.total} questions attempted` 
              : `Not practiced in ${daysSince} days`
          };
        })
        .sort((a, b) => {
          // Sort by priority then by days since
          if (a.priority === 'MEDIUM' && b.priority === 'LOW') return -1;
          if (a.priority === 'LOW' && b.priority === 'MEDIUM') return 1;
          return b.daysSince - a.daysSince;
        });

      setRecommendations({
        weakAreas,
        missedTopics,
        underPracticed
      });
      setAnalysisComplete(true);
    } catch (error) {
      console.error('Failed to analyze study pattern:', error);
      setAnalysisComplete(true);
    }
  };

  const handleStartSession = (subject) => {
    const url = createPageUrl(`QuestionBank?startSession=true&subject=${encodeURIComponent(subject)}&numQuestions=30&difficulty=medium&feedbackMode=instant`);
   router.push(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8 border-none shadow-xl">
          <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pro Feature</h1>
          <p className="text-slate-600 mb-6">Personalised Practice is available for Pro and Ultimate subscribers.</p>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-900">
            <Link href={createPageUrl("Packages")}>Upgrade Plan</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const hasAccess = user.role === 'admin' || user.subscription_tier === 'pro' || user.subscription_tier === 'ultimate';

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8 border-none shadow-xl">
          <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pro Feature</h1>
          <p className="text-slate-600 mb-6">Personalised Practice is available for Pro and Ultimate subscribers.</p>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-900">
            <Link href={createPageUrl("Packages")}>Upgrade Plan</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const totalIssues = recommendations.weakAreas.length + recommendations.missedTopics.length + recommendations.underPracticed.length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Personalised Practice</h1>
          <p className="text-slate-600">Data-driven practice sessions focused on your weak areas, missed topics, and under-practiced subjects</p>
        </div>

        {!analysisComplete ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-16 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Analyzing your performance data...</p>
            </CardContent>
          </Card>
        ) : totalIssues === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-16 text-center">
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">No Areas Identified</h3>
              <p className="text-slate-600 mb-8">
                Great work! Either you haven't practiced enough yet for us to identify areas for improvement, or you're performing consistently well across all subjects.
              </p>
              <Button asChild>
                <Link href={createPageUrl("QuestionBank")}>Start Practicing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-8 border-none shadow-lg bg-linear-to-br from-amber-50 to-amber-100">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Your Personalised Study Plan</h3>
                    <p className="text-slate-700 mb-4">
                      Based on your practice history, we've identified {totalIssues} area{totalIssues > 1 ? 's' : ''} that need attention:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {recommendations.weakAreas.length > 0 && (
                        <Badge className="bg-red-600 text-white text-sm px-3 py-1">
                          {recommendations.weakAreas.length} Weak Area{recommendations.weakAreas.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {recommendations.missedTopics.length > 0 && (
                        <Badge className="bg-purple-600 text-white text-sm px-3 py-1">
                          {recommendations.missedTopics.length} Missed Topic{recommendations.missedTopics.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {recommendations.underPracticed.length > 0 && (
                        <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                          {recommendations.underPracticed.length} Under-Practiced
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="weak" className="mb-8">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="weak" className="relative">
                  Weak Areas
                  {recommendations.weakAreas.length > 0 && (
                    <Badge className="ml-2 bg-red-600 text-white">{recommendations.weakAreas.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="missed" className="relative">
                  Missed Topics
                  {recommendations.missedTopics.length > 0 && (
                    <Badge className="ml-2 bg-purple-600 text-white">{recommendations.missedTopics.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="underpracticed" className="relative">
                  Under-Practiced
                  {recommendations.underPracticed.length > 0 && (
                    <Badge className="ml-2 bg-blue-600 text-white">{recommendations.underPracticed.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="weak">
                {recommendations.weakAreas.length === 0 ? (
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-12 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No Weak Areas!</h3>
                      <p className="text-slate-600">You're scoring 65%+ in all practiced subjects. Great job!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-red-900 mb-1">Priority: HIGH</h4>
                            <p className="text-sm text-red-800">
                              These subjects are scoring below 65%. Focus here first to maximize improvement.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {recommendations.weakAreas.map((area, idx) => (
                      <Card key={area.subject} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-red-600 text-white">#{idx + 1}</Badge>
                                <h3 className="text-xl font-bold text-slate-900">{area.subject}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span>{area.attempted} questions attempted</span>
                                <span>•</span>
                                <span>Last practiced: {new Date(area.lastPracticed).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-red-600">{area.accuracy.toFixed(0)}%</p>
                              <Progress value={area.accuracy} className="w-24 h-2 mt-2" />
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleStartSession(area.subject)}
                            className="w-full bg-red-600 hover:bg-red-700"
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Practice This Subject (30 Questions)
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="missed">
                {recommendations.missedTopics.length === 0 ? (
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-12 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">All Topics Covered!</h3>
                      <p className="text-slate-600">You've practiced questions from every subject. Excellent coverage!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <Card className="border-purple-200 bg-purple-50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-purple-900 mb-1">Priority: CRITICAL</h4>
                            <p className="text-sm text-purple-800">
                              You haven't practiced any questions in these subjects yet. Don't leave blind spots in your preparation!
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {recommendations.missedTopics.map((topic, idx) => (
                      <Card key={topic.subject} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-purple-600 text-white">NEW</Badge>
                                <h3 className="text-xl font-bold text-slate-900">{topic.subject}</h3>
                              </div>
                              <p className="text-sm text-slate-600">Never practiced</p>
                            </div>
                            <BookOpen className="w-12 h-12 text-purple-500" />
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => handleStartSession(topic.subject)}
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                            >
                              <Target className="w-4 h-4 mr-2" />
                              Start Learning (30 Questions)
                            </Button>
                            <Button 
                              asChild
                              variant="outline"
                              className="border-purple-300 text-purple-900 hover:bg-purple-50"
                            >
                              <Link href={createPageUrl(`StudyNotes`)}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                Study Notes
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="underpracticed">
                {recommendations.underPracticed.length === 0 ? (
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-12 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Great Practice Habits!</h3>
                      <p className="text-slate-600">All practiced subjects have good volume and recency. Keep it up!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-blue-900 mb-1">Needs Attention</h4>
                            <p className="text-sm text-blue-800">
                              These subjects need more practice volume or haven't been reviewed recently. Stay fresh!
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {recommendations.underPracticed.map((area, idx) => (
                      <Card key={area.subject} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={area.priority === 'MEDIUM' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}>
                                  {area.priority}
                                </Badge>
                                <h3 className="text-xl font-bold text-slate-900">{area.subject}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                                <span>{area.attempted} questions attempted</span>
                                <span>•</span>
                                <span>{area.accuracy.toFixed(0)}% accuracy</span>
                              </div>
                              <p className="text-sm text-slate-500">{area.reason}</p>
                            </div>
                            <Clock className="w-12 h-12 text-blue-500" />
                          </div>
                          <Button 
                            onClick={() => handleStartSession(area.subject)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Continue Practicing (30 Questions)
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <h3 className="font-bold text-green-900 mb-3">How Personalised Practice Works</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span><strong>Weak Areas:</strong> Subjects where you're scoring below 65% accuracy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span><strong>Missed Topics:</strong> Subjects you haven't practiced at all (blind spots)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span><strong>Under-Practiced:</strong> Subjects with low volume (less than 20 questions) or not reviewed in 7+ days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Click any subject to start a focused 30-question practice session</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>As you improve, subjects automatically move out of these categories</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}