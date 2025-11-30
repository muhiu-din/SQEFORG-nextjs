"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Brain,
  Heart,
  Shield,
  Zap,
  Sun,
  Moon,
  Coffee,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

const mentalPrepModules = [
  {
    id: 'breathing',
    title: 'Box Breathing Technique',
    description: 'Calm your nerves before and during exams',
    icon: Wind,
    color: 'from-blue-500 to-cyan-500',
    steps: [
      'Breathe in for 4 counts',
      'Hold for 4 counts',
      'Breathe out for 4 counts',
      'Hold for 4 counts',
      'Repeat 4-5 times'
    ]
  },
  {
    id: 'visualization',
    title: 'Success Visualization',
    description: 'Picture yourself succeeding on exam day',
    icon: Sun,
    color: 'from-amber-500 to-orange-500',
    steps: [
      'Close your eyes and relax',
      'Imagine arriving at the exam center feeling calm',
      'See yourself reading questions confidently',
      'Visualize selecting the right answers',
      'Picture receiving your pass result'
    ]
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness Grounding',
    description: 'Stay present and reduce anxiety',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    steps: [
      'Notice 5 things you can see',
      'Notice 4 things you can touch',
      'Notice 3 things you can hear',
      'Notice 2 things you can smell',
      'Notice 1 thing you can taste'
    ]
  },
  {
    id: 'affirmations',
    title: 'Positive Affirmations',
    description: 'Build confidence through self-talk',
    icon: Heart,
    color: 'from-rose-500 to-red-500',
    affirmations: [
      'I am well-prepared for this exam',
      'I have practiced extensively and know the material',
      'I stay calm and focused under pressure',
      'I trust my preparation and abilities',
      'I am capable of passing the SQE'
    ]
  },
  {
    id: 'progressive',
    title: 'Progressive Muscle Relaxation',
    description: 'Release physical tension',
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    steps: [
      'Tense your shoulders for 5 seconds, then release',
      'Clench your fists for 5 seconds, then release',
      'Tighten your jaw for 5 seconds, then release',
      'Squeeze your legs for 5 seconds, then release',
      'Notice the difference between tension and relaxation'
    ]
  },
  {
    id: 'sleep',
    title: 'Pre-Exam Sleep Routine',
    description: 'Ensure quality rest before exam day',
    icon: Moon,
    color: 'from-indigo-500 to-blue-500',
    steps: [
      'Stop studying 2 hours before bed',
      'Avoid caffeine after 4 PM',
      'Do light stretching or walk',
      'Prepare everything for tomorrow (clothes, ID, etc.)',
      'Read something relaxing (not exam content)',
      'Lights off by 10 PM for 8 hours sleep'
    ]
  },
  {
    id: 'morning',
    title: 'Exam Day Morning Routine',
    description: 'Start exam day with confidence',
    icon: Coffee,
    color: 'from-yellow-500 to-amber-500',
    steps: [
      'Wake up 3 hours before exam',
      'Eat a nutritious breakfast (protein + complex carbs)',
      'Quick 10-minute review of key concepts (not new material)',
      'Do 5 minutes of box breathing',
      'Positive affirmations while getting ready',
      'Arrive 30 mins early, stay calm'
    ]
  },
  {
    id: 'exam-panic',
    title: 'In-Exam Panic Management',
    description: 'What to do if you panic during the exam',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    steps: [
      'PAUSE - Put your pen down',
      'Close your eyes and take 3 deep breaths',
      'Remind yourself: "I am prepared. This is temporary."',
      'Drink some water',
      'Skip the difficult question, mark it, move on',
      'Return to easier questions to rebuild confidence'
    ]
  },
  {
    id: 'resilience',
    title: 'Building Exam Resilience',
    description: 'Long-term mental strength for SQE journey',
    icon: TrendingUp,
    color: 'from-teal-500 to-cyan-500',
    steps: [
      'Accept that some questions will be difficult - that\'s normal',
      'Practice under timed pressure regularly',
      'Learn from mistakes without self-criticism',
      'Maintain regular sleep, exercise, and social connections',
      'Remember: One bad mock doesn\'t define your ability',
      'Seek support early if feeling overwhelmed'
    ]
  }
];

