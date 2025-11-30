"use client";
import React, { useState, useEffect } from 'react';
import { User, Question } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Lock, Loader2, Search, Save, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution", "Property Practice", "Land Law",
  "Wills & Administration of Estates", "Trusts", "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law", "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

// Keyword matching logic (same as auditor)
const SUBJECT_KEYWORDS = {
  "Business Law & Practice": ["company", "partnership", "business", "commercial", "shareholder", "director", "articles of association", "memorandum", "corporate", "limited liability", "plc", "ltd", "incorporation", "board meeting"],
  "Contract Law": ["contract", "offer", "acceptance", "consideration", "breach", "damages", "misrepresentation", "frustration", "privity", "terms", "warranty", "condition", "exclusion clause", "penalty clause"],
  "Tort Law": ["negligence", "duty of care", "breach of duty", "causation", "remoteness", "damages", "nuisance", "trespass", "defamation", "vicarious liability", "occupiers liability", "psychiatric harm"],
  "Dispute Resolution": ["litigation", "civil procedure", "cpr", "claim form", "disclosure", "witness", "trial", "appeal", "costs", "settlement", "mediation", "arbitration", "court proceedings"],
  "Property Practice": ["conveyancing", "sale", "purchase", "freehold", "leasehold", "mortgage", "title", "searches", "completion", "exchange", "stamp duty", "land registry", "sdlt"],
  "Land Law": ["estate", "lease", "licence", "easement", "covenant", "mortgage", "adverse possession", "proprietary estoppel", "co-ownership", "trust of land", "overriding interest", "registered land"],
  "Wills & Administration of Estates": ["will", "testator", "executor", "administrator", "intestacy", "probate", "grant", "inheritance", "beneficiary", "legacy", "devise", "codicil", "testamentary"],
  "Trusts": ["trust", "trustee", "beneficiary", "settlor", "fiduciary", "breach of trust", "constructive trust", "resulting trust", "charitable trust", "express trust", "trust property"],
  "Criminal Law": ["murder", "manslaughter", "assault", "battery", "theft", "robbery", "burglary", "fraud", "mens rea", "actus reus", "intention", "recklessness", "offence", "gbh"],
  "Criminal Practice": ["prosecution", "defence", "bail", "plea", "sentencing", "magistrates", "crown court", "indictment", "summary", "either way", "disclosure", "police station"],
  "Solicitors Accounts": ["client account", "office account", "sra accounts rules", "reconciliation", "client money", "ledger", "double entry", "vat", "bill", "disbursement", "residual balance"],
  "Constitutional & Administrative Law": ["parliament", "statute", "statutory interpretation", "judicial review", "human rights", "rule of law", "separation of powers", "ultra vires", "wednesbury", "legitimate expectation"],
  "EU Law": ["european union", "treaty", "directive", "regulation", "supremacy", "direct effect", "state liability", "tfeu", "cjeu"],
  "The Legal System of England & Wales": ["court system", "jurisdiction", "common law", "equity", "precedent", "statute", "legal system", "judiciary", "legislation", "stare decisis"],
  "Legal Services": ["legal services act", "reserved activities", "regulation", "legal services board", "approved regulator", "authorisation", "unauthorized practice"],
  "Ethics & Professional Conduct": ["professional conduct", "code of conduct", "sra", "principles", "outcomes", "solicitors regulation authority", "ethics", "conflict of interest", "confidentiality", "client care", "undertaking"]
};

const scoreQuestionForSubject = (questionText, subject) => {
    const keywords = SUBJECT_KEYWORDS[subject];
    // CRITICAL FIX: Check if keywords exist for this subject
    if (!keywords || !Array.isArray(keywords)) {
        return 0;
    }
    
    const textLower = questionText.toLowerCase();
    let score = 0;
    keywords.forEach(keyword => {
        if (textLower.includes(keyword.toLowerCase())) {
            score += 1;
        }
    });
    return score;
};

