"use client";
import React, { useState, useEffect, useCallback } from 'react';
// call api entities
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, Edit, Save, X } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';

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

export default function AdminQuestionEditor() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = {name: "Admin User", email: "admin@example.com", role: "admin"}; // Mock admin user
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
      setLoadingUser(false);
    };
    initialize();
  }, []);

  const loadQuestions = useCallback(async (subject) => {
    if (subject === 'all') {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    try {
      const filtered = await Question.filter({ subject: subject }, '-created_date');
      setQuestions(filtered);
    } catch (error) {
      console.error("Failed to load questions:", error);
      setQuestions([]);
    }
    setLoadingQuestions(false);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadQuestions(subjectFilter);
    }
  }, [subjectFilter, user, loadQuestions]);

  const handleEdit = (question) => {
    setEditingQuestion({ ...question });
  };

  const handleCancel = () => {
    setEditingQuestion(null);
  };

  const handleSave = async () => {
    if (!editingQuestion) return;

    const originalQuestion = questions.find(q => q.id === editingQuestion.id);

    await Question.update(editingQuestion.id, {
        subject: editingQuestion.subject,
        difficulty: editingQuestion.difficulty
    });

    // Instead of a full reload, update the state locally for a faster UI response.
    if (originalQuestion && originalQuestion.subject !== editingQuestion.subject) {
        // If the subject was changed, remove it from the current list.
        setQuestions(prev => prev.filter(q => q.id !== editingQuestion.id));
    } else {
        // Otherwise, just update the item in place.
        setQuestions(prev => prev.map(q =>
            q.id === editingQuestion.id ? editingQuestion : q
        ));
    }

    setEditingQuestion(null);
  };

  const handleFieldChange = (field, value) => {
    setEditingQuestion(prev => ({ ...prev, [field]: value }));
  };

  if (loadingUser) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-slate-600 mt-2">This page is for administrators only.</p>
          <Link href={createPageUrl("Dashboard")}><Button variant="outline" className="mt-6">Return to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Question Editor</h1>
        <p className="text-slate-600 mb-8">Find, view, and re-categorize questions. Select a subject to begin.</p>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Questions ({subjectFilter !== 'all' && !loadingQuestions ? questions.length : '...'})</CardTitle>
            <div className="w-64">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by subject..." /></SelectTrigger>
                <SelectContent className="max-h-96">
                  <SelectItem value="all">Select a Subject</SelectItem>
                  {ALL_SUBJECTS.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingQuestions ? (
              <div className="text-center p-10"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : subjectFilter === 'all' ? (
              <div className="text-center p-10 text-slate-500">Please select a subject to view questions.</div>
            ) : (
              <div className="space-y-3">
                {questions.map(q => (
                  <div key={q.id} className="border rounded-lg p-4 bg-white">
                    {editingQuestion?.id === q.id ? (
                      // Edit View
                      <div className="space-y-4">
                        <p className="text-slate-800">{q.question_text}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                              <Label>Subject</Label>
                              <Select value={editingQuestion.subject} onValueChange={(v) => handleFieldChange('subject', v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      {ALL_SUBJECTS.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div>
                              <Label>Difficulty</Label>
                               <Select value={editingQuestion.difficulty || 'medium'} onValueChange={(v) => handleFieldChange('difficulty', v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="easy">Easy</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={handleCancel}><X className="w-4 h-4 mr-2" />Cancel</Button>
                          <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save</Button>
                        </div>
                      </div>
                    ) : (
                      // Display View
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-800 mb-2">{q.question_text}</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{q.subject}</Badge>
                            <Badge variant="outline">{q.difficulty || 'medium'}</Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(q)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
