"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Heart,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Phone,
  Loader2,
  TrendingDown,
  Brain,
  User,
  MessageCircle,
  Clock,
  Shield,
  Activity
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminMentalHealthMonitor() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState([]);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        setLoading(false);
        return;
      }

      const allFlags = await base44.entities.MentalHealthFlag.list('-created_date');
      setFlags(Array.isArray(allFlags) ? allFlags : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setUser(null);
    }
    setLoading(false);
  };

  const handleContactStudent = async (flag) => {
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: flag.user_email,
        subject: 'SQEForge Support - We\'re Here to Help',
        body: `Dear ${flag.user_name},

We noticed you might be experiencing some challenges with your SQE preparation. Please know that this is completely normal and you're not alone.

${adminNotes || 'Our team is here to support you. Would you like to schedule a quick call to discuss how we can help adjust your study approach?'}

Remember:
✅ The SQE is challenging - struggling doesn't mean you can't pass
✅ Many successful candidates faced similar challenges
✅ We can adjust your study plan to reduce pressure
✅ Mental wellbeing is just as important as academic preparation

Please reply to this email or contact us at support@sqeforge.com if you'd like to chat.

We're here for you.

Best regards,
SQEForge Support Team`
      });

      await base44.entities.MentalHealthFlag.update(flag.id, {
        admin_contacted: true,
        admin_notes: adminNotes
      });

      alert('Support email sent successfully!');
      setSelectedFlag(null);
      setAdminNotes('');
      await loadData();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    }
    setSending(false);
  };

  const handleResolveFlag = async (flag) => {
    try {
      await base44.entities.MentalHealthFlag.update(flag.id, {
        resolved: true,
        resolution_notes: resolutionNotes
      });

      alert('Flag marked as resolved!');
      setSelectedFlag(null);
      setResolutionNotes('');
      await loadData();
    } catch (error) {
      console.error('Failed to resolve flag:', error);
      alert('Failed to update flag.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>Admin access required</AlertDescription>
        </Alert>
      </div>
    );
  }

  const unresolvedFlags = flags.filter(f => !f.resolved);
  const criticalFlags = unresolvedFlags.filter(f => f.severity === 'critical');
  const highFlags = unresolvedFlags.filter(f => f.severity === 'high');
  const contactedFlags = unresolvedFlags.filter(f => f.admin_contacted);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-amber-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
            <Heart className="w-10 h-10 text-red-500" />
            Student Wellbeing Monitor
          </h1>
          <p className="text-slate-600 text-lg">
            Support students who need help - available across all subscription tiers
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Critical Flags</p>
                  <p className="text-3xl font-bold text-red-600">{criticalFlags.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">High Priority</p>
                  <p className="text-3xl font-bold text-orange-600">{highFlags.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Contacted</p>
                  <p className="text-3xl font-bold text-blue-600">{contactedFlags.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{flags.filter(f => f.resolved).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="unresolved" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="unresolved">
              Needs Attention ({unresolvedFlags.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({flags.filter(f => f.resolved).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unresolved">
            {unresolvedFlags.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">All Caught Up! 🎉</h3>
                  <p className="text-slate-600">No students currently need wellbeing support. Great work!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {unresolvedFlags.map(flag => (
                  <Card key={flag.id} className={`border-2 ${
                    flag.severity === 'critical' ? 'border-red-400 bg-red-50' :
                    flag.severity === 'high' ? 'border-orange-400 bg-orange-50' :
                    'border-amber-200 bg-amber-50'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <User className="w-5 h-5 text-slate-700" />
                            <div>
                              <p className="font-bold text-slate-900 text-lg">{flag.user_name}</p>
                              <p className="text-sm text-slate-600">{flag.user_email}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className={getSeverityColor(flag.severity)}>
                              {flag.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{flag.concern_type.replace(/_/g, ' ')}</Badge>
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(parseISO(flag.created_date), 'MMM d, yyyy HH:mm')}
                            </Badge>
                            {flag.admin_contacted && (
                              <Badge className="bg-blue-600">
                                <Mail className="w-3 h-3 mr-1" />
                                Contacted
                              </Badge>
                            )}
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
                            <p className="text-sm font-semibold text-slate-700 mb-1">Message:</p>
                            <p className="text-slate-900">{flag.message}</p>
                          </div>

                          <div className="text-xs text-slate-600">
                            <p><strong>Source:</strong> {flag.source.replace(/_/g, ' ')}</p>
                            {flag.performance_context && (
                              <p className="mt-1">
                                <strong>Context:</strong> {JSON.stringify(flag.performance_context).substring(0, 100)}...
                              </p>
                            )}
                          </div>

                          {flag.admin_notes && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm font-semibold text-blue-900 mb-1">Admin Notes:</p>
                              <p className="text-sm text-blue-800">{flag.admin_notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => setSelectedFlag(flag)}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Contact Student
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Contact {flag.user_name}</DialogTitle>
                                <DialogDescription>
                                  Send supportive email and add notes
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Additional Message (optional)</Label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add any specific advice or next steps..."
                                    className="mt-2"
                                    rows={4}
                                  />
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-sm text-blue-900">
                                    A supportive email will be sent encouraging the student to reach out. 
                                    They'll receive empathy, reassurance, and an offer to discuss their study approach.
                                  </p>
                                </div>
                                <Button
                                  onClick={() => handleContactStudent(flag)}
                                  disabled={sending}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  {sending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Mail className="w-4 h-4 mr-2" />
                                      Send Support Email
                                    </>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedFlag(flag)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Resolve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resolve Flag for {flag.user_name}</DialogTitle>
                                <DialogDescription>
                                  Mark this concern as addressed
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Resolution Notes</Label>
                                  <Textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="How was this resolved? What actions were taken?"
                                    className="mt-2"
                                    rows={3}
                                  />
                                </div>
                                <Button
                                  onClick={() => handleResolveFlag(flag)}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Mark as Resolved
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved">
            <div className="space-y-4">
              {flags.filter(f => f.resolved).map(flag => (
                <Card key={flag.id} className="border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-bold text-slate-900">{flag.user_name}</p>
                            <p className="text-sm text-slate-600">{flag.user_email}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 mb-3">
                          <Badge variant="outline">{flag.concern_type.replace(/_/g, ' ')}</Badge>
                          <Badge variant="outline">
                            Resolved {format(parseISO(flag.updated_date), 'MMM d, yyyy')}
                          </Badge>
                        </div>

                        <p className="text-sm text-slate-700 mb-3">{flag.message}</p>

                        {flag.resolution_notes && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-900 mb-1">Resolution:</p>
                            <p className="text-sm text-green-800">{flag.resolution_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Alert className="mt-8 bg-purple-50 border-purple-200">
          <Heart className="h-5 w-5 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>Wellbeing First Approach:</strong> This monitoring system helps identify students who need support early. 
            Flags are created when students report stress in mental prep modules, show declining performance patterns, 
            or self-report concerns. All subscription tiers receive this support service.
          </AlertDescription>
        </Alert>

        <Card className="mt-6 border-none shadow-lg bg-linear-to-br from-blue-50 to-purple-50">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">How Flags Are Generated</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  Mental Prep Modules
                </h4>
                <p className="text-sm text-slate-600">
                  Students can self-report stress, anxiety, or burnout through mental preparation exercises. 
                  High scores on anxiety assessments trigger automatic flags.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                  Performance Patterns
                </h4>
                <p className="text-sm text-slate-600">
                  Declining scores over time, repeated low performance (&lt;40%), or abandoning multiple exams 
                  halfway through can trigger concern flags automatically.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Study Behavior
                </h4>
                <p className="text-sm text-slate-600">
                  Excessive study hours (burnout risk), long breaks from platform, or erratic study patterns 
                  can indicate student needs support.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Direct Reports
                </h4>
                <p className="text-sm text-slate-600">
                  Students can directly request support through contact forms or feedback mechanisms, 
                  which creates immediate flags for admin review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}