export default function ManualQuestionAuditor() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
        } catch (e) {
            setUser(null);
        }
        setLoadingUser(false);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
        loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
        const allQuestions = await Question.list();
        const audited = allQuestions.filter(q => q.ai_audited === true);
        const notAudited = allQuestions.filter(q => q.ai_audited !== true);
        
        // Calculate "weak matches" - questions with low keyword scores
        const weakMatches = allQuestions.filter(q => {
            // CRITICAL FIX: Add safety checks for question properties
            if (!q || !q.question_text || !q.subject) return false;
            
            const fullText = `${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.option_e || ''}`;
            const score = scoreQuestionForSubject(fullText, q.subject);
            return score === 0 || score === 1; // Very low confidence
        });

        setStats({
            total: allQuestions.length,
            audited: audited.length,
            notAudited: notAudited.length,
            weakMatches: weakMatches.length
        });
    } catch (error) {
        console.error("Failed to load stats:", error);
        // Set default stats on error
        setStats({
            total: 0,
            audited: 0,
            notAudited: 0,
            weakMatches: 0
        });
    }
  };

  const loadQuestions = async (subject, showWeakOnly = false) => {
    setLoadingQuestions(true);
    try {
        let filtered;
        if (subject === 'all') {
            filtered = await Question.list('-created_date', 100);
        } else if (subject === 'weak') {
            const all = await Question.list();
            filtered = all.filter(q => {
                // CRITICAL FIX: Add safety checks
                if (!q || !q.question_text || !q.subject) return false;
                
                const fullText = `${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.option_e || ''}`;
                const score = scoreQuestionForSubject(fullText, q.subject);
                return score === 0 || score === 1;
            });
        } else {
            filtered = await Question.filter({ subject: subject }, '-created_date', 100);
        }

        // Add confidence scores
        const questionsWithScores = filtered.map(q => {
            // CRITICAL FIX: Add safety checks
            if (!q || !q.question_text || !q.subject) return { ...q, confidenceScore: 0 };
            
            const fullText = `${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.option_e || ''}`;
            const score = scoreQuestionForSubject(fullText, q.subject);
            return { ...q, confidenceScore: score };
        });

        setQuestions(questionsWithScores);
    } catch (error) {
        console.error("Failed to load questions:", error);
        setQuestions([]);
    }
    setLoadingQuestions(false);
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    if (subject !== 'all') {
        loadQuestions(subject);
    } else {
        setQuestions([]);
    }
  };

  const handleSave = async () => {
    if (!editingQuestion) return;
    setSaving(true);
    try {
        await Question.update(editingQuestion.id, {
            subject: editingQuestion.subject,
            ai_audited: true
        });
        
        // Update local state
        setQuestions(prev => prev.map(q => 
            q.id === editingQuestion.id ? { ...editingQuestion, ai_audited: true } : q
        ));
        
        setEditingQuestion(null);
        await loadStats(); // Refresh stats
    } catch (error) {
        console.error("Failed to save:", error);
        alert("Failed to save changes. Please try again.");
    }
    setSaving(false);
  };

  const filteredQuestions = questions.filter(q => {
    if (!searchTerm) return true;
    // Ensure q.question_text exists before calling toLowerCase
    return q.question_text && q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
          <Link to={createPageUrl("Dashboard")}><Button variant="outline" className="mt-6">Return to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Manual Question Auditor</h1>
        <p className="text-slate-600 mb-8">Review and manually categorize questions that need attention.</p>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-1">Total Questions</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-1">AI Audited</p>
                <p className="text-3xl font-bold text-green-600">{stats.audited.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-1">Not Audited</p>
                <p className="text-3xl font-bold text-amber-600">{stats.notAudited.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-red-500 cursor-pointer hover:bg-red-50" onClick={() => handleSubjectChange('weak')}>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-1">Weak Matches (Need Review)</p>
                <p className="text-3xl font-bold text-red-600">{stats.weakMatches.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Click to review</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-700" />
          <AlertTitle className="text-blue-900">What are "Weak Matches"?</AlertTitle>
          <AlertDescription className="text-blue-800">
            These are questions with 0-1 keyword matches for their current subject. They likely need to be recategorized manually.
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                  <SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger>
                  <SelectContent className="max-h-96">
                    <SelectItem value="all">All Subjects (first 100)</SelectItem>
                    <SelectItem value="weak">⚠️ Weak Matches Only</SelectItem>
                    {ALL_SUBJECTS.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Search Questions</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search by question text..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingQuestions ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" /></div>
            ) : selectedSubject === 'all' && questions.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Select a subject to start reviewing questions.</p>
            ) : filteredQuestions.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No questions found matching your filters.</p>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map(q => (
                  <div key={q.id} className="border rounded-lg p-4 bg-white">
                    {editingQuestion?.id === q.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <p className="text-slate-800 font-medium">{q.question_text}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Subject</label>
                            <Select 
                              value={editingQuestion.subject} 
                              onValueChange={(v) => setEditingQuestion({...editingQuestion, subject: v})}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent className="max-h-96">
                                {ALL_SUBJECTS.sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Difficulty</label>
                            <Select 
                              value={editingQuestion.difficulty || 'medium'} 
                              onValueChange={(v) => setEditingQuestion({...editingQuestion, difficulty: v})}
                            >
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
                          <Button variant="ghost" onClick={() => setEditingQuestion(null)} disabled={saving}>
                            Cancel
                          </Button>
                          <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-slate-800 mb-3">{q.question_text}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary">{q.subject}</Badge>
                            <Badge variant="outline">{q.difficulty || 'medium'}</Badge>
                            {q.confidenceScore !== undefined && (
                              <Badge className={
                                q.confidenceScore === 0 ? 'bg-red-100 text-red-800' :
                                q.confidenceScore === 1 ? 'bg-amber-100 text-amber-800' :
                                q.confidenceScore <= 3 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }>
                                Match Score: {q.confidenceScore}
                              </Badge>
                            )}
                            {q.ai_audited && <Badge className="bg-blue-100 text-blue-800">AI Audited</Badge>}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingQuestion(q)}
                          className="ml-4"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
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
