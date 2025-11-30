"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown, Zap, Star, Trophy, Gavel, Shield, BookOpen, Target, AlertTriangle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { createPageUrl } from '@/utils';

const subscriptionPlans = [
  {
    name: 'Starter',
    price: '£12',
    period: '/month',
    annualPrice: '£120',
    annualSaving: '£24',
    description: 'Perfect for getting started with SQE prep',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    features: [
      '496 Hard Questions (31 per subject - equal distribution)',
      '4 Hard Mock Exams (2 FLK1 + 2 FLK2)',
      '496 Flash Cards (31 per subject - equal distribution)',
      'Basic Study Notes',
      'Personalised Study Path',
      'Daily Challenge',
      'Progress Tracker + Leaderboard',
      'Mental Preparation Modules',
      'Interactive Flowcharts',
      'Community Forum',
      'Study Groups',
      'Email Support',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: '£28',
    period: '/month',
    annualPrice: '£280',
    annualSaving: '£56',
    description: 'Most popular - complete study toolkit',
    icon: Star,
    color: 'from-purple-500 to-purple-600',
    features: [
      '1,008 Hard Questions (63 per subject - equal distribution)',
      '15 Hard Mock Exams (mixed subjects)',
      'Unlimited Flash Cards',
      'Full Study Notes',
      'Weak Area Focus Sessions',
      'Revision Planner',
      'Mind Maps (All Subjects)',
      'Advanced Analytics Dashboard',
      'Mental Preparation Modules',
      'Interactive Flowcharts',
      'Daily Challenge',
      'Performance Benchmarks',
      'Leaderboard Rankings',
      'Community Forum',
      'Study Groups (Unlimited)',
      'Priority Email Support',
    ],
    popular: true,
  },
  {
    name: 'Ultimate',
    price: '£45',
    period: '/month',
    annualPrice: '£220',
    annualSaving: '£320',
    description: 'Everything you need to master the SQE',
    icon: Crown,
    color: 'from-amber-500 to-amber-600',
    features: [
      'Unlimited Hard Questions (equal per subject)',
      'Unlimited Hard Mock Exams',
      'Unlimited Flash Cards',
      'All Study Materials',
      'Custom Mock Creator (Admin)',
      'Advanced Analytics Dashboard',
      'Predictive Pass Probability',
      'Mental Preparation Modules',
      'Interactive Flowcharts',
      'Revision Planner',
      'Mind Maps (All Subjects)',
      'Daily Challenge',
      'Scaled Scoring Analysis',
      'Top of Leaderboard Access',
      'Community Forum (Priority)',
      'Study Groups (Unlimited + Admin)',
      'Priority Email & Chat Support',
      'Early Access to New Features',
    ],
    popular: false,
  },
];

const mockPackages = [
  {
    id: 'flk1-1',
    name: 'FLK 1 Single Mock',
    price: '£5',
    description: '1 FLK 1 Hard Mock Exam',
    mocks: 1,
    type: 'FLK 1',
    icon: BookOpen,
    features: [
      '1 × 90-question hard exam',
      'Official SQE format (157.5 mins)',
      'Detailed explanations',
      'Performance analytics',
      'Subject breakdown',
    ]
  },
  {
    id: 'flk1-10',
    name: 'FLK 1 Complete Pack',
    price: '£40',
    originalPrice: '£50',
    description: '10 FLK 1 Hard Mock Exams',
    mocks: 10,
    type: 'FLK 1',
    icon: BookOpen,
    popular: true,
    badge: 'SAVE £10',
    features: [
      '10 × 90-question hard exams',
      'Official SQE format',
      'Detailed explanations',
      'Performance analytics',
      'Progress tracking',
    ]
  },
  {
    id: 'flk2-1',
    name: 'FLK 2 Single Mock',
    price: '£5',
    description: '1 FLK 2 Hard Mock Exam',
    mocks: 1,
    type: 'FLK 2',
    icon: BookOpen,
    features: [
      '1 × 90-question hard exam',
      'Official SQE format (157.5 mins)',
      'Detailed explanations',
      'Performance analytics',
      'Subject breakdown',
    ]
  },
  {
    id: 'flk2-10',
    name: 'FLK 2 Complete Pack',
    price: '£40',
    originalPrice: '£50',
    description: '10 FLK 2 Hard Mock Exams',
    mocks: 10,
    type: 'FLK 2',
    icon: BookOpen,
    popular: true,
    badge: 'SAVE £10',
    features: [
      '10 × 90-question hard exams',
      'Official SQE format',
      'Detailed explanations',
      'Performance analytics',
      'Progress tracking',
    ]
  },
];

const FLK1_SUBJECTS = [
  'Business Law & Practice',
  'Contract Law',
  'Tort Law',
  'Dispute Resolution',
  'Constitutional & Administrative Law',
  'EU Law',
  'The Legal System of England & Wales',
  'Legal Services',
  'Ethics & Professional Conduct'
];

const FLK2_SUBJECTS = [
  'Property Practice',
  'Land Law',
  'Wills & Administration of Estates',
  'Trusts',
  'Criminal Law',
  'Criminal Practice',
  'Solicitors Accounts',
  'Ethics & Professional Conduct'
];

// Subject-specific packs: 5 mocks per subject @ £15 each
const subjectPacks = [
  ...FLK1_SUBJECTS.map(subject => ({
    id: `subject-${subject.toLowerCase().replace(/\s+/g, '-')}`,
    name: subject,
    price: '£15',
    description: `5 hard ${subject} mock exams`,
    mocks: 5,
    type: 'FLK 1',
    icon: Target,
    features: [
      `5 × 90-question hard ${subject} mocks`,
      '450 challenging questions total',
      'Official SQE format (157.5 mins each)',
      'Deep dive into one subject',
      'Master this topic completely',
      'Performance tracking',
    ]
  })),
  ...FLK2_SUBJECTS.map(subject => ({
    id: `subject-${subject.toLowerCase().replace(/\s+/g, '-')}`,
    name: subject,
    price: '£15',
    description: `5 hard ${subject} mock exams`,
    mocks: 5,
    type: 'FLK 2',
    icon: Target,
    features: [
      `5 × 90-question hard ${subject} mocks`,
      '450 challenging questions total',
      'Official SQE format (157.5 mins each)',
      'Deep dive into one subject',
      'Master this topic completely',
      'Performance tracking',
    ]
  }))
];

const bootcampPackages = [
  {
    id: 'bootcamp-2week',
    name: '2-Week Sprint Bootcamp',
    price: '£20',
    description: 'Intensive 14-day plan + Ultimate access',
    icon: Zap,
    duration: '14 days',
    features: [
      '14-day structured study plan',
      '🎯 Full Ultimate Platform Access',
      'Unlimited hard questions',
      'Unlimited hard mock exams',
      'Custom Mock Creator (Admin)',
      'Daily task checklist',
      '4 full mock exams included',
      'Weak area drilling',
      'One-time purchase',
      'Lifetime access to plan',
    ]
  },
  {
    id: 'bootcamp-30day',
    name: '30-Day Final Prep Bootcamp',
    price: '£35',
    description: 'Complete month-long program + Ultimate access',
    icon: Target,
    duration: '30 days',
    popular: true,
    badge: 'MOST POPULAR',
    features: [
      '30-day comprehensive study plan',
      '🎯 Full Ultimate Platform Access',
      'Unlimited hard questions',
      'Unlimited hard mock exams',
      'Custom Mock Creator (Admin)',
      'Daily task checklist',
      '8 full mock exams included',
      'Mental preparation modules',
      'One-time purchase',
      'Lifetime access to plan',
    ]
  },
];

const simulatorPackages = [
  {
    id: 'sim-1',
    name: 'Single Simulator',
    price: '£7',
    description: 'One complete hard exam day simulation',
    attempts: 1,
    icon: Shield,
    features: [
      '1 full hard exam day simulation',
      '180 hard questions (90 + 90)',
      '5h 15min timed',
      'Official SQE format',
      'Detailed performance report',
    ]
  },
  {
    id: 'sim-3',
    name: '3 Simulator Pack',
    price: '£18',
    originalPrice: '£21',
    description: 'Practice makes perfect',
    attempts: 3,
    icon: Shield,
    popular: true,
    badge: 'SAVE £3',
    features: [
      '3 full hard exam day simulations',
      '180 hard questions per attempt',
      'Official SQE format',
      'Performance reports',
      'Just £6 per simulation',
    ]
  },
  {
    id: 'sim-5',
    name: '5 Simulator Pack',
    price: '£25',
    originalPrice: '£35',
    description: 'Best value - maximum practice',
    attempts: 5,
    icon: Shield,
    badge: 'SAVE £10',
    features: [
      '5 full hard exam day simulations',
      '180 hard questions per attempt',
      'Official SQE format',
      'Comprehensive analytics',
      'Just £5 per simulation',
    ]
  },
];

export default function Packages() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSelectPackage = (packageName, packageType = 'subscription') => {
    alert(`${packageName} selected! Contact us at support@sqeforge.com to complete your purchase.`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
            <Gavel className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Flexible SQE Pricing</h1>
          <p className="text-xl text-slate-600 mb-6">
            Choose your subscription + add exactly what you need
          </p>
          <Alert className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Mix & Match:</strong> Base plan + subject-specific mocks + bootcamps + simulator. All content is HARD difficulty for maximum exam readiness.
            </AlertDescription>
          </Alert>
        </div>

        {/* Current Plan Alert */}
        {user && user.subscription_tier && (
          <Alert className="max-w-2xl mx-auto mb-8 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              You're currently on the <strong>{user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)}</strong> plan
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="subscriptions" className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-5 mb-12">
            <TabsTrigger value="subscriptions">Plans</TabsTrigger>
            <TabsTrigger value="subjects">
              Subjects
              <Badge className="ml-2 bg-amber-600 text-white text-xs">NEW</Badge>
            </TabsTrigger>
            <TabsTrigger value="bootcamp">Bootcamp</TabsTrigger>
            <TabsTrigger value="mocks">Mocks</TabsTrigger>
            <TabsTrigger value="simulator">Simulator</TabsTrigger>
          </TabsList>

          {/* SUBSCRIPTION PLANS */}
          <TabsContent value="subscriptions">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Subscription Plans</h2>
              <p className="text-slate-600">Recurring access to platform features and HARD content only</p>
              
              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-3 p-1 bg-slate-100 rounded-lg mt-6">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-md font-semibold transition-all ${
                    billingCycle === 'monthly' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2 rounded-md font-semibold transition-all ${
                    billingCycle === 'annual' 
                      ? 'bg-linear-to-r from-green-600 to-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Annual
                  <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">Save up to 59%</span>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
              {subscriptionPlans.map((pkg, index) => {
                const Icon = pkg.icon;
                const showAnnual = billingCycle === 'annual' && pkg.annualPrice;
                const displayPrice = showAnnual ? pkg.annualPrice : pkg.price;
                const displayPeriod = showAnnual ? '/year' : pkg.period;

                const isUltimateAnnual = pkg.name === 'Ultimate' && billingCycle === 'annual';
                const isProMonthly = pkg.name === 'Pro' && billingCycle === 'monthly';
                
                return (
                  <Card
                    key={index}
                    className={`relative border-2 ${
                      isUltimateAnnual
                        ? 'border-green-500 shadow-2xl scale-105 ring-4 ring-green-200'
                        : isProMonthly
                        ? 'border-purple-500 shadow-2xl scale-105'
                        : 'border-slate-200 shadow-lg hover:shadow-xl'
                    } transition-all duration-300`}
                  >
                    {isUltimateAnnual && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-green-600 text-white px-4 py-1 text-sm font-bold whitespace-nowrap">
                          BEST VALUE - SAVE £{pkg.annualSaving}
                        </Badge>
                      </div>
                    )}
                    {isProMonthly && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-purple-600 text-white px-4 py-1 text-sm font-bold">
                          MOST POPULAR
                        </Badge>
                      </div>
                    )}

                    <CardHeader className={`p-6 bg-linear-to-br ${pkg.color} text-white rounded-t-lg`}>
                      <div className="flex items-center justify-center mb-3">
                        <Icon className="w-10 h-10" />
                      </div>
                      <CardTitle className="text-xl font-bold text-center mb-2">
                        {pkg.name}
                      </CardTitle>
                      <div className="text-center">
                        <span className="text-5xl font-bold">{displayPrice}</span>
                        <span className="text-base opacity-90">{displayPeriod}</span>
                      </div>
                      {showAnnual && (
                        <div className="text-center mt-3 space-y-1">
                          <p className="text-sm font-semibold bg-white/20 rounded px-3 py-1.5 inline-block">
                            = £{(parseInt(pkg.annualPrice.replace('£', '')) / 12).toFixed(0)}/month
                          </p>
                          <p className="text-xs opacity-90">Save £{pkg.annualSaving} vs monthly</p>
                        </div>
                      )}
                      <p className="text-center text-sm mt-3 opacity-90">
                        {pkg.description}
                      </p>
                    </CardHeader>

                    <CardContent className="p-6">
                      <ul className="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-900">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSelectPackage(pkg.name + (showAnnual ? ' Annual' : ''), 'subscription')}
                        disabled={user?.subscription_tier === pkg.name.toLowerCase()}
                        className={`w-full h-11 text-base font-bold ${
                          isUltimateAnnual
                            ? 'bg-green-600 hover:bg-green-700'
                            : isProMonthly
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {user?.subscription_tier === pkg.name.toLowerCase()
                          ? 'Current Plan'
                          : showAnnual ? 'Get Annual Plan' : 'Select Plan'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {billingCycle === 'annual' && (
              <div className="mt-12 text-center p-8 bg-linear-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 max-w-5xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Why Choose Annual?</h3>
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
                  <div>
                    <Trophy className="w-8 h-8 text-green-600 mb-2" />
                    <h4 className="font-bold text-slate-900 mb-2">Huge Savings</h4>
                    <p className="text-sm text-slate-600">Save up to £320 (59% off) compared to monthly billing</p>
                  </div>
                  <div>
                    <Shield className="w-8 h-8 text-green-600 mb-2" />
                    <h4 className="font-bold text-slate-900 mb-2">Price Lock</h4>
                    <p className="text-sm text-slate-600">Lock in this price - no surprises or increases for the full year</p>
                  </div>
                  <div>
                    <Star className="w-8 h-8 text-green-600 mb-2" />
                    <h4 className="font-bold text-slate-900 mb-2">Best Value</h4>
                    <p className="text-sm text-slate-600">Ultimate Annual = just £18.33/month instead of £45/month</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* SUBJECT-SPECIFIC MOCKS - NEW! */}
          <TabsContent value="subjects">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Subject-Specific Hard Mock Packs</h2>
              <p className="text-slate-600">Master one subject at a time • 5 hard mocks per subject • Just £15</p>
            </div>

            <Alert className="max-w-4xl mx-auto mb-8 bg-amber-50 border-amber-200">
              <Target className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>Deep Dive Learning:</strong> Each pack contains 5 full 90-question HARD mocks (450 questions) focused on ONE subject. Perfect for targeting weak areas!
              </AlertDescription>
            </Alert>

            {/* ALL SUBJECTS BUNDLE - NEW! */}
            <Card className="max-w-4xl mx-auto mb-12 border-4 border-purple-500 shadow-2xl">
              <CardHeader className="bg-linear-to-r from-purple-600 to-indigo-600 text-white p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Trophy className="w-16 h-16" />
                    <div>
                      <Badge className="bg-amber-500 text-slate-900 mb-2">ULTIMATE BUNDLE</Badge>
                      <CardTitle className="text-3xl mb-2">ALL SUBJECTS COMPLETE PACK</CardTitle>
                      <p className="text-lg">80 Hard Mocks × 16 Subjects = 7,200 Questions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80 line-through">£240</p>
                    <p className="text-6xl font-bold">£70</p>
                    <Badge className="bg-green-400 text-slate-900 mt-2">SAVE £170</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      FLK 1 Complete (9 subjects)
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {FLK1_SUBJECTS.map(s => (
                        <li key={s} className="text-slate-600">• {s} (5 mocks)</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      FLK 2 Complete (7 subjects)
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {FLK2_SUBJECTS.map(s => (
                        <li key={s} className="text-slate-600">• {s} (5 mocks)</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Alert className="mb-6 bg-purple-50 border-purple-200">
                  <Trophy className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    <strong>Complete Exam Prep:</strong> 80 full-length hard mocks covering EVERY SQE topic. 
                    This is everything you need to pass both FLK 1 and FLK 2. Just £0.875 per mock!
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => handleSelectPackage('All Subjects Complete Bundle', 'subject-pack-bundle')}
                  className="w-full h-16 text-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Trophy className="w-6 h-6 mr-3" />
                  Purchase Complete Bundle - £70
                </Button>
              </CardContent>
            </Card>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Or Choose Individual Subjects</h3>
              <p className="text-slate-600">£15 per subject (5 hard mocks each)</p>
            </div>

            <Tabs defaultValue="flk1" className="max-w-6xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="flk1">FLK 1 Subjects ({FLK1_SUBJECTS.length})</TabsTrigger>
                <TabsTrigger value="flk2">FLK 2 Subjects ({FLK2_SUBJECTS.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="flk1">
                <div className="grid md:grid-cols-3 gap-6">
                  {subjectPacks.filter(p => p.type === 'FLK 1').map(pkg => (
                    <Card key={pkg.id} className="border-2 border-blue-200 hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          <Badge className="bg-blue-600 text-white">FLK 1</Badge>
                        </div>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-4xl font-bold text-slate-900">{pkg.price}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{pkg.description}</p>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ul className="space-y-2 mb-6">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => handleSelectPackage(pkg.name, 'subject-pack')}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Purchase Pack
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="flk2">
                <div className="grid md:grid-cols-3 gap-6">
                  {subjectPacks.filter(p => p.type === 'FLK 2').map(pkg => (
                    <Card key={pkg.id} className="border-2 border-purple-200 hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3 bg-purple-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          <Badge className="bg-purple-600 text-white">FLK 2</Badge>
                        </div>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-4xl font-bold text-slate-900">{pkg.price}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{pkg.description}</p>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ul className="space-y-2 mb-6">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => handleSelectPackage(pkg.name, 'subject-pack')}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          Purchase Pack
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <Card className="mt-12 max-w-4xl mx-auto bg-linear-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Why Choose Subject-Specific Mocks?</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Target className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                    <h4 className="font-bold mb-2">Laser Focus</h4>
                    <p className="text-sm text-slate-600">450 questions on ONE subject = complete mastery</p>
                  </div>
                  <div className="text-center">
                    <Zap className="w-10 h-10 text-orange-600 mx-auto mb-3" />
                    <h4 className="font-bold mb-2">Best Value</h4>
                    <p className="text-sm text-slate-600">Just 3p per question vs 5.5p for mixed mocks</p>
                  </div>
                  <div className="text-center">
                    <Trophy className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                    <h4 className="font-bold mb-2">Weak Area Killer</h4>
                    <p className="text-sm text-slate-600">Target your problem subjects with concentrated practice</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BOOTCAMP PACKAGES */}
          <TabsContent value="bootcamp">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Final Prep Bootcamp Programs</h2>
              <p className="text-slate-600">One-time purchase • Includes Ultimate access • From £20</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              {bootcampPackages.map((pkg) => {
                const Icon = pkg.icon;
                return (
                  <Card
                    key={pkg.id}
                    className={`relative border-2 ${
                      pkg.popular ? 'border-purple-500 shadow-2xl scale-105' : 'border-slate-200 shadow-lg'
                    } transition-all`}
                  >
                    {pkg.badge && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-purple-600 text-white px-4 py-1 text-sm font-bold">
                          {pkg.badge}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="p-6 bg-linear-to-br from-purple-600 to-indigo-600 text-white rounded-t-lg">
                      <div className="flex items-center justify-center mb-3">
                        <Icon className="w-10 h-10" />
                      </div>
                      <CardTitle className="text-xl font-bold text-center mb-2">
                        {pkg.name}
                      </CardTitle>
                      <div className="text-center">
                        <span className="text-5xl font-bold">{pkg.price}</span>
                        <span className="text-base opacity-90 ml-2">one-time</span>
                      </div>
                      <p className="text-center text-sm mt-3 opacity-90">
                        {pkg.description}
                      </p>
                      <div className="text-center mt-3 bg-white/20 rounded-lg py-2">
                        <p className="text-sm font-semibold">{pkg.duration} + Ultimate Features</p>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      <ul className="space-y-2 mb-6">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-900">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSelectPackage(pkg.name, 'bootcamp')}
                        className={`w-full h-11 text-base font-bold ${
                          pkg.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        Purchase Bootcamp
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* MIXED MOCK EXAM PACKS */}
          <TabsContent value="mocks">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Mixed Mock Exam Packs</h2>
              <p className="text-slate-600">One-time purchase • All subjects • £5 per mock or £40 for 10</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {mockPackages.map((pkg) => {
                const Icon = pkg.icon;
                return (
                  <Card
                    key={pkg.id}
                    className={`relative border-2 ${
                      pkg.popular ? 'border-amber-400 shadow-xl' : 'border-slate-200 shadow-lg'
                    } hover:shadow-xl transition-all`}
                  >
                    {pkg.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-amber-500 text-white px-3 py-1 text-xs font-bold">
                          {pkg.badge}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="p-6 border-b">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="w-8 h-8 text-slate-700" />
                        <CardTitle className="text-xl font-bold">{pkg.name}</CardTitle>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-slate-900">{pkg.price}</span>
                        {pkg.originalPrice && (
                          <span className="text-lg text-slate-400 line-through">{pkg.originalPrice}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{pkg.description}</p>
                    </CardHeader>

                    <CardContent className="p-6">
                      <ul className="space-y-2 mb-6">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSelectPackage(pkg.name, 'mock')}
                        className="w-full bg-slate-900 hover:bg-slate-800"
                      >
                        Purchase Pack
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* EXAM DAY SIMULATOR */}
          <TabsContent value="simulator">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Exam Day Simulator</h2>
              <p className="text-slate-600">Full 5h15min exam experience • £5-7 per simulation</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
              {simulatorPackages.map((pkg) => {
                const Icon = pkg.icon;
                return (
                  <Card
                    key={pkg.id}
                    className={`relative border-2 ${
                      pkg.popular ? 'border-green-500 shadow-xl scale-105' : 'border-slate-200 shadow-lg'
                    } transition-all`}
                  >
                    {pkg.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-green-600 text-white px-3 py-1 text-xs font-bold">
                          {pkg.badge}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="p-6 bg-linear-to-br from-slate-800 to-slate-900 text-white rounded-t-lg">
                      <div className="flex items-center justify-center mb-3">
                        <Icon className="w-10 h-10" />
                      </div>
                      <CardTitle className="text-xl font-bold text-center mb-2">
                        {pkg.name}
                      </CardTitle>
                      <div className="text-center">
                        <span className="text-5xl font-bold">{pkg.price}</span>
                        {pkg.originalPrice && (
                          <div className="text-sm mt-1 opacity-60 line-through">{pkg.originalPrice}</div>
                        )}
                      </div>
                      <p className="text-center text-sm mt-3 opacity-90">
                        {pkg.description}
                      </p>
                    </CardHeader>

                    <CardContent className="p-6">
                      <ul className="space-y-2 mb-6">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-900">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSelectPackage(pkg.name, 'simulator')}
                        className={`w-full h-11 ${
                          pkg.popular ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        Purchase
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="text-center mt-16 p-12 bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your SQE Journey?</h2>
          <p className="text-lg mb-8 text-slate-300">
            Mix subscription plans with subject packs, bootcamps, and simulator access
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-8 h-14 text-lg"
              onClick={() => handleSelectPackage('All Subjects Complete Bundle - £70')}
            >
              <Trophy className="w-5 h-5 mr-2" />
              All Subjects Bundle - £70
            </Button>
            <Button
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 h-14 text-lg"
              onClick={() => handleSelectPackage('Ultimate Annual')}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Ultimate Annual - £220
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}