export default function MentalPreparation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [concernType, setConcernType] = useState('high_anxiety');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    }
    setLoading(false);
  };

  const handleRequestSupport = async () => {
    if (!supportMessage.trim()) {
      alert('Please describe what you\'re experiencing.');
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.MentalHealthFlag.create({
        user_email: user.email,
        user_name: user.full_name || 'Student',
        concern_type: concernType,
        severity: severity,
        message: supportMessage,
        source: 'self_reported',
        performance_context: {
          reported_from: 'mental_preparation_page',
          timestamp: new Date().toISOString()
        },
        admin_contacted: false,
        resolved: false
      });

      alert('✅ Support request submitted. Our team will reach out to you within 24 hours. You\'re not alone - we\'re here to help!');
      setSupportMessage('');
      setShowSupportForm(false);
    } catch (error) {
      console.error('Failed to submit support request:', error);
      alert('Failed to submit request. Please email us directly at support@sqeforge.com');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (selectedModule) {
    const module = selectedModule;
    const Icon = module.icon;
    const totalSteps = module.steps?.length || module.affirmations?.length || 0;

    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
        <div className="max-w-3xl mx-auto">
          <Button
            onClick={() => {
              setSelectedModule(null);
              setActiveStep(0);
            }}
            variant="outline"
            className="mb-6"
          >
            ← Back to All Modules
          </Button>

          <Card className="border-none shadow-2xl">
            <CardHeader className={`p-8 bg-linear-to-r ${module.color} text-white`}>
              <div className="flex items-center gap-4 mb-4">
                <Icon className="w-12 h-12" />
                <div>
                  <CardTitle className="text-3xl">{module.title}</CardTitle>
                  <p className="text-white/90 mt-2">{module.description}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {module.steps && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>Progress</span>
                      <span>{activeStep + 1}/{totalSteps}</span>
                    </div>
                    <Progress value={((activeStep + 1) / totalSteps) * 100} className="h-3" />
                  </div>

                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl font-bold text-blue-600">{activeStep + 1}</span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-900 mb-8">
                      {module.steps[activeStep]}
                    </p>

                    {module.id === 'breathing' && (
                      <div className="mb-8">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1.2, 1, 1] }}
                          transition={{ duration: 16, repeat: Infinity }}
                          className="w-32 h-32 rounded-full bg-linear-to-br from-blue-400 to-cyan-400 mx-auto"
                        />
                      </div>
                    )}
                  </motion.div>

                  <div className="flex gap-4">
                    {activeStep > 0 && (
                      <Button
                        onClick={() => setActiveStep(prev => prev - 1)}
                        variant="outline"
                        className="flex-1"
                      >
                        Previous
                      </Button>
                    )}
                    {activeStep < totalSteps - 1 ? (
                      <Button
                        onClick={() => setActiveStep(prev => prev + 1)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Next Step
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          alert('Great work! Practice this technique regularly.');
                          setSelectedModule(null);
                          setActiveStep(0);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {module.affirmations && (
                <div className="space-y-4">
                  {module.affirmations.map((affirmation, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className="p-6 bg-linear-to-r from-rose-50 to-pink-50 rounded-lg border-2 border-rose-200"
                    >
                      <p className="text-xl font-semibold text-slate-900 text-center">
                        "{affirmation}"
                      </p>
                    </motion.div>
                  ))}
                  <Button
                    onClick={() => setSelectedModule(null)}
                    className="w-full mt-6 bg-rose-600 hover:bg-rose-700"
                  >
                    Done
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
            <Brain className="w-10 h-10 text-purple-600" />
            Mental Preparation & Wellbeing
          </h1>
          <p className="text-slate-600 text-lg">
            Manage exam stress and build mental resilience - available to all students
          </p>
        </div>

        <Alert className="mb-8 bg-purple-50 border-purple-200">
          <Heart className="h-5 w-5 text-purple-600" />
          <AlertTitle className="text-purple-900 font-bold">Your Wellbeing Matters</AlertTitle>
          <AlertDescription className="text-purple-900">
            The SQE is challenging, and feeling stressed is completely normal. These techniques are proven to help 
            manage anxiety, improve focus, and boost performance. If you're struggling, we're here to support you.
          </AlertDescription>
        </Alert>

        {!showSupportForm ? (
          <Card className="mb-8 border-blue-200 bg-linear-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <MessageCircle className="w-8 h-8 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Need Support?</h3>
                  <p className="text-slate-700 mb-4">
                    Feeling overwhelmed, anxious, or struggling with preparation? You don't have to handle it alone. 
                    Our team is here to help adjust your study approach and provide guidance.
                  </p>
                  <Button
                    onClick={() => setShowSupportForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Request Personal Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-blue-600" />
                Request Support from Our Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>How are you feeling?</Label>
                <select
                  value={concernType}
                  onChange={(e) => setConcernType(e.target.value)}
                  className="w-full mt-2 p-2 border rounded-lg"
                >
                  <option value="high_anxiety">High anxiety about exams</option>
                  <option value="burnout">Feeling burnt out</option>
                  <option value="low_confidence">Low confidence in abilities</option>
                  <option value="exam_fear">Fear of exam day</option>
                  <option value="struggling_with_content">Struggling with content</option>
                  <option value="overwhelming_stress">Overwhelming stress</option>
                  <option value="other">Other concern</option>
                </select>
              </div>

              <div>
                <Label>Severity</Label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full mt-2 p-2 border rounded-lg"
                >
                  <option value="low">Low - Would like some advice</option>
                  <option value="medium">Medium - Affecting my studies</option>
                  <option value="high">High - Struggling significantly</option>
                  <option value="critical">Critical - Need urgent help</option>
                </select>
              </div>

              <div>
                <Label>Tell us what's going on (confidential)</Label>
                <Textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Share as much or as little as you're comfortable with. We're here to listen and help..."
                  className="mt-2"
                  rows={5}
                />
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Confidential & Supportive:</strong> Your message goes directly to our support team. 
                  We'll reach out within 24 hours with personalized guidance and adjustments to help you succeed.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowSupportForm(false);
                    setSupportMessage('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestSupport}
                  disabled={submitting || !supportMessage.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Submit Support Request
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentalPrepModules.map(module => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedModule(module)}
              >
                <CardHeader className={`p-6 bg-linear-to-r ${module.color} text-white`}>
                  <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8" />
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 mb-4">{module.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {module.steps?.length || module.affirmations?.length} steps
                    </Badge>
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-12 border-none shadow-xl bg-linear-to-br from-green-50 to-emerald-50">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <Shield className="w-12 h-12 text-green-600 shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Evidence-Based Techniques</h3>
                <p className="text-slate-700 mb-4">
                  All techniques are based on cognitive behavioral therapy (CBT) and mindfulness research. 
                  Studies show these methods significantly reduce exam anxiety and improve performance.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Proven Effectiveness</p>
                      <p className="text-sm text-slate-600">Used by thousands of law students worldwide</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Quick to Learn</p>
                      <p className="text-sm text-slate-600">5-10 minutes per technique</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Use Anywhere</p>
                      <p className="text-sm text-slate-600">At home, on exam day, during breaks</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">No Side Effects</p>
                      <p className="text-sm text-slate-600">Natural, healthy coping mechanisms</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="mt-8 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-900 font-bold">When to Seek Professional Help</AlertTitle>
          <AlertDescription className="text-amber-900">
            If you're experiencing persistent anxiety, depression, or thoughts of self-harm, please contact:
            <br /><strong>Samaritans:</strong> 116 123 (24/7 free helpline)
            <br /><strong>Student Space:</strong> Text "STUDENT" to 85258
            <br /><strong>NHS Mental Health:</strong> Call 111 or visit your GP
            <br /><br />
            These feelings are serious, and professional support can make a real difference. Don't wait - reach out today.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}