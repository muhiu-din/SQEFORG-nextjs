
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Trophy, Target } from 'lucide-react';

export default function ComparativeBenchmark({ userStats, daysUntilExam }) {
  const benchmarks = {
    avgScore: 68, // Successful candidates average
    questionsAttempted: 1200,
    mocksCompleted: 15,
    weakAreasMax: 3
  };

  const scoreComparison = userStats.avgMockScore >= benchmarks.avgScore ? 'above' : 'below';
  const volumeComparison = userStats.totalQuestions >= benchmarks.questionsAttempted ? 'above' : 'below';

  return (
    <Card className="mb-8 border-none shadow-xl bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-600" />
          Your Performance vs Benchmark
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-slate-600 mb-2">Your Avg Score</p>
            <p className="text-4xl font-bold text-slate-900">{userStats.avgMockScore.toFixed(0)}%</p>
            <Badge className={scoreComparison === 'above' ? 'bg-green-600 mt-2' : 'bg-amber-600 mt-2'}>
              {scoreComparison === 'above' ? 'Above Benchmark' : 'Developing'}
            </Badge>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-300">
            <Trophy className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-800 mb-2">Pass Benchmark</p>
            <p className="text-4xl font-bold text-green-900">{benchmarks.avgScore}%</p>
            <p className="text-xs text-green-700 mt-1">Target average</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-700 font-medium">Questions Practiced</span>
              <span className="font-semibold">
                {userStats.totalQuestions} vs benchmark {benchmarks.questionsAttempted}
              </span>
            </div>
            <Progress 
              value={Math.min((userStats.totalQuestions / benchmarks.questionsAttempted) * 100, 100)} 
              className="h-3"
            />
            <p className="text-xs text-slate-600 mt-1">
              {volumeComparison === 'above' 
                ? '✅ Great volume! You\'re practicing more than average.' 
                : `⚠️ ${benchmarks.questionsAttempted - userStats.totalQuestions} more questions to reach benchmark.`}
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-700 font-medium">Mock Exams Completed</span>
              <span className="font-semibold">
                {userStats.completedMocks} vs benchmark {benchmarks.mocksCompleted}
              </span>
            </div>
            <Progress 
              value={Math.min((userStats.completedMocks / benchmarks.mocksCompleted) * 100, 100)} 
              className="h-3"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-700 font-medium">Weak Areas</span>
              <span className="font-semibold">
                {userStats.weakAreasCount} (target: ≤{benchmarks.weakAreasMax})
              </span>
            </div>
            <Progress 
              value={userStats.weakAreasCount === 0 ? 100 : Math.max(0, 100 - (userStats.weakAreasCount / benchmarks.weakAreasMax * 100))} 
              className="h-3"
            />
          </div>
        </div>

        {daysUntilExam && daysUntilExam > 0 && (
          <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
            <p className="text-sm text-blue-900 mb-2">
              <strong>📅 {daysUntilExam} days until your exam</strong>
            </p>
            <p className="text-xs text-blue-800">
              Successful candidates practice {Math.ceil(benchmarks.questionsAttempted / 60)} questions per day on average.
              {userStats.totalQuestions < benchmarks.questionsAttempted && (
                ` You need ~${Math.ceil((benchmarks.questionsAttempted - userStats.totalQuestions) / daysUntilExam)} per day to reach benchmark.`
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}