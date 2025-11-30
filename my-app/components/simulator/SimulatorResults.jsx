import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Zap, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';

const OFFICIAL_SQE_AVG_SECONDS = 102; // Official SRA/SQE average: 102 seconds per question

export default function SimulatorResults({ 
  score, 
  totalQuestions, 
  examTitle, 
  attempt,
  part1Score,
  part2Score,
  part1Total,
  part2Total,
  part1FlaggedQuestions = {},
  part2FlaggedQuestions = {},
  examMode = 'standard',
  questionTimes = {}
}) {
  const percentage = (score / totalQuestions) * 100;
  const passed = percentage >= 60;

  // Calculate time statistics if available
  const timeStats = React.useMemo(() => {
    if (!questionTimes || Object.keys(questionTimes).length === 0) {
      return null;
    }

    const times = Object.values(questionTimes);
    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const avgTime = totalTime / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    // Compare to official SQE average
    const comparisonToOfficial = avgTime - OFFICIAL_SQE_AVG_SECONDS;
    const percentageDiff = ((avgTime - OFFICIAL_SQE_AVG_SECONDS) / OFFICIAL_SQE_AVG_SECONDS) * 100;

    return {
      totalMinutes: Math.floor(totalTime / 60),
      avgSeconds: Math.round(avgTime),
      maxSeconds: Math.round(maxTime),
      minSeconds: Math.round(minTime),
      comparisonToOfficial: Math.round(comparisonToOfficial),
      percentageDiff: Math.round(percentageDiff),
      isFaster: avgTime < OFFICIAL_SQE_AVG_SECONDS,
      isOnPace: Math.abs(avgTime - OFFICIAL_SQE_AVG_SECONDS) <= 10
    };
  }, [questionTimes]);

  const totalFlagged = Object.keys(part1FlaggedQuestions).length + Object.keys(part2FlaggedQuestions).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Card className="border-none shadow-xl mb-8">
          <CardHeader className={`text-center p-10 border-b ${passed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${passed ? 'bg-green-600' : 'bg-amber-600'}`}>
              {passed ? <CheckCircle2 className="w-10 h-10 text-white" /> : <XCircle className="w-10 h-10 text-white" />}
            </div>
            <CardTitle className={`text-3xl font-bold ${passed ? 'text-green-800' : 'text-amber-800'} mb-2`}>
              {passed ? "Excellent Work!" : "Keep Practicing!"}
            </CardTitle>
            <p className="text-slate-600">{examTitle}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {examMode === 'unrestricted' && <Badge variant="outline" className="flex items-center gap-1"><Zap className="w-3 h-3" />Untimed</Badge>}
              {examMode === 'adaptive' && <Badge variant="outline" className="flex items-center gap-1"><Target className="w-3 h-3" />Adaptive</Badge>}
              {examMode === 'standard' && <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />Timed</Badge>}
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="text-center mb-8">
              <p className="text-6xl font-bold text-slate-900 mb-2">{percentage.toFixed(0)}%</p>
              <p className="text-xl text-slate-600">{score} out of {totalQuestions} correct</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Morning Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-900">{part1Score} / {part1Total}</p>
                  <p className="text-sm text-blue-700 mt-1">{((part1Score / part1Total) * 100).toFixed(0)}% correct</p>
                  {Object.keys(part1FlaggedQuestions).length > 0 && (
                    <p className="text-xs text-blue-600 mt-2">{Object.keys(part1FlaggedQuestions).length} questions flagged</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Afternoon Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-900">{part2Score} / {part2Total}</p>
                  <p className="text-sm text-purple-700 mt-1">{((part2Score / part2Total) * 100).toFixed(0)}% correct</p>
                  {Object.keys(part2FlaggedQuestions).length > 0 && (
                    <p className="text-xs text-purple-600 mt-2">{Object.keys(part2FlaggedQuestions).length} questions flagged</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {timeStats && examMode === 'standard' && (
              <Card className={`mb-8 ${timeStats.isOnPace ? 'bg-green-50 border-green-200' : timeStats.isFaster ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Time Performance Analysis
                    </CardTitle>
                    {timeStats.isOnPace && <Badge className="bg-green-600 text-white">On Pace</Badge>}
                    {!timeStats.isOnPace && timeStats.isFaster && <Badge className="bg-blue-600 text-white">Faster</Badge>}
                    {!timeStats.isOnPace && !timeStats.isFaster && <Badge className="bg-amber-600 text-white">Slower</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{timeStats.totalMinutes}m</p>
                      <p className="text-xs text-slate-600">Total Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{timeStats.avgSeconds}s</p>
                      <p className="text-xs text-slate-600">Avg per Question</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{timeStats.maxSeconds}s</p>
                      <p className="text-xs text-slate-600">Longest</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{timeStats.minSeconds}s</p>
                      <p className="text-xs text-slate-600">Shortest</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${timeStats.isOnPace ? 'bg-green-100 border-2 border-green-300' : timeStats.isFaster ? 'bg-blue-100 border-2 border-blue-300' : 'bg-amber-100 border-2 border-amber-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {timeStats.isOnPace && <Minus className="w-5 h-5 text-green-700" />}
                        {!timeStats.isOnPace && timeStats.isFaster && <TrendingDown className="w-5 h-5 text-blue-700" />}
                        {!timeStats.isOnPace && !timeStats.isFaster && <TrendingUp className="w-5 h-5 text-amber-700" />}
                        <span className="font-bold text-slate-900">Official SQE/SRA Comparison</span>
                      </div>
                      <Badge variant="outline" className={timeStats.isFaster ? 'text-blue-700 border-blue-400' : 'text-amber-700 border-amber-400'}>
                        {timeStats.comparisonToOfficial > 0 ? '+' : ''}{timeStats.comparisonToOfficial}s
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className={timeStats.isOnPace ? 'text-green-800' : timeStats.isFaster ? 'text-blue-800' : 'text-amber-800'}>Your Average:</span>
                        <span className="font-bold">{timeStats.avgSeconds} seconds per question</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={timeStats.isOnPace ? 'text-green-800' : timeStats.isFaster ? 'text-blue-800' : 'text-amber-800'}>SQE Official Average:</span>
                        <span className="font-bold">{OFFICIAL_SQE_AVG_SECONDS} seconds per question</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={timeStats.isOnPace ? 'text-green-800' : timeStats.isFaster ? 'text-blue-800' : 'text-amber-800'}>Difference:</span>
                        <span className="font-bold">
                          {timeStats.percentageDiff > 0 ? '+' : ''}{timeStats.percentageDiff}% 
                          {timeStats.isFaster ? ' faster' : ' slower'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-300">
                      <p className={`text-xs ${timeStats.isOnPace ? 'text-green-800' : timeStats.isFaster ? 'text-blue-800' : 'text-amber-800'}`}>
                        {timeStats.isOnPace && (
                          <>
                            <strong>Perfect Pacing!</strong> You're within 10 seconds of the official SQE average. 
                            This is the ideal pace for exam day.
                          </>
                        )}
                        {!timeStats.isOnPace && timeStats.isFaster && (
                          <>
                            <strong>You're Faster!</strong> You're averaging {Math.abs(timeStats.comparisonToOfficial)} seconds faster per question. 
                            Great for time management, but make sure you're reading questions carefully.
                          </>
                        )}
                        {!timeStats.isOnPace && !timeStats.isFaster && (
                          <>
                            <strong>Time to Speed Up!</strong> You're averaging {timeStats.comparisonToOfficial} seconds slower per question. 
                            In a 90-question exam, this adds up to approximately {Math.round(timeStats.comparisonToOfficial * 90 / 60)} extra minutes. 
                            Practice improving your pace while maintaining accuracy.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {totalFlagged > 0 && (
              <Card className="mb-8 bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Tip:</strong> You flagged {totalFlagged} question{totalFlagged > 1 ? 's' : ''} for review. 
                    These are great candidates for focused study and revision.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Button asChild className="w-full h-12 bg-slate-900 hover:bg-slate-800">
                <Link href={createPageUrl(`ExamReview?attemptId=${attempt?.id}`)}>
                  Review All Questions
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12">
                <Link href={createPageUrl("ExamDaySimulator")}>
                  Back to Simulator
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12">
                <Link href={createPageUrl("Dashboard")}>
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-blue-900 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Review all questions to understand your mistakes</li>
              <li>• Focus on your weak areas identified in the analysis</li>
              <li>• {examMode === 'unrestricted' ? 'Try a timed simulator to practice under exam conditions' : 'Take another simulator to track your progress'}</li>
              <li>• Use the Personalized Study Path to optimize your revision</li>
              {timeStats && !timeStats.isOnPace && (
                <li>• {timeStats.isFaster ? 'Maintain your speed advantage but ensure accuracy' : 'Work on improving your pace - aim for 102 seconds per question'}</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}