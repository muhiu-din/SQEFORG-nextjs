"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Brain,
  MessageSquare,
  Lightbulb,
  Zap,
  Clock,
  CheckCircle2,
  Target,
  BookOpen,
  Video,
  Music
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const COMING_SOON_FEATURES = [
  {
    id: 'forger',
    title: 'Forger - Your AI Study Companion',
    description: 'Get instant help on any SQE question or legal concept',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    priority: 'high',
    eta: 'Next Major Release',
    features: [
      'Ask questions about any legal concept',
      'Get simpler explanations of complex topics',
      'Generate mnemonics and memory aids on demand',
      'Explore "what if" scenarios for better understanding',
      '"Explain like I\'m 5" mode for difficult concepts',
      'Deep dives into case law and statutory interpretation',
      'Contextual help based on your current question',
    ],
    status: 'In Development - Credit System Being Planned'
  },
  {
    id: 'video-explainers',
    title: 'Video Concept Explainers',
    description: 'Short video explanations for the toughest concepts',
    icon: Video,
    color: 'from-red-500 to-rose-600',
    priority: 'medium',
    eta: 'Q2 2025',
    features: [
      'Animated explanations of complex legal tests',
      'Visual breakdowns of procedural steps',
      '5-minute deep dives into difficult topics',
      'Case law visual summaries',
      'Statutory interpretation guides',
    ],
    status: 'Planned for Future Release'
  },
  {
    id: 'audio-summaries',
    title: 'Audio Revision Summaries',
    description: 'Listen to revision content on the go',
    icon: Music,
    color: 'from-amber-500 to-orange-600',
    priority: 'medium',
    eta: 'Q2 2025',
    features: [
      'Audio versions of revision books',
      'Key case summaries in audio format',
      'Statutory provisions read aloud',
      'Perfect for commute or gym revision',
      'Downloadable for offline listening',
    ],
    status: 'Planned for Future Release'
  },
];

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-linear-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Coming Soon</h1>
          <p className="text-xl text-slate-600">
            Exciting new features on the roadmap to make your SQE prep even better
          </p>
        </div>

        <Alert className="mb-8 bg-blue-50 border-blue-200 max-w-3xl mx-auto">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Have a feature request?</strong> Let us know what you'd like to see! Use the <strong>Feedback & Reviews</strong> page to share your ideas.
          </AlertDescription>
        </Alert>

        {/* Forger - Featured Section */}
        <Card className="mb-12 border-2 border-purple-500 shadow-2xl">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-purple-600 text-white px-6 py-2 text-base font-bold">
              🌟 FLAGSHIP FEATURE
            </Badge>
          </div>

          <CardHeader className="p-8 bg-linear-to-br from-purple-500 to-indigo-600 text-white rounded-t-lg mt-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold mb-2">
                  Forger - Your AI Study Companion
                </CardTitle>
                <p className="text-white/90 text-lg">
                  Get instant, intelligent help on any SQE question or legal concept
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-white/20 text-white">Next Major Release</Badge>
              <Badge className="bg-white/20 text-white">Credit System in Planning</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  What Forger Can Do:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Instant Explanations:</strong> Get complex legal concepts explained in simple terms
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Smart Mnemonics:</strong> Ask for memory aids tailored to how you learn
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>"What If" Scenarios:</strong> Explore how changing facts affects legal outcomes
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Contextual Help:</strong> Get assistance based on your current question or topic
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Deep Dives:</strong> Request detailed analysis of cases, statutes, or legal principles
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Why We're Building This:
                </h3>
                <div className="space-y-4 text-slate-700">
                  <p>
                    Every student learns differently. While our structured content works for most, sometimes you need a <strong>personalized explanation</strong> that makes sense to YOU.
                  </p>
                  <p>
                    Forger will be like having an expert SQE tutor available 24/7 to answer your questions, clarify confusing concepts, and help you understand exactly what you need to know.
                  </p>
                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 mt-4">
                    <p className="font-bold text-purple-900 mb-2">Credit System Details:</p>
                    <p className="text-sm text-purple-800">
                      We're carefully planning how to provide Forger access sustainably. Each interaction with Forger uses AI credits, so we're designing a fair system that ensures everyone can access this powerful feature without depleting platform resources. More details coming soon!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Alert className="mt-8 bg-linear-to-r from-purple-50 to-indigo-50 border-purple-300">
              <Brain className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-900">
                <strong>Forger is being designed with YOU in mind.</strong> We're taking time to build this right so it truly enhances your learning. Stay tuned for updates!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Other Coming Soon Features */}
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Other Exciting Features</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {COMING_SOON_FEATURES.filter(f => f.id !== 'forger').map(feature => {
            const Icon = feature.icon;
            
            return (
              <Card key={feature.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className={`p-6 bg-linear-to-br ${feature.color} text-white`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-8 h-8" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                  <p className="text-white/90">{feature.description}</p>
                  <div className="flex gap-2 mt-4">
                    <Badge className="bg-white/20 text-white">{feature.eta}</Badge>
                    <Badge className="bg-white/20 text-white capitalize">{feature.priority} Priority</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <h4 className="font-bold text-slate-900 mb-3">What to Expect:</h4>
                  <ul className="space-y-2">
                    {feature.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">
                      <strong>Status:</strong> {feature.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feedback CTA */}
        <Card className="mt-12 border-none shadow-xl bg-linear-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Shape the Future of SQEForge
            </h3>
            <p className="text-slate-700 mb-6 max-w-2xl mx-auto">
              Your feedback drives our development. Have ideas for features we should build? 
              Found something that could work better? Let us know!
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to={createPageUrl('FeedbackReviews')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Share Your Feedback
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}