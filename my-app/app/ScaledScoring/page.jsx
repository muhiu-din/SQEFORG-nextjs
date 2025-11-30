import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Target, TrendingUp, Info } from 'lucide-react';
import ScoreVisualization from '../components/ScoreVisualization';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createPageUrl } from '@/utils';

export default function ScaledScoring() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
            <Scale className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Understanding Scaled Scoring</h1>
          <p className="text-slate-600 text-lg">How your SQE mock exam performance is measured.</p>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-lg">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Info className="w-6 h-6 text-blue-500" />
                What is Scaled Scoring?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 prose prose-slate max-w-none">
              <p>
                Instead of a simple percentage, high-stakes exams like the SQE use a method called "scaled scoring." Your raw score (the number of questions you got right) is converted onto a consistent scale—in this case, from 0 to 500.
              </p>
              <p>
                This ensures that scores are comparable across different versions of an exam, even if one version is slightly harder or easier than another. A scaled score of 350, for example, represents the same level of competence regardless of which specific exam you took.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Target className="w-6 h-6 text-green-500" />
                The Two Pass Marks in SQEForge
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 prose prose-slate max-w-none">
              <p>On your results page, you'll see two different pass marks to give you a complete picture of your performance:</p>
              <ul>
                <li><strong>Standard Pass Mark (300):</strong> This is a fixed pass mark set at 300 out of 500, which is equivalent to a 60% raw score. It's a consistent benchmark to aim for.</li>
                <li><strong>Scaled Scoring Pass Mark:</strong> This is a dynamic pass mark calculated based on the specific difficulty of the questions in the exam you just took. It's determined using a methodology similar to the Angoff method, where each question is assigned a difficulty rating. This mark shows you what the pass mark would be if it were adjusted for the exam's unique difficulty.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <TrendingUp className="w-6 h-6 text-amber-500" />
                Visualizing Your Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="mb-6 text-slate-700">
                The score bar on your results page helps you quickly see how you performed against both pass marks. Here are a couple of examples:
              </p>
              <div className="space-y-10">
                <div>
                  <h4 className="font-semibold mb-3">Example 1: A Clear Pass</h4>
                  <p className="text-sm text-slate-600 mb-4">In this scenario, the user's score (380) is well above both the Standard Pass Mark (300) and the Scaled Scoring Pass Mark (325) for this particular exam.</p>
                  <ScoreVisualization 
                    score={380} 
                    passMark={300} 
                    scaledScorePassMark={325}
                  />
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Example 2: A Marginal Fail</h4>
                   <p className="text-sm text-slate-600 mb-4">Here, the user's score (310) is just above the Standard Pass Mark (300). However, this was an easier-than-average exam, so the Scaled Scoring Pass Mark was higher (320). According to the scaled score, this would be a fail, indicating more practice is needed.</p>
                  <ScoreVisualization 
                    score={310} 
                    passMark={300} 
                    scaledScorePassMark={320}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center pt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Ready to test your knowledge?</h2>
            <p className="text-slate-600 mb-6">Take a mock exam now to see your scaled score in action.</p>
            <Button asChild className="h-12 px-8 text-lg bg-slate-900 hover:bg-slate-800">
                <Link href={createPageUrl("MockExams")}>Take a Mock Exam</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}