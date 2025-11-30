"use client";
import React, { useState, useEffect } from 'react';
import { User, Question } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// CANONICAL SUBJECT LIST - matches Question entity exactly
const ALL_SUBJECTS = [
  "Business Law & Practice",
  "Contract Law",
  "Tort Law",
  "Dispute Resolution",
  "Property Practice",
  "Land Law",
  "Wills & Administration of Estates",
  "Trusts",
  "Criminal Law",
  "Criminal Practice",
  "Solicitors Accounts",
  "Constitutional & Administrative Law",
  "EU Law",
  "The Legal System of England & Wales",
  "Legal Services",
  "Ethics & Professional Conduct"
];

export default function SubjectReviewTool() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const loadQuestionsForSubject = async (subject) => {
    setLoadingQuestions(true);
    setQuestions([]);
    setPendingChanges({});
    try {
      const subjectQuestions = await Question.filter({ subject: subject });
      setQuestions(subjectQuestions);
    } catch (error) {
      console.error("Failed to load questions:", error);
    }
    setLoadingQuestions(false);
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    loadQuestionsForSubject(subject);
  };

  const handleQuestionSubjectChange = (questionId, newSubject) => {
    setPendingChanges(prev => ({
      ...prev,
      [questionId]: newSubject
    }));
  };

  const handleSaveChanges = async () => {
    const changesToSave = Object.entries(pendingChanges);
    if (changesToSave.length === 0) return;

    setSaving(true);
    setSaveProgress(0);
    let saved = 0;
    let failed = 0;

    for (let i = 0; i < changesToSave.length; i++) {
      const [questionId, newSubject] = changesToSave[i];
      
      try {
        await Question.update(questionId, { subject: newSubject });
        saved++;
      } catch (error) {
        console.error(`Failed to update question ${questionId}:`, error);
        failed++;
      }

      setSaveProgress(Math.round(((i + 1) / changesToSave.length) * 100));
      
      // Small delay to avoid rate limits
      if (i < changesToSave.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setStats({ saved, failed, total: changesToSave.length });
    setSaving(false);
    
    // Reload questions after save
    if (selectedSubject) {
      await loadQuestionsForSubject(selectedSubject);
    }
  };

  const handleResetChanges = () => {
    setPendingChanges({});
  };

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-slate-600 mt-2">This page is for administrators only.</p>
          <Link to={createPageUrl("Dashboard")}><Button variant="outline" className="mt-6">Return to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  const pendingCount = Object.keys(pendingChanges).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Subject Review Tool</h1>
          <p className="text-slate-600 text-lg">Review questions one subject at a time and quickly re-categorize them</p>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-700" />
          <AlertTitle className="text-blue-800">How It Works</AlertTitle>
          <AlertDescription className="text-blue-700 space-y-1">
            <p>1. Select a subject to review all its questions</p>
            <p>2. For any misplaced questions, change the subject using the dropdown</p>
            <p>3. Click "Save Changes" when done (only saves what you changed)</p>
            <p>4. Move to the next subject and repeat</p>
          </AlertDescription>
        </Alert>

        {stats && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <AlertTitle className="text-green-800">Changes Saved!</AlertTitle>
            <AlertDescription className="text-green-700">
              Successfully updated {stats.saved} questions. {stats.failed > 0 && `Failed: ${stats.failed}`}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle>Select Subject to Review</CardTitle>
              <div className="w-64">
                <Select value={selectedSubject} onValueChange={handleSubjectChange} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    {ALL_SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {loadingQuestions ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-500" />
              <p className="text-slate-600">Loading questions...</p>
            </CardContent>
          </Card>
        ) : questions.length > 0 ? (
          <>
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Questions in {selectedSubject}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    {questions.length} questions • {pendingCount} pending changes
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleResetChanges}
                    disabled={pendingCount === 0 || saving}
                  >
                    Reset Changes
                  </Button>
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={pendingCount === 0 || saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Save {pendingCount > 0 && `${pendingCount} `}Changes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {saving && (
                  <div className="mb-6">
                    <p className="text-sm text-center text-slate-600 mb-2">Saving changes...</p>
                    <Progress value={saveProgress} />
                  </div>
                )}
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {questions.map(question => {
                    const newSubject = pendingChanges[question.id];
                    const hasChange = !!newSubject;
                    
                    return (
                      <div 
                        key={question.id} 
                        className={`p-4 rounded-lg border ${hasChange ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{question.difficulty}</Badge>
                              {hasChange && <Badge className="bg-amber-500">Will Change</Badge>}
                            </div>
                            <p className="text-sm text-slate-800 mb-2">
                              {question.question_text.substring(0, 150)}
                              {question.question_text.length > 150 ? '...' : ''}
                            </p>
                          </div>
                          <div className="w-64">
                            <Select 
                              value={newSubject || question.subject} 
                              onValueChange={(value) => handleQuestionSubjectChange(question.id, value)}
                              disabled={saving}
                            >
                              <SelectTrigger className={hasChange ? 'border-amber-500' : ''}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-96">
                                {ALL_SUBJECTS.map(s => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : selectedSubject ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Questions Found</h3>
              <p className="text-slate-600">No questions in {selectedSubject}